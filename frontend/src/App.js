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
