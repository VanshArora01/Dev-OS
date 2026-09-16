const mongoose = require('mongoose');

const DocumentChunkSchema = new mongoose.Schema({
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
    fileName: {
        type: String,
        default: ''
    },
    webViewLink: {
        type: String,
        default: ''
    },
    chunkIndex: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    embedding: {
        type: [Number],
        default: []
    }
}, {
    timestamps: true
});

DocumentChunkSchema.index({ userId: 1, driveFileId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model('DocumentChunk', DocumentChunkSchema);
