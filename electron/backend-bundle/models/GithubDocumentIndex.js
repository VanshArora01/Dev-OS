const mongoose = require('mongoose');

const GithubDocumentIndexSchema = new mongoose.Schema({
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
        index: true
    },
    repositoryId: {
        type: String,
        required: true,
        index: true
    },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    path: { type: String, required: true },
    branch: { type: String, default: '' },
    commitSha: { type: String, default: '' },
    language: { type: String, default: '' },
    contentHash: { type: String, default: '' },
    chunkCount: { type: Number, default: 0 },
    indexedAt: { type: Date, default: Date.now },
    status: {
        type: String,
        enum: ['indexed', 'skipped', 'failed'],
        default: 'indexed'
    },
    error: { type: String, default: null }
}, {
    timestamps: true
});

GithubDocumentIndexSchema.index(
    { userId: 1, projectId: 1, repositoryId: 1, path: 1 },
    { unique: true }
);

module.exports = mongoose.model('GithubDocumentIndex', GithubDocumentIndexSchema);
