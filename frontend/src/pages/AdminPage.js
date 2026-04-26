import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Shield, Plus, Trash2, Edit2, X, Briefcase, BookOpen } from 'lucide-react';
import { jobsAPI, coursesAPI, adminAPI } from '../api';
import { PageHeader, Spinner, Badge, StatCard } from '../components/ui/UI';

export default function AdminPage() {
    const [jobs, setJobs] = useState([]);
    const [courses, setCourses] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('jobs');
    const [isAddingJob, setIsAddingJob] = useState(false);

    const [newJob, setNewJob] = useState({
        title: '',
        company: '',
        location: '',
        salary: '',
        requiredSkills: '',
        description: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [jobsRes, coursesRes] = await Promise.all([
                    jobsAPI.getAll(),
                    coursesAPI.getAll()
                ]);
                setJobs(jobsRes.data.jobs);
                setCourses(coursesRes.data.courses);
                // Stats might fail if not fully implemented in backend yet, so we handle it gracefully
                try {
                    const statsRes = await adminAPI.getStats();
                    setStats(statsRes.data.stats);
                } catch (e) {
                    setStats({ totalJobs: jobsRes.data.jobs.length, totalCourses: coursesRes.data.courses.length, totalUsers: 0 });
                }
            } catch (err) {
                toast.error('Failed to fetch admin data');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddJob = async (e) => {
        e.preventDefault();
        try {
            const jobData = {
                ...newJob,
                requiredSkills: newJob.requiredSkills.split(',').map(s => s.trim())
            };
            await jobsAPI.create(jobData);
            toast.success('Job added successfully!');
            setIsAddingJob(false);
            setNewJob({ title: '', company: '', location: '', salary: '', requiredSkills: '', description: '' });
            const { data } = await jobsAPI.getAll();
            setJobs(data.jobs);
        } catch (err) {
            toast.error('Failed to add job');
        }
    };

    const handleDeleteJob = async (id) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            await jobsAPI.delete(id);
            setJobs(jobs.filter(j => j._id !== id));
            toast.success('Job deleted');
        } catch (err) {
            toast.error('Failed to delete job');
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <PageHeader 
                    title="Admin Control Center" 
                    subtitle="Manage platform metadata, jobs, and courses"
                    icon={Shield}
                />

                {/* Quick Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                    <StatCard title="Total Jobs" value={stats?.totalJobs || 0} icon={Briefcase} gradient="from-indigo-500/10 to-blue-500/10" />
                    <StatCard title="Total Courses" value={stats?.totalCourses || 0} icon={BookOpen} gradient="from-emerald-500/10 to-teal-500/10" />
                    <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Plus} gradient="from-violet-500/10 to-purple-500/10" />
                </div>

                {/* Tabs */}
                <div className="flex gap-4 mb-6 border-b border-slate-200 dark:border-white/10">
                    <button 
                        onClick={() => setActiveTab('jobs')}
                        className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'jobs' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                    >
                        Manage Jobs
                    </button>
                    <button 
                        onClick={() => setActiveTab('courses')}
                        className={`pb-4 px-2 text-sm font-bold transition-all ${activeTab === 'courses' ? 'text-indigo-500 border-b-2 border-indigo-500' : 'text-slate-400'}`}
                    >
                        Manage Courses
                    </button>
                </div>

                {activeTab === 'jobs' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Active Job Postings</h2>
                            <button 
                                onClick={() => setIsAddingJob(!isAddingJob)}
                                className="btn-gradient flex items-center gap-2 py-2 px-4 text-sm"
                            >
                                {isAddingJob ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                {isAddingJob ? 'Cancel' : 'Add New Job'}
                            </button>
                        </div>

                        {isAddingJob && (
                            <form onSubmit={handleAddJob} className="section-card grid sm:grid-cols-2 gap-4 animate-slide-up">
                                <input 
                                    placeholder="Job Title"
                                    className="input-field" 
                                    value={newJob.title}
                                    onChange={e => setNewJob({...newJob, title: e.target.value})}
                                    required
                                />
                                <input 
                                    placeholder="Company"
                                    className="input-field" 
                                    value={newJob.company}
                                    onChange={e => setNewJob({...newJob, company: e.target.value})}
                                    required
                                />
                                <input 
                                    placeholder="Location"
                                    className="input-field" 
                                    value={newJob.location}
                                    onChange={e => setNewJob({...newJob, location: e.target.value})}
                                />
                                <input 
                                    placeholder="Salary Range"
                                    className="input-field" 
                                    value={newJob.salary}
                                    onChange={e => setNewJob({...newJob, salary: e.target.value})}
                                />
                                <div className="sm:col-span-2">
                                    <input 
                                        placeholder="Required Skills (comma separated)"
                                        className="input-field w-full" 
                                        value={newJob.requiredSkills}
                                        onChange={e => setNewJob({...newJob, requiredSkills: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <textarea 
                                        placeholder="Job Description"
                                        className="input-field w-full h-24 pt-3" 
                                        value={newJob.description}
                                        onChange={e => setNewJob({...newJob, description: e.target.value})}
                                    />
                                </div>
                                <button type="submit" className="btn-gradient py-3 sm:col-span-2">Create Job Posting</button>
                            </form>
                        )}

                        <div className="grid gap-4">
                            {jobs.map(job => (
                                <div key={job._id} className="section-card flex items-center justify-between group">
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">{job.title}</h3>
                                        <p className="text-sm text-slate-500">{job.company} • {job.location}</p>
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {job.requiredSkills.map(s => (
                                                <Badge key={s} variant="default">{s}</Badge>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 text-slate-400 hover:text-indigo-500 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteJob(job._id)}
                                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'courses' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Curated Skill Courses</h2>
                            <button className="btn-gradient flex items-center gap-2 py-2 px-4 text-sm">
                                <Plus className="w-4 h-4" /> Add Course
                            </button>
                        </div>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {courses.map(course => (
                                <div key={course._id} className="section-card">
                                    <Badge variant="primary" className="mb-2">{course.skill}</Badge>
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-1 line-clamp-1">{course.courseName}</h4>
                                    <p className="text-xs text-slate-500 mb-4">{course.platform}</p>
                                    <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                                        <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500 cursor-pointer transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Add these to index.css if not present
// .input-field {
//   @apply px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all;
// }
