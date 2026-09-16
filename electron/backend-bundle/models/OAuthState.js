const mongoose = require('mongoose');

const OAuthStateSchema = new mongoose.Schema({
    state: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    clerkId: {
        type: String,
        required: true
    },
    provider: {
        type: String,
        required: true,
        default: 'google_drive'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

OAuthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OAuthState', OAuthStateSchema);
