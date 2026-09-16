const User = require('../models/User');

async function getUserIdFromClerkId(clerkId) {
    if (!clerkId) return null;
    let user = await User.findOne({ clerkId });
    if (!user) {
        user = new User({
            clerkId,
            displayName: 'New DevOS User'
        });
        await user.save();
    }
    return user._id;
}

function getClerkIdFromRequest(req) {
    return req.headers['x-clerk-id'] || req.query.clerkId || req.body?.clerkId || null;
}

async function requireClerkUser(req, res, next) {
    try {
        const clerkId = getClerkIdFromRequest(req);
        if (!clerkId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = await getUserIdFromClerkId(clerkId);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        req.clerkId = clerkId;
        req.userId = userId;
        next();
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.status(500).json({ error: 'Authentication failed' });
    }
}

module.exports = {
    getUserIdFromClerkId,
    getClerkIdFromRequest,
    requireClerkUser
};
