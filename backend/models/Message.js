const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
        index: true
    },
    role: {
        type: String,
        enum: ['user', 'assistant', 'system', 'tool'],
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    toolCalls: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    toolResults: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    sources: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
