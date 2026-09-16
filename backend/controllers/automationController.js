const Project = require('../models/Project');
const Session = require('../models/Session');
const { analyzeScreen, processAssistantQuery } = require('../services/visionService');
const mongoose = require('mongoose');

/**
 * Screen monitoring (periodic)
 */
exports.evaluateScreen = async (req, res) => {
    try {
        const { image, projectId, clerkId } = req.body;
        if (!image || !projectId) return res.status(400).json({ error: 'Missing logic parameters' });

        const aiResult = await analyzeScreen(image);
        
        const project = await Project.findById(projectId);
        if (project) {
            project.lastSessionSummary = aiResult.summary;
            project.nextPlannedStep = aiResult.nextStep;
            await project.save();
        }

        res.status(200).json({
            summary: aiResult.summary,
            nextStep: aiResult.nextStep,
            newFeatureFound: aiResult.newFeatureFound
        });
    } catch (err) {
        res.status(500).json({ error: 'Sync failed' });
    }
};

/**
 * Conversation / Assistant Query
 */
exports.handleAssistantQuery = async (req, res) => {
    try {
        const { text, image, projectId, clerkId } = req.body;
        
        const assistantResult = await processAssistantQuery(text, image);
        
        // If query implies adding a deliverable
        if (assistantResult.action === 'add_deliverable' && assistantResult.deliverable) {
            const project = await Project.findById(projectId);
            if (project) {
                // Ensure checklist exists 
                if (!project.requirements) project.requirements = { deliverablesChecklist: [] };
                project.requirements.deliverablesChecklist.push({
                    item: assistantResult.deliverable,
                    done: false
                });
                await project.save();
            }
        }

        res.status(200).json(assistantResult);
    } catch (err) {
        console.error('Assistant Error:', err);
        res.status(500).json({ error: 'Processing error' });
    }
};
