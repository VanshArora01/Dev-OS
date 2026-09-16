const mongoose = require('mongoose');
const Project = require('../models/Project');
const Session = require('../models/Session');
const User = require('../models/User');

exports.getDashboardSummary = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;

        if (!clerkId) {
            return res.status(400).json({ error: 'clerkId is required' });
        }

        const user = await User.findOne({ clerkId });
        if (!user) {
            return res.json({
                totalProjects: 0,
                activeProjects: 0,
                sessionsThisWeek: 0,
                minutesThisWeek: 0,
                lastProject: null,
                recentSessions: []
            });
        }

        // userId is already retrieved from req.auth

        // 1. Project Stats
        const totalProjects = await Project.countDocuments({ userId });
        const activeProjects = await Project.countDocuments({ userId, status: 'active' });

        // 2. Last active project
        const lastProject = await Project.findOne({ userId }).sort({ lastWorkedAt: -1 });

        // 3. Continuity Data
        const lastSession = await Session.findOne({ userId }).sort({ createdAt: -1 });
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);

        const yesterdaySessions = await Session.find({
            userId,
            createdAt: {
                $gte: yesterday,
                $lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        const yesterdaySummary = yesterdaySessions.map(s => s.summary).join(". ") || "No work recorded yesterday.";

        // 4. Projects close to deadline or inactive
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const deadlinesSoon = await Project.find({
            userId,
            deadline: { $lte: threeDaysFromNow, $gte: new Date() },
            status: { $ne: 'completed' }
        }).select('name deadline');

        const inactiveProjects = await Project.find({
            userId,
            lastWorkedAt: { $lt: sevenDaysAgo },
            status: 'active'
        }).select('name lastWorkedAt');

        // 5. Recent Sessions
        const recentSessions = await Session.find({ userId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('projectId', 'name');

        res.json({
            totalProjects,
            activeProjects,
            lastProject,
            yesterdaySummary,
            todayPlan: lastProject?.nextPlannedStep || "No plan recorded. Start by setting a goal.",
            deadlinesSoon,
            inactiveProjects,
            recentSessions: recentSessions.map(s => ({
                id: s._id,
                projectName: s.projectId?.name || 'Deleted Project',
                projectId: s.projectId?._id,
                summary: s.summary,
                nextStep: s.nextStep,
                createdAt: s.createdAt
            }))
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
