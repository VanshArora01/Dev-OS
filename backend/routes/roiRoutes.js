const express = require('express');
const router = express.Router();
const roiController = require('../controllers/roiController');

router.post('/calculate', roiController.calculateROI);

module.exports = router;
