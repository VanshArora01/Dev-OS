const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: false,
        default: null,
        index: true
    },
    scope: {
        type: String,
        enum: ['persistent', 'ephemeral'],
        default: 'persistent',
        index: true
    },
    surface: {
        type: String,
        enum: ['project', 'workspace'],
        default: 'project',
        index: true
    },
    title: {
        type: String,
        default: 'New conversation'
    },
    summary: {
        type: String,
        default: ''
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastMessageAt: {
        type: Date,
        default: null
    },
    currentArtifact: {
        type: {
            artifact_id: String,
            file_name: String,
            mime_type: String,
            format: String,
            size: Number,
            download_url: String,
            created_at: Date
        },
        default: null
    }
}, {
    timestamps: true
});

ConversationSchema.index({ userId: 1, projectId: 1, updatedAt: -1 });
ConversationSchema.index({ userId: 1, projectId: 1, lastMessageAt: -1 });
ConversationSchema.index({ userId: 1, surface: 1, scope: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
