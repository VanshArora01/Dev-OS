const mongoose = require('mongoose');
const Project = require('../models/Project');
const User = require('../models/User');
const pdf = require('pdf-parse');
const { config } = require('../config/ai');
const { safeGroqCompletion } = require('../services/groqClient');


// Helper to get User ID from Clerk ID
async function getUserIdFromClerkId(clerkId) {
    if (!clerkId) return null;
    try {
        let user = await User.findOne({ clerkId });
        if (!user) {
            // Create a default user profile if it doesn't exist
            user = new User({
                clerkId,
                displayName: 'New DevOS User'
            });
            await user.save();
        }
        return user._id;
    } catch (err) {
        console.error('Error in getUserIdFromClerkId:', err);
        throw err;
    }
}

exports.createProject = async (req, res) => {
    try {
        const { ...projectData } = req.body;
        const { userId, clerkId } = req.auth;

        if (!clerkId) {
            return res.status(400).json({ error: 'Clerk ID is required' });
        }

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const newProject = new Project({
            ...projectData,
            userId,
            lastWorkedAt: new Date()
        });

        const savedProject = await newProject.save();

        // Increment usage in subscription if middleware passed it
        if (req.subscription) {
            req.subscription.projectsUsed += 1;
            await req.subscription.save();
        }

        res.status(201).json(savedProject);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.getProjects = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;

        if (!clerkId) {
            return res.status(400).json({ error: 'Clerk ID is required' });
        }

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        if (!userId) {
            console.warn(`[getProjects] No user found for Clerk ID: ${clerkId}`);
            return res.json([]); // Return empty if user doesn't exist yet
        }

        const projects = await Project.find({ userId }).sort({ lastWorkedAt: -1 });
        res.json(projects);
    } catch (err) {
        console.error('getProjects error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve projects. Please check database connection.' });
    }
};

exports.getProjectById = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid Project ID format' });
        }

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        // Optional: Verify ownership if clerkId is provided
        const { userId, clerkId } = req.auth;
        if (clerkId) {
            // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
            if (!userId || !project.userId || project.userId.toString() !== userId.toString()) {
                console.warn(`[getProjectById] Unauthorized access: User ${userId} requested Project ${project._id} owned by ${project.userId}`);
                return res.status(403).json({ error: 'Unauthorized access to this project' });
            }
        }

        res.json(project);
    } catch (err) {
        console.error('getProjectById error:', err.message);
        res.status(500).json({ error: 'Failed to retrieve project details.' });
    }
};

exports.updateProject = async (req, res) => {
    try {
        const { ...updateData } = req.body;
        const { userId, clerkId } = req.auth;

        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (clerkId) {
            // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
            if (!userId || project.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'Unauthorized update attempt' });
            }
        }

        // updateData.lastWorkedAt = new Date(); // Only update on session creation or explicit work
        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            { $set: updateData },
            { new: true }
        );

        res.json(updatedProject);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteProject = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        const project = await Project.findById(req.params.id);

        if (!project) return res.status(404).json({ error: 'Project not found' });

        if (clerkId) {
            // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
            if (!userId || project.userId.toString() !== userId.toString()) {
                return res.status(403).json({ error: 'Unauthorized delete attempt' });
            }
        }

        await Project.findByIdAndDelete(req.params.id);
        // Also delete associated sessions
        const Session = require('../models/Session');
        await Session.deleteMany({ projectId: req.params.id });

        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        console.error('deleteProject error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getProjectSummary = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const { userId, clerkId } = req.auth;
        console.log(`[getProjectSummary] Fetching for projectId: ${projectId}, clerkId: ${clerkId}`);

        // const userId = await getUserIdFromClerkId(clerkId); // Retrieved from req.auth
        const Session = require('../models/Session');

        const sessions = await Session.find({ projectId }).sort({ createdAt: -1 });
        const project = await Project.findById(projectId);

        if (!project) return res.status(404).json({ error: 'Project not found' });

        const totalSessions = sessions.length;
        const totalMinutes = sessions.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
        const avgSession = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
        const lastSession = sessions[0] || null;

        // Health Status
        let healthStatus = 'inactive';
        if (project.lastWorkedAt) {
            const now = new Date();
            const lastWorked = new Date(project.lastWorkedAt);
            const diffDays = Math.floor((now - lastWorked) / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) healthStatus = 'active';
            else if (diffDays <= 30) healthStatus = 'slipping';
            else healthStatus = 'inactive';
        }

        res.json({
            totalSessions,
            totalMinutes,
            avgSession,
            lastSession,
            healthStatus
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.addResource = async (req, res) => {
    try {
        const { label, url } = req.body;
        const { userId, clerkId } = req.auth;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $push: { resources: { label, url } } },
            { new: true }
        );
        
        if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
        
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteResource = async (req, res) => {
    try {
        const { rid } = req.params;
        const { userId, clerkId } = req.auth;

        const project = await Project.findOneAndUpdate(
            { _id: req.params.id, userId },
            { $pull: { resources: { _id: rid } } },
            { new: true }
        );
        
        if (!project) return res.status(404).json({ error: 'Project not found or unauthorized' });
        
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.parsePRD = async (req, res) => {
    // STEP 6: DEBUG LOGGING
    if (req.file) {
        console.log("File received:", req.file.originalname);
        console.log("File size:", req.file.size);
        console.log("Buffer exists:", !!req.file.buffer);
    }

    try {
        if (!process.env.GROQ_API_KEY) {
            return res.status(500).json({ success: false, error: "GROQ_API_KEY not configured on server." });
        }

        let fullText = "";
        const isExtractOnly = req.query.extractOnly === 'true';

        // STEP 1: FILE UPLOAD CONFIGURATION & CHECK
        if (req.file) {
            if (!req.file.buffer) {
                return res.status(400).json({ success: false, error: "File upload failed" });
            }

            const fileName = req.file.originalname.toLowerCase();
            const mimeType = req.file.mimetype;

            // STEP 3: MULTI-FORMAT EXTRACTION
            try {
                if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
                    // Standard PDF Parsing
                    const data = await pdf(req.file.buffer);
                    fullText = (data.text || "").trim();
                } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || fileName.endsWith('.docx')) {
                    // DOCX Parsing using Mammoth
                    const mammoth = require("mammoth");
                    const result = await mammoth.extractRawText({ buffer: req.file.buffer });
                    fullText = (result.value || "").trim();
                } else if (mimeType === 'text/plain' || fileName.endsWith('.txt')) {
                    // Plain Text Parsing
                    fullText = req.file.buffer.toString('utf-8').trim();
                } else {
                    return res.status(400).json({ 
                        success: false, 
                        error: "Unsupported file format. Please upload PDF, DOCX, or TXT." 
                    });
                }
                
                // STEP 6: EXTRACTION RESULT LOGGING
                console.log(`[DEBUG] Format Detected: ${mimeType || fileName}`);
                console.log("Extracted text length:", fullText.length);

                // STEP 4 & 7: VALIDATION & FALLBACK
                if (!fullText || fullText.trim().length < 50) {
                    return res.status(422).json({
                        success: false,
                        error: `This ${fileName.split('.').pop().toUpperCase()} does not contain enough readable text (possibly scanned or empty)`
                    });
                }
            } catch (extError) {
                console.error("Extraction Failure:", extError.message);
                return res.status(422).json({
                    success: false,
                    error: "Failed to extract text from the file. It may be corrupted or unsupported."
                });
            }
        } else if (req.body.text) {

            fullText = req.body.text;
        } else {
            return res.status(400).json({ success: false, error: "File upload failed" });
        }

        // STEP 8: RESPONSE FORMAT (for Extraction Phase)
        if (isExtractOnly) {
            console.log(`[DEBUG] Returning Extraction Result (${fullText.length} chars)`);
            return res.json({ 
                success: true, 
                text: fullText 
            });
        }

        // AI SYNTHESIS PHASE (If reached here, we have fullText and want structured synthesis)
        if (!fullText || fullText.trim().length < 50) {
            return res.status(400).json({ success: false, error: "Context stream too thin for synthesis." });
        }

        console.log(`[DEBUG] Dispatching to AI (${fullText.length} chars)`);
        const prompt = `### INSTRUCTIONS:
        ANALZYE THIS PRD. 
        EXTRACT PROJECT IDENTITY DATA.
        IGNORE ALL TECHNICAL ARTIFACTS OR PDF LOGS.

        PRD CONTENT:
        ---
        ${fullText.substring(0, 20000)}
        ---

        RETURN VALID JSON:
        {
          "name": "Project Name",
          "type": "personal | freelance | company",
          "description": "3-5 sentences describing the core goal",
          "priority": "low | medium | high | critical",
          "techStack": ["Stack1", "Stack2"],
          "suggested_tasks": ["Strategic Milestone 1", "Strategic Milestone 2", "..."],
          "requirements": {
             "technicalRequirements": "...",
             "clientRequirements": "..."
          }
        }`;

        const completion = await safeGroqCompletion({
            model: config.summaryModel,
            messages: [
                { role: "system", content: "You are a senior project architect. You focus on user intent. You always return valid JSON." },
                { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" }
        });

        const rawResponse = completion.choices[0].message.content;
        let aiResult;
        try {
            aiResult = JSON.parse(rawResponse);
        } catch (parseErr) {
            return res.status(500).json({ success: false, error: "Invalid AI response format." });
        }

        // Normalization Layer
        const finalData = {
            success: true,
            name: aiResult.name || aiResult.project_name || "Untitled Workspace",
            type: aiResult.type || "personal",
            description: aiResult.description || "",
            priority: aiResult.priority || "medium",
            techStack: aiResult.techStack || [],
            suggested_tasks: aiResult.suggested_tasks || aiResult.milestones || [],
            requirements: aiResult.requirements || { technicalRequirements: "", clientRequirements: "" }
        };

        res.json(finalData);

    } catch (err) {
        console.error("Critical Synthesis Failure:", err);
        res.status(500).json({ success: false, error: "Neural Engine failed to synthesize: " + err.message });
    }
};
