const UserSubscription = require('../models/UserSubscription');
const plans = require('../config/plans');

/**
 * Middleware to check subscription limits
 * @param {('projects')} feature - The feature ti check
 */
const checkLimit = (feature) => {
    return async (req, res, next) => {
        try {
            const clerkId = req.headers['x-clerk-id'] || req.body?.clerkId || req.query?.clerkId;
            console.log(`[LimitCheck] Checking limit for feature: ${feature}, ClerkID: ${clerkId}`);

            if (!clerkId) {
                console.warn(`[LimitCheck] Missing ClerkID for feature: ${feature}`);
                return res.status(401).json({ error: 'Authentication required' });
            }

            let subscription = await UserSubscription.findOne({ clerkId });

            if (!subscription) {
                subscription = new UserSubscription({ clerkId, planName: 'starter' });
                await subscription.save();
            }

            const plan = plans[subscription.planName];
            const limit = plan.limits[feature];

            if (feature === 'projects') {
                // Limit removed per user request
                /*
                if (subscription.projectsUsed >= limit) {
                    return res.status(403).json({
                        error: 'Project limit reached.',
                        message: `You have reached the limit for the ${plan.name} plan. Please upgrade to create more projects.`,
                        limitReached: true
                    });
                }
                */
            }

            req.subscription = subscription;
            next();
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    };
};

module.exports = { checkLimit };
