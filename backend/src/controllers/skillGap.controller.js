const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Course = require('../models/Course');

// Required skills per job role (fallback when no jobs in DB match)
const ROLE_SKILLS_MAP = {
    'Full Stack Developer': ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'HTML', 'CSS', 'Git', 'REST API'],
    'Frontend Developer': ['React', 'JavaScript', 'HTML', 'CSS', 'TypeScript', 'Vue', 'Git', 'Tailwind', 'Sass'],
    'Backend Developer': ['Node.js', 'Python', 'Java', 'Express', 'MongoDB', 'PostgreSQL', 'REST API', 'Docker', 'Git'],
    'Data Scientist': ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'Scikit-learn', 'TensorFlow', 'SQL', 'Data Analysis'],
    'DevOps Engineer': ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Jenkins', 'Terraform', 'Linux', 'Bash', 'Git'],
    'Mobile Developer': ['React Native', 'Flutter', 'Android', 'iOS', 'Swift', 'Kotlin', 'Firebase', 'Git'],
    'Machine Learning Engineer': ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Deep Learning', 'SQL', 'Git'],
    'Cloud Engineer': ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux', 'Networking'],
    'Cybersecurity Analyst': ['Network Security', 'Firewalls', 'Linux', 'Python', 'SIEM', 'Penetration Testing', 'OWASP'],
    'UI/UX Designer': ['Figma', 'Adobe XD', 'HTML', 'CSS', 'Prototyping', 'User Research', 'Wireframing'],
};

const calculateSkillGap = (userSkills, requiredSkills) => {
    const userSkillsLower = userSkills.map((s) => s.toLowerCase());
    const matched = [];
    const missing = [];
    requiredSkills.forEach((skill) => {
        if (userSkillsLower.includes(skill.toLowerCase())) matched.push(skill);
        else missing.push(skill);
    });
    const matchPercentage = requiredSkills.length > 0
        ? Math.round((matched.length / requiredSkills.length) * 100) : 0;
    return { matched, missing, matchPercentage };
};

const calculateProbability = (matchPercentage, experienceYears, requiredExp = 0) => {
    const expMax = Math.max(requiredExp, 5);
    const expScore = Math.min((experienceYears / expMax) * 100, 100);
    return Math.round(Math.min(matchPercentage * 0.7 + expScore * 0.3, 100));
};

/**
 * @desc    Analyze skill gap for a selected job role (by role name)
 * @route   POST /api/skill-gap
 * @access  Private
 */
exports.analyzeSkillGap = async (req, res) => {
    try {
        const { jobRole } = req.body;
        if (!jobRole) return res.status(400).json({ success: false, message: 'Job role is required' });

        const resume = await Resume.findOne({ userId: req.user.id });
        if (!resume) return res.status(404).json({ success: false, message: 'No resume found. Please upload one first.' });

        let requiredSkills = ROLE_SKILLS_MAP[jobRole] || [];
        const dbJob = await Job.findOne({ title: { $regex: jobRole, $options: 'i' }, isActive: true });
        if (dbJob && dbJob.requiredSkills.length > 0) requiredSkills = dbJob.requiredSkills;

        if (requiredSkills.length === 0)
            return res.status(400).json({ success: false, message: `No skill data available for "${jobRole}"` });

        const { matched, missing, matchPercentage } = calculateSkillGap(resume.skills, requiredSkills);
        const probability = calculateProbability(matchPercentage, resume.experienceYears, dbJob?.experienceRequired || 2);
        await Resume.findByIdAndUpdate(resume._id, { lastAnalyzedRole: jobRole });

        res.json({
            success: true,
            data: { jobRole, userSkills: resume.skills, requiredSkills, matchedSkills: matched, missingSkills: missing, matchPercentage, probability, resumeScore: resume.resumeScore, experienceYears: resume.experienceYears },
        });
    } catch (error) {
        console.error('Skill gap error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Analyze skill gap for a specific job posting (by jobId) — includes company, position, inline courses
 * @route   POST /api/skill-gap/job
 * @access  Private
 */
exports.analyzeJobSkillGap = async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) return res.status(400).json({ success: false, message: 'jobId is required' });

        const resume = await Resume.findOne({ userId: req.user.id });
        if (!resume) return res.status(404).json({ success: false, message: 'No resume found. Please upload your resume first.' });

        const job = await Job.findById(jobId);
        if (!job) return res.status(404).json({ success: false, message: 'Job not found' });

        const requiredSkills = job.requiredSkills;
        const { matched, missing, matchPercentage } = calculateSkillGap(resume.skills, requiredSkills);
        const probability = calculateProbability(matchPercentage, resume.experienceYears, job.experienceRequired || 2);

        // Fetch courses for each missing skill
        const coursesMap = {};
        if (missing.length > 0) {
            const courses = await Course.find({
                skill: { $in: missing.map((s) => new RegExp(`^${s}$`, 'i')) },
            }).sort({ rating: -1 });

            missing.forEach((skill) => {
                coursesMap[skill] = courses.filter((c) => c.skill.toLowerCase() === skill.toLowerCase());
            });
        }

        const allCourses = Object.values(coursesMap).flat();
        const uniqueCourses = allCourses.filter((c, idx, self) => self.findIndex((x) => x.link === c.link) === idx);

        await Resume.findByIdAndUpdate(resume._id, { lastAnalyzedRole: job.title });

        res.json({
            success: true,
            data: {
                job: { id: job._id, title: job.title, company: job.company, location: job.location, type: job.type, salary: job.salary, description: job.description, experienceRequired: job.experienceRequired },
                userSkills: resume.skills,
                requiredSkills,
                matchedSkills: matched,
                missingSkills: missing,
                matchPercentage,
                probability,
                resumeScore: resume.resumeScore,
                experienceYears: resume.experienceYears,
                coursesPerSkill: coursesMap,
                recommendedCourses: uniqueCourses,
            },
        });
    } catch (error) {
        console.error('Job skill gap error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get list of available job roles
 * @route   GET /api/skill-gap/roles
 * @access  Private
 */
exports.getJobRoles = async (req, res) => {
    try {
        const dbRoles = await Job.distinct('title', { isActive: true });
        const hardcodedRoles = Object.keys(ROLE_SKILLS_MAP);
        const allRoles = [...new Set([...hardcodedRoles, ...dbRoles])].sort();
        res.json({ success: true, roles: allRoles });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
