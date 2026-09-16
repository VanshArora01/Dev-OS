const User = require('../models/User');
const { verifyToken } = require('@clerk/backend');

async function getUserIdFromClerkId(clerkId) {
    if (!clerkId) return null;
    let user = await User.findOne({ clerkId });
    if (!user) {
        try {
            user = new User({
                clerkId,
                displayName: 'New DevOS User'
            });
            await user.save();
        } catch (error) {
            if (error.code === 11000) {
                // Another concurrent request created the user just before this save()
                user = await User.findOne({ clerkId });
                if (!user) throw error; // Re-throw if something is fundamentally broken
            } else {
                throw error;
            }
        }
    }
    return user._id;
}

function getClerkIdFromRequest(req) {
    return req.headers['x-clerk-id'] || req.query.clerkId || req.body?.clerkId || null;
}

async function requireClerkUser(req, res, next) {
    try {
        const authHeader = req.headers.authorization || req.headers.Authorization;
        
        try {
            require('fs').appendFileSync('auth_debug.log', `[${new Date().toISOString()}] authHeader: ${authHeader}\n`);
        } catch(e) {}

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.warn('[Auth Middleware] Missing or malformed authHeader. req.headers:', Object.keys(req.headers), 'authHeader:', authHeader);
            return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
        }

        const token = authHeader.substring(7);
        const secretKey = process.env.CLERK_SECRET_KEY;
        
        if (!secretKey) {
            console.error('[Auth Middleware] CLERK_SECRET_KEY is missing from environment variables.');
            return res.status(500).json({ error: 'Authentication configuration error' });
        }

        let verified;
        try {
            verified = await verifyToken(token, { secretKey: secretKey });
        } catch (tokenErr) {
            console.error('[Auth Middleware] Token verification explicitly threw:', tokenErr.message);
            return res.status(401).json({ error: `Unauthorized: Token verification threw (${tokenErr.message})` });
        }

        if (!verified || !verified.sub) {
            console.warn('[Auth Middleware] Token verification returned invalid:', verified);
            return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
        }

        const clerkId = verified.sub;
        let userId;
        try {
            userId = await getUserIdFromClerkId(clerkId);
        } catch (dbErr) {
            console.error('[Auth Middleware] Database error looking up user:', dbErr.message);
            return res.status(500).json({ error: `Internal Server Error: Database lookup failed (${dbErr.message})` });
        }
        
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized: User not found' });
        }

        req.auth = { userId: userId, clerkId: clerkId };
        
        // For backwards compatibility during transition
        req.clerkId = clerkId;
        req.userId = userId;

        next();
    } catch (error) {
        let tokenStr = 'unknown';
        try {
            const authHeader = req.headers.authorization || req.headers.Authorization;
            if (authHeader) tokenStr = authHeader.substring(7).substring(0, 15);
        } catch(e) {}
        console.error('[Auth Middleware] Token verification failed:', error.message);
        return res.status(401).json({ error: `Unauthorized: Token verification failed (${error.message}). Token prefix: ${tokenStr}` });
    }
}

module.exports = {
    getUserIdFromClerkId,
    getClerkIdFromRequest,
    requireClerkUser
};
