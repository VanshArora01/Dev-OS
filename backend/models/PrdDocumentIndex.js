const mongoose = require('mongoose');

const PrdDocumentIndexSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true,
        index: true,
        unique: true
    },
    sourceDocumentId: {
        type: String,
        required: true
    },
    filename: {
        type: String,
        default: 'prd'
    },
    contentHash: {
        type: String,
        default: ''
    },
    chunkCount: {
        type: Number,
        default: 0
    },
    vectorDimension: {
        type: Number,
        default: null
    },
    status: {
        type: String,
        enum: ['pending', 'indexed', 'failed', 'deleted'],
        default: 'pending'
    },
    error: {
        type: String,
        default: null
    },
    version: {
        type: Number,
        default: 1
    },
    indexedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

PrdDocumentIndexSchema.index({ userId: 1, projectId: 1 }, { unique: true });

module.exports = mongoose.model('PrdDocumentIndex', PrdDocumentIndexSchema);
