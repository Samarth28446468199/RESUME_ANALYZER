import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend, RadialLinearScale,
  PointElement, LineElement, Filler,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { resumeAPI, skillGapAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { Spinner, Badge, EmptyState } from '../components/ui/UI';
import {
  Upload, Target, Briefcase,
  CheckCircle, XCircle, Award, ArrowRight, Zap
} from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend, RadialLinearScale, PointElement, LineElement, Filler);

const chartOptions = {
  plugins: { legend: { display: false } },
  cutout: '75%',
  animation: { animateRotate: true, duration: 1800, easing: 'easeOutQuart' },
  responsive: true,
  maintainAspectRatio: false,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: rd } = await resumeAPI.analyze();
        setResume(rd.resume);

        if (rd.resume.lastAnalyzedRole) {
          const { data: sg } = await skillGapAPI.analyze(rd.resume.lastAnalyzedRole);
          setSkillGap(sg.data);
        }
      } catch (_) {
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#090C15]">
        <Spinner size="xl" />
      </div>
    );
  }

  const donutData = skillGap ? {
    datasets: [{
      data: [skillGap.matchPercentage, 100 - skillGap.matchPercentage],
      backgroundColor: ['#6366f1', 'rgba(99,102,241,0.1)'],
      borderWidth: 0,
    }],
  } : null;

  const probData = skillGap ? {
    datasets: [{
      data: [skillGap.probability, 100 - skillGap.probability],
      backgroundColor: ['#10b981', 'rgba(16,185,129,0.1)'],
      borderWidth: 0,
    }],
  } : null;

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#090C15] font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              Welcome back,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-emerald-400">
                {user?.name?.split(' ')[0]}
              </span> 👋
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400 mt-3 font-medium">Your personalized career intelligence hub.</p>
          </div>
          {!resume && (
            <Link to="/upload" className="flex-shrink-0 btn-gradient flex items-center gap-3 px-8 py-4 text-base font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
              <Upload className="w-5 h-5" /> Analyze New Resume
            </Link>
          )}
        </div>

        {!resume ? (
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-[2.5rem] p-16 text-center shadow-2xl animate-fade-in backdrop-blur-xl">
            <EmptyState
              icon={Upload}
              title="Awaiting Input"
              subtitle="Upload your latest resume to activate the neural-engine and map out your ultimate career trajectory."
              action={
                <Link to="/upload" className="btn-gradient flex items-center gap-3 px-8 py-4 mx-auto mt-6 text-base font-bold rounded-2xl shadow-xl hover:scale-105 transition-all w-fit">
                  <Upload className="w-5 h-5" /> Upload Document
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up">
              {[
                { title: "Resume Score", value: `${resume.resumeScore}/100`, sub: "Overall completeness", icon: Award, color: "text-indigo-500", bg: "bg-indigo-500/10" },
                { title: "Skills Detected", value: resume.skills.length, sub: "Extracted from PDF", icon: Zap, color: "text-amber-500", bg: "bg-amber-500/10" },
                { title: "Experience Frame", value: `${resume.experienceYears} Yrs`, sub: "Calculated tenure", icon: Briefcase, color: "text-blue-500", bg: "bg-blue-500/10" },
                { title: "Correlation", value: skillGap ? `${skillGap.matchPercentage}%` : 'N/A', sub: skillGap ? skillGap.jobRole : 'No role analyzed', icon: Target, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/50 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-1 transition-transform group relative overflow-hidden backdrop-blur-xl">
                  <div className="absolute top-0 right-0 p-6 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500">
                    <stat.icon className={`w-16 h-16 ${stat.color}`} />
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-6 relative z-10`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest relative z-10">{stat.title}</h3>
                  <div className="text-4xl font-black text-slate-800 dark:text-white my-2 tracking-tight relative z-10">{stat.value}</div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 font-medium relative z-10">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {skillGap && (
                <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {/* Glassmorphic Chart Connectors */}
                  {[{ data: donutData, perc: skillGap.matchPercentage, label: 'Skill Match Engine', sub: skillGap.jobRole, color: 'text-indigo-500', numColor: 'text-indigo-500' },
                    { data: probData, perc: skillGap.probability, label: 'Success Predictor', sub: 'Calculated odds', color: 'text-emerald-500', numColor: 'text-emerald-500' }
                  ].map((chart, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl animate-slide-up hover:shadow-2xl transition-shadow backdrop-blur-xl flex flex-col items-center justify-center">
                      <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">{chart.label}</h3>
                      <div className="relative w-48 h-48 mb-4">
                        <Doughnut data={chart.data} options={chartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className={`text-5xl font-black tracking-tighter ${chart.numColor}`}>{chart.perc}%</span>
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">{chart.sub}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className={`space-y-6 ${skillGap ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
                {/* Advanced Skills Cloud */}
                <div className="bg-white dark:bg-slate-900/50 p-8 sm:p-10 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-xl backdrop-blur-xl h-full flex flex-col animate-slide-up">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Ontology Cloud</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Foundational skills actively tracked</p>
                    </div>
                    <Badge variant="primary" className="text-base px-4 py-2 font-bold shadow-lg shadow-indigo-500/20">{resume.skills.length} Detected</Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 overflow-y-auto pr-2 custom-scrollbar flex-grow content-start">
                    {resume.skills.map((skill) => {
                      const matched = skillGap?.matchedSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                      const missing = skillGap?.missingSkills?.map(s => s.toLowerCase()).includes(skill.toLowerCase());
                      let classes = "px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-transform hover:scale-105 border ";
                      if (matched) classes += "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
                      else if (missing) classes += "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
                      else classes += "bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";

                      return <span key={skill} className={classes}>{skill}</span>;
                    })}
                  </div>

                  {!skillGap && (
                    <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                      <Link to="/skill-gap" className="btn-gradient px-8 py-4 rounded-2xl text-base font-bold shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all flex items-center gap-2">
                        Analyze Job Role Gap <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {skillGap && (
               <div className="grid md:grid-cols-2 gap-8 animate-slide-up">
                 <div className="bg-gradient-to-br from-emerald-500/5 to-teal-500/5 border border-emerald-500/20 p-8 rounded-[2.5rem] shadow-xl dark:shadow-none backdrop-blur-xl">
                   <div className="flex items-center justify-between mb-8">
                     <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center">
                         <CheckCircle className="w-6 h-6 text-emerald-500" />
                       </div>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white">Correlated</h2>
                     </div>
                     <Badge variant="success" className="text-lg px-4 py-1.5">{skillGap.matchedSkills.length}</Badge>
                   </div>
                   <div className="flex flex-wrap gap-3">
                     {skillGap.matchedSkills.map(s => (
                       <span key={s} className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-sm font-bold border border-emerald-200 dark:border-emerald-800">{s}</span>
                     ))}
                   </div>
                 </div>

                 <div className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border border-red-500/20 p-8 rounded-[2.5rem] shadow-xl dark:shadow-none backdrop-blur-xl flex flex-col justify-between">
                   <div>
                     <div className="flex items-center justify-between mb-8">
                       <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-red-500/20 rounded-2xl flex items-center justify-center">
                           <XCircle className="w-6 h-6 text-red-500" />
                         </div>
                         <h2 className="text-2xl font-black text-slate-900 dark:text-white">Deficient</h2>
                       </div>
                       <Badge variant="danger" className="text-lg px-4 py-1.5">{skillGap.missingSkills.length}</Badge>
                     </div>
                     <div className="flex flex-wrap gap-3 mb-8">
                       {skillGap.missingSkills.map(s => (
                         <span key={s} className="px-4 py-2 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-sm font-bold border border-red-200 dark:border-red-800">{s}</span>
                       ))}
                     </div>
                   </div>
                   {skillGap.missingSkills.length > 0 && (
                     <Link to={`/courses?skills=${skillGap.missingSkills.join(',')}`} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-auto shadow-sm">
                       Access Recommended Curriculum <ArrowRight className="w-5 h-5" />
                     </Link>
                   )}
                 </div>
               </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
