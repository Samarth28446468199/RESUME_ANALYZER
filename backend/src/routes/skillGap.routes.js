const express = require('express');
const router = express.Router();
const { analyzeSkillGap, analyzeJobSkillGap, getJobRoles } = require('../controllers/skillGap.controller');
const { protect } = require('../middleware/auth');

router.get('/roles', protect, getJobRoles);
router.post('/', protect, analyzeSkillGap);
router.post('/job', protect, analyzeJobSkillGap);

module.exports = router;
