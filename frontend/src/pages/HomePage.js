import React from 'react';
import { Link } from 'react-router-dom';
import { Zap, ArrowRight, Brain, Target, TrendingUp, BookOpen, Shield, Code, Briefcase, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const FEATURES = [
    { icon: Brain, title: 'AI Resume Parser', desc: 'Instantly extract deep skills, education, and hidden potential from your uploaded documents.', color: 'from-violet-500/20 to-indigo-500/20', iconColor: 'text-violet-500' },
    { icon: Target, title: 'Precise Skill Gap', desc: 'Correlate your actual skills against leading industry job requirements in real-time.', color: 'from-indigo-500/20 to-blue-500/20', iconColor: 'text-indigo-500' },
    { icon: TrendingUp, title: 'Selection Probability', desc: 'Leverage predictive AI to calculate your precise odds of landing the target job.', color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500' },
    { icon: BookOpen, title: 'Tailored Courses', desc: 'Direct integrations with Coursera, Udemy & YouTube to recommend exactly what you need.', color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-500' },
];

const STATS = [
    { label: 'Job Listings AI Mapped', value: '500,000+' },
    { label: 'Total Course Modules', value: '2,500+' },
    { label: 'Skills Ontology Tracked', value: '15,000+' },
    { label: 'Users Landed Jobs', value: '10K+' },
];

export default function HomePage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-white dark:bg-[#090C15] font-sans selection:bg-indigo-500/30">
            {/* Elegant Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

            {/* Hero Section */}
            <section className="relative pt-32 pb-24 px-4 overflow-hidden">
                {/* Hero Orbs */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 pointer-events-none opacity-60 dark:opacity-40 animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-0 w-[500px] h-[400px] bg-emerald-600/20 rounded-full blur-[100px] pointer-events-none opacity-50 dark:opacity-30"></div>

                <div className="relative z-10 max-w-5xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 bg-slate-900/5 border border-slate-200/50 dark:bg-white/5 dark:border-white/10 rounded-full px-5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-8 backdrop-blur-md shadow-sm animate-fade-in group hover:bg-slate-900/10 dark:hover:bg-white/10 transition">
                        <Zap className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                        Next-Gen AI Career Ecosystem
                    </div>

                    <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[1.05] text-slate-900 dark:text-white mb-8 animate-slide-up" style={{ animationDelay: '100ms' }}>
                        Architect Your <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400">
                            Future Career.
                        </span>
                    </h1>

                    <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed font-medium animate-slide-up" style={{ animationDelay: '200ms' }}>
                        Drop your resume into our neural-engine. Instantly unpack skill gaps, calculate probabilities, and get an automated roadmap of top-tier courses to secure your dream role.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-slide-up" style={{ animationDelay: '300ms' }}>
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="px-10 py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 shadow-2xl hover:shadow-indigo-500/25 transition-all text-lg font-bold flex items-center gap-3">
                                Enter Workspace <ArrowRight className="w-5 h-5" />
                            </Link>
                        ) : (
                            <>
                                <Link to="/register" className="px-10 py-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 shadow-2xl hover:shadow-indigo-500/25 transition-all text-lg font-bold flex items-center gap-3">
                                    Start Optimizing <ArrowRight className="w-5 h-5" />
                                </Link>
                                <Link to="/login" className="px-10 py-5 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-lg font-bold shadow-sm backdrop-blur-md">
                                    Member Login
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Premium Stats Grid */}
            <section className="py-16 px-4 relative z-10 border-y border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-3xl">
                <div className="max-w-6xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-x divide-transparent lg:divide-slate-200 dark:lg:divide-white/10">
                    {STATS.map(({ label, value }, i) => (
                        <div key={label} className={`text-center px-4 animate-slide-up`} style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="text-4xl lg:text-5xl font-black text-slate-800 dark:text-white mb-2 tracking-tight">{value}</div>
                            <div className="text-sm uppercase tracking-widest font-bold text-slate-400 dark:text-slate-500">{label}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Core Features */}
            <section className="py-24 px-4 relative z-10">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
                            Intelligence designed for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">radical growth.</span>
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xl max-w-2xl mx-auto leading-relaxed">
                            A complete suite bridging the void between what employers want and what you currently know.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {FEATURES.map(({ icon: Icon, title, desc, color, iconColor }, i) => (
                            <div key={title} className="group p-8 rounded-[2rem] bg-white dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center mb-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className={`w-8 h-8 ${iconColor}`} />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight">{title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Classic CTA section */}
            {!isAuthenticated && (
                <section className="py-24 px-4 relative z-10">
                    <div className="max-w-5xl mx-auto relative rounded-[3rem] overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900"></div>
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                        
                        <div className="relative p-12 lg:p-20 text-center flex flex-col items-center">
                            <Shield className="w-16 h-16 text-emerald-400 mb-6 drop-shadow-2xl" />
                            <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tight mb-6">
                                Stop Guessing. Start Landing.
                            </h2>
                            <p className="text-indigo-100 text-lg lg:text-xl max-w-2xl text-center mb-10 leading-relaxed font-medium">
                                Join the elite network of developers taking the shortcut to their highest-paying roles. Your personal AI career coach is waiting.
                            </p>
                            <Link to="/register" className="px-10 py-5 rounded-2xl bg-white text-indigo-900 hover:bg-slate-50 hover:scale-105 shadow-xl transition-all text-lg font-bold flex items-center gap-3">
                                Claim Your Free Workspace <ArrowRight className="w-5 h-5 text-indigo-500" />
                            </Link>
                        </div>
                    </div>
                </section>
            )}

            <footer className="py-10 text-center font-medium text-sm text-slate-400 dark:text-slate-500 relative z-10 bg-white/50 dark:bg-transparent backdrop-blur-lg">
                © {new Date().getFullYear()} SkillGap AI. Engineering careers with ❤️
            </footer>
        </div>
    );
}
