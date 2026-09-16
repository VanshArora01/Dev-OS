const mongoose = require('mongoose');

const DriveDocumentIndexSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        default: null,
        index: true
    },
    driveFileId: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        default: ''
    },
    webViewLink: {
        type: String,
        default: ''
    },
    modifiedTime: {
        type: Date,
        default: null
    },
    size: {
        type: Number,
        default: 0
    },
    parents: {
        type: [String],
        default: []
    },
    indexedAt: {
        type: Date,
        default: Date.now
    },
    chunkCount: {
        type: Number,
        default: 0
    },
    contentHash: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

DriveDocumentIndexSchema.index({ userId: 1, driveFileId: 1 }, { unique: true });

module.exports = mongoose.model('DriveDocumentIndex', DriveDocumentIndexSchema);
