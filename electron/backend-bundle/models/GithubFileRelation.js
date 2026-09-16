const mongoose = require('mongoose');

const GithubFileRelationSchema = new mongoose.Schema({
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
    repositoryId: { type: String, required: true, index: true },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    path: { type: String, required: true },
    language: { type: String, default: '' },
    imports: { type: [String], default: [] },
    exports: { type: [String], default: [] },
    relatedPaths: { type: [String], default: [] },
    analyzedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

GithubFileRelationSchema.index(
    { userId: 1, projectId: 1, repositoryId: 1, path: 1 },
    { unique: true }
);

module.exports = mongoose.model('GithubFileRelation', GithubFileRelationSchema);
