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
