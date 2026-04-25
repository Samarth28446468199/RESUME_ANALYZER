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
  const jobCount = await Job.countDocuments();
  if (jobCount > 0) return; // already seeded

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
