const express = require('express');
const router = express.Router();
const riskController = require('../controllers/riskController');

router.post('/run-risk-scan', riskController.runRiskScan);

module.exports = router;
