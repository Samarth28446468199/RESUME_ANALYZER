const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCoverLetter, analyzeInterviewAnswer, getResumeTips } = require('../controllers/ai.controller');

router.post('/cover-letter', protect, generateCoverLetter);
router.post('/interview-prep', protect, analyzeInterviewAnswer);
router.post('/resume-tips', protect, getResumeTips);

module.exports = router;
