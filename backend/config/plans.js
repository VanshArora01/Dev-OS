/**
 * Subscription Plans Configuration for DevOS
 */
const plans = {
    starter: {
        name: 'Starter',
        price: 0,
        limits: {
            projects: 10
        }
    },
    pro: {
        name: 'Pro',
        price: 19,
        limits: {
            projects: 20
        }
    },
    enterprise: {
        name: 'Enterprise',
        price: 49,
        limits: {
            projects: Infinity
        }
    }
};

module.exports = plans;
