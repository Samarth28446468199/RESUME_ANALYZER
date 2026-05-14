import axios from 'axios';

// Base API instance
const baseURL = process.env.REACT_APP_API_URL || '/api';

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
