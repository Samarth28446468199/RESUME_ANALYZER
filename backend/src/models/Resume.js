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
