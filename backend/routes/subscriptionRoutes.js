const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');

router.get('/plans', subscriptionController.getPlans);
router.get('/status', subscriptionController.getSubscriptionStatus);
router.post('/subscribe', subscriptionController.subscribe);
router.post('/cancel', subscriptionController.cancelSubscription);

module.exports = router;
