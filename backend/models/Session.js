const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    problems: {
        type: String,
        default: ""
    },
    decisions: {
        type: String,
        default: ""
    },
    nextStep: {
        type: String,
        required: true
    },
    durationMinutes: {
        type: Number,
        default: 0
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    stoppedAt: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Session', SessionSchema);
