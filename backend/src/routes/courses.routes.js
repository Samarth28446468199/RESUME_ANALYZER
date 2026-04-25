const express = require('express');
const router = express.Router();
const {
    getRecommendedCourses,
    getAllCourses,
    createCourse,
} = require('../controllers/courses.controller');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/recommend', protect, getRecommendedCourses);
router.get('/', protect, adminOnly, getAllCourses);
router.post('/', protect, adminOnly, createCourse);

module.exports = router;
