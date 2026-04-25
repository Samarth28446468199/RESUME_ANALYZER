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
