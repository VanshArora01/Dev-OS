const mongoose = require('mongoose');

const PendingAIActionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        default: null,
        index: true
    },
    toolName: {
        type: String,
        required: true
    },
    toolArgs: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    agentState: {
        type: mongoose.Schema.Types.Mixed,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'expired'],
        default: 'pending'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

PendingAIActionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('PendingAIAction', PendingAIActionSchema);
