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
  CheckCircle, XCircle, Award, ArrowRight, Zap, Download, TrendingUp, Map
} from 'lucide-react';
import ThreeScene from '../components/ui/ThreeScene';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

  const handleDownloadPDF = async () => {
    const element = document.getElementById('dashboard-content');
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${user?.name || 'Resume'}_Analysis.pdf`);
  };

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
      <div id="dashboard-content" className="max-w-7xl mx-auto">
        <div className="mb-12 text-center max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
            CareerAI Dashboard
          </h1>
          <h2 className="text-xl md:text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
            Welcome, {user?.name}
          </h2>
          <p className="text-base md:text-lg text-slate-500 dark:text-slate-400 mt-6 font-medium leading-relaxed">
            Access your personalized career intelligence hub. Discover hidden skill gaps, analyze your professional trajectory, and prepare for your next big opportunity.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {!resume ? (
              <Link to="/upload" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                <Upload className="w-5 h-5" /> Analyze New Resume
              </Link>
            ) : (
              <>
                <button onClick={handleDownloadPDF} className="flex-shrink-0 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-500 flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-sm hover:scale-105 transition-all">
                  <Download className="w-5 h-5" /> Export Report
                </button>
                <Link to="/learning-path" className="flex-shrink-0 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-10 py-4 text-base font-bold rounded-2xl shadow-xl shadow-indigo-500/20 hover:scale-105 transition-all">
                  <Map className="w-5 h-5" /> View Career Map
                </Link>
              </>
            )}
          </div>
        </div>

        {!resume ? (
          <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-3xl p-16 text-center shadow-lg animate-fade-in backdrop-blur-xl">
            <EmptyState
              icon={Upload}
              title="Awaiting Your Resume"
              subtitle="Upload your latest resume to let our AI architect map out a customized pathway to your dream role."
              action={
                <Link to="/upload" className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-3 px-8 py-3.5 mx-auto mt-6 text-sm font-semibold rounded-xl shadow-md transition-all w-fit">
                  <Upload className="w-4 h-4" /> Upload Document
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-10">
            {/* Top Stat Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-up perspective-container">
              {[
                { title: "Resume Score", value: `${resume.resumeScore}/100`, sub: "Overall completeness", icon: Award, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800" },
                { title: "Skills Detected", value: resume.skills.length, sub: "Extracted from PDF", icon: Zap, color: "text-slate-700 dark:text-slate-300", bg: "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700" },
                { title: "Experience Frame", value: `${resume.experienceYears} Yrs`, sub: "Calculated tenure", icon: Briefcase, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800" },
                { title: "Correlation", value: skillGap ? `${skillGap.matchPercentage}%` : 'N/A', sub: skillGap ? skillGap.jobRole : 'No role analyzed', icon: Target, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" },
              ].map((stat, i) => (
                <div key={i} className="bg-white dark:bg-slate-900/40 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden backdrop-blur-xl">
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

            <div className="grid lg:grid-cols-3 gap-8 perspective-container">
              {skillGap && (
                <div className="lg:col-span-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6 perspective-container">
                  {/* Glassmorphic Chart Connectors */}
                  {[{ data: donutData, perc: skillGap.matchPercentage, label: 'Skill Match', sub: skillGap.jobRole, color: 'text-indigo-600 dark:text-indigo-400', numColor: 'text-indigo-600 dark:text-indigo-400' },
                    { data: probData, perc: skillGap.probability, label: 'Success Probability', sub: 'Calculated odds', color: 'text-emerald-600 dark:text-emerald-400', numColor: 'text-emerald-600 dark:text-emerald-400' }
                  ].map((chart, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900/40 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl flex flex-col items-center justify-center">
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
                <div className="bg-white dark:bg-slate-900/40 p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm backdrop-blur-xl h-full flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Active Skill Profile</h2>
                      <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">Detected skills mapped against industry standards</p>
                    </div>
                    <Badge variant="primary" className="text-sm px-3 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">{resume.skills.length} Total</Badge>
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
               <div className="grid md:grid-cols-2 gap-8 mt-8">
                 <div className="bg-white dark:bg-slate-900/40 border border-emerald-200 dark:border-emerald-900/30 p-8 rounded-3xl shadow-sm backdrop-blur-xl">
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

                 <div className="bg-white dark:bg-slate-900/40 border border-red-200 dark:border-red-900/30 p-8 rounded-3xl shadow-sm backdrop-blur-xl flex flex-col justify-between">
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
                     <Link to={`/courses?skills=${skillGap.missingSkills.join(',')}`} className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all mt-auto shadow-sm tilt-card">
                       Access Recommended Curriculum <ArrowRight className="w-5 h-5" />
                     </Link>
                   )}
                 </div>
               </div>
            )}

            {/* Quick Actions 3D Section */}
            <div className="mt-12">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 tracking-tight">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Link to="/interview-prep" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Mock Interview</span>
                    <span className="text-slate-500 text-xs mt-1">Start a practice session</span>
                  </div>
                  <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center">
                    <Zap className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </Link>
                <Link to="/jobs" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Job Matches</span>
                    <span className="text-slate-500 text-xs mt-1">View tailored roles</span>
                  </div>
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </Link>
                <Link to="/salary-insights" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Salary Insights</span>
                    <span className="text-slate-500 text-xs mt-1">Market compensation</span>
                  </div>
                  <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </Link>
                <Link to="/cover-letter" className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-900 dark:text-white">Cover Letter</span>
                    <span className="text-slate-500 text-xs mt-1">Generate with AI</span>
                  </div>
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                    <Award className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </Link>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
