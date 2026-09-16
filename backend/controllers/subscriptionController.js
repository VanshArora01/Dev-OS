const UserSubscription = require('../models/UserSubscription');
const FakePayment = require('../models/FakePayment');
const plans = require('../config/plans');

// Helper to generate random transaction ID
const generateTxnId = () => 'TXN' + Math.random().toString(36).substring(2, 10).toUpperCase();

exports.getPlans = (req, res) => {
    res.json(Object.entries(plans).map(([id, details]) => ({ id, ...details })));
};

exports.getSubscriptionStatus = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        if (!clerkId) return res.status(400).json({ error: 'clerkId is required' });

        let subscription = await UserSubscription.findOne({ clerkId });

        if (!subscription) {
            // Create default starter subscription if not exists
            subscription = new UserSubscription({ clerkId, planName: 'starter' });
            await subscription.save();
        }

        const planDetails = plans[subscription.planName];

        res.json({
            ...subscription.toObject(),
            planDetails,
            remainingProjects: planDetails.limits.projects === Infinity ? 'Unlimited' : Math.max(0, planDetails.limits.projects - subscription.projectsUsed),
            remainingEvaluations: planDetails.limits.evaluations === Infinity ? 'Unlimited' : Math.max(0, planDetails.limits.evaluations - subscription.evaluationsUsed)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.subscribe = async (req, res) => {
    try {
        const { planName } = req.body;
        const { userId, clerkId } = req.auth;
        if (!clerkId || !planName) return res.status(400).json({ error: 'clerkId and planName are required' });
        if (!plans[planName]) return res.status(400).json({ error: 'Invalid plan name' });

        // Simulate payment delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        const amount = plans[planName].price;
        const transactionId = generateTxnId();

        // Create FakePayment record
        const payment = new FakePayment({
            clerkId,
            planName,
            amount,
            transactionId,
            paymentStatus: 'success'
        });
        await payment.save();

        // Update or Create Subscription
        let subscription = await UserSubscription.findOne({ clerkId });
        if (subscription) {
            subscription.planName = planName;
            subscription.status = 'active';
            subscription.startDate = new Date();
            subscription.endDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            // We usually don't reset usage, or maybe we do? Let's say we don't for now.
            await subscription.save();
        } else {
            subscription = new UserSubscription({
                clerkId,
                planName,
                status: 'active'
            });
            await subscription.save();
        }

        res.json({
            success: true,
            message: `Successfully subscribed to ${plans[planName].name}`,
            payment,
            subscription
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.cancelSubscription = async (req, res) => {
    try {
        const { userId, clerkId } = req.auth;
        if (!clerkId) return res.status(400).json({ error: 'clerkId is required' });

        const subscription = await UserSubscription.findOneAndUpdate(
            { clerkId },
            { status: 'cancelled' },
            { new: true }
        );

        if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

        res.json({ success: true, message: 'Subscription cancelled', subscription });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
