const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { checkLimit } = require('../middleware/limitMiddleware');

router.post('/:id/generate', checkLimit('exportPdf'), reportController.generateReport);
router.get('/:id/download', checkLimit('exportPdf'), reportController.downloadReport);

module.exports = router;
