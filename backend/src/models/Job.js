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
