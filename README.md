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
