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
