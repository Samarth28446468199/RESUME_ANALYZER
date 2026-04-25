const Course = require('../models/Course');
const Resume = require('../models/Resume');

/**
 * @desc    Get course recommendations for user's missing skills
 * @route   GET /api/courses/recommend?missingSkills=React,Docker
 * @access  Private
 */
exports.getRecommendedCourses = async (req, res) => {
    try {
        let missingSkills = [];

        // Accept from query params or derive from resume
        if (req.query.missingSkills) {
            missingSkills = req.query.missingSkills.split(',').map((s) => s.trim());
        } else {
            const resume = await Resume.findOne({ userId: req.user.id });
            if (!resume) {
                return res.status(404).json({ success: false, message: 'No resume found' });
            }
            missingSkills = resume.skills; // Fallback: recommend courses for all skills
        }

        if (missingSkills.length === 0) {
            return res.json({ success: true, courses: [] });
        }

        // Find courses matching any missing skill (case-insensitive)
        const courses = await Course.find({
            skill: { $in: missingSkills.map((s) => new RegExp(`^${s}$`, 'i')) },
        }).sort({ rating: -1 });

        res.json({ success: true, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private/Admin
 */
exports.getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find().sort({ createdAt: -1 });
        res.json({ success: true, count: courses.length, courses });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create course (admin)
 * @route   POST /api/courses
 * @access  Private/Admin
 */
exports.createCourse = async (req, res) => {
    try {
        const course = await Course.create(req.body);
        res.status(201).json({ success: true, course });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
