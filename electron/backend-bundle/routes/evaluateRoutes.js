const express = require('express');
const router = express.Router();
const evaluateController = require('../controllers/evaluateController');
const { checkLimit } = require('../middleware/limitMiddleware');

router.post('/', checkLimit('evaluations'), evaluateController.evaluate);

module.exports = router;
