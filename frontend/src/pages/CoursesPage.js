import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { BookOpen, ExternalLink, Star, Clock, Search, PlayCircle } from 'lucide-react';
import { coursesAPI } from '../api';
import { PageHeader, Spinner, Badge, EmptyState } from '../components/ui/UI';

const getYouTubeEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
};

export default function CoursesPage() {
    const location = useLocation();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [playingVideoId, setPlayingVideoId] = useState(null);
    
    // Check if we came from skill gap analysis with specific skills in query
    const searchParams = new URLSearchParams(location.search);
    const missingSkills = searchParams.get('skills')?.split(',') || [];

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        const fetchCourses = async () => {
            setLoading(true);
            try {
                const { data } = await coursesAPI.recommend(missingSkills);
                setCourses(data.courses);
            } catch (err) {
                toast.error('Failed to fetch course recommendations');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [location.search]); // missingSkills is derived from location.search

    const filteredCourses = courses.filter(course => 
        course.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.skill.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19]">
                <div className="flex flex-col items-center gap-4">
                    <Spinner size="xl" />
                    <p className="text-slate-500 font-medium animate-pulse">Curating your personalized curriculum...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-16 bg-slate-50 dark:bg-[#0B0F19] transition-colors duration-300 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Skill Upgrading Matrix"
                    subtitle="Premium curated courses to help you bridge your skill gaps"
                    action={
                        <div className="relative hidden sm:block w-72">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <input 
                                type="text"
                                placeholder="Search skills, topics..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all shadow-sm"
                            />
                        </div>
                    }
                />

                {missingSkills.length > 0 && (
                    <div className="mb-10 flex flex-wrap items-center gap-3 animate-fade-in bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <span className="text-sm font-bold text-red-600 dark:text-red-400">Targeting Missing Skills:</span>
                        {missingSkills.map(s => (
                            <div key={s} className="px-3 py-1 rounded-lg bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 text-xs font-bold shadow-sm">
                                {s}
                            </div>
                        ))}
                    </div>
                )}

                {filteredCourses.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-16 shadow-xl border border-slate-100 dark:border-slate-800">
                        <EmptyState 
                            icon={Search}
                            title="No courses found"
                            subtitle={searchTerm ? "Our search couldn't find matching topics. Try a broader term." : "We're curating state-of-the-art courses for your unique profile. Check back shortly."}
                        />
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredCourses.map((course, idx) => {
                            const embedUrl = getYouTubeEmbedUrl(course.link);
                            const isPlaying = playingVideoId === course._id;
                            
                            return (
                                <div key={course._id} className="group relative rounded-[2rem] bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 hover:-translate-y-2 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 flex flex-col h-full overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                    
                                    {/* Thumbnail / Video Section */}
                                    <div className="relative w-full h-48 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                                        {isPlaying && embedUrl ? (
                                            <iframe
                                                src={`${embedUrl}?autoplay=1`}
                                                title={course.courseName}
                                                className="w-full h-full border-0 rounded-t-[2rem]"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex flex-col items-center justify-center p-6 text-center">
                                                {embedUrl ? (
                                                    <>
                                                        <PlayCircle className="w-12 h-12 text-red-500 mb-3 drop-shadow-lg" />
                                                        <button 
                                                            onClick={() => setPlayingVideoId(course._id)}
                                                            className="px-6 py-2 rounded-full bg-white/90 dark:bg-slate-900/90 hover:scale-105 transition-transform shadow-md text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2"
                                                        >
                                                            <PlayCircle className="w-4 h-4 text-indigo-500" /> Watch Lesson
                                                        </button>
                                                    </>
                                                ) : (
                                                    <BookOpen className="w-16 h-16 text-indigo-300 opacity-50" />
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="p-8 flex flex-col flex-grow">
                                        <div className="mb-4">
                                            <div className="flex gap-2 flex-wrap mb-3">
                                                <Badge variant="primary" className="text-xs uppercase tracking-wider">{course.skill}</Badge>
                                                {embedUrl && <Badge variant="danger" className="text-xs uppercase tracking-wider bg-red-100 text-red-700">Video format</Badge>}
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors line-clamp-2">
                                                {course.courseName}
                                            </h3>
                                        </div>

                                        <div className="space-y-4 mb-8 flex-grow">
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <span className="text-slate-500 font-medium">Platform</span>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">{course.platform}</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                    <span className="text-slate-500 font-medium">Rating</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">4.9 / 5.0</span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                                                <div className="flex items-center gap-1.5">
                                                    <Clock className="w-4 h-4 text-emerald-500" />
                                                    <span className="text-slate-500 font-medium">Duration</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-slate-200">Self-paced</span>
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <a 
                                                href={course.link} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="w-full py-4 rounded-xl text-base font-bold flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 transition-all focus:ring-4 focus:ring-indigo-500/30"
                                            >
                                                Go to Course <ExternalLink className="w-5 h-5" />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
