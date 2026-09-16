const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const sessionAnalysisController = require('../controllers/sessionAnalysisController');

router.post('/', sessionController.createSession);
router.get('/last/:id', sessionController.getLastSession);
router.get('/:id', sessionController.getSessionsByProject);

// Vision analysis receives base64-encoded screenshots — allow up to 10 MB on this route only.
// The global 2 MB limit set in server.js is overridden here by specifying a route-level parser.
router.post(
    '/analyze',
    express.json({ limit: '10mb' }),
    sessionAnalysisController.analyzeSession
);

module.exports = router;
