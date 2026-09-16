const mongoose = require('mongoose');

const UserSubscriptionSchema = new mongoose.Schema({
    clerkId: {
        type: String,
        required: true,
        unique: true
    },
    planName: {
        type: String,
        enum: ['starter', 'pro', 'enterprise'],
        default: 'starter'
    },
    status: {
        type: String,
        enum: ['active', 'cancelled', 'expired'],
        default: 'active'
    },
    projectsUsed: {
        type: Number,
        default: 0
    },
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default 30 days
    }
}, { timestamps: true });

module.exports = mongoose.model('UserSubscription', UserSubscriptionSchema);
