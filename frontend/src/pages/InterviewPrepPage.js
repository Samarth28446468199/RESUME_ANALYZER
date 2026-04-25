import React, { useState, useEffect } from 'react';
import { Video, Mic, CheckCircle, Play, Pause, AlertCircle, Camera, BrainCircuit, Activity } from 'lucide-react';
import { PageHeader, Badge } from '../components/ui/UI';
import { aiAPI } from '../api';

const QUESTIONS = [
    {
        id: 1,
        question: "Tell me about a time you had to learn a new technology quickly.",
        skill: "Adaptability",
        tips: ["Use the STAR method (Situation, Task, Action, Result).", "Focus on what YOU did specifically.", "Mention the outcome and what you learned."]
    },
    {
        id: 2,
        question: "Explain a complex technical concept to a non-technical person.",
        skill: "Communication",
        tips: ["Avoid jargon entirely.", "Use an everyday analogy.", "Check for understanding."]
    },
    {
        id: 3,
        question: "Describe your experience working in an Agile/Scrum environment.",
        skill: "Methodologies",
        tips: ["Mention sprint planning, daily standups, and retrospectives.", "Talk about how you collaborated with the team to overcome blockers."]
    }
];

export default function InterviewPrepPage() {
    const [currentQ, setCurrentQ] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [feedback, setFeedback] = useState(null);
    const [timer, setTimer] = useState(0);

    useEffect(() => {
        let interval;
        if (isRecording) {
            interval = setInterval(() => setTimer(t => t + 1), 1000);
        } else {
            setTimer(0);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleRecordToggle = async () => {
        if (isRecording) {
            setIsRecording(false);
            try {
                const response = await aiAPI.analyzeInterviewAnswer({
                    questionId: QUESTIONS[currentQ].id,
                    timeSpent: timer
                });
                if (response.data.success) {
                    setFeedback({
                        score: response.data.data.score,
                        comments: response.data.data.comments
                    });
                }
            } catch (error) {
                console.error('Error analyzing answer:', error);
                setFeedback({
                    score: 0,
                    comments: "An error occurred while analyzing your answer. Please try again."
                });
            }
        } else {
            setIsRecording(true);
            setFeedback(null);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 bg-slate-50 dark:bg-[#090C15] font-sans">
            <div className="max-w-7xl mx-auto">
                <PageHeader
                    title="Mock Interview Simulator"
                    subtitle="Practice with our AI interviewer and receive deep analytical feedback on your performance."
                    action={<Badge variant="primary" className="shadow-lg shadow-indigo-500/20 px-4 py-1.5 font-bold">Neural AI Beta</Badge>}
                />

                <div className="grid lg:grid-cols-4 gap-8">
                    {/* Sidebar / Question List */}
                    <div className="order-2 lg:order-1 lg:col-span-1 space-y-4">
                        <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-6 uppercase tracking-wider text-sm flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-indigo-500" />
                            Question Bank
                        </h3>
                        {QUESTIONS.map((q, idx) => (
                            <div 
                                key={q.id} 
                                onClick={() => { setCurrentQ(idx); setFeedback(null); setIsRecording(false); }}
                                className={`p-5 rounded-2xl border cursor-pointer transition-all duration-300 ${currentQ === idx ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 shadow-lg shadow-indigo-500/10 scale-[1.02]' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'}`}
                            >
                                <div className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    {q.skill}
                                </div>
                                <div className={`text-sm font-semibold line-clamp-3 ${currentQ === idx ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-700 dark:text-slate-300'}`}>
                                    {q.question}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Area */}
                    <div className="order-1 lg:order-2 lg:col-span-3 space-y-6 animate-fade-in">
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-xl backdrop-blur-xl relative overflow-hidden">
                            {/* Question Header */}
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 mb-10">
                                <div>
                                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white leading-tight mb-4">
                                        "{QUESTIONS[currentQ].question}"
                                    </h2>
                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        <AlertCircle className="w-4 h-4 text-amber-500" /> Tips inside
                                    </div>
                                </div>
                            </div>

                            {/* Tips Grid */}
                            <div className="grid sm:grid-cols-3 gap-4 mb-10">
                                {QUESTIONS[currentQ].tips.map((tip, i) => (
                                    <div key={i} className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-4 flex gap-3">
                                        <div className="w-8 h-8 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-600 dark:text-amber-400 font-bold text-sm">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm font-medium text-amber-900 dark:text-amber-200">{tip}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Camera / Recording Area */}
                            <div className="relative w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-800 dark:border-slate-800/80 group">
                                {/* Simulated Camera View / Placeholder */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <Camera className={`w-20 h-20 ${isRecording ? 'text-indigo-500/20' : 'text-slate-700/50'} transition-colors duration-700 ease-in-out`} />
                                    {!isRecording && <p className="text-slate-500 mt-4 font-medium uppercase tracking-widest text-sm">Camera Offline</p>}
                                </div>

                                {/* Recording Overlay Element & Frame */}
                                {isRecording && (
                                    <>
                                        <div className="absolute inset-0 border-[6px] border-red-500/50 rounded-3xl animate-pulse pointer-events-none"></div>
                                        <div className="absolute top-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
                                            <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
                                            <div className="w-3 h-3 rounded-full bg-red-500 absolute"></div>
                                            <span className="text-white font-mono font-bold tracking-wider">{formatTime(timer)}</span>
                                        </div>
                                        <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                                            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-2">
                                                <Activity className="w-5 h-5 text-indigo-400" />
                                                <span className="text-indigo-400 font-medium text-sm">AI Analyzing Audio...</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Main Action Button floating inside the frame */}
                                {!isRecording && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                         <p className="text-white font-bold text-lg">Ready to start?</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 flex justify-center">
                                <button 
                                    onClick={handleRecordToggle}
                                    className={`px-10 py-5 rounded-2xl font-black text-white text-lg flex items-center gap-3 transition-all hover:scale-105 ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-xl shadow-red-500/30 ring-4 ring-red-500/30' : 'bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl shadow-indigo-500/30 ring-4 ring-indigo-500/20'}`}
                                >
                                    {isRecording ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                                    {isRecording ? 'Stop Recording & Analyze' : 'Start Answering'}
                                </button>
                            </div>

                            {/* Feedback Result */}
                            {feedback && (
                                <div className="mt-10 p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 animate-slide-up shadow-xl shadow-emerald-500/5">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center shadow-inner">
                                                <CheckCircle className="w-8 h-8 text-emerald-500" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-xl text-slate-900 dark:text-white">Analysis Complete</h3>
                                                <p className="font-medium text-emerald-600 dark:text-emerald-400 mt-1">AI Evaluator Feedback</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="block text-4xl font-black text-emerald-500 tracking-tighter">{feedback.score}</span>
                                            <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">Out of 100</span>
                                        </div>
                                    </div>
                                    <div className="bg-white/50 dark:bg-slate-900/50 rounded-2xl p-6 border border-emerald-500/10">
                                        <p className="text-slate-800 dark:text-slate-200 text-lg leading-relaxed font-medium">
                                            "{feedback.comments}"
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
