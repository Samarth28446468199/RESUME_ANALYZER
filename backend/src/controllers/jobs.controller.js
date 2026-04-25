const Job = require('../models/Job');
const Resume = require('../models/Resume');

/**
 * Calculate match % between user skills and required skills
 */
const getMatchPercent = (userSkills, requiredSkills) => {
    if (!requiredSkills || requiredSkills.length === 0) return 0;
    const userLower = userSkills.map((s) => s.toLowerCase());
    const matched = requiredSkills.filter((s) => userLower.includes(s.toLowerCase()));
    return Math.round((matched.length / requiredSkills.length) * 100);
};

/**
 * @desc    Get job recommendations based on user's resume skills
 * @route   GET /api/jobs/recommend
 * @access  Private
 */
exports.getRecommendedJobs = async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user.id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Please upload a resume first' });
        }

        const allJobs = await Job.find({ isActive: true });

        // Compute match for every job
        const jobsWithMatch = allJobs
            .map((job) => ({
                _id: job._id,
                title: job.title,
                company: job.company,
                location: job.location,
                type: job.type,
                salary: job.salary,
                requiredSkills: job.requiredSkills,
                description: job.description,
                matchPercentage: getMatchPercent(resume.skills, job.requiredSkills),
            }))
            .sort((a, b) => b.matchPercentage - a.matchPercentage);

        res.json({ success: true, jobs: jobsWithMatch });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get all jobs (admin)
 * @route   GET /api/jobs
 * @access  Private/Admin
 */
exports.getAllJobs = async (req, res) => {
    try {
        const jobs = await Job.find().sort({ createdAt: -1 });
        res.json({ success: true, count: jobs.length, jobs });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new job (admin)
 * @route   POST /api/jobs
 * @access  Private/Admin
 */
exports.createJob = async (req, res) => {
    try {
        const job = await Job.create(req.body);
        res.status(201).json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update a job (admin)
 * @route   PUT /api/jobs/:id
 * @access  Private/Admin
 */
exports.updateJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });
        res.json({ success: true, job });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete a job (admin)
 * @route   DELETE /api/jobs/:id
 * @access  Private/Admin
 */
exports.deleteJob = async (req, res) => {
    try {
        await Job.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Job deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
