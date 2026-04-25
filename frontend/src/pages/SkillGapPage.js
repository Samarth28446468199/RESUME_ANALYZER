import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import {
  Briefcase, Brain, CheckCircle, XCircle,
  MapPin, DollarSign, Clock, PlayCircle, ExternalLink,
  Star, Building2, Search, Zap, Target,
  BookOpen, TrendingUp, AlertCircle
} from 'lucide-react';
import { skillGapAPI, jobsAPI } from '../api';
import { Spinner } from '../components/ui/UI';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const getYouTubeId = (url) => {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
  return m ? m[1] : null;
};

const getYouTubeThumb = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

const getEmbedUrl = (url) => {
  const id = getYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
};

// ─── Sub-components ───────────────────────────────────────────────────────────
function MatchRing({ value, color, size = 160 }) {
  const r = (size / 2) - 12;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  const grad = color === 'indigo'
    ? ['#818cf8', '#6366f1'] : ['#34d399', '#10b981'];

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <defs>
        <linearGradient id={`ring-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={grad[0]} />
          <stop offset="100%" stopColor={grad[1]} />
        </linearGradient>
      </defs>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="10" className="text-slate-100 dark:text-slate-800" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={`url(#ring-${color})`} strokeWidth="10"
        strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1.4s ease' }} />
    </svg>
  );
}

function CourseCard({ course, skillLabel }) {
  const [playing, setPlaying] = useState(false);
  const thumb = getYouTubeThumb(course.link);
  const embed = getEmbedUrl(course.link);

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/60 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      {/* Thumbnail / Embed */}
      <div className="relative w-full h-44 bg-slate-200 dark:bg-slate-800 flex-shrink-0">
        {playing && embed ? (
          <iframe
            src={`${embed}?autoplay=1`}
            title={course.courseName}
            className="w-full h-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-500/10 to-purple-500/10 cursor-pointer"
            onClick={() => embed && setPlaying(true)}>
            {thumb ? (
              <img src={thumb} alt={course.courseName} className="absolute inset-0 w-full h-full object-cover opacity-60" />
            ) : null}
            <div className="relative z-10 flex flex-col items-center gap-2">
              {embed ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-white/90 dark:bg-slate-900/90 flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                    <PlayCircle className="w-8 h-8 text-red-500" />
                  </div>
                  <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Watch on Page</span>
                </>
              ) : (
                <BookOpen className="w-12 h-12 text-indigo-400 opacity-50" />
              )}
            </div>
          </div>
        )}
        {/* Skill tag */}
        <span className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow">
          {skillLabel}
        </span>
        {/* Free badge */}
        {course.isFree && (
          <span className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-500 text-white shadow">
            FREE
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col flex-grow">
        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-snug mb-2 line-clamp-2">
          {course.courseName}
        </h4>
        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {course.rating}</span>
          <span>{course.platform}</span>
          <span className="capitalize">{course.level || 'Beginner'}</span>
        </div>
        <a href={course.link} target="_blank" rel="noopener noreferrer"
          className="mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow shadow-indigo-500/30">
          Open Course <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  );
}

function JobCard({ job, selected, onSelect }) {
  const isSelected = selected?._id === job._id;
  return (
    <button onClick={() => onSelect(job)}
      className={`w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 ${isSelected
        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 shadow-lg shadow-indigo-500/20'
        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
      }`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-indigo-500' : 'bg-slate-100 dark:bg-slate-800'}`}>
          <Briefcase className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-900 dark:text-white text-sm truncate">{job.title}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <Building2 className="w-3 h-3" /> {job.company}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3 h-3" /> {job.location}
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-medium">
              {job.type}
            </span>
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {job.requiredSkills.slice(0, 4).map(s => (
          <span key={s} className="text-xs px-2 py-0.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-medium">
            {s}
          </span>
        ))}
        {job.requiredSkills.length > 4 && (
          <span className="text-xs px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
            +{job.requiredSkills.length - 4} more
          </span>
        )}
      </div>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function SkillGapPage() {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [result, setResult] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [activeSkillTab, setActiveSkillTab] = useState('missing');

  // Load actual job listings
  useEffect(() => {
    const loadJobs = async () => {
      setLoadingJobs(true);
      try {
        const { data } = await jobsAPI.recommend();
        setJobs(data.jobs);
        setFilteredJobs(data.jobs);
      } catch {
        // Fallback: load all jobs
        try {
          const { data } = await jobsAPI.getAll();
          setJobs(data.jobs);
          setFilteredJobs(data.jobs);
        } catch {
          toast.error('Could not load job listings. Please upload your resume first.');
        }
      } finally {
        setLoadingJobs(false);
      }
    };
    loadJobs();
  }, []);

  // Filter jobs by search
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredJobs(jobs); return; }
    const q = searchQuery.toLowerCase();
    setFilteredJobs(jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      j.requiredSkills.some(s => s.toLowerCase().includes(q))
    ));
  }, [searchQuery, jobs]);

  const handleAnalyze = async () => {
    if (!selectedJob) { toast.warning('Please select a job position first.'); return; }
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await skillGapAPI.analyzeByJob(selectedJob._id);
      setResult(data.data);
      setActiveSkillTab('missing');
      toast.success('Analysis complete! 🚀');
    } catch (err) {
      const msg = err.response?.data?.message || 'Analysis failed';
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const qualificationLabel = (pct) => {
    if (pct >= 80) return { text: 'Highly Qualified', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800' };
    if (pct >= 55) return { text: 'Partially Qualified', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800' };
    return { text: 'Skill Gap Detected', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800' };
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#0B0F19] font-sans transition-colors duration-300">
      <div className="max-w-7xl mx-auto">

        {/* ── Header ── */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Resume ↔ Job Analyzer
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-0.5">
                Pick a company & position — see exactly what skills you have, what's missing, and how to bridge the gap.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-8">

          {/* ── Left: Job Picker ── */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-5 flex flex-col">
              <h2 className="text-lg font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-500" /> Select Position
              </h2>

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search jobs, companies, skills..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                />
              </div>

              {/* Job list */}
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[520px] pr-1 custom-scrollbar">
                {loadingJobs ? (
                  <div className="flex justify-center py-12"><Spinner size="lg" /></div>
                ) : filteredJobs.length === 0 ? (
                  <div className="text-center py-10 text-slate-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No jobs found.<br />Upload your resume to see recommendations.</p>
                  </div>
                ) : (
                  filteredJobs.map(job => (
                    <JobCard key={job._id} job={job} selected={selectedJob} onSelect={setSelectedJob} />
                  ))
                )}
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !selectedJob}
                className="mt-5 w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
              >
                {analyzing ? <><Spinner size="sm" /> Analyzing...</> : <><Zap className="w-5 h-5" /> Analyze My Fit</>}
              </button>
            </div>
          </div>

          {/* ── Right: Results ── */}
          <div className="lg:col-span-3 flex flex-col gap-6">
            {!result ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-24 bg-white dark:bg-slate-900/40 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-5">
                  <Target className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-2xl font-black text-slate-700 dark:text-white mb-2">Select a Job to Analyze</h3>
                <p className="text-slate-400 dark:text-slate-500 max-w-xs text-sm font-medium">
                  Choose any position on the left to see a deep analysis of your resume against that role's requirements.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-6 animate-fade-in">

                {/* ── Job Header Card ── */}
                <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-500/30 relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                  <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                  <div className="relative z-10">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h2 className="text-2xl font-black tracking-tight">{result.job.title}</h2>
                        <div className="flex items-center gap-2 mt-1 text-indigo-200 text-sm font-medium">
                          <Building2 className="w-4 h-4" /> {result.job.company}
                        </div>
                      </div>
                      {(() => {
                        const q = qualificationLabel(result.matchPercentage);
                        return (
                          <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border bg-white/10 border-white/20 text-white whitespace-nowrap`}>
                            {q.text}
                          </span>
                        );
                      })()}
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-indigo-100">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {result.job.location}</span>
                      <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4" /> {result.job.salary}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {result.job.experienceRequired}+ yrs exp</span>
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4" /> {result.job.type}</span>
                    </div>
                    {result.job.description && (
                      <p className="mt-3 text-indigo-100 text-sm leading-relaxed opacity-80">{result.job.description}</p>
                    )}
                  </div>
                </div>

                {/* ── Score Rings ── */}
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Skill Match', value: result.matchPercentage, color: 'indigo', sub: `${result.matchedSkills.length} of ${result.requiredSkills.length} skills` },
                    { label: 'Hiring Probability', value: result.probability, color: 'emerald', sub: `${result.experienceYears} yr exp factor` },
                  ].map(({ label, value, color, sub }) => (
                    <div key={label} className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6 flex flex-col items-center">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{label}</p>
                      <div className="relative w-32 h-32 flex items-center justify-center">
                        <MatchRing value={value} color={color} size={130} />
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={`text-3xl font-black ${color === 'indigo' ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {value}%
                          </span>
                        </div>
                      </div>
                      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 font-medium text-center">{sub}</p>
                    </div>
                  ))}
                </div>

                {/* ── Skill Breakdown Tabs ── */}
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl overflow-hidden">
                  <div className="flex border-b border-slate-100 dark:border-white/5">
                    {[
                      { id: 'missing', label: `Skills Needed (${result.missingSkills.length})`, icon: XCircle, color: 'text-red-500' },
                      { id: 'matched', label: `Skills You Have (${result.matchedSkills.length})`, icon: CheckCircle, color: 'text-emerald-500' },
                      { id: 'required', label: `All Required (${result.requiredSkills.length})`, icon: Target, color: 'text-indigo-500' },
                    ].map(tab => (
                      <button key={tab.id} onClick={() => setActiveSkillTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-4 text-xs font-bold transition-all border-b-2 ${activeSkillTab === tab.id
                          ? `border-indigo-500 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-500/5`
                          : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                        <tab.icon className={`w-4 h-4 ${activeSkillTab === tab.id ? 'text-indigo-500' : tab.color}`} />
                        <span className="hidden sm:inline">{tab.label}</span>
                        <span className="sm:hidden">{tab.id === 'missing' ? `Missing (${result.missingSkills.length})` : tab.id === 'matched' ? `Have (${result.matchedSkills.length})` : `All (${result.requiredSkills.length})`}</span>
                      </button>
                    ))}
                  </div>
                  <div className="p-6">
                    {activeSkillTab === 'missing' && (
                      result.missingSkills.length === 0 ? (
                        <div className="text-center py-6">
                          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">You have ALL required skills! 🎉</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {result.missingSkills.map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-bold border border-red-200 dark:border-red-800">
                              {s}
                            </span>
                          ))}
                        </div>
                      )
                    )}
                    {activeSkillTab === 'matched' && (
                      result.matchedSkills.length === 0 ? (
                        <p className="text-slate-400 text-center py-6 italic">No matching skills detected yet.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {result.matchedSkills.map(s => (
                            <span key={s} className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 text-sm font-bold border border-emerald-200 dark:border-emerald-800">
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      )
                    )}
                    {activeSkillTab === 'required' && (
                      <div className="flex flex-wrap gap-2">
                        {result.requiredSkills.map(s => {
                          const has = result.matchedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase());
                          return (
                            <span key={s} className={`px-3 py-1.5 rounded-xl text-sm font-bold border ${has
                              ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                              : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800'}`}>
                              {has ? '✓' : '✗'} {s}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Course Recommendations ── */}
                {result.missingSkills.length > 0 && (
                  <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                        <TrendingUp className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">Bridge the Gap</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Courses to learn your missing skills</p>
                      </div>
                    </div>

                    {result.recommendedCourses && result.recommendedCourses.length > 0 ? (
                      <>
                        {/* Per-skill sections */}
                        {result.missingSkills.map(skill => {
                          const skillCourses = result.coursesPerSkill?.[skill] || [];
                          if (skillCourses.length === 0) return null;
                          return (
                            <div key={skill} className="mb-8">
                              <div className="flex items-center gap-2 mb-4">
                                <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                <h4 className="font-bold text-slate-700 dark:text-slate-200">{skill}</h4>
                                <span className="text-xs text-slate-400">{skillCourses.length} course{skillCourses.length !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="grid sm:grid-cols-2 gap-4">
                                {skillCourses.map(course => (
                                  <CourseCard key={course._id || course.link} course={course} skillLabel={skill} />
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Missing skills with no courses */}
                        {result.missingSkills.filter(s => !(result.coursesPerSkill?.[s]?.length > 0)).length > 0 && (
                          <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-2">Skills without specific courses yet:</p>
                            <div className="flex flex-wrap gap-2">
                              {result.missingSkills
                                .filter(s => !(result.coursesPerSkill?.[s]?.length > 0))
                                .map(s => (
                                  <a key={s} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s + ' tutorial')}`}
                                    target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-colors">
                                    {s} <ExternalLink className="w-3 h-3" />
                                  </a>
                                ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                        <p className="text-slate-500 font-medium mb-4">No specific courses in the database for these skills yet.</p>
                        <p className="text-sm text-slate-400 mb-4">Search YouTube for:</p>
                        <div className="flex flex-wrap justify-center gap-2">
                          {result.missingSkills.map(s => (
                            <a key={s} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(s + ' tutorial for beginners')}`}
                              target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 transition-colors border border-red-200 dark:border-red-800">
                              <PlayCircle className="w-4 h-4" /> {s} tutorial
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Your Skills Summary ── */}
                <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl p-6">
                  <h3 className="font-black text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-amber-500" /> Your Resume Skills
                    <span className="ml-auto text-xs font-bold px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                      {result.userSkills.length} detected
                    </span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.userSkills.map(s => {
                      const isMatched = result.matchedSkills.map(x => x.toLowerCase()).includes(s.toLowerCase());
                      return (
                        <span key={s} className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all hover:scale-105 ${isMatched
                          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          {s}
                        </span>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-sm bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 inline-block" />
                    Highlighted = matches this job's requirements
                  </p>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
