const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const sessionAnalysisController = require("../controllers/sessionAnalysisController");

router.post('/', sessionController.createSession);
router.get('/last/:id', sessionController.getLastSession);
router.get('/:id', sessionController.getSessionsByProject);
router.post("/analyze", sessionAnalysisController.analyzeSession);

module.exports = router;

