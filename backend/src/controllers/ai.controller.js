// AI Controller - Currently mocks AI responses

exports.generateCoverLetter = async (req, res) => {
    try {
        const { jobTitle, companyName, skills } = req.body;
        
        if (!jobTitle || !companyName) {
            return res.status(400).json({ success: false, message: 'Job Title and Company Name are required' });
        }

        // Simulating processing time and generative AI response
        setTimeout(() => {
            const letter = `Dear Hiring Manager at ${companyName},\n\nI am writing to express my strong interest in the ${jobTitle} position. With my background and expertise in ${skills || 'relevant technologies'}, I am confident that I can bring significant value to your team.\n\nThroughout my career, I have consistently focused on building scalable, user-centric solutions. The opportunity to contribute to ${companyName} excites me, particularly because of your commitment to innovation.\n\nI would welcome the opportunity to discuss how my technical skills and professional experience align perfectly with your current needs.\n\nThank you for your time and consideration.\n\nSincerely,\n[Your Name]`;
            res.json({ success: true, data: { coverLetter: letter } });
        }, 1000);
        
    } catch (error) {
        console.error('Cover letter generation error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.analyzeInterviewAnswer = async (req, res) => {
    try {
        const { questionId, audioOrVideoData, timeSpent } = req.body;
        
        // Simulating processing time for AI analysis
        setTimeout(() => {
            const feedbackScore = Math.floor(Math.random() * 20) + 75; // Random score between 75 and 95
            res.json({
                success: true,
                data: {
                    score: feedbackScore,
                    comments: "Strong structural approach. Your articulation of the STAR method was clear, but try to minimize filler words. The technical depth was solid."
                }
            });
        }, 1500);

    } catch (error) {
        console.error('Interview analysis error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};
