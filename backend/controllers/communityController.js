const User = require('../models/User');
const Thought = require('../models/Thought');
const Comment = require('../models/Comment');

// User Profile logic
exports.getUserProfile = async (req, res) => {
    try {
        const { clerkId } = req.params;
        let user = await User.findOne({ clerkId });

        if (!user) {
            // Return empty profile if not found
            return res.status(200).json({ clerkId, displayName: '', bio: '', profession: '' });
        }

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const { displayName, bio, profession, avatar, location } = req.body;
        const { userId, clerkId } = req.auth;

        let user = await User.findOneAndUpdate(
            { clerkId },
            { displayName, bio, profession, avatar, location },
            { new: true, upsert: true }
        );

        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Thoughts logic
exports.createThought = async (req, res) => {
    try {
        const { userId, content, userName, userAvatar } = req.body;
        const newThought = new Thought({ userId, content, userName, userAvatar });
        await newThought.save();
        res.status(201).json(newThought);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllThoughts = async (req, res) => {
    try {
        const thoughts = await Thought.find().sort({ createdAt: -1 });
        res.status(200).json(thoughts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Comments logic
exports.createComment = async (req, res) => {
    try {
        const { thoughtId, userId, content, userName, userAvatar } = req.body;
        const newComment = new Comment({ thoughtId, userId, content, userName, userAvatar });
        await newComment.save();
        res.status(201).json(newComment);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCommentsByThought = async (req, res) => {
    try {
        const { thoughtId } = req.params;
        const comments = await Comment.find({ thoughtId }).sort({ createdAt: 1 });
        res.status(200).json(comments);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
