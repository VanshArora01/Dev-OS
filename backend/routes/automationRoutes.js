const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');

router.post('/evaluate-screen', automationController.evaluateScreen);
router.post('/assistant-query', automationController.handleAssistantQuery);

module.exports = router;
