const mongoose = require('mongoose');

const ThoughtSchema = new mongoose.Schema({
    userId: {
        type: String, // Clerk ID
        required: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    // Track who posted it for easy lookups
    userName: String,
    userAvatar: String
});

module.exports = mongoose.model('Thought', ThoughtSchema);
