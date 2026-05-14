# AI Skill Gap Detector & Resume Analyzer Codebase

## File: backend\package.json
```json
{
  "name": "ai-skill-gap-backend",
  "version": "1.0.0",
  "description": "Backend for AI Skill Gap Detector & Resume Analyzer",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js",
    "seed": "node src/utils/seedData.js"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.96.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.18.2",
    "express-validator": "^7.0.1",
    "jsonwebtoken": "^9.0.2",
    "mammoth": "^1.7.0",
    "mongodb-memory-server": "^11.0.1",
    "mongoose": "^8.2.0",
    "multer": "^1.4.5-lts.1",
    "pdf-parse": "^1.1.1"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}

```

## File: backend\src\controllers\ai.controller.js
```javascript
const Anthropic = require('@anthropic-ai/sdk');
const Resume = require('../models/Resume');

// Initialize Claude client
const getClient = () => {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === 'your_claude_api_key_here') {
        return null;
    }
    return new Anthropic({ apiKey });
};

/**
 * Helper — call Claude and return text response
 */
const askClaude = async (client, systemPrompt, userMessage) => {
    const message = await client.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
    });
    return message.content[0].text;
};

/**
 * @desc    Generate a professional cover letter using Claude AI
 * @route   POST /api/ai/cover-letter
 * @access  Private
 */
exports.generateCoverLetter = async (req, res) => {
    try {
        const { jobTitle, companyName, skills, jobDescription, userName } = req.body;

        if (!jobTitle || !companyName) {
            return res.status(400).json({ success: false, message: 'Job Title and Company Name are required' });
        }

        const client = getClient();

        // Fallback if no API key configured
        if (!client) {
            const letter = `Dear Hiring Manager at ${companyName},\n\nI am writing to express my strong interest in the ${jobTitle} position. With my background and expertise in ${skills || 'relevant technologies'}, I am confident that I can bring significant value to your team.\n\nThroughout my career, I have consistently focused on building scalable, user-centric solutions. The opportunity to contribute to ${companyName} excites me, particularly because of your commitment to innovation.\n\nI would welcome the opportunity to discuss how my technical skills and professional experience align perfectly with your current needs.\n\nThank you for your time and consideration.\n\nSincerely,\n${userName || '[Your Name]'}`;
            return res.json({ success: true, data: { coverLetter: letter, poweredBy: 'template' } });
        }

        const systemPrompt = `You are an expert career counselor and professional cover letter writer. 
Write compelling, personalized, and ATS-optimized cover letters. 
Use a professional tone, specific achievements where possible, and keep it to 3-4 paragraphs.
Do NOT include placeholder text like [Your Name] — use the name provided.
Return ONLY the cover letter text, no extra commentary.`;

        const userMessage = `Write a professional cover letter for:
- Applicant Name: ${userName || 'the applicant'}
- Job Title: ${jobTitle}
- Company: ${companyName}
- Key Skills: ${skills || 'software development, problem solving, teamwork'}
${jobDescription ? `- Job Description: ${jobDescription}` : ''}

Make it compelling, specific, and ready to send.`;

        const coverLetter = await askClaude(client, systemPrompt, userMessage);

        res.json({
            success: true,
            data: { coverLetter, poweredBy: 'claude-3-5-haiku' }
        });

    } catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(500).json({ success: false, message: 'AI generation failed: ' + error.message });
    }
};

/**
 * @desc    Analyze an interview answer using Claude AI
 * @route   POST /api/ai/interview-prep
 * @access  Private
 */
exports.analyzeInterviewAnswer = async (req, res) => {
    try {
        const { question, answer, jobRole } = req.body;

        if (!question || !answer) {
            return res.status(400).json({ success: false, message: 'Question and answer are required' });
        }

        const client = getClient();

        // Fallback if no API key configured
        if (!client) {
            const feedbackScore = Math.floor(Math.random() * 20) + 75;
            return res.json({
                success: true,
                data: {
                    score: feedbackScore,
                    comments: "Strong structural approach. Your articulation of the STAR method was clear, but try to minimize filler words. The technical depth was solid.",
                    strengths: ["Clear communication", "Structured response"],
                    improvements: ["Add specific metrics", "Use more technical detail"],
                    poweredBy: 'template'
                }
            });
        }

        const systemPrompt = `You are an expert technical interviewer and career coach with 15+ years of experience.
Analyze interview answers critically but constructively.
Return your analysis as valid JSON with this exact structure:
{
  "score": <number 0-100>,
  "overallFeedback": "<2-3 sentence summary>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<area to improve 1>", "<area to improve 2>"],
  "betterAnswerTip": "<one specific tip to make the answer better>"
}`;

        const userMessage = `Analyze this interview answer:

Interview Question: "${question}"
${jobRole ? `Job Role: ${jobRole}` : ''}
Candidate's Answer: "${answer}"

Provide detailed, actionable feedback.`;

        const rawResponse = await askClaude(client, systemPrompt, userMessage);

        let parsed;
        try {
            // Extract JSON from response
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            parsed = null;
        }

        if (parsed) {
            res.json({
                success: true,
                data: {
                    score: parsed.score,
                    comments: parsed.overallFeedback,
                    strengths: parsed.strengths || [],
                    improvements: parsed.improvements || [],
                    betterAnswerTip: parsed.betterAnswerTip || '',
                    poweredBy: 'claude-3-5-haiku'
                }
            });
        } else {
            // Return raw text if JSON parsing fails
            res.json({
                success: true,
                data: {
                    score: 78,
                    comments: rawResponse,
                    strengths: [],
                    improvements: [],
                    poweredBy: 'claude-3-5-haiku'
                }
            });
        }

    } catch (error) {
        console.error('Interview analysis error:', error);
        res.status(500).json({ success: false, message: 'AI analysis failed: ' + error.message });
    }
};

/**
 * @desc    Get AI-powered resume improvement tips using Claude
 * @route   POST /api/ai/resume-tips
 * @access  Private
 */
exports.getResumeTips = async (req, res) => {
    try {
        const resume = await Resume.findOne({ userId: req.user.id });

        if (!resume) {
            return res.status(404).json({ success: false, message: 'No resume found. Please upload one first.' });
        }

        const client = getClient();

        if (!client) {
            return res.json({
                success: true,
                data: {
                    tips: [
                        "Add quantifiable achievements (e.g., 'Improved app performance by 40%')",
                        "Include a professional summary at the top",
                        "List skills in order of proficiency",
                        "Use action verbs: Built, Designed, Implemented, Led",
                        "Tailor your resume for each job application"
                    ],
                    poweredBy: 'template'
                }
            });
        }

        const systemPrompt = `You are a professional resume coach and career advisor.
Analyze the resume data and provide specific, actionable improvement tips.
Return JSON with this structure:
{
  "overallScore": <number 0-100>,
  "tips": ["<specific tip 1>", "<specific tip 2>", ...],
  "strengths": ["<what's good>", ...],
  "missingElements": ["<what's missing>", ...]
}`;

        const userMessage = `Analyze this resume data and give improvement tips:

Name: ${resume.name || 'Not detected'}
Skills Found (${resume.skills.length}): ${resume.skills.slice(0, 20).join(', ')}
Education: ${resume.education.map(e => e.degree).join(', ') || 'None detected'}
Experience Years: ${resume.experienceYears}
Current Resume Score: ${resume.resumeScore}/100

Provide specific, actionable tips to improve this resume.`;

        const rawResponse = await askClaude(client, systemPrompt, userMessage);

        let parsed;
        try {
            const jsonMatch = rawResponse.match(/\{[\s\S]*\}/);
            parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
            parsed = null;
        }

        res.json({
            success: true,
            data: {
                tips: parsed?.tips || [rawResponse],
                strengths: parsed?.strengths || [],
                missingElements: parsed?.missingElements || [],
                overallScore: parsed?.overallScore || resume.resumeScore,
                poweredBy: 'claude-3-5-haiku'
            }
        });

    } catch (error) {
        console.error('Resume tips error:', error);
        res.status(500).json({ success: false, message: 'AI tips generation failed: ' + error.message });
    }
};

```

## File: backend\src\controllers\auth.controller.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate and sign JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validate fields
        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already in use' });
        }

        // Create user
        const user = await User.create({ name, email, password });
        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            message: 'Account created successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // UNIVERSAL LOGIN BYPASS: Any email can login. 
        // If user doesn't exist, create them. If they do, just log them in.
        let user = await User.findOne({ email });
        
        if (!user) {
            // Create a temporary user for this email
            user = await User.create({
                name: email.split('@')[0],
                email: email,
                password: 'password123', // Default password for new users
                role: 'user'
            });
            console.log(`🚀 Universal Login: Created new user for ${email}`);
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            message: 'Logged in successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get current logged-in user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Change user password
 * @route   PUT /api/auth/password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const user = await User.findById(req.user.id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password' });
        }

        user.password = newPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Password change error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Google Login — find or create user by email, return JWT
 * @route   POST /api/auth/google
 * @access  Public
 */
exports.googleLogin = async (req, res) => {
    try {
        const { email, name } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required for Google login' });
        }

        // Find existing user or create a new one
        let user = await User.findOne({ email });

        if (!user) {
            // Generate a random secure password for Google-auth users (they won't use it)
            const randomPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
            user = await User.create({
                name: name || email.split('@')[0],
                email,
                password: randomPassword,
                authProvider: 'google',
            });
        }

        const token = generateToken(user._id);

        return res.json({
            success: true,
            message: 'Google login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Google login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

```

## File: backend\src\controllers\courses.controller.js
```javascript
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

```

## File: backend\src\controllers\jobs.controller.js
```javascript
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

```

## File: backend\src\controllers\resume.controller.js
```javascript
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

```

## File: backend\src\controllers\skillGap.controller.js
```javascript
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

```

## File: backend\src\middleware\auth.js
```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: Protect routes — requires valid JWT
 */
exports.protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer ')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(decoded.id).select('-password');

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'User not found' });
        }

        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalid or expired' });
    }
};

/**
 * Middleware: Restrict to admin role only
 */
exports.adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Admin access required' });
};

```

## File: backend\src\middleware\upload.js
```javascript
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const ext = path.extname(file.originalname);
        cb(null, `resume-${uniqueSuffix}${ext}`);
    },
});

// File filter — only PDF and DOCX
const fileFilter = (req, file, cb) => {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF and DOCX files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

module.exports = upload;

```

## File: backend\src\models\Course.js
```javascript
const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
    {
        skill: {
            type: String,
            required: [true, 'Skill is required'],
            trim: true,
            lowercase: true,
        },
        courseName: {
            type: String,
            required: [true, 'Course name is required'],
            trim: true,
        },
        platform: {
            type: String,
            enum: ['Coursera', 'Udemy', 'edX', 'YouTube', 'Pluralsight', 'LinkedIn Learning', 'FreeCodeCamp', 'Other'],
            default: 'Coursera',
        },
        link: {
            type: String,
            required: [true, 'Course URL is required'],
        },
        duration: { type: String, default: 'Self-paced' },
        level: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
        },
        rating: { type: Number, default: 4.5, min: 0, max: 5 },
        isFree: { type: Boolean, default: false },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Course', courseSchema);

```

## File: backend\src\models\Job.js
```javascript
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Job title is required'],
            trim: true,
        },
        company: {
            type: String,
            required: [true, 'Company is required'],
            trim: true,
        },
        location: { type: String, default: 'Remote' },
        type: {
            type: String,
            enum: ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance'],
            default: 'Full-time',
        },
        salary: { type: String, default: 'Competitive' },
        requiredSkills: [{ type: String }],
        description: { type: String, default: '' },
        experienceRequired: { type: Number, default: 0 }, // years
        category: { type: String, default: 'Technology' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Job', jobSchema);

```

## File: backend\src\models\Resume.js
```javascript
const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        fileName: { type: String },
        filePath: { type: String },
        rawText: { type: String }, // Raw extracted text

        // Parsed fields
        name: { type: String, default: '' },
        email: { type: String, default: '' },
        phone: { type: String, default: '' },
        skills: [{ type: String }],
        education: [
            {
                degree: String,
                institution: String,
                year: String,
            },
        ],
        experience: [
            {
                title: String,
                company: String,
                duration: String,
                description: String,
            },
        ],
        experienceYears: { type: Number, default: 0 },

        // Computed scores
        resumeScore: { type: Number, default: 0 }, // Out of 100

        // Last analyzed job role
        lastAnalyzedRole: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Resume', resumeSchema);

```

## File: backend\src\models\User.js
```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false, // Never return password by default
        },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user',
        },
        avatar: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

```

## File: backend\src\routes\admin.routes.js
```javascript
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

```

## File: backend\src\routes\ai.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { generateCoverLetter, analyzeInterviewAnswer, getResumeTips } = require('../controllers/ai.controller');

router.post('/cover-letter', protect, generateCoverLetter);
router.post('/interview-prep', protect, analyzeInterviewAnswer);
router.post('/resume-tips', protect, getResumeTips);

module.exports = router;

```

## File: backend\src\routes\auth.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { register, login, getMe, changePassword, googleLogin } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.put('/password', protect, changePassword);

module.exports = router;

```

## File: backend\src\routes\courses.routes.js
```javascript
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

```

## File: backend\src\routes\jobs.routes.js
```javascript
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

```

## File: backend\src\routes\resume.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { uploadResume, getResume } = require('../controllers/resume.controller');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/upload', protect, upload.single('resume'), uploadResume);
router.get('/analyze', protect, getResume);

module.exports = router;

```

## File: backend\src\routes\skillGap.routes.js
```javascript
const express = require('express');
const router = express.Router();
const { analyzeSkillGap, analyzeJobSkillGap, getJobRoles } = require('../controllers/skillGap.controller');
const { protect } = require('../middleware/auth');

router.get('/roles', protect, getJobRoles);
router.post('/', protect, analyzeSkillGap);
router.post('/job', protect, analyzeJobSkillGap);

module.exports = router;

```

## File: backend\src\server.js
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth.routes'));
app.use('/api/resume',    require('./routes/resume.routes'));
app.use('/api/skill-gap', require('./routes/skillGap.routes'));
app.use('/api/jobs',      require('./routes/jobs.routes'));
app.use('/api/courses',   require('./routes/courses.routes'));
app.use('/api/admin',     require('./routes/admin.routes'));
app.use('/api/ai',        require('./routes/ai.routes'));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'AI Skill Gap Detector API is running' }));
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

// ─── Auto-seed helper ────────────────────────────────────────────────────────
const autoSeed = async () => {
  const Job = require('./models/Job');
  const Course = require('./models/Course');
  const User = require('./models/User');
  const jobCount = await Job.countDocuments();
  if (jobCount > 0) return; // already seeded

  // Seed default demo user
  const demoUser = await User.findOne({ email: 'demo@careerai.com' });
  if (!demoUser) {
    await User.create({
      name: 'Demo User',
      email: 'demo@careerai.com',
      password: 'password123',
      role: 'user'
    });
    console.log('🌱 Seeded Demo User (demo@careerai.com / password123)');
  }

  const JOBS = [
    { title: 'Full Stack Developer', company: 'TechNova Inc.', location: 'Remote', type: 'Full-time', salary: '₹8L - ₹18L/yr', requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'HTML', 'CSS', 'Git', 'REST API'], experienceRequired: 2, description: 'Build scalable web apps using modern JS stack.', isActive: true },
    { title: 'Frontend Developer', company: 'Pixel Perfect Labs', location: 'Bangalore, India', type: 'Full-time', salary: '₹6L - ₹14L/yr', requiredSkills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind', 'Git'], experienceRequired: 1, description: 'Craft beautiful UIs for SaaS products.', isActive: true },
    { title: 'Backend Developer', company: 'Aether Systems', location: 'Hyderabad, India', type: 'Full-time', salary: '₹10L - ₹22L/yr', requiredSkills: ['Node.js', 'Python', 'PostgreSQL', 'Docker', 'REST API', 'Git', 'Express'], experienceRequired: 3, description: 'Design and build high-performance APIs.', isActive: true },
    { title: 'Data Scientist', company: 'DataMind Analytics', location: 'Pune, India', type: 'Full-time', salary: '₹12L - ₹28L/yr', requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'TensorFlow', 'SQL', 'Data Analysis'], experienceRequired: 2, description: 'Build predictive models for business insights.', isActive: true },
    { title: 'DevOps Engineer', company: 'CloudOps Pro', location: 'Remote', type: 'Full-time', salary: '₹14L - ₹30L/yr', requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Bash', 'Git'], experienceRequired: 3, description: 'Manage infrastructure and deploy cloud solutions.', isActive: true },
    { title: 'Mobile Developer', company: 'AppForge', location: 'Chennai, India', type: 'Full-time', salary: '₹7L - ₹16L/yr', requiredSkills: ['React Native', 'JavaScript', 'Firebase', 'Git', 'iOS', 'Android'], experienceRequired: 2, description: 'Build cross-platform mobile applications.', isActive: true },
    { title: 'Machine Learning Engineer', company: 'AI Horizon', location: 'Bangalore, India', type: 'Full-time', salary: '₹18L - ₹40L/yr', requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Deep Learning', 'SQL'], experienceRequired: 4, description: 'Deploy ML models into production systems.', isActive: true },
    { title: 'Cloud Engineer', company: 'Nimbus Cloud', location: 'Remote', type: 'Contract', salary: '₹16L - ₹35L/yr', requiredSkills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux'], experienceRequired: 3, description: 'Architect and manage multi-cloud environments.', isActive: true },
    { title: 'UI/UX Designer', company: 'Design Studio X', location: 'Mumbai, India', type: 'Full-time', salary: '₹5L - ₹12L/yr', requiredSkills: ['Figma', 'Adobe XD', 'HTML', 'CSS', 'Prototyping', 'User Research'], experienceRequired: 1, description: 'Create intuitive designs for digital products.', isActive: true },
    { title: 'React Developer', company: 'WebWave Agency', location: 'Delhi, India', type: 'Full-time', salary: '₹7L - ₹15L/yr', requiredSkills: ['React', 'JavaScript', 'TypeScript', 'CSS', 'Git', 'REST API'], experienceRequired: 2, description: 'Develop responsive web applications with React.', isActive: true },
  ];

  const COURSES = [
    { skill: 'react', courseName: 'React.js Full Course - 12 Hours', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=-mJFZp84TIY', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'react', courseName: 'React — The Complete Guide 2024', platform: 'Udemy', link: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', level: 'Beginner', rating: 4.7, isFree: false },
    { skill: 'node.js', courseName: 'Node.js Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=f2EqECiTBL8', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'node.js', courseName: 'Node.js Developer Course', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/', level: 'Beginner', rating: 4.6, isFree: false },
    { skill: 'python', courseName: 'Python Tutorial for Beginners - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'python', courseName: 'Python for Everybody', platform: 'Coursera', link: 'https://www.coursera.org/specializations/python', level: 'Beginner', rating: 4.8, isFree: false },
    { skill: 'machine learning', courseName: 'Machine Learning for Everybody - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=i_LwzRmAOkZ', level: 'Intermediate', rating: 4.8, isFree: true },
    { skill: 'machine learning', courseName: 'Machine Learning A-Z', platform: 'Udemy', link: 'https://www.udemy.com/course/machinelearning/', level: 'Intermediate', rating: 4.6, isFree: false },
    { skill: 'docker', courseName: 'Docker Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'aws', courseName: 'AWS Certified Solutions Architect - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=Ia-UEYYRCEI', level: 'Intermediate', rating: 4.6, isFree: true },
    { skill: 'typescript', courseName: 'TypeScript Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'mongodb', courseName: 'MongoDB Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=c2M-rlkkT5o', level: 'Beginner', rating: 4.6, isFree: true },
    { skill: 'postgresql', courseName: 'PostgreSQL Tutorial Full Course 2022', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=85pG_pDkITY', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'git', courseName: 'Git & GitHub Crash Course For Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=RGOj5yH7evk', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'kubernetes', courseName: 'Kubernetes Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=X48VuDVv0do', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'figma', courseName: 'Figma UI/UX Design Essentials', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'tensorflow', courseName: 'TensorFlow 2.0 Complete Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=tPYj3fFJGjk', level: 'Intermediate', rating: 4.6, isFree: true },
    { skill: 'linux', courseName: 'Linux Command Line Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', level: 'Beginner', rating: 4.6, isFree: true },
    { skill: 'javascript', courseName: 'JavaScript Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=PkZNo7MFNFg', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'javascript', courseName: 'The Complete JavaScript Course 2024', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-javascript-course/', level: 'Beginner', rating: 4.7, isFree: false },
    { skill: 'css', courseName: 'CSS Full Course - Includes Flexbox and CSS Grid', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'tailwind', courseName: 'Tailwind CSS Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=lCxcTsOHrjo', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'rest api', courseName: 'REST API Crash Course - Introduction', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=-MTSQjw5DrM', level: 'Beginner', rating: 4.6, isFree: true },
    { skill: 'sql', courseName: 'SQL Tutorial - Full Database Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=HXV3zeQKqGY', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'terraform', courseName: 'Terraform Course - Automate your AWS cloud infrastructure', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=SLB_c_ayRMo', level: 'Intermediate', rating: 4.6, isFree: true },
    { skill: 'react native', courseName: 'React Native Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=0-S5a0eXPoc', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'pytorch', courseName: 'PyTorch for Deep Learning - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=V_xro1bcAuA', level: 'Intermediate', rating: 4.7, isFree: true },
    { skill: 'nlp', courseName: 'Natural Language Processing with Python', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=X2vAabgKiuM', level: 'Intermediate', rating: 4.5, isFree: true },
    { skill: 'deep learning', courseName: 'Deep Learning Fundamentals - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=VyWAvY2CF9c', level: 'Intermediate', rating: 4.6, isFree: true },
    { skill: 'firebase', courseName: 'Firebase Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=9kRgVxULbag', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'express', courseName: 'Express JS Crash Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=L72fhGm1tfE', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'html', courseName: 'HTML Full Course - Build a Website Tutorial', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=pQN-pnXPaVg', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'azure', courseName: 'Microsoft Azure Fundamentals AZ-900', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=NKEFWyqJ5XA', level: 'Beginner', rating: 4.7, isFree: true },
    { skill: 'gcp', courseName: 'Google Cloud Platform Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=IUU6OR8yHCc', level: 'Beginner', rating: 4.6, isFree: true },
    { skill: 'adobe xd', courseName: 'Adobe XD Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=68w2VwalD5w', level: 'Beginner', rating: 4.6, isFree: true },
    { skill: 'scikit-learn', courseName: 'Scikit-Learn Course - Machine Learning in Python', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=pqNCD_5r0IU', level: 'Intermediate', rating: 4.6, isFree: true },
    { skill: 'data analysis', courseName: 'Data Analysis with Python - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=r-uOLxNrNk8', level: 'Beginner', rating: 4.7, isFree: true },
  ];

  await Job.insertMany(JOBS);
  await Course.insertMany(COURSES);
  console.log(`🌱 Auto-seeded ${JOBS.length} jobs and ${COURSES.length} courses into in-memory DB`);
};

// ─── Connect to DB & Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB (Local/Cloud)');
  } catch (err) {
    console.log('⚠️ Failed to connect to local MongoDB, starting in-memory database fallback...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      await mongoose.connect(mongoServer.getUri());
      console.log('✅ Mongoose connected to in-memory MongoDB');
      await autoSeed();
    } catch (fallbackErr) {
      console.error('❌ Both Local and In-Memory MongoDB failed. Exiting.', fallbackErr);
      process.exit(1);
    }
  }

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
};

connectDB();

```

## File: backend\src\utils\seedData.js
```javascript
/**
 * Seed Script — populates Jobs and Courses collections with sample data
 * Run: node src/utils/seedData.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Job = require('../models/Job');
const Course = require('../models/Course');

const JOBS = [
    {
        title: 'Full Stack Developer',
        company: 'TechNova Inc.',
        location: 'Remote',
        type: 'Full-time',
        salary: '$80,000 - $120,000',
        requiredSkills: ['React', 'Node.js', 'MongoDB', 'Express', 'JavaScript', 'HTML', 'CSS', 'Git', 'REST API'],
        experienceRequired: 2,
        description: 'Build scalable web apps using modern JS stack.',
    },
    {
        title: 'Frontend Developer',
        company: 'Pixel Perfect Labs',
        location: 'New York, NY',
        type: 'Full-time',
        salary: '$70,000 - $100,000',
        requiredSkills: ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Tailwind', 'Git'],
        experienceRequired: 1,
        description: 'Craft beautiful UIs for SaaS products.',
    },
    {
        title: 'Backend Developer',
        company: 'Aether Systems',
        location: 'San Francisco, CA',
        type: 'Full-time',
        salary: '$90,000 - $130,000',
        requiredSkills: ['Node.js', 'Python', 'PostgreSQL', 'Docker', 'REST API', 'Git', 'Express'],
        experienceRequired: 3,
        description: 'Design and build high-performance APIs.',
    },
    {
        title: 'Data Scientist',
        company: 'DataMind Analytics',
        location: 'Boston, MA',
        type: 'Full-time',
        salary: '$100,000 - $150,000',
        requiredSkills: ['Python', 'Machine Learning', 'Pandas', 'NumPy', 'TensorFlow', 'SQL', 'Data Analysis'],
        experienceRequired: 2,
        description: 'Build predictive models for business insights.',
    },
    {
        title: 'DevOps Engineer',
        company: 'CloudOps Pro',
        location: 'Remote',
        type: 'Full-time',
        salary: '$95,000 - $140,000',
        requiredSkills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Terraform', 'Linux', 'Bash', 'Git'],
        experienceRequired: 3,
        description: 'Manage infrastructure and deploy cloud solutions.',
    },
    {
        title: 'Mobile Developer',
        company: 'AppForge',
        location: 'Austin, TX',
        type: 'Full-time',
        salary: '$75,000 - $110,000',
        requiredSkills: ['React Native', 'JavaScript', 'Firebase', 'Git', 'iOS', 'Android'],
        experienceRequired: 2,
        description: 'Build cross-platform mobile applications.',
    },
    {
        title: 'Machine Learning Engineer',
        company: 'AI Horizon',
        location: 'Seattle, WA',
        type: 'Full-time',
        salary: '$120,000 - $170,000',
        requiredSkills: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'NLP', 'Deep Learning', 'SQL'],
        experienceRequired: 4,
        description: 'Deploy ML models into production systems.',
    },
    {
        title: 'Cloud Engineer',
        company: 'Nimbus Cloud',
        location: 'Remote',
        type: 'Contract',
        salary: '$110,000 - $160,000',
        requiredSkills: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'Terraform', 'Linux'],
        experienceRequired: 3,
        description: 'Architect and manage multi-cloud environments.',
    },
    {
        title: 'UI/UX Designer',
        company: 'Design Studio X',
        location: 'Los Angeles, CA',
        type: 'Full-time',
        salary: '$65,000 - $95,000',
        requiredSkills: ['Figma', 'Adobe XD', 'HTML', 'CSS', 'Prototyping', 'User Research'],
        experienceRequired: 1,
        description: 'Create intuitive designs for digital products.',
    },
    {
        title: 'React Developer',
        company: 'WebWave Agency',
        location: 'Chicago, IL',
        type: 'Full-time',
        salary: '$70,000 - $105,000',
        requiredSkills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'CSS', 'Git', 'REST API'],
        experienceRequired: 2,
        description: 'Develop responsive web applications with React.',
    },
];

const COURSES = [
    // React
    { skill: 'react', courseName: 'React.js Full Course - 12 Hours', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=-mJFZp84TIY', level: 'Beginner', rating: 4.8, isFree: true },
    { skill: 'react', courseName: 'React — The Complete Guide 2024', platform: 'Udemy', link: 'https://www.udemy.com/course/react-the-complete-guide-incl-redux/', level: 'Beginner', rating: 4.7, isFree: false },
    // Node.js
    { skill: 'node.js', courseName: 'Node.js Full Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=f2EqECiTBL8', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'node.js', courseName: 'Node.js Developer Course', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-nodejs-developer-course-2/', level: 'Beginner', rating: 4.6, isFree: false },
    // Python
    { skill: 'python', courseName: 'Python Tutorial for Beginners - Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=_uQrJ0TkZlc', level: 'Beginner', rating: 4.9, isFree: true },
    { skill: 'python', courseName: 'Python for Everybody', platform: 'Coursera', link: 'https://www.coursera.org/specializations/python', level: 'Beginner', rating: 4.8, isFree: false },
    // Machine Learning
    { skill: 'machine learning', courseName: 'Machine Learning for Everybody', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=i_LwzRmAOkZ', level: 'Intermediate', rating: 4.8, isFree: true },
    // Docker
    { skill: 'docker', courseName: 'Docker Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=fqMOX6JJhGo', level: 'Beginner', rating: 4.8, isFree: true },
    // AWS
    { skill: 'aws', courseName: 'AWS Certified Solutions Architect', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=Ia-UEYYRCEI', level: 'Intermediate', rating: 4.6, isFree: true },
    // TypeScript
    { skill: 'typescript', courseName: 'TypeScript Full Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=BwuLxPH8IDs', level: 'Beginner', rating: 4.7, isFree: true },
    // MongoDB
    { skill: 'mongodb', courseName: 'MongoDB Tutorial for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=c2M-rlkkT5o', level: 'Beginner', rating: 4.6, isFree: true },
    // PostgreSQL
    { skill: 'postgresql', courseName: 'The Complete SQL Bootcamp', platform: 'Udemy', link: 'https://www.udemy.com/course/the-complete-sql-bootcamp/', level: 'Beginner', rating: 4.7, isFree: false },
    // Git
    { skill: 'git', courseName: 'Git & GitHub Crash Course', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=RGOj5yH7evk', level: 'Beginner', rating: 4.8, isFree: true },
    // Kubernetes
    { skill: 'kubernetes', courseName: 'Kubernetes for Absolute Beginners', platform: 'Udemy', link: 'https://www.udemy.com/course/learn-kubernetes/', level: 'Beginner', rating: 4.6, isFree: false },
    // Figma
    { skill: 'figma', courseName: 'Figma UI/UX Design Essentials', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=c9Wg6Cb_YlU', level: 'Beginner', rating: 4.7, isFree: true },
    // TensorFlow
    { skill: 'tensorflow', courseName: 'TensorFlow Course for Beginners', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=tPYj3fFJGjk', level: 'Intermediate', rating: 4.6, isFree: true },
    // Linux
    { skill: 'linux', courseName: 'Linux Command Line Basics', platform: 'YouTube', link: 'https://www.youtube.com/watch?v=ZtqBQ68cfJc', level: 'Beginner', rating: 4.6, isFree: true },
];

const seed = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        await Job.deleteMany({});
        await Course.deleteMany({});

        await Job.insertMany(JOBS);
        await Course.insertMany(COURSES);

        console.log(`✅ Seeded ${JOBS.length} jobs and ${COURSES.length} courses`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err);
        process.exit(1);
    }
};

seed();

```

## File: frontend\package.json
```json
{
  "name": "frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@react-three/drei": "^10.7.7",
    "@react-three/fiber": "^9.6.1",
    "@supabase/supabase-js": "^2.103.0",
    "@tailwindcss/forms": "^0.5.11",
    "@testing-library/dom": "^10.4.1",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^13.5.0",
    "axios": "^1.15.0",
    "chart.js": "^4.5.1",
    "framer-motion": "^12.38.0",
    "html2canvas": "^1.4.1",
    "jspdf": "^4.2.1",
    "lucide-react": "^1.8.0",
    "react": "^19.2.5",
    "react-chartjs-2": "^5.3.1",
    "react-dom": "^19.2.5",
    "react-dropzone": "^15.0.0",
    "react-router-dom": "^7.14.0",
    "react-scripts": "5.0.1",
    "react-toastify": "^11.0.5",
    "tailwindcss": "^3.4.19",
    "three": "^0.184.0",
    "web-vitals": "^2.1.4"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "CI=false react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

```

## File: frontend\public\index.html
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta
      name="description"
      content="Web site created using create-react-app"
    />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <!--
      manifest.json provides metadata used when your web app is installed on a
      user's mobile device or desktop. See https://developers.google.com/web/fundamentals/web-app-manifest/
    -->
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <!--
      Notice the use of %PUBLIC_URL% in the tags above.
      It will be replaced with the URL of the `public` folder during the build.
      Only files inside the `public` folder can be referenced from the HTML.

      Unlike "/favicon.ico" or "favicon.ico", "%PUBLIC_URL%/favicon.ico" will
      work correctly both with client-side routing and a non-root public URL.
      Learn how to configure a non-root public URL by running `npm run build`.
    -->
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
    <!--
      This HTML file is a template.
      If you open it directly in the browser, you will see an empty page.

      You can add webfonts, meta tags, or analytics to this file.
      The build step will place the bundled scripts into the <body> tag.

      To begin the development, run `npm start` or `yarn start`.
      To create a production bundle, use `npm run build` or `yarn build`.
    -->
  </body>
</html>

```

## File: frontend\public\manifest.json
```json
{
  "short_name": "React App",
  "name": "Create React App Sample",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    },
    {
      "src": "logo192.png",
      "type": "image/png",
      "sizes": "192x192"
    },
    {
      "src": "logo512.png",
      "type": "image/png",
      "sizes": "512x512"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}

```

## File: frontend\README.md
```md
# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)

```

## File: frontend\src\api\index.js
```javascript
import axios from 'axios';

// Base API instance
const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 globally — clear token and redirect
// Skip redirect for /auth/me so AuthContext can handle stale tokens gracefully
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const url = error.config?.url || '';
        if (error.response?.status === 401 && !url.includes('/auth/me')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ─── Auth ─────────────────────────────────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    googleLogin: (data) => api.post('/auth/google', data),
    getMe: () => api.get('/auth/me'),
    changePassword: (data) => api.put('/auth/password', data),
};

// ─── Resume ───────────────────────────────────────────────────────────────
export const resumeAPI = {
    upload: (formData) => api.post('/resume/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    analyze: () => api.get('/resume/analyze'),
};

// ─── Skill Gap ────────────────────────────────────────────────────────────
export const skillGapAPI = {
    getRoles: () => api.get('/skill-gap/roles'),
    analyze: (jobRole) => api.post('/skill-gap', { jobRole }),
    analyzeByJob: (jobId) => api.post('/skill-gap/job', { jobId }),
};

// ─── Jobs ─────────────────────────────────────────────────────────────────
export const jobsAPI = {
    recommend: () => api.get('/jobs/recommend'),
    getAll: () => api.get('/jobs'),
    create: (data) => api.post('/jobs', data),
    update: (id, data) => api.put(`/jobs/${id}`, data),
    delete: (id) => api.delete(`/jobs/${id}`),
};

// ─── Courses ──────────────────────────────────────────────────────────────
export const coursesAPI = {
    recommend: (missingSkills = []) =>
        api.get('/courses/recommend', {
            params: missingSkills.length ? { missingSkills: missingSkills.join(',') } : {},
        }),
    getAll: () => api.get('/courses'),
    create: (data) => api.post('/courses', data),
};

// ─── Admin ────────────────────────────────────────────────────────────────
export const adminAPI = {
    getStats: () => api.get('/admin/stats'),
    getUsers: () => api.get('/admin/users'),
};

// ─── AI Tools (Claude-powered) ────────────────────────────────────────────────
export const aiAPI = {
    generateCoverLetter: (data) => api.post('/ai/cover-letter', data),
    analyzeInterviewAnswer: (data) => api.post('/ai/interview-prep', data),
    getResumeTips: () => api.post('/ai/resume-tips'),
};

export default api;

```

## File: frontend\src\App.css
```css
.App {
  text-align: center;
}

.App-logo {
  height: 40vmin;
  pointer-events: none;
}

@media (prefers-reduced-motion: no-preference) {
  .App-logo {
    animation: App-logo-spin infinite 20s linear;
  }
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

.App-link {
  color: #61dafb;
}

@keyframes App-logo-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

```

## File: frontend\src\App.js
```javascript
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/layout/ProtectedRoute';
import HomePage from './pages/HomePage';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import SkillGapPage from './pages/SkillGapPage';
import JobsPage from './pages/JobsPage';
import CoursesPage from './pages/CoursesPage';
import InterviewPrepPage from './pages/InterviewPrepPage';
import CoverLetterPage from './pages/CoverLetterPage';
import SettingsPage from './pages/SettingsPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen">
        <Routes>
          {/* Public Routes without Navbar */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<PublicRoute><AuthPage mode="login" /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><AuthPage mode="register" /></PublicRoute>} />

          {/* Protected Routes with Navbar */}
          <Route path="/*" element={
            <ProtectedRoute>
              <>
                <Navbar />
                <Routes>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/upload" element={<UploadPage />} />
                  <Route path="/skill-gap" element={<SkillGapPage />} />
                  <Route path="/jobs" element={<JobsPage />} />
                  <Route path="/courses" element={<CoursesPage />} />
                  <Route path="/interview-prep" element={<InterviewPrepPage />} />
                  <Route path="/cover-letter" element={<CoverLetterPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

```

## File: frontend\src\App.test.js
```javascript
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders learn react link', () => {
  render(<App />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});

```

## File: frontend\src\components\layout\Navbar.js
```javascript
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, Upload, Radar, Briefcase, BookOpen,
    Shield, LogOut, Sun, Moon, Menu, X, Zap, Settings, Video, FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

const NAV_ITEMS = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/upload', label: 'Upload Resume', icon: Upload },
    { path: '/skill-gap', label: 'Skill Gap', icon: Radar },
    { path: '/jobs', label: 'Jobs', icon: Briefcase },
    { path: '/courses', label: 'Courses', icon: BookOpen },
    { path: '/interview-prep', label: 'Interview Prep', icon: Video },
    { path: '/cover-letter', label: 'Cover Letter Maker', icon: FileText },
];

const ADMIN_ITEMS = [
    { path: '/admin', label: 'Admin Panel', icon: Shield },
];

export default function Navbar() {
    const { user, isAdmin, logout } = useAuth();
    const { isDark, toggle } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const navLinks = isAdmin ? [...NAV_ITEMS, ...ADMIN_ITEMS] : NAV_ITEMS;

    return (
        <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/10 backdrop-blur-xl"
            style={{ background: isDark ? 'rgba(15,15,26,0.85)' : 'rgba(255,255,255,0.85)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center gap-2 group">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg gradient-text hidden sm:block">CareerAI</span>
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden md:flex items-center gap-1">
                        {navLinks.map(({ path, label, icon: Icon }) => {
                            const active = location.pathname === path;
                            return (
                                <Link
                                    key={path}
                                    to={path}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${active
                                            ? 'bg-indigo-500/20 text-indigo-500 dark:text-indigo-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {label}
                                </Link>
                            );
                        })}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2">
                        {/* Dark mode toggle */}
                        <button
                            onClick={toggle}
                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            aria-label="Toggle dark mode"
                        >
                            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>

                        {/* Avatar + logout */}
                        <div className="hidden md:flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-white/10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                                    {user?.name?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                                    {user?.name}
                                </span>
                            </div>
                            <Link
                                to="/settings"
                                className="p-2 rounded-lg text-slate-500 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                                title="Settings"
                            >
                                <Settings className="w-5 h-5" />
                            </Link>
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>

                        {/* Mobile hamburger */}
                        <button
                            className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5"
                            onClick={() => setMobileOpen(!mobileOpen)}
                        >
                            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileOpen && (
                    <div className="md:hidden pb-4 animate-slide-up">
                        <div className="flex flex-col gap-1 pt-2">
                            {navLinks.map(({ path, label, icon: Icon }) => {
                                const active = location.pathname === path;
                                return (
                                    <Link
                                        key={path}
                                        to={path}
                                        onClick={() => setMobileOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                      ${active ? 'bg-indigo-500/20 text-indigo-500' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {label}
                                    </Link>
                                );
                            })}
                            <hr className="border-slate-200 dark:border-white/10 my-2" />
                            <button
                                onClick={handleLogout}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}

```

## File: frontend\src\components\layout\ProtectedRoute.js
```javascript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Redirect to login if not authenticated
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Redirect to dashboard if already authenticated
export const PublicRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

// Admin-only route
export const AdminRoute = ({ children }) => {
    const { isAuthenticated, isAdmin } = useAuth();
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/dashboard" replace />;
    return children;
};

```

## File: frontend\src\components\ui\ThreeScene.js
```javascript
import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, OrbitControls, Environment, Float, Stars } from '@react-three/drei';

function AnimatedSphere() {
  const sphereRef = useRef();

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y = state.clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={1.5} floatIntensity={2}>
      <Sphere ref={sphereRef} args={[1.2, 64, 64]}>
        <MeshDistortMaterial
          color="#6366f1"
          attach="material"
          distort={0.4}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
        />
      </Sphere>
    </Float>
  );
}

export default function ThreeScene() {
  return (
    <div className="w-full h-full min-h-[300px] relative rounded-[2.5rem] overflow-hidden bg-slate-900/10 dark:bg-black/20 border border-slate-200 dark:border-white/10 shadow-inner">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <Stars radius={100} depth={50} count={3000} factor={4} saturation={0} fade speed={1} />
        <AnimatedSphere />
        <Environment preset="city" />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
      <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest animate-pulse">System Online</p>
      </div>
    </div>
  );
}

```

## File: frontend\src\components\ui\UI.js
```javascript
import React from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
    const sizes = { sm: 'w-5 h-5 border-2', md: 'w-10 h-10 border-4', lg: 'w-16 h-16 border-4' };
    return (
        <div className="flex justify-center items-center">
            <div className={`${sizes[size]} border-indigo-200 dark:border-indigo-900 border-t-indigo-500 rounded-full animate-spin`} />
        </div>
    );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, label, color = 'indigo', showValue = true }) => {
    const colors = {
        indigo: 'from-indigo-500 to-violet-500',
        green: 'from-emerald-500 to-teal-500',
        red: 'from-red-500 to-pink-500',
        yellow: 'from-yellow-400 to-orange-500',
        blue: 'from-blue-500 to-cyan-500',
    };
    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between mb-2 text-sm font-medium">
                    {label && <span className="text-slate-600 dark:text-slate-400">{label}</span>}
                    {showValue && <span className="text-slate-800 dark:text-slate-200">{value}%</span>}
                </div>
            )}
            <div className="progress-track">
                <div
                    className={`progress-fill bg-gradient-to-r ${colors[color]}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend }) => (
    <div className="section-card flex flex-col gap-3 group hover:-translate-y-1 transition-transform duration-300">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className={`text-3xl font-bold mt-1 gradient-text`}>{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {Icon && (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient || 'from-indigo-500/20 to-violet-500/20'}`}>
                    <Icon className="w-6 h-6 text-indigo-500" />
                </div>
            )}
        </div>
        {trend !== undefined && (
            <div className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last analysis
            </div>
        )}
    </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        {Icon && (
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-indigo-400" />
            </div>
        )}
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="ml-4">{action}</div>}
    </div>
);

```

## File: frontend\src\context\AuthContext.js
```javascript
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { authAPI } from '../api';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);
    const verifiedRef = useRef(false);

    const saveSession = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', jwtToken);
    };

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        verifiedRef.current = false;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    // Verify token once on first mount only — avoid redirect loop on in-memory DB restart
    useEffect(() => {
        if (token && !verifiedRef.current) {
            verifiedRef.current = true;
            authAPI.getMe()
                .then(res => setUser(res.data.user))
                .catch(() => logout());
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    const { data } = await authAPI.googleLogin({
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    });
                    if (data.token) {
                        verifiedRef.current = true;
                        setUser(data.user);
                        setToken(data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('token', data.token);
                    }
                } catch (err) {
                    console.error('Google sync failed', err);
                }
            }
        });

        return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const register = useCallback(async (name, email, password) => {
        setLoading(true);
        try {
            const { data } = await authAPI.register({ name, email, password });
            saveSession(data.user, data.token);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await authAPI.login({ email, password });
            saveSession(data.user, data.token);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const loginWithGoogle = useCallback(async () => {
        setLoading(true);
        try {
            // Direct backend login bypassing Supabase OAuth misconfiguration
            const { data } = await authAPI.googleLogin({
                email: 'demo.google.user@example.com',
                name: 'Google Demo User',
            });
            saveSession(data.user, data.token);
            return { success: true };
        } catch (err) {
            return { success: false, message: 'Google login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const isAuthenticated = !!token;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, register, login, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};

```

## File: frontend\src\context\ThemeContext.js
```javascript
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            root.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDark]);

    const toggle = () => setIsDark((prev) => !prev);

    return (
        <ThemeContext.Provider value={{ isDark, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
};

```

## File: frontend\src\index.css
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

/* ─── CSS Variables ─────────────────────────────────────────────────── */
:root {
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #0f172a;
  --text-secondary: #64748b;
  --border: #e2e8f0;
  --card-bg: #ffffff;
  --card-shadow: 0 4px 24px rgba(0,0,0,0.06);
}

.dark {
  --bg-primary: #0f0f1a;
  --bg-secondary: #1a1a2e;
  --text-primary: #f1f5f9;
  --text-secondary: #94a3b8;
  --border: #1e293b;
  --card-bg: #1a1a2e;
  --card-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

/* ─── Base ───────────────────────────────────────────────────────────── */
* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: 'Inter', sans-serif;
  background-color: var(--bg-primary);
  color: var(--text-primary);
  transition: background-color 0.3s ease, color 0.3s ease;
  -webkit-font-smoothing: antialiased;
}

/* ─── Scrollbar ──────────────────────────────────────────────────────── */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: var(--bg-secondary); }
::-webkit-scrollbar-thumb { background: #4f46e5; border-radius: 3px; }

/* ─── Glassmorphism card ─────────────────────────────────────────────── */
@layer components {
  .glass-card {
    @apply rounded-2xl border border-white/10 backdrop-blur-sm;
    background: rgba(255,255,255,0.05);
    box-shadow: var(--card-shadow);
  }

  .dark .glass-card {
    background: rgba(26,26,46,0.8);
  }

  /* Gradient text */
  .gradient-text {
    @apply bg-clip-text text-transparent;
    background-image: linear-gradient(135deg, #6366f1, #10b981);
  }

  /* Animated gradient button */
  .btn-gradient {
    @apply relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-white overflow-hidden transition-all duration-300;
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    box-shadow: 0 4px 15px rgba(99,102,241,0.4);
  }
  .btn-gradient:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 25px rgba(99,102,241,0.6);
  }
  .btn-gradient:active { transform: translateY(0); }

  /* Progress bar track */
  .progress-track {
    @apply w-full h-3 rounded-full overflow-hidden;
    background: var(--border);
  }
  .progress-fill {
    @apply h-full rounded-full transition-all duration-700 ease-out;
  }

  /* Skill badge */
  .skill-badge {
    @apply inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all duration-200;
  }
  .skill-badge-green {
    @apply skill-badge bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400;
  }
  .skill-badge-red {
    @apply skill-badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400;
  }
  .skill-badge-blue {
    @apply skill-badge bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400;
  }

  /* Section card */
  .section-card {
    background: var(--card-bg);
    border-color: var(--border);
    box-shadow: var(--card-shadow);
  }

  /* Input fields */
  .input-field {
    @apply px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all;
  }
}

/* ─── Animations ─────────────────────────────────────────────────────── */
.animate-fade-in  { animation: fadeIn  0.5s ease-in-out; }
.animate-slide-up { animation: slideUp 0.4s ease-out; }

@keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }

/* ─── 3D Effects ─────────────────────────────────────────────────────── */
.tilt-card {
  transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
  transform-style: preserve-3d;
}
.tilt-card:hover {
  transform: perspective(1000px) rotateX(8deg) rotateY(-8deg) translateZ(10px) scale(1.02);
  box-shadow: -15px 15px 35px rgba(0,0,0,0.15), 0 0 20px rgba(99, 102, 241, 0.2);
}
.dark .tilt-card:hover {
  box-shadow: -15px 15px 35px rgba(0,0,0,0.5), 0 0 20px rgba(99, 102, 241, 0.4);
}

.float-animation {
  animation: float 6s ease-in-out infinite;
}

.float-animation-delayed {
  animation: float 6s ease-in-out infinite;
  animation-delay: 2s;
}

@keyframes float {
  0% { transform: translateY(0px) rotate(0deg); }
  50% { transform: translateY(-20px) rotate(2deg); }
  100% { transform: translateY(0px) rotate(0deg); }
}

.perspective-container {
  perspective: 1200px;
}

.hero-3d-scene {
  transform-style: preserve-3d;
  transform: rotateX(15deg) rotateY(-10deg);
  transition: transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.hero-3d-scene:hover {
  transform: rotateX(5deg) rotateY(-5deg) translateZ(30px);
}

/* ─── Loader ─────────────────────────────────────────────────────────── */
.loader-ring {
  width: 48px; height: 48px;
  border: 4px solid var(--border);
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ─── Toast overrides ────────────────────────────────────────────────── */
.Toastify__toast { border-radius: 12px !important; font-family: 'Inter', sans-serif !important; }

```

## File: frontend\src\index.js
```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Performance monitoring removed for simplicity

```

## File: frontend\src\pages\AdminPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Shield, Plus, Trash2, Edit2, X, Briefcase, BookOpen } from 'lucide-react';
import { jobsAPI, coursesAPI, adminAPI } from '../api';
import { PageHeader, Spinner, Badge, StatCard } from '../components/ui/UI';

export default function AdminPage() {
    const [jobs, setJobs] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs');
    const [isAddingJob, setIsAddingJob] = useState(false);

    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        location: '',
        salary: '',
        requiredSkills: '',
        description: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [jobsRes, coursesRes] = await Promise.all([
                    jobsAPI.getAll(),
                    coursesAPI.getAll()
                ]);
                setJobs(jobsRes.data.jobs);
                setCourses(coursesRes.data.courses);
                // Stats might fail if not fully implemented in backend yet, so we handle it gracefully
                try {
                    const statsRes = await adminAPI.getStats();
                    setStats(statsRes.data.stats);
                } catch (e) {
                    setStats({ totalJobs: jobsRes.data.jobs.length, totalCourses: coursesRes.data.courses.length, totalUsers: 0 });
                }
            } catch (err) {
                toast.error('Failed to fetch admin data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddJob = async (e) => {
        e.preventDefault();
        try {
            const jobData = {
                ...newJob,
                requiredSkills: newJob.requiredSkills.split(',').map(s => s.trim())
            };
            await jobsAPI.create(jobData);
            toast.success('Job added successfully!');
            setIsAddingJob(false);
            setNewJob({ title: '', company: '', location: '', salary: '', requiredSkills: '', description: '' });
            const { data } = await jobsAPI.getAll();
            setJobs(data.jobs);
        } catch (err) {
            toast.error('Failed to add job');
        }
    };

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await jobsAPI.delete(id);
            setJobs(jobs.filter(j => j._id !== id));
            toast.success('Job deleted');
        } catch (err) {
            toast.error('Failed to delete job');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <PageHeader 
                    title="Admin Control Center" 
                    subtitle="Manage platform metadata, jobs, and courses"
                    icon={Shield}
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Jobs" value={stats?.totalJobs || 0} icon={Briefcase} gradient="from-indigo-500/10 to-blue-500/10" />
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon={BookOpen} gradient="from-emerald-500/10 to-teal-500/10" />
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Plus} gradient="from-violet-500/10 to-purple-500/10" />
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-white/10">
                    <button 
                        onClick={() => setActiveTab('jobs')}
                        className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'jobs' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                    >
                        Manage Jobs
                    </button>
                    <button 
                        onClick={() => setActiveTab('courses')}
                        className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'courses' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                    >
                        Manage Courses
                    </button>
                </div>

                {activeTab === 'jobs' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Job Postings</h2>
                            <button 
                                onClick={() => setIsAddingJob(!isAddingJob)}
                                className="btn-gradient flex items-center gap-2 py-2 px-4 text-sm"
                            >
                                {isAddingJob ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {isAddingJob ? 'Cancel' : 'Add New Job'}
                            </button>
                        </div>

                        {isAddingJob && (
                            <form onSubmit={handleAddJob} className="section-card grid sm:grid-cols-2 gap-4 animate-slide-up">
                                <input 
                                    placeholder="Job Title"
                                    className="input-field" 
                                    value={newJob.title}
                                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                                    required
                                />
                                <input 
                                    placeholder="Company"
                                    className="input-field" 
                                    value={newJob.company}
                                    onChange={e => setNewJob({...newJob, company: e.target.value})}
                                    required
                                />
                                <input 
                                    placeholder="Location"
                                    className="input-field" 
                                    value={newJob.location}
                                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                                />
                                <input 
                                    placeholder="Salary Range"
                                    className="input-field" 
                                    value={newJob.salary}
                                    onChange={e => setNewJob({...newJob, salary: e.target.value})}
                                />
                                <div className="sm:col-span-2">
                                    <input 
                                        placeholder="Required Skills (comma separated)"
                                        className="input-field w-full" 
                                        value={newJob.requiredSkills}
                                        onChange={e => setNewJob({...newJob, requiredSkills: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <textarea 
                                        placeholder="Job Description"
                                        className="input-field w-full h-24 pt-3" 
                                        value={newJob.description}
                                        onChange={e => setNewJob({...newJob, description: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="btn-gradient py-3 sm:col-span-2">Create Job Posting</button>
                            </form>
                        )}

                        <div className="grid gap-4">
                            {jobs.map(job => (
                                <div key={job._id} className="section-card flex items-center justify-between group">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{job.title}</h3>
                                        <p className="text-sm text-slate-500">{job.company} • {job.location}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {job.requiredSkills.map(s => (
                                                <Badge key={s} variant="default">{s}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteJob(job._id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Curated Skill Courses</h2>
                            <button className="btn-gradient flex items-center gap-2 py-2 px-4 text-sm">
                                <Plus className="w-4 h-4" /> Add Course
                            </button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map(course => (
                                <div key={course._id} className="section-card">
                                    <Badge variant="primary" className="mb-2">{course.skill}</Badge>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{course.courseName}</h4>
                                    <p className="text-xs text-slate-500 mb-4">{course.platform}</p>
                                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Add these to index.css if not present
// .input-field {
//   @apply px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all;
// }

```

## File: frontend\src\pages\AuthPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/UI';
import { supabase } from '../supabase';

function AuthInput({ type, placeholder, value, onChange, icon: Icon, suffix }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-all duration-300 shadow-sm hover:shadow-md"
        required
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </div>
      )}
    </div>
  );
}

export default function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loginWithGoogle, loading } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    setIsLogin(location.pathname === '/login' || mode === 'login');
  }, [location.pathname, mode]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    navigate(!isLogin ? '/login' : '/register', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (isLogin) {
      result = await login(form.email, form.password);
    } else {
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      result = await register(form.name, form.email, form.password);
    }

    if (result.success) {
      toast.success(isLogin ? 'Welcome back, explorer! 🎉' : 'Account created! Welcome to the future. 🚀');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await loginWithGoogle();
      if (result.success) {
          toast.success('Successfully logged in with Google! 🎉');
          navigate('/dashboard');
      } else {
          toast.error(result.message || 'Google Login failed');
      }
    } catch (err) {
      toast.error('Could not initialize Google Login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0B0F19]">
      {/* Visual Section */}
      <div className="hidden md:flex w-1/2 relative bg-indigo-600 overflow-hidden text-white flex-col justify-center px-12 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 opacity-90"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Abstract Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">CareerAI</h2>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Elevate Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-emerald-300">Career Trajectory</span>
          </h1>
          <p className="text-lg lg:text-xl text-indigo-100 font-medium mb-12">
            Harness the power of AI to analyze your resume, pinpoint skill gaps, and land your next big role with confidence.
          </p>
          
          <div className="space-y-4">
            {[
              "Real-time Resume Analysis",
              "Personalized Course Recommendations",
              "AI Mock Interviews"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 w-fit">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span className="font-semibold text-indigo-50">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative z-10 animate-fade-in">
          
          <div className="text-center mb-10 text-slate-800 dark:text-white">
            <h2 className="text-3xl font-black mb-2">
              {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? 'Sign in to review your insights.' : 'Register to unlock your potential.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full relative flex items-center justify-center gap-3 py-4 mb-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-slate-400 font-semibold text-sm">OR</span>
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <AuthInput
                type="text"
                placeholder="Full Legal Name"
                value={form.name}
                onChange={set('name')}
                icon={User}
              />
            )}
            <AuthInput
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={set('email')}
              icon={Mail}
            />
            <AuthInput
              type={showPass ? 'text' : 'password'}
              placeholder="Secure Password"
              value={form.password}
              onChange={set('password')}
              icon={Lock}
              suffix={
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group-focus-within:text-indigo-500">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-indigo-500/30 disabled:opacity-70"
            >
              {loading ? <Spinner size="sm" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 dark:text-slate-400 font-medium">
            {isLogin ? "New here? " : 'Already a member? '}
            <button
              onClick={toggleMode}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Create an account' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

```

## File: frontend\src\pages\CoursesPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpen, ExternalLink, Star, Clock, Search, PlayCircle } from 'lucide-react';
import { coursesAPI } from '../api';
import { PageHeader, Spinner, Badge, EmptyState } from '../components/ui/UI';

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export default function CoursesPage() {
    const location = useLocation();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [playingVideoId, setPlayingVideoId] = useState(null);
    
    const missingSkills = React.useMemo(() => {
        const searchParams = new URLSearchParams(location.search);
        return searchParams.get('skills')?.split(',') || [];
    }, [location.search]);

    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const { data } = await coursesAPI.recommend(missingSkills);
                setCourses(data.courses);
            } catch (err) {
                toast.error('Failed to fetch course recommendations');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [missingSkills]); 

    const filteredCourses = courses.filter(course => 
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.skill.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="xl" />
                    <p className="text-slate-500 font-medium animate-pulse">Curating your personalized curriculum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Skill Upgrading Matrix"
                    subtitle="Premium curated courses to help you bridge your skill gaps"
                    action={
                        <div className="relative hidden sm:block w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search skills, topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                            />
                        </div>
                    }
                />

                {missingSkills.length > 0 && (
                    <div className="mb-10 flex flex-wrap items-center gap-3 animate-fade-in bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">Targeting Missing Skills:</span>
                        {missingSkills.map(s => (
                            <div key={s} className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold shadow-sm">
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                {filteredCourses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 shadow-xl border border-slate-100 dark:border-slate-800">
                        <EmptyState 
                            icon={Search}
                            title="No courses found"
                            subtitle={searchTerm ? "Our search couldn't find matching topics. Try a broader term." : "We're curating state-of-the-art courses for your unique profile. Check back shortly."}
                        />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course, idx) => {
                            const embedUrl = getYouTubeEmbedUrl(course.link);
                            const isPlaying = playingVideoId === course._id;
                            
                            return (
                                <div key={course._id} className="group relative rounded-[2rem] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 flex flex-col h-full overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                    
                                    {/* Thumbnail / Video Section */}
                                    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                        {isPlaying && embedUrl ? (
                                            <iframe
                                                src={`${embedUrl}?autoplay=1`}
                                                title={course.courseName}
                                                className="w-full h-full border-0 rounded-t-[2rem]"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex flex-col items-center justify-center p-6 text-center">
                                                {embedUrl ? (
                                                    <>
                                                        <PlayCircle className="w-12 h-12 text-red-500 mb-3 drop-shadow-lg" />
                                                        <button 
                                                            onClick={() => setPlayingVideoId(course._id)}
                                                            className="px-6 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:scale-105 transition-transform shadow-md text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"
                                                        >
                                                            <PlayCircle className="w-4 h-4 text-indigo-500" /> Watch Lesson
                                                        </button>
                                                    </>
                                                ) : (
                                                    <BookOpen className="w-16 h-16 text-indigo-300 opacity-50" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <div className="flex gap-2 flex-wrap mb-3">
                                                <Badge variant="primary" className="text-xs uppercase tracking-wider">{course.skill}</Badge>
                                                {embedUrl && <Badge variant="danger" className="text-xs uppercase tracking-wider bg-red-100 text-red-700">Video format</Badge>}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2">
                                                {course.courseName}
                                            </h3>
                                        </div>

                                        <div className="space-y-4 mb-8 flex-grow">
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="text-slate-500 font-medium">Platform</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{course.platform}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span className="text-slate-500 font-medium">Rating</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">4.9 / 5.0</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-slate-500 font-medium">Duration</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">Self-paced</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <a 
                                                href={course.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all focus:ring-4 focus:ring-indigo-500/30"
                                            >
                                                Go to Course <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

```

## File: frontend\src\pages\CoverLetterPage.js
```javascript
import React, { useState } from 'react';
import { FileText, Sparkles, Copy, CheckCircle } from 'lucide-react';
import { PageHeader, Badge, Spinner } from '../components/ui/UI';
import { aiAPI } from '../api';

export default function CoverLetterPage() {
    const [formData, setFormData] = useState({
        jobTitle: '',
        companyName: '',
        skills: ''
    });
    const [generating, setGenerating] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [copied, setCopied] = useState(false);

    const handleGenerate = async (e) => {
        e.preventDefault();
        setGenerating(true);
        setCoverLetter('');
        
        try {
            const response = await aiAPI.generateCoverLetter(formData);
            if (response.data.success) {
                setCoverLetter(response.data.data.coverLetter);
            }
        } catch (error) {
            console.error('Error generating cover letter:', error);
            setCoverLetter('An error occurred while generating the cover letter. Please try again.');
        } finally {
            setGenerating(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(coverLetter);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <PageHeader
                    title="AI Cover Letter Builder"
                    subtitle="Instantly generate tailored cover letters for your job applications"
                    action={<Badge variant="primary">New Feature</Badge>}
                />

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Input Form */}
                    <div className="section-card">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Job Details</h2>
                        </div>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Target Job Title</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="e.g., Frontend Developer" 
                                    value={formData.jobTitle}
                                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Name</label>
                                <input 
                                    className="input-field w-full" 
                                    placeholder="e.g., TechNova" 
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Key Skills to Highlight (Comma separated)</label>
                                <textarea 
                                    className="input-field w-full h-24 pt-3" 
                                    placeholder="e.g., React, Tailwind, Team Leadership" 
                                    value={formData.skills}
                                    onChange={(e) => setFormData({...formData, skills: e.target.value})}
                                    required
                                />
                            </div>
                            <button type="submit" disabled={generating} className="btn-gradient w-full py-3 flex items-center justify-center gap-2">
                                {generating ? <Spinner size="sm" /> : <FileText className="w-4 h-4" />}
                                {generating ? 'Generating...' : 'Generate Cover Letter'}
                            </button>
                        </form>
                    </div>

                    {/* Output Area */}
                    <div className="section-card flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Generated Letter</h2>
                            {coverLetter && (
                                <button onClick={handleCopy} className="text-sm font-medium text-indigo-500 flex items-center gap-1 hover:text-indigo-400">
                                    {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy to Clipboard'}
                                </button>
                            )}
                        </div>
                        <div className="flex-grow bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 overflow-y-auto">
                            {generating ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                                    <Sparkles className="w-8 h-8 animate-pulse text-indigo-400" />
                                    <p>AI is writing your letter...</p>
                                </div>
                            ) : coverLetter ? (
                                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                    {coverLetter}
                                </pre>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                    <FileText className="w-12 h-12 opacity-20" />
                                    <p className="text-sm">Your cover letter will appear here.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## File: frontend\src\pages\DashboardPage.js
```javascript
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale,
  PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { resumeAPI, skillGapAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge, EmptyState } from '../components/ui/UI';
import {
  Upload, Target, Briefcase,
  CheckCircle, XCircle, Award, ArrowRight, Zap, Download, TrendingUp, Map
} from 'lucide-react';
import ThreeScene from '../components/ui/ThreeScene';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const chartOptions = {
  plugins: { legend: { display: false } },
  cutout: '75%',
  animation: { animateRotate: true, duration: 1800, easing: 'easeOutQuart' },
  responsive: true,
  maintainAspectRatio: false,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rd } = await resumeAPI.analyze();
        setResume(rd.resume);

        if (rd.resume.lastAnalyzedRole) {
          const { data: sg } = await skillGapAPI.analyze(rd.resume.lastAnalyzedRole);
          setSkillGap(sg.data);
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleDownloadPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${user?.name || 'Resume'}_Analysis.pdf`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090C15]">
        <Spinner size="xl" />
      </div>
    );
  }

  const donutData = skillGap ? {
    datasets: [{
      data: [skillGap.matchPercentage, 100 - skillGap.matchPercentage],
      backgroundColor: ['#6366f1', 'rgba(99,102,241,0.1)'],
      borderWidth: 0,
    }],
  } : null;

  const probData = skillGap ? {
    datasets: [{
      data: [skillGap.probability, 100 - skillGap.probability],
      backgroundColor: ['#10b981', 'rgba(16,185,129,0.1)'],
      borderWidth: 0,
    }],
  } : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#090C15] font-sans">
      <div id="dashboard-content" className="max-w-7xl mx-auto">
        <div className="mb-12 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            CareerAI Dashboard
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            Welcome, {user?.name}
          </h2>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mt-6 font-medium leading-relaxed">
            Access your personalized career intelligence hub. Discover hidden skill gaps, analyze your professional trajectory, and prepare for your next big opportunity.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {!resume ? (
              <Link to="/upload" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                <Upload className="w-5 h-5" /> Analyze New Resume
              </Link>
            ) : (
              <>
                <button onClick={handleDownloadPDF} className="flex-shrink-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-sm hover:scale-105 transition-all">
                  <Download className="w-5 h-5" /> Export Report
                </button>
                <Link to="/learning-path" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                  <Map className="w-5 h-5" /> View Career Map
                </Link>
              </>
            )}
          </div>
        </div>

        {!resume ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-lg animate-fade-in backdrop-blur-xl">
            <EmptyState
              icon={Upload}
              title="Awaiting Your Resume"
              subtitle="Upload your latest resume to let our AI architect map out a customized pathway to your dream role."
              action={
                <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-8 py-3.5 mx-auto mt-6 text-sm font-semibold rounded-xl shadow-md transition-all w-fit">
                  <Upload className="w-4 h-4" /> Upload Document
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up perspective-container">
              {[
                { title: "Resume Score", value: `${resume.resumeScore}/100`, sub: "Overall completeness", icon: Award, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" },
                { title: "Skills Detected", value: resume.skills.length, sub: "Extracted from PDF", icon: Zap, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
                { title: "Experience Frame", value: `${resume.experienceYears} Yrs`, sub: "Calculated tenure", icon: Briefcase, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
                { title: "Correlation", value: skillGap ? `${skillGap.matchPercentage}%` : 'N/A', sub: skillGap ? skillGap.jobRole : 'No role analyzed', icon: Target, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    <stat.icon className={`w-16 h-16 ${stat.color}`} />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 relative z-10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">{stat.title}</h3>
                  <div className="text-4xl font-black text-slate-800 dark:text-white my-2 tracking-tight relative z-10">{stat.value}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium relative z-10">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8 perspective-container">
              {skillGap && (
                <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 perspective-container">
                  {/* Glassmorphic Chart Connectors */}
                  {[{ data: donutData, perc: skillGap.matchPercentage, label: 'Skill Match', sub: skillGap.jobRole, color: 'text-indigo-600 dark:text-indigo-400', numColor: 'text-indigo-600 dark:text-indigo-400' },
                    { data: probData, perc: skillGap.probability, label: 'Success Probability', sub: 'Calculated odds', color: 'text-emerald-600 dark:text-emerald-400', numColor: 'text-emerald-600 dark:text-emerald-400' }
                  ].map((chart, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center">
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{chart.label}</h3>
                      <div className="relative w-48 h-48 mb-4">
                        <Doughnut data={chart.data} options={chartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className={`text-5xl font-black tracking-tighter ${chart.numColor}`}>{chart.perc}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{chart.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={`space-y-6 ${skillGap ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {/* Advanced Skills Cloud */}
                <div className="bg-white dark:bg-slate-900/40 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Active Skill Profile</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Detected skills mapped against industry standards</p>
                    </div>
                    <Badge variant="primary" className="text-sm px-3 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{resume.skills.length} Total</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow content-start">
                    {resume.skills.map((skill) => {
                      const matched = skillGap?.matchedSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                      const missing = skillGap?.missingSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                      let classes = "px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform hover:scale-105 border ";
                      if (matched) classes += "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
                      else if (missing) classes += "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
                      else classes += "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

                      return <span key={skill} className={classes}>{skill}</span>;
                    })}
                  </div>

                  {!skillGap && (
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link to="/skill-gap" className="btn-gradient px-8 py-4 rounded-2xl text-base font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2">
                        Analyze Job Role Gap <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {skillGap && (
               <div className="grid md:grid-cols-2 gap-8 mt-8">
                 <div className="bg-white dark:bg-slate-900/40 border border-emerald-200 dark:border-emerald-900/30 p-8 rounded-3xl shadow-sm backdrop-blur-xl">
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                         <CheckCircle className="w-6 h-6 text-emerald-500" />
                       </div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white">Correlated</h2>
                     </div>
                     <Badge variant="success" className="text-lg px-4 py-1.5">{skillGap.matchedSkills.length}</Badge>
                   </div>
                   <div className="flex flex-wrap gap-3">
                     {skillGap.matchedSkills.map(s => (
                       <span key={s} className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm font-bold border border-emerald-200 dark:border-emerald-800">{s}</span>
                     ))}
                   </div>
                 </div>

                 <div className="bg-white dark:bg-slate-900/40 border border-red-200 dark:border-red-900/30 p-8 rounded-3xl shadow-sm backdrop-blur-xl flex flex-col justify-between">
                   <div>
                     <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                           <XCircle className="w-6 h-6 text-red-500" />
                         </div>
                         <h2 className="text-2xl font-black text-slate-900 dark:text-white">Deficient</h2>
                       </div>
                       <Badge variant="danger" className="text-lg px-4 py-1.5">{skillGap.missingSkills.length}</Badge>
                     </div>
                     <div className="flex flex-wrap gap-3 mb-8">
                       {skillGap.missingSkills.map(s => (
                         <span key={s} className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-sm font-bold border border-red-200 dark:border-red-800">{s}</span>
                       ))}
                     </div>
                   </div>
                   {skillGap.missingSkills.length > 0 && (
                     <Link to={`/courses?skills=${skillGap.missingSkills.join(',')}`} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-auto shadow-sm tilt-card">
                       Access Recommended Curriculum <ArrowRight className="w-5 h-5" />
                     </Link>
                   )}
                 </div>
               </div>
            )}

            {/* Quick Actions 3D Section */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/interview-prep" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Mock Interview</span>
                    <span className="text-slate-500 text-xs mt-1">Start a practice session</span>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </Link>
                <Link to="/jobs" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Job Matches</span>
                    <span className="text-slate-500 text-xs mt-1">View tailored roles</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </Link>
                <Link to="/salary-insights" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Salary Insights</span>
                    <span className="text-slate-500 text-xs mt-1">Market compensation</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Link>
                <Link to="/cover-letter" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Cover Letter</span>
                    <span className="text-slate-500 text-xs mt-1">Generate with AI</span>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

```

## File: frontend\src\pages\HomePage.js
```javascript
import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Brain, Target, TrendingUp, BookOpen, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    { icon: Brain, title: 'AI Resume Parser', desc: 'Instantly extract deep skills, education, and hidden potential from your uploaded documents.', color: 'from-violet-500/20 to-indigo-500/20', iconColor: 'text-violet-500' },
    { icon: Target, title: 'Precise Skill Gap', desc: 'Correlate your actual skills against leading industry job requirements in real-time.', color: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-500' },
    { icon: TrendingUp, title: 'Selection Probability', desc: 'Leverage predictive AI to calculate your precise odds of landing the target job.', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500' },
    { icon: BookOpen, title: 'Tailored Courses', desc: 'Direct integrations with Coursera, Udemy & YouTube to recommend exactly what you need.', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-500' },
];

const STATS = [
    { label: 'Job Listings AI Mapped', value: '500,000+' },
    { label: 'Total Course Modules', value: '2,500+' },
    { label: 'Skills Ontology Tracked', value: '15,000+' },
    { label: 'Users Landed Jobs', value: '10K+' },
];

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-white dark:bg-[#090C15] font-sans selection:bg-indigo-500/30">
            {/* Elegant Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-32 px-4 overflow-hidden perspective-container">
                {/* Hero Orbs & Floating Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none opacity-60 dark:opacity-40 animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-30"></div>
                
                {/* 3D Floating Decorative Cards */}
                <div className="absolute top-1/4 left-[10%] w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl border border-white/10 backdrop-blur-xl hidden lg:flex items-center justify-center float-animation transform -rotate-12">
                    <Brain className="w-12 h-12 text-indigo-400 opacity-80" />
                </div>
                <div className="absolute bottom-1/3 right-[10%] w-40 h-40 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-[2rem] border border-white/10 backdrop-blur-xl hidden lg:flex items-center justify-center float-animation-delayed transform rotate-12">
                    <TrendingUp className="w-16 h-16 text-emerald-400 opacity-80" />
                </div>

                <div className="relative z-10 max-w-5xl mx-auto text-center hero-3d-scene">
                    <div className="inline-flex items-center gap-2 bg-slate-900/5 border border-slate-200/50 dark:bg-white/5 dark:border-white/10 rounded-full px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-8 backdrop-blur-md shadow-sm animate-fade-in group hover:bg-slate-900/10 dark:hover:bg-white/10 transition">
                        <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                        Next-Gen AI Career Ecosystem
                    </div>

                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        Architect Your <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">
                            Future Career.
                        </span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '200ms' }}>
                        Let CareerAI analyze your professional profile. Instantly identify skill gaps, calculate job-match probabilities, and receive a customized roadmap of industry-leading courses to accelerate your career.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="px-10 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-2xl hover:shadow-indigo-500/25 transition-all text-lg font-bold flex items-center gap-3">
                                Enter Workspace <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 shadow-2xl hover:shadow-indigo-500/25 transition-all text-lg font-bold flex items-center gap-3">
                                    Start Optimizing <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/login" className="px-10 py-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-bold shadow-sm backdrop-blur-md">
                                    Member Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Premium Stats Grid */}
            <section className="py-16 px-4 relative z-10 border-y border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-3xl">
                <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-x divide-transparent lg:divide-slate-200 dark:lg:divide-white/10">
                    {STATS.map(({ label, value }, i) => (
                        <div key={label} className={`text-center px-4 animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{value}</div>
                            <div className="text-sm uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Core Features */}
            <section className="py-24 px-4 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Intelligence designed for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">radical growth.</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                            A complete suite bridging the void between what employers want and what you currently know.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 perspective-container">
                        {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }, i) => (
                            <div key={title} className="group p-8 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 tilt-card animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-8 h-8 ${iconColor}`} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Classic CTA section */}
            {!isAuthenticated && (
                <section className="py-24 px-4 relative z-10 perspective-container">
                    <div className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden tilt-card" style={{ transformStyle: 'preserve-3d' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        
                        {/* Interactive floating elements inside CTA */}
                        <div className="absolute top-10 left-10 w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-pulse-slow"></div>
                        <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl float-animation"></div>

                        <div className="relative p-12 lg:p-20 text-center flex flex-col items-center" style={{ transform: 'translateZ(40px)' }}>
                            <Shield className="w-16 h-16 text-emerald-400 mb-6 drop-shadow-2xl float-animation-delayed" />
                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-6">
                                Stop Guessing. Start Landing.
                            </h2>
                            <p className="text-indigo-100 text-lg lg:text-xl max-w-2xl text-center mb-10 leading-relaxed font-medium">
                                Join the elite network of developers taking the shortcut to their highest-paying roles. Your personal AI career coach is waiting.
                            </p>
                            <Link to="/register" className="px-10 py-5 rounded-2xl bg-white text-indigo-900 hover:bg-slate-50 hover:scale-105 shadow-xl transition-all text-lg font-bold flex items-center gap-3">
                                Claim Your Free Workspace <ArrowRight className="w-5 h-5 text-indigo-500" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <footer className="py-10 text-center font-medium text-sm text-slate-400 dark:text-slate-500 relative z-10 bg-white/50 dark:bg-transparent backdrop-blur-lg">
                © {new Date().getFullYear()} CareerAI. Engineering careers with ❤️
            </footer>
        </div>
    );
}

```

## File: frontend\src\pages\InterviewPrepPage.js
```javascript
import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, ChevronRight, ChevronLeft, Mic, MicOff, Video, VideoOff, PlayCircle, StopCircle, RefreshCcw, BrainCircuit, TrendingUp, Lightbulb, User, Volume2 } from 'lucide-react';
import { Badge } from '../components/ui/UI';
import { aiAPI } from '../api';
import { toast } from 'react-toastify';

const QUESTIONS = [
  // Behavioral & General
  { id: 1, question: "Tell me about yourself and your technical background.", skill: "Introduction", category: "General" },
  { id: 2, question: "Describe a time you had to learn a new technology quickly. What was your approach?", skill: "Adaptability", category: "Behavioral" },
  { id: 3, question: "How do you handle disagreements with teammates on technical decisions?", skill: "Teamwork", category: "Behavioral" },
  { id: 4, question: "Describe a challenging bug you encountered and how you resolved it.", skill: "Problem Solving", category: "Technical" },
  { id: 5, question: "Where do you see yourself in 3 years, and how does this role fit your goals?", skill: "Career Goals", category: "General" },
  { id: 6, question: "Tell me about a time you failed to meet a deadline. What happened and what did you learn?", skill: "Accountability", category: "Behavioral" },
  
  // Technical - Architecture & Web
  { id: 7, question: "Explain how the internet works to a non-technical person.", skill: "Communication", category: "Technical" },
  { id: 8, question: "What is the difference between REST and GraphQL? When would you use each?", skill: "API Knowledge", category: "Technical" },
  { id: 9, question: "How would you optimize the performance of a slow-loading web application?", skill: "Performance", category: "Technical" },
  { id: 10, question: "Explain the concept of Microservices vs Monolithic architecture.", skill: "System Design", category: "Technical" },
  
  // Technical - Algorithms & DB
  { id: 11, question: "What is the difference between SQL and NoSQL databases? When should I choose NoSQL?", skill: "Databases", category: "Technical" },
  { id: 12, question: "Explain the time and space complexity of a Hash Map (Dictionary).", skill: "Data Structures", category: "Technical" },
  { id: 13, question: "How do you ensure your code is secure against common vulnerabilities like XSS or SQL Injection?", skill: "Security", category: "Technical" },
  
  // Scenarios
  { id: 14, question: "You are assigned a task using a framework you've never seen before. Walk me through your first 48 hours.", skill: "Initiative", category: "Behavioral" },
  { id: 15, question: "Production is down and you are the only engineer online. What are your immediate steps?", skill: "Crisis Management", category: "Technical" }
];

const CATEGORY_COLORS = {
  General: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Behavioral: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Technical: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function InterviewPrepPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [sessionScores, setSessionScores] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [permError, setPermError] = useState(null); // 'camera' | 'mic' | null // idle | interview | feedback

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Init speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let full = '';
        for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
        setAnswer(full);
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          setPermError('mic');
          toast.error('Microphone access denied. See the fix guide on screen.');
        }
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
    return () => { stopCamera(); window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraOn(true);
      setPermError(null);
      toast.success('Camera connected!');
    } catch (err) {
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'camera' : null;
      setPermError(msg);
      toast.error('Camera access denied. See the fix guide on screen.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported. Please use Google Chrome or Microsoft Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setAnswer('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setPermError(null);
      } catch(e) {
        console.error(e);
        toast.error('Could not start mic. Please check permissions.');
      }
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en'));
    if (v) utt.voice = v;
    utt.rate = 0.92;
    utt.onstart = () => setIsAiSpeaking(true);
    utt.onend = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const startInterview = async () => {
    await startCamera();
    setPhase('interview');
    setCurrentQ(0);
    setSessionScores([]);
    setFeedback(null);
    setAnswer('');
    setTimeout(() => speakText(QUESTIONS[0].question), 800);
  };

  const handleAnalyze = async () => {
    if (!answer.trim() || answer.trim().length < 15) return toast.error('Please provide a longer answer first.');
    if (isListening) toggleListening();
    setLoading(true); setFeedback(null);
    try {
      const res = await aiAPI.analyzeInterviewAnswer({ question: QUESTIONS[currentQ].question, answer: answer.trim(), jobRole: QUESTIONS[currentQ].skill });
      if (res.data.success) {
        const fb = res.data.data;
        setFeedback(fb);
        setSessionScores(prev => [...prev, { q: currentQ + 1, score: fb.score, skill: QUESTIONS[currentQ].skill }]);
        speakText(`Score: ${fb.score} out of 100. ${fb.comments}`);
        setPhase('feedback');
      }
    } catch { toast.error('AI analysis failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleNext = () => {
    const next = currentQ + 1;
    if (next >= QUESTIONS.length) { setPhase('summary'); return; }
    setCurrentQ(next); setAnswer(''); setFeedback(null); setPhase('interview');
    setTimeout(() => speakText(QUESTIONS[next].question), 400);
  };

  const avgScore = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a,b) => a + b.score, 0) / sessionScores.length) : 0;

  return (
    <div className="min-h-screen bg-[#0A0D1A] pt-20 pb-12 px-4 sm:px-6 font-sans text-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              Live AI Interview
            </h1>
            <p className="text-slate-400 mt-1 ml-14">Real-time voice interview powered by Claude AI</p>
          </div>
          <div className="flex items-center gap-3">
            {sessionScores.length > 0 && (
              <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm">
                <span className="text-slate-400">Avg Score: </span>
                <span className={`font-black text-lg ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}</span>
                <span className="text-slate-400">/100</span>
              </div>
            )}
            <Badge variant="primary" className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Claude AI
            </Badge>
          </div>
        </div>

        {/* ===== PERMISSION FIX BANNER ===== */}
        {permError && (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-black text-amber-400 text-lg mb-1">
                {permError === 'camera' ? 'Camera Access Blocked' : 'Microphone Access Blocked'}
              </h3>
              <p className="text-amber-200/80 text-sm mb-3">Chrome remembered your previous "Block" choice. Follow these steps to fix it:</p>
              <ol className="space-y-1 text-sm text-amber-100">
                <li><span className="font-black text-amber-400">1.</span> Click the 🔒 <strong>lock icon</strong> in your browser address bar (left of the URL)</li>
                <li><span className="font-black text-amber-400">2.</span> Find <strong>Camera</strong> or <strong>Microphone</strong> in the dropdown</li>
                <li><span className="font-black text-amber-400">3.</span> Change it from <span className="text-red-400 font-bold">Block</span> to <span className="text-emerald-400 font-bold">Allow</span></li>
                <li><span className="font-black text-amber-400">4.</span> <strong>Refresh this page</strong> (press F5) and try again</li>
              </ol>
            </div>
            <button onClick={() => setPermError(null)} className="text-amber-400 hover:text-white text-xl font-black px-2">✕</button>
          </div>
        )}


        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 bg-indigo-600/20 border-2 border-indigo-500/30 relative`}>
              <BrainCircuit className="w-16 h-16 text-indigo-400" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Ready for your AI Interview?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">The AI will ask you {QUESTIONS.length} real interview questions. Speak your answers clearly and Claude will analyze your performance with detailed feedback.</p>
            <div className="grid grid-cols-3 gap-4 mb-10 w-full">
              {[['🎥', 'Camera On', 'Face-to-face video experience'], ['🎙️', 'Voice Input', 'Speak naturally, AI transcribes'], ['🤖', 'AI Analysis', 'Claude scores each answer']].map(([icon, title, desc]) => (
                <div key={title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-bold text-white text-sm">{title}</p>
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <button onClick={startInterview} className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <PlayCircle className="w-7 h-7" /> Start Interview
            </button>
          </div>
        )}

        {/* INTERVIEW / FEEDBACK SCREEN */}
        {(phase === 'interview' || phase === 'feedback') && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: Video + Controls */}
            <div className="lg:col-span-2 space-y-5">

              {/* Video */}
              <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
                <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800/90 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-600">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-slate-400 font-semibold text-sm">Camera is off</p>
                    </div>
                  </div>
                )}

                {/* Top overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-xs font-bold text-white">{currentQ + 1} / {QUESTIONS.length}</span>
                </div>

                {/* Recording badge */}
                {isListening && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-500/90 backdrop-blur px-5 py-2.5 rounded-full pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-black text-white uppercase tracking-widest">Listening...</span>
                  </div>
                )}

                {/* AI Avatar bottom-left */}
                <div className="absolute bottom-16 left-4 flex items-center gap-3 bg-black/70 backdrop-blur p-2 pr-4 rounded-full border border-white/10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isAiSpeaking ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'bg-slate-700'}`}>
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Claude AI</p>
                    <p className="text-sm font-semibold text-white">{isAiSpeaking ? 'Speaking...' : 'Ready'}</p>
                  </div>
                </div>

                {/* ====== ZOOM-STYLE CONTROL BAR ====== */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md flex items-center justify-center gap-4 border-t border-white/10">
                  {/* Mic Toggle */}
                  <button
                    onClick={toggleListening}
                    title={isListening ? 'Mute Mic' : 'Unmute Mic'}
                    className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all group ${
                      isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  <span className="text-xs text-slate-400 -mt-0 hidden sm:block w-14 text-center">{isListening ? 'Mute' : 'Unmute'}</span>

                  {/* Camera Toggle */}
                  <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
                    className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all ${
                      isCameraOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40'
                    }`}
                  >
                    {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                  </button>
                  <span className="text-xs text-slate-400 hidden sm:block w-14 text-center">{isCameraOn ? 'Camera' : 'No Cam'}</span>

                  {/* Divider */}
                  <div className="w-px h-6 bg-white/20 mx-1" />

                  {/* Speak / Stop Answering */}
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      isListening ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isListening ? <><StopCircle className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Speak</>}
                  </button>

                  {/* Repeat question */}
                  <button onClick={() => speakText(QUESTIONS[currentQ].question)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all">
                    <Volume2 className="w-4 h-4 text-indigo-400" /> Repeat
                  </button>
                </div>
              </div>

              {/* Controls + Transcript */}
              <div className="bg-slate-800/80 backdrop-blur rounded-3xl p-6 border border-slate-700">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <button onClick={handleAnalyze} disabled={loading || !answer.trim()} className="flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm border border-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                      {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {loading ? 'Analyzing...' : 'Analyze Answer'}
                    </button>
                    <p className="text-xs text-slate-500 text-center">Use the control bar on the video to toggle camera &amp; mic</p>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5" /> Your Answer {isListening && <span className="text-red-400 animate-pulse">● Live</span>}
                    </label>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6}
                      placeholder="Click 'Speak Answer' and answer verbally. Your words will appear here in real-time. You can also type directly."
                      className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm leading-relaxed transition-all"
                    />
                    <p className="text-right text-xs text-slate-500 mt-1">{answer.length} chars</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-5">
              {/* Question Card */}
              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 -translate-y-2 translate-x-2">
                  <BrainCircuit className="w-32 h-32 text-indigo-400" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[QUESTIONS[currentQ].category]}`}>
                      {QUESTIONS[currentQ].category}
                    </span>
                    <span className="text-xs text-slate-400">{QUESTIONS[currentQ].skill}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-6">
                    "{QUESTIONS[currentQ].question}"
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => { if(currentQ > 0) { setCurrentQ(q => q-1); setAnswer(''); setFeedback(null); }}} disabled={currentQ === 0} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 font-bold text-sm hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button onClick={handleNext} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                      Skip <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Map */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Progress</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {QUESTIONS.map((q, i) => {
                    const scored = sessionScores.find(s => s.q === i+1);
                    return (
                      <button key={i} onClick={() => { setCurrentQ(i); setAnswer(''); setFeedback(null); setPhase('interview'); }}
                        className={`h-8 rounded-lg text-xs font-bold transition-all ${i === currentQ ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : scored ? (scored.score >= 80 ? 'bg-emerald-600/60 text-emerald-200' : scored.score >= 60 ? 'bg-amber-600/60 text-amber-200' : 'bg-red-600/60 text-red-200') : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                        {i+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 animate-fade-in space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" /> AI Feedback
                    </h4>
                    <div className="text-right">
                      <span className={`text-3xl font-black ${feedback.score >= 80 ? 'text-emerald-400' : feedback.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{feedback.score}</span>
                      <span className="text-slate-400 text-xs">/100</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${feedback.score >= 80 ? 'bg-emerald-500' : feedback.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${feedback.score}%` }} />
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">{feedback.comments}</p>

                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</p>
                      <ul className="space-y-1">{feedback.strengths.map((s,i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>{s}</li>)}</ul>
                    </div>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Improvements</p>
                      <ul className="space-y-1">{feedback.improvements.map((s,i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>{s}</li>)}</ul>
                    </div>
                  )}
                  {feedback.betterAnswerTip && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-indigo-400 flex items-center gap-1 mb-1"><Lightbulb className="w-3.5 h-3.5" /> Pro Tip</p>
                      <p className="text-xs text-indigo-200">{feedback.betterAnswerTip}</p>
                    </div>
                  )}
                  <button onClick={handleNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2">
                    {currentQ + 1 >= QUESTIONS.length ? '🎉 Finish Interview' : <>Next Question <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUMMARY SCREEN */}
        {phase === 'summary' && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/40">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">Interview Complete! 🎉</h2>
            <p className="text-slate-400 mb-8">Here's your session performance summary</p>
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 mb-8">
              <p className="text-slate-400 text-sm mb-1">Overall Average Score</p>
              <p className={`text-6xl font-black mb-6 ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}<span className="text-2xl text-slate-400">/100</span></p>
              <div className="space-y-3">
                {sessionScores.map((s,i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4">Q{s.q}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white w-8 text-right">{s.score}</span>
                    <span className="text-xs text-slate-400 w-28 text-left">{s.skill}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { setPhase('idle'); setSessionScores([]); setFeedback(null); setAnswer(''); stopCamera(); window.speechSynthesis?.cancel(); }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 mx-auto">
              <RefreshCcw className="w-5 h-5" /> Start New Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

```

## File: frontend\src\pages\JobsPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Briefcase, MapPin, DollarSign, ExternalLink, Target, Search } from 'lucide-react';
import { jobsAPI } from '../api';
import { PageHeader, Spinner, Badge, ProgressBar, EmptyState } from '../components/ui/UI';

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await jobsAPI.recommend();
                setJobs(data.jobs);
            } catch (err) {
                toast.error('Failed to fetch job recommendations');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <PageHeader
                    title="Job Recommendations"
                    subtitle="Discover roles that match your current skill set"
                    action={
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search jobs or companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64"
                            />
                        </div>
                    }
                />

                {filteredJobs.length === 0 ? (
                    <div className="section-card py-20">
                        <EmptyState 
                            icon={Briefcase}
                            title={searchTerm ? 'No matching jobs found' : 'No recommendations yet'}
                            subtitle={searchTerm ? 'Try adjusting your search terms' : 'Upload a resume with more skills to get better results'}
                        />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {filteredJobs.map((job) => (
                            <div key={job._id} className="section-card group hover:-translate-y-1 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 font-bold text-xl">
                                            {job.company[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                                        </div>
                                    </div>
                                    <Badge variant={job.matchPercentage >= 80 ? 'success' : job.matchPercentage >= 50 ? 'primary' : 'warning'}>
                                        {job.matchPercentage}% Match
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location || 'Remote'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {job.salary || 'Competitive'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {job.type || 'Full-time'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Target className="w-3.5 h-3.5" />
                                        {job.requiredSkills.length} Skills Required
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Compatibility</span>
                                        <span className="text-xs font-bold text-indigo-500">{job.matchPercentage}%</span>
                                    </div>
                                    <ProgressBar value={job.matchPercentage} color="indigo" showValue={false} />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex flex-wrap gap-1 max-w-[70%]">
                                        {job.requiredSkills.slice(0, 3).map(skill => (
                                            <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.requiredSkills.length > 3 && (
                                            <span className="text-[10px] px-2 py-0.5 text-slate-400">+{job.requiredSkills.length - 3} more</span>
                                        )}
                                    </div>
                                    <button 
                                        onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(job.company + ' ' + job.title + ' careers')}`, '_blank')}
                                        className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-400"
                                    >
                                        Apply <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

```

## File: frontend\src\pages\SettingsPage.js
```javascript
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Lock, Save } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Spinner } from '../components/ui/UI';

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            toast.success('Password updated successfully! 🎉');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <PageHeader
                    title="Account Settings"
                    subtitle="Manage your profile and security preferences"
                />

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Profile Information (Read-only for now) */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="section-card flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{user?.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                            <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
                                {user?.role} Account
                            </span>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="md:col-span-2">
                        <div className="section-card">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Change Password</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwords.currentPassword}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        required
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwords.newPassword}
                                            onChange={handleChange}
                                            className="input-field w-full"
                                            required
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={handleChange}
                                            className="input-field w-full"
                                            required
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-gradient w-full sm:w-auto py-2.5 px-6 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

```

## File: frontend\src\pages\SkillGapPage.js
```javascript
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Briefcase, Brain, CheckCircle, XCircle,
  MapPin, DollarSign, Clock, PlayCircle, ExternalLink,
  Star, Building2, Search, Zap, Target,
  BookOpen, TrendingUp, AlertCircle
} from 'lucide-react';
import { skillGapAPI, jobsAPI } from '../api';
import { Spinner } from '../components/ui/UI';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return m ? m[1] : null;
};

const getYouTubeThumb = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const getEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function MatchRing({ value, color, size = 160 }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const grad = color === 'indigo'
    ? ['#818cf8', '#6366f1'] : ['#34d399', '#10b981'];

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <defs>
        <linearGradient id={`ring-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={grad[0]} />
          <stop offset="100%" stopColor={grad[1]} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={`url(#ring-${color})`} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s ease' }} />
    </svg>
  );
}

function CourseCard({ course, skillLabel }) {
  const [playing, setPlaying] = useState(false);
  const thumb = getYouTubeThumb(course.link);
  const embed = getEmbedUrl(course.link);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Thumbnail / Embed */}
      <div className="relative w-full h-44 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
        {playing && embed ? (
          <iframe
            src={`${embed}?autoplay=1`}
            title={course.courseName}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 cursor-pointer"
            onClick={() => embed && setPlaying(true)}>
            {thumb ? (
              <img src={thumb} alt={course.courseName} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {embed ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Watch on Page</span>
                </>
              ) : (
                <BookOpen className="w-12 h-12 text-indigo-400 opacity-50" />
              )}
            </div>
          </div>
        )}
        {/* Skill tag */}
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow">
          {skillLabel}
        </span>
        {/* Free badge */}
        {course.isFree && (
          <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow">
            FREE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-snug mb-2 line-clamp-2">
          {course.courseName}
        </h4>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating}</span>
          <span>{course.platform}</span>
          <span className="capitalize">{course.level || 'Beginner'}</span>
        </div>
        <a href={course.link} target="_blank" rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow shadow-indigo-500/30">
          Open Course <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function JobCard({ job, selected, onSelect }) {
  const isSelected = selected?._id === job._id;
  return (
    <button onClick={() => onSelect(job)}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${isSelected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <Briefcase className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{job.title}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Building2 className="w-3 h-3" /> {job.company}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {job.type}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {job.requiredSkills.slice(0, 4).map(s => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
            {s}
          </span>
        ))}
        {job.requiredSkills.length > 4 && (
          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            +{job.requiredSkills.length - 4} more
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SkillGapPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState('missing');

  // Load actual job listings
  useEffect(() => {
    const loadJobs = async () => {
      setLoadingJobs(true);
      try {
        const { data } = await jobsAPI.recommend();
        setJobs(data.jobs);
        setFilteredJobs(data.jobs);
      } catch {
        // Fallback: load all jobs
        try {
          const { data } = await jobsAPI.getAll();
          setJobs(data.jobs);
          setFilteredJobs(data.jobs);
        } catch {
          toast.error('Could not load job listings. Please upload your resume first.');
        }
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // Filter jobs by search
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredJobs(jobs); return; }
    const q = searchQuery.toLowerCase();
    setFilteredJobs(jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.requiredSkills.some(s => s.toLowerCase().includes(q))
    ));
  }, [searchQuery, jobs]);

  const handleAnalyze = async () => {
    if (!selectedJob) { toast.warning('Please select a job position first.'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await skillGapAPI.analyzeByJob(selectedJob._id);
      setResult(data.data);
      setActiveSkillTab('missing');
      toast.success('Analysis complete! 🚀');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed';
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const qualificationLabel = (pct) => {
    if (pct >= 80) return { text: 'Highly Qualified', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' };
    if (pct >= 55) return { text: 'Partially Qualified', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' };
    return { text: 'Skill Gap Detected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' };
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0B0F19] font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Resume ↔ Job Analyzer
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                Pick a company & position — see exactly what skills you have, what's missing, and how to bridge the gap.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Left: Job Picker ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-5 flex flex-col">
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" /> Select Position
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, skills..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Job list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
                {loadingJobs ? (
                  <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No jobs found.<br />Upload your resume to see recommendations.</p>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <JobCard key={job._id} job={job} selected={selectedJob} onSelect={setSelectedJob} />
                  ))
                )}
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedJob}
                className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                {analyzing ? <><Spinner size="sm" /> Analyzing...</> : <><Zap className="w-5 h-5" /> Analyze My Fit</>}
              </button>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-5">
                  <Target className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-700 dark:text-white mb-2">Select a Job to Analyze</h3>
                <p className="text-slate-400 dark:text-slate-500 max-w-xs text-sm font-medium">
                  Choose any position on the left to see a deep analysis of your resume against that role's requirements.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-fade-in">

                {/* ── Job Header Card ── */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">{result.job.title}</h2>
                        <div className="flex items-center gap-2 mt-1 text-indigo-200 text-sm font-medium">
                          <Building2 className="w-4 h-4" /> {result.job.company}
                        </div>
                      </div>
                      {(() => {
                        const q = qualificationLabel(result.matchPercentage);
                        return (
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border bg-white/10 border-white/20 text-white whitespace-nowrap`}>
                            {q.text}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {result.job.location}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {result.job.salary}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {result.job.experienceRequired}+ yrs exp</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {result.job.type}</span>
                    </div>
                    {result.job.description && (
                      <p className="mt-3 text-indigo-100 text-sm leading-relaxed opacity-80">{result.job.description}</p>
                    )}
                  </div>
                </div>

                {/* ── Score Rings ── */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Skill Match', value: result.matchPercentage, color: 'indigo', sub: `${result.matchedSkills.length} of ${result.requiredSkills.length} skills` },
                    { label: 'Hiring Probability', value: result.probability, color: 'emerald', sub: `${result.experienceYears} yr exp factor` },
                  ].map(({ label, value, color, sub }) => (
                    <div key={label} className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6 flex flex-col items-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <MatchRing value={value} color={color} size={130} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {value}%
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium text-center">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Skill Breakdown Tabs ── */}
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
                  <div className="flex border-b border-slate-100 dark:border-white/5">
                    {[
                      { id: 'missing', label: `Skills Needed (${result.missingSkills.length})`, icon: XCircle, color: 'text-red-500' },
                      { id: 'matched', label: `Skills You Have (${result.matchedSkills.length})`, icon: CheckCircle, color: 'text-emerald-500' },
                      { id: 'required', label: `All Required (${result.requiredSkills.length})`, icon: Target, color: 'text-indigo-500' },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setActiveSkillTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-xs font-bold transition-all border-b-2 ${activeSkillTab === tab.id
                          ? `border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5`
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                        <tab.icon className={`w-4 h-4 ${activeSkillTab === tab.id ? 'text-indigo-500' : tab.color}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.id === 'missing' ? `Missing (${result.missingSkills.length})` : tab.id === 'matched' ? `Have (${result.matchedSkills.length})` : `All (${result.requiredSkills.length})`}</span>
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    {activeSkillTab === 'missing' && (
                      result.missingSkills.length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">You have ALL required skills! 🎉</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {result.missingSkills.map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      )
                    )}
                    {activeSkillTab === 'matched' && (
                      result.matchedSkills.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 italic">No matching skills detected yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {result.matchedSkills.map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )
                    )}
                    {activeSkillTab === 'required' && (
                      <div className="flex flex-wrap gap-2">
                        {result.requiredSkills.map(s => {
                          const has = result.matchedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase());
                          return (
                            <span key={s} className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${has
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                              {has ? '✓' : '✗'} {s}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Course Recommendations ── */}
                {result.missingSkills.length > 0 && (
                  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Bridge the Gap</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Courses to learn your missing skills</p>
                      </div>
                    </div>

                    {result.recommendedCourses && result.recommendedCourses.length > 0 ? (
                      <>
                        {/* Per-skill sections */}
                        {result.missingSkills.map(skill => {
                          const skillCourses = result.coursesPerSkill?.[skill] || [];
                          if (skillCourses.length === 0) return null;
                          return (
                            <div key={skill} className="mb-8">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">{skill}</h4>
                                <span className="text-xs text-slate-400">{skillCourses.length} course{skillCourses.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                {skillCourses.map(course => (
                                  <CourseCard key={course._id || course.link} course={course} skillLabel={skill} />
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Missing skills with no courses */}
                        {result.missingSkills.filter(s => !(result.coursesPerSkill?.[s]?.length > 0)).length > 0 && (
                          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Skills without specific courses yet:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.missingSkills
                                .filter(s => !(result.coursesPerSkill?.[s]?.length > 0))
                                .map(s => (
                                  <a key={s} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s + ' tutorial')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors">
                                    {s} <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium mb-4">No specific courses in the database for these skills yet.</p>
                        <p className="text-sm text-slate-400 mb-4">Search YouTube for:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {result.missingSkills.map(s => (
                            <a key={s} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s + ' tutorial for beginners')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800">
                              <PlayCircle className="w-4 h-4" /> {s} tutorial
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Your Skills Summary ── */}
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6">
                  <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Your Resume Skills
                    <span className="ml-auto text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {result.userSkills.length} detected
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.userSkills.map(s => {
                      const isMatched = result.matchedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase());
                      return (
                        <span key={s} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${isMatched
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          {s}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 inline-block" />
                    Highlighted = matches this job's requirements
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

```

## File: frontend\src\pages\UploadPage.js
```javascript
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import { Upload, FileText, CheckCircle, Download } from 'lucide-react';
import { resumeAPI } from '../api';
import { PageHeader, ProgressBar, Badge, Spinner } from '../components/ui/UI';
import jsPDF from 'jspdf';

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      toast.error('Only PDF or DOCX files under 5MB are allowed');
      return;
    }
    setFile(accepted[0]);
    setResult(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append('resume', file);
    setUploading(true);
    try {
      const { data } = await resumeAPI.upload(formData);
      setResult(data.resume);
      toast.success('Resume analyzed successfully! 🎉');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('Resume Analysis Report', 20, 20);
    doc.setFontSize(12);
    doc.text(`Name: ${result.name || 'N/A'}`, 20, 40);
    doc.text(`Email: ${result.email || 'N/A'}`, 20, 50);
    doc.text(`Experience: ${result.experienceYears} years`, 20, 60);
    doc.text(`Resume Score: ${result.resumeScore}/100`, 20, 70);
    doc.setFontSize(14);
    doc.text('Skills Detected:', 20, 90);
    doc.setFontSize(11);
    const skillText = result.skills.join(', ');
    const splitSkills = doc.splitTextToSize(skillText, 170);
    doc.text(splitSkills, 20, 100);
    doc.save('resume-analysis.pdf');
    toast.success('Report downloaded!');
  };

  return (
    <div className="min-h-screen pt-20 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <PageHeader
          title="Upload Resume"
          subtitle="Upload your PDF or DOCX resume for instant AI analysis"
        />

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`section-card cursor-pointer transition-all duration-300 border-2 border-dashed flex flex-col items-center justify-center py-16 mb-6 hover:border-indigo-400
            ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-slate-300 dark:border-slate-700'}`}
        >
          <input {...getInputProps()} />
          <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300
            ${isDragActive ? 'bg-indigo-100 dark:bg-indigo-900/30 scale-110' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <Upload className={`w-10 h-10 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">
            {isDragActive ? 'Drop your resume here!' : 'Drag & drop your resume'}
          </h3>
          <p className="text-slate-400 text-sm">or click to browse — PDF or DOCX, max 5MB</p>
        </div>

        {/* Selected file */}
        {file && !result && (
          <div className="section-card flex items-center justify-between mb-6 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <FileText className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white text-sm">{file.name}</p>
                <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="btn-gradient flex items-center gap-2 disabled:opacity-60"
            >
              {uploading ? (
                <><Spinner size="sm" /> Analyzing…</>
              ) : (
                <><Upload className="w-4 h-4" /> Analyze Resume</>
              )}
            </button>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="section-card flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 dark:text-white">{result.name || 'Your Resume'}</h2>
                  <p className="text-slate-400 text-sm">{result.email}</p>
                </div>
              </div>
              <button onClick={downloadReport} className="btn-gradient flex items-center gap-2 text-sm py-2">
                <Download className="w-4 h-4" /> Download Report
              </button>
            </div>

            {/* Resume score */}
            <div className="section-card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                Resume Score
                <Badge variant={result.resumeScore >= 70 ? 'success' : result.resumeScore >= 40 ? 'warning' : 'danger'}>
                  {result.resumeScore >= 70 ? 'Strong' : result.resumeScore >= 40 ? 'Average' : 'Needs Work'}
                </Badge>
              </h3>
              <ProgressBar
                value={result.resumeScore}
                label={`${result.resumeScore} / 100`}
                color={result.resumeScore >= 70 ? 'green' : result.resumeScore >= 40 ? 'yellow' : 'red'}
              />
            </div>

            {/* Stats grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: 'Skills Detected', value: result.skills.length, color: 'text-indigo-500' },
                { label: 'Experience Years', value: result.experienceYears, color: 'text-blue-500' },
                { label: 'Education Entries', value: result.education?.length || 0, color: 'text-emerald-500' },
              ].map(({ label, value, color }) => (
                <div key={label} className="section-card text-center">
                  <p className={`text-3xl font-black ${color}`}>{value}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="section-card">
              <h3 className="font-bold text-slate-800 dark:text-white mb-4">Detected Skills</h3>
              <div className="flex flex-wrap gap-2">
                {result.skills.length > 0 ? (
                  result.skills.map((s) => (
                    <span key={s} className="skill-badge-blue">{s}</span>
                  ))
                ) : (
                  <p className="text-slate-400 text-sm">No skills detected. Try a more detailed resume.</p>
                )}
              </div>
            </div>

            {/* Education */}
            {result.education?.length > 0 && (
              <div className="section-card">
                <h3 className="font-bold text-slate-800 dark:text-white mb-4">Education</h3>
                <div className="space-y-2">
                  {result.education.map((edu, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-700 dark:text-slate-300">{edu.degree}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

```

## File: frontend\src\reportWebVitals.js
```javascript
const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(onPerfEntry);
      getFID(onPerfEntry);
      getFCP(onPerfEntry);
      getLCP(onPerfEntry);
      getTTFB(onPerfEntry);
    });
  }
};

export default reportWebVitals;

```

## File: frontend\src\setupTests.js
```javascript
// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

```

## File: frontend\src\supabase.js
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cwinqkphtonxbeypstds.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdWxhYmFzZSIsInJlZiI6ImN3aW5xa3BodG9ueGJleXBzdGRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1NDI4NjIsImV4cCI6MjA2MDExODg2Mn0.uD-w-q5FAGRrYt0sunTg1-huXlpA8IPGRm3fh64Gvq';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

```

## File: frontend\tailwind.config.js
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        accent: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        dark: {
          900: '#0f0f1a',
          800: '#1a1a2e',
          700: '#16213e',
          600: '#0f3460',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s infinite',
        'shimmer': 'shimmer 1.5s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};

```

## File: package.json
```json
{
  "name": "ai-skill-gap-detector",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "frontend-install": "npm install --prefix frontend",
    "frontend-build": "npm run build --prefix frontend",
    "backend-install": "npm install --prefix backend",
    "install-all": "npm run frontend-install && npm run backend-install",
    "build": "cd frontend && npm install && npm run build && mv build ../dist"
  }
}

```

## File: README.md
```md
# 🚀 AI Skill Gap Detector & Resume Analyzer

> An intelligent career platform for final-year & pass-out B.Tech students to bridge the gap between their current skills and industry requirements.

![Platform Preview](https://img.shields.io/badge/Status-Live-brightgreen) ![React](https://img.shields.io/badge/React-18-blue) ![Node.js](https://img.shields.io/badge/Node.js-Express-green) ![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-brightgreen)

---

## ✨ Features

| Feature | Description |
|---|---|
| 📄 **AI Resume Parsing** | Extracts skills, education & experience from PDF/DOCX |
| 🎯 **Skill Gap Detection** | Compares your skills vs. real job requirements |
| 📊 **Job Probability Score** | Calculates your hire-probability based on skills + experience |
| 💼 **Job Recommendations** | Smart job matches tailored to your profile |
| 📚 **Course Recommendations** | Curated YouTube & Udemy courses for missing skills |
| ✉️ **AI Cover Letter Builder** | Instantly generates tailored cover letters |
| 🎤 **Mock Interview Simulator** | Practice with AI-powered feedback on your answers |
| 🛡️ **Admin Panel** | Full job & course management dashboard |
| 🌙 **Dark / Light Mode** | Premium glassmorphism UI with smooth animations |

---

## 🛠️ Tech Stack

**Frontend**
- React.js 18
- Tailwind CSS + Custom CSS
- Axios, Chart.js, Lucide React
- React Router v6

**Backend**
- Node.js + Express.js
- MongoDB (Mongoose)
- JWT Authentication
- Multer (file uploads), PDF-Parse, Mammoth (DOCX)
- MongoDB Memory Server (in-memory fallback if no local DB)

---

## ⚙️ Setup Instructions

### Prerequisites
- Node.js v18+ installed
- MongoDB (optional — falls back to in-memory DB automatically)

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/ai-skill-gap-detector.git
cd ai-skill-gap-detector
```

### 2. Backend Setup
```bash
cd backend
npm install
# .env is pre-configured. To use your own MongoDB, update MONGO_URI in .env
npm run dev
# Server starts on http://localhost:5000
# If no local MongoDB is found, it auto-starts an in-memory DB and seeds data
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
# App starts on http://localhost:3000
```

### 4. Environment Variables (`backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/skillgap
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d
NODE_ENV=development
```
> ⚠️ Change `JWT_SECRET` before deploying to production!

---

## 📁 Project Structure

```
ai-skill-gap-detector/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth, Resume, SkillGap, Jobs, Courses, AI, Admin
│   │   ├── middleware/        # JWT Auth guard, File upload
│   │   ├── models/            # User, Resume, Job, Course (Mongoose schemas)
│   │   ├── routes/            # Express routers
│   │   └── server.js          # Entry point with auto-seed + in-memory fallback
│   └── uploads/               # Temporary resume storage
├── frontend/
│   ├── src/
│   │   ├── api/               # Axios API wrapper (authAPI, resumeAPI, aiAPI…)
│   │   ├── components/        # Navbar, UI components, ProtectedRoute
│   │   ├── context/           # AuthContext, ThemeContext
│   │   └── pages/             # All page components
│   └── public/
└── README.md
```

---

## 🔑 Admin Access

Register a new account, then manually update your user's `role` field to `"admin"` in MongoDB:
```js
db.users.updateOne({ email: "your@email.com" }, { $set: { role: "admin" } })
```

---

## 📜 License

MIT License — feel free to use and extend this project.

```

## File: vercel.json
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

```

