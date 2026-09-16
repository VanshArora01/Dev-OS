const mongoose = require('mongoose');
const Session = require('../models/Session');
const Project = require('../models/Project');
const User = require('../models/User');

// Helper to get User ID from Clerk ID
async function getUserIdFromClerkId(clerkId) {
    if (!clerkId) return null;
    let user = await User.findOne({ clerkId });
    if (!user) {
        user = new User({
            clerkId,
            displayName: 'New DevOS User'
        });
        await user.save();
    }
    return user._id;
}

exports.createSession = async (req, res) => {
    try {
        const { projectId, clerkId, summary, problems, decisions, nextStep, nextPlan, durationMinutes, startedAt, stoppedAt } = req.body;
        const resolvedNextStep = (nextStep || nextPlan || '').trim();
        const resolvedSummary = (summary || '').trim();

        const missing = [];
        if (!projectId) missing.push('projectId');
        if (!clerkId) missing.push('clerkId');
        if (!resolvedSummary) missing.push('summary');
        if (!resolvedNextStep) missing.push('nextStep');
        if (missing.length) {
            return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
        }

        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify project ownership
        const project = await Project.findOne({ _id: projectId, userId });
        if (!project) {
            return res.status(403).json({ error: 'Project not found or unauthorized' });
        }

        const newSession = new Session({
            projectId,
            userId,
            summary: resolvedSummary,
            problems: problems || "",
            decisions: decisions || "",
            nextStep: resolvedNextStep,
            durationMinutes: durationMinutes || 0,
            startedAt: startedAt || new Date(),
            stoppedAt: stoppedAt || new Date()
        });

        const savedSession = await newSession.save();

        // Update project's lastWorkedAt, summary and next step
        project.lastWorkedAt = new Date();
        project.lastSessionSummary = resolvedSummary;
        project.nextPlannedStep = resolvedNextStep;
        project.totalMinutesWorked = (project.totalMinutesWorked || 0) + (durationMinutes || 0);
        await project.save();

        res.status(201).json(savedSession);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSessionsByProject = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(projectId)) {
            return res.status(400).json({ error: 'Invalid Project ID format' });
        }
        const { clerkId } = req.query;

        if (!clerkId) {
            return res.status(400).json({ error: 'clerkId is required' });
        }

        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sessions = await Session.find({ projectId, userId }).sort({ createdAt: -1 });
        res.json(sessions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getLastSession = async (req, res) => {
    try {
        const { id: projectId } = req.params;
        const clerkId = req.headers['x-clerk-id'];

        if (!clerkId) {
            return res.status(400).json({ error: 'x-clerk-id header is required' });
        }

        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const lastSession = await Session.findOne({ projectId, userId })
            .sort({ createdAt: -1 });

        res.json(lastSession || null);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

