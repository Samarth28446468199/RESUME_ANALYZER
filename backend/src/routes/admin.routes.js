const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const Course = require('../models/Course');
const User = require('../models/User');
const Resume = require('../models/Resume');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// GET /api/admin/stats — Dashboard stats
router.get('/stats', async (req, res) => {
    try {
        const [users, resumes, jobs, courses] = await Promise.all([
            User.countDocuments(),
            Resume.countDocuments(),
            Job.countDocuments({ isActive: true }),
            Course.countDocuments(),
        ]);
        res.json({ success: true, stats: { users, resumes, jobs, courses } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// GET /api/admin/users — List all users
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({ success: true, users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// PUT /api/admin/jobs/:id — Update job
router.put('/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// POST /api/admin/jobs — Add a job
router.post('/jobs', async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.status(201).json({ success: true, job });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// DELETE /api/admin/jobs/:id — Delete a job
router.delete('/jobs/:id', async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Deleted' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
