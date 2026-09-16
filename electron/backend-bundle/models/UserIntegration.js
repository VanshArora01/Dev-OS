const mongoose = require('mongoose');

const UserIntegrationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    clerkId: {
        type: String,
        required: true,
        index: true
    },
    provider: {
        type: String,
        required: true,
        enum: ['google_drive', 'github'],
        index: true
    },
    providerAccountId: {
        type: String,
        required: true
    },
    accountEmail: {
        type: String,
        default: ''
    },
    encryptedAccessToken: {
        type: String,
        default: null
    },
    encryptedRefreshToken: {
        type: String,
        default: null
    },
    tokenExpiry: {
        type: Date,
        default: null
    },
    scopes: {
        type: [String],
        default: []
    },
    status: {
        type: String,
        enum: ['connected', 'disconnected', 'revoked', 'error'],
        default: 'connected'
    },
    lastError: {
        type: String,
        default: null
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
}, {
    timestamps: true
});

UserIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model('UserIntegration', UserIntegrationSchema);
