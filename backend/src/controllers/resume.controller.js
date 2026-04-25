const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const Resume = require('../models/Resume');

// ─── Skill Database ───────────────────────────────────────────────────────────
// Comprehensive list of skills to detect in resumes
const KNOWN_SKILLS = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'c', 'ruby', 'go', 'golang',
    'rust', 'swift', 'kotlin', 'php', 'scala', 'r', 'matlab', 'perl',
    // Web Frontend
    'react', 'reactjs', 'angular', 'angularjs', 'vue', 'vuejs', 'html', 'html5', 'css', 'css3',
    'sass', 'scss', 'less', 'tailwind', 'tailwindcss', 'bootstrap', 'jquery', 'next.js', 'nextjs',
    'gatsby', 'svelte', 'nuxt', 'remix',
    // Web Backend
    'node', 'nodejs', 'node.js', 'express', 'expressjs', 'django', 'flask', 'fastapi',
    'spring', 'spring boot', 'laravel', 'rails', 'ruby on rails', 'asp.net', '.net',
    'graphql', 'rest api', 'restful', 'soap', 'grpc',
    // Databases
    'mongodb', 'mysql', 'postgresql', 'postgres', 'sqlite', 'redis', 'cassandra',
    'dynamodb', 'firebase', 'supabase', 'elasticsearch', 'oracle', 'mssql',
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'k8s',
    'terraform', 'ansible', 'jenkins', 'ci/cd', 'github actions', 'gitlab ci',
    'nginx', 'apache', 'linux', 'bash', 'shell scripting',
    // Mobile
    'react native', 'flutter', 'android', 'ios', 'swift', 'xamarin',
    // Data Science / ML
    'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'keras', 'scikit-learn',
    'pandas', 'numpy', 'matplotlib', 'data analysis', 'data science', 'nlp',
    'computer vision', 'neural network', 'ai',
    // Tools
    'git', 'github', 'gitlab', 'bitbucket', 'jira', 'confluence', 'slack',
    'figma', 'adobe xd', 'postman', 'swagger', 'webpack', 'vite', 'babel',
    // Testing
    'jest', 'mocha', 'chai', 'selenium', 'cypress', 'playwright', 'junit', 'testing',
    // Other
    'agile', 'scrum', 'kanban', 'microservices', 'blockchain', 'solidity', 'web3',
    'socket.io', 'websocket', 'oauth', 'jwt',
];

/**
 * Extract text from PDF or DOCX file
 */
const extractText = async (filePath, mimetype) => {
    const ext = path.extname(filePath).toLowerCase();

    if (ext === '.pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text;
    }

    if (ext === '.docx' || ext === '.doc') {
        const result = await mammoth.extractRawText({ path: filePath });
        return result.value;
    }

    throw new Error('Unsupported file format');
};

/**
 * Extract skills from raw text by matching against known skills list
 */
const extractSkills = (text) => {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set();

    KNOWN_SKILLS.forEach((skill) => {
        // Use word-boundary matching for short skills
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lowerText)) {
            // Normalize and capitalize
            foundSkills.add(
                skill
                    .split(' ')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')
            );
        }
    });

    return [...foundSkills];
};

/**
 * Extract education info from text
 */
const extractEducation = (text) => {
    const education = [];
    const degreeRegex =
        /(?:bachelor|master|phd|b\.?tech|m\.?tech|b\.?sc|m\.?sc|b\.?e|m\.?e|mba|bca|mca|diploma)[^\n]*/gi;
    const matches = text.match(degreeRegex) || [];

    matches.forEach((match) => {
        education.push({
            degree: match.trim().substring(0, 200),
            institution: '',
            year: '',
        });
    });

    return education.slice(0, 5);
};

/**
 * Estimate years of experience from text
 */
const extractExperienceYears = (text) => {
    const yearRegex = /(\d+)\+?\s*year[s]?\s*(?:of\s*)?(?:experience|exp)/gi;
    const matches = [...text.matchAll(yearRegex)];
    if (matches.length > 0) {
        return parseInt(matches[0][1], 10);
    }
    return 0;
};

/**
 * Extract name — first non-empty line heuristic
 */
const extractName = (text) => {
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    // First line is usually the name if it's short (< 5 words)
    if (lines.length > 0 && lines[0].split(' ').length <= 5) {
        return lines[0];
    }
    return '';
};

/**
 * Extract email
 */
const extractEmail = (text) => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const match = text.match(emailRegex);
    return match ? match[0] : '';
};

/**
 * Extract phone
 */
const extractPhone = (text) => {
    const phoneRegex = /(\+?\d[\d\s\-().]{8,14}\d)/;
    const match = text.match(phoneRegex);
    return match ? match[0].trim() : '';
};

/**
 * Compute a resume score out of 100
 */
const computeResumeScore = (skills, education, experience, experienceYears) => {
    let score = 0;
    score += Math.min(skills.length * 3, 40);       // Up to 40 pts for skills
    score += Math.min(education.length * 10, 20);   // Up to 20 pts for education
    score += Math.min(experienceYears * 5, 30);      // Up to 30 pts for experience
    score += experience.length > 0 ? 10 : 0;        // 10 pts for having work history
    return Math.min(score, 100);
};

/**
 * @desc    Upload and parse resume
 * @route   POST /api/resume/upload
 * @access  Private
 */
exports.uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const { path: filePath, originalname, mimetype } = req.file;

        // Extract text from document
        let rawText;
        try {
            rawText = await extractText(filePath, mimetype);
        } catch (e) {
            return res.status(400).json({ success: false, message: 'Could not parse file: ' + e.message });
        }

        // Parse resume fields
        const name = extractName(rawText);
        const email = extractEmail(rawText);
        const phone = extractPhone(rawText);
        const skills = extractSkills(rawText);
        const education = extractEducation(rawText);
        const experienceYears = extractExperienceYears(rawText);
        const resumeScore = computeResumeScore(skills, education, [], experienceYears);

        // Upsert resume (one per user)
        const resume = await Resume.findOneAndUpdate(
            { userId: req.user.id },
            {
                userId: req.user.id,
                fileName: originalname,
                filePath,
                rawText,
                name,
                email,
                phone,
                skills,
                education,
                experience: [],
                experienceYears,
                resumeScore,
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            message: 'Resume uploaded and analyzed successfully',
            resume: {
                id: resume._id,
                name: resume.name,
                email: resume.email,
                phone: resume.phone,
                skills: resume.skills,
                education: resume.education,
                experienceYears: resume.experienceYears,
                resumeScore: resume.resumeScore,
            },
        });
    } catch (error) {
        console.error('Upload resume error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get user's resume analysis
 * @route   GET /api/resume/analyze
 * @access  Private
 */
exports.getResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user.id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'No resume found. Please upload one first.' });
        }
        res.json({ success: true, resume });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
