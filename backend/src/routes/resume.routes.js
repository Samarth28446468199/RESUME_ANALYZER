const express = require('express');
const router = express.Router();
const { uploadResume, getResume } = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/analyze', protect, getResume);

module.exports = router;
