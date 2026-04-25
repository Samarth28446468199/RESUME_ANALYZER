const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCoverLetter, analyzeInterviewAnswer } = require('../controllers/ai.controller');

router.post('/cover-letter', protect, generateCoverLetter);
router.post('/interview-prep', protect, analyzeInterviewAnswer);

module.exports = router;
