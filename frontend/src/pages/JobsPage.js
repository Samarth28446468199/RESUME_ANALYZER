import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Briefcase, MapPin, DollarSign, ExternalLink, Target, Search, Filter } from 'lucide-react';
import { jobsAPI } from '../api';
import { PageHeader, Spinner, Badge, ProgressBar, EmptyState } from '../components/ui/UI';

export default function JobsPage() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const { data } = await jobsAPI.recommend();
                setJobs(data.jobs);
            } catch (err) {
                toast.error('Failed to fetch job recommendations');
            } finally {
                setLoading(false);
            }
        };
        fetchJobs();
    }, []);

    const filteredJobs = jobs.filter(job => 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                <PageHeader
                    title="Job Recommendations"
                    subtitle="Discover roles that match your current skill set"
                    action={
                        <div className="relative hidden sm:block">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input 
                                type="text"
                                placeholder="Search jobs or companies..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none text-sm w-64"
                            />
                        </div>
                    }
                />

                {filteredJobs.length === 0 ? (
                    <div className="section-card py-20">
                        <EmptyState 
                            icon={Briefcase}
                            title={searchTerm ? 'No matching jobs found' : 'No recommendations yet'}
                            subtitle={searchTerm ? 'Try adjusting your search terms' : 'Upload a resume with more skills to get better results'}
                        />
                    </div>
                ) : (
                    <div className="grid lg:grid-cols-2 gap-6">
                        {filteredJobs.map((job) => (
                            <div key={job._id} className="section-card group hover:-translate-y-1 transition-all">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 font-bold text-xl">
                                            {job.company[0]}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-indigo-500 transition-colors">
                                                {job.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{job.company}</p>
                                        </div>
                                    </div>
                                    <Badge variant={job.matchPercentage >= 80 ? 'success' : job.matchPercentage >= 50 ? 'primary' : 'warning'}>
                                        {job.matchPercentage}% Match
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-y-3 mb-6">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <MapPin className="w-3.5 h-3.5" />
                                        {job.location || 'Remote'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        {job.salary || 'Competitive'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Briefcase className="w-3.5 h-3.5" />
                                        {job.type || 'Full-time'}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Target className="w-3.5 h-3.5" />
                                        {job.requiredSkills.length} Skills Required
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <div className="flex justify-between mb-1.5">
                                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Skill Compatibility</span>
                                        <span className="text-xs font-bold text-indigo-500">{job.matchPercentage}%</span>
                                    </div>
                                    <ProgressBar value={job.matchPercentage} color="indigo" showValue={false} />
                                </div>

                                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
                                    <div className="flex flex-wrap gap-1 max-w-[70%]">
                                        {job.requiredSkills.slice(0, 3).map(skill => (
                                            <span key={skill} className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                                {skill}
                                            </span>
                                        ))}
                                        {job.requiredSkills.length > 3 && (
                                            <span className="text-[10px] px-2 py-0.5 text-slate-400">+{job.requiredSkills.length - 3} more</span>
                                        )}
                                    </div>
                                    <button className="flex items-center gap-1.5 text-sm font-bold text-indigo-500 hover:text-indigo-400">
                                        Apply <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
