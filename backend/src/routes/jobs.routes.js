const express = require('express');
const router = express.Router();
const {
    getRecommendedJobs,
    getAllJobs,
    createJob,
    updateJob,
    deleteJob,
} = require('../controllers/jobs.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/recommend', protect, getRecommendedJobs);
router.get('/', protect, adminOnly, getAllJobs);
router.post('/', protect, adminOnly, createJob);
router.put('/:id', protect, adminOnly, updateJob);
router.delete('/:id', protect, adminOnly, deleteJob);

module.exports = router;
