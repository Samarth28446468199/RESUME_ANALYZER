import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Sparkles, ChevronRight, ChevronLeft, Mic, MicOff, Video, VideoOff, PlayCircle, StopCircle, RefreshCcw, BrainCircuit, TrendingUp, Lightbulb, User, Volume2 } from 'lucide-react';
import { Badge } from '../components/ui/UI';
import { aiAPI } from '../api';
import { toast } from 'react-toastify';

const QUESTIONS = [
  // Behavioral & General
  { id: 1, question: "Tell me about yourself and your technical background.", skill: "Introduction", category: "General" },
  { id: 2, question: "Describe a time you had to learn a new technology quickly. What was your approach?", skill: "Adaptability", category: "Behavioral" },
  { id: 3, question: "How do you handle disagreements with teammates on technical decisions?", skill: "Teamwork", category: "Behavioral" },
  { id: 4, question: "Describe a challenging bug you encountered and how you resolved it.", skill: "Problem Solving", category: "Technical" },
  { id: 5, question: "Where do you see yourself in 3 years, and how does this role fit your goals?", skill: "Career Goals", category: "General" },
  { id: 6, question: "Tell me about a time you failed to meet a deadline. What happened and what did you learn?", skill: "Accountability", category: "Behavioral" },
  
  // Technical - Architecture & Web
  { id: 7, question: "Explain how the internet works to a non-technical person.", skill: "Communication", category: "Technical" },
  { id: 8, question: "What is the difference between REST and GraphQL? When would you use each?", skill: "API Knowledge", category: "Technical" },
  { id: 9, question: "How would you optimize the performance of a slow-loading web application?", skill: "Performance", category: "Technical" },
  { id: 10, question: "Explain the concept of Microservices vs Monolithic architecture.", skill: "System Design", category: "Technical" },
  
  // Technical - Algorithms & DB
  { id: 11, question: "What is the difference between SQL and NoSQL databases? When should I choose NoSQL?", skill: "Databases", category: "Technical" },
  { id: 12, question: "Explain the time and space complexity of a Hash Map (Dictionary).", skill: "Data Structures", category: "Technical" },
  { id: 13, question: "How do you ensure your code is secure against common vulnerabilities like XSS or SQL Injection?", skill: "Security", category: "Technical" },
  
  // Scenarios
  { id: 14, question: "You are assigned a task using a framework you've never seen before. Walk me through your first 48 hours.", skill: "Initiative", category: "Behavioral" },
  { id: 15, question: "Production is down and you are the only engineer online. What are your immediate steps?", skill: "Crisis Management", category: "Technical" }
];

const CATEGORY_COLORS = {
  General: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  Behavioral: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  Technical: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

export default function InterviewPrepPage() {
  const [currentQ, setCurrentQ] = useState(0);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [sessionScores, setSessionScores] = useState([]);
  const [phase, setPhase] = useState('idle');
  const [permError, setPermError] = useState(null); // 'camera' | 'mic' | null // idle | interview | feedback

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Init speech recognition
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SR) {
      const rec = new SR();
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let full = '';
        for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
        setAnswer(full);
      };
      rec.onerror = (e) => {
        if (e.error === 'not-allowed') {
          setPermError('mic');
          toast.error('Microphone access denied. See the fix guide on screen.');
        }
        setIsListening(false);
      };
      recognitionRef.current = rec;
    }
    return () => { stopCamera(); window.speechSynthesis?.cancel(); recognitionRef.current?.stop(); };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setIsCameraOn(true);
      setPermError(null);
      toast.success('Camera connected!');
    } catch (err) {
      const msg = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError'
        ? 'camera' : null;
      setPermError(msg);
      toast.error('Camera access denied. See the fix guide on screen.');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('Speech recognition not supported. Please use Google Chrome or Microsoft Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setAnswer('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        setPermError(null);
      } catch(e) {
        console.error(e);
        toast.error('Could not start mic. Please check permissions.');
      }
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(v => v.lang.startsWith('en'));
    if (v) utt.voice = v;
    utt.rate = 0.92;
    utt.onstart = () => setIsAiSpeaking(true);
    utt.onend = () => setIsAiSpeaking(false);
    window.speechSynthesis.speak(utt);
  };

  const startInterview = async () => {
    await startCamera();
    setPhase('interview');
    setCurrentQ(0);
    setSessionScores([]);
    setFeedback(null);
    setAnswer('');
    setTimeout(() => speakText(QUESTIONS[0].question), 800);
  };

  const handleAnalyze = async () => {
    if (!answer.trim() || answer.trim().length < 15) return toast.error('Please provide a longer answer first.');
    if (isListening) toggleListening();
    setLoading(true); setFeedback(null);
    try {
      const res = await aiAPI.analyzeInterviewAnswer({ question: QUESTIONS[currentQ].question, answer: answer.trim(), jobRole: QUESTIONS[currentQ].skill });
      if (res.data.success) {
        const fb = res.data.data;
        setFeedback(fb);
        setSessionScores(prev => [...prev, { q: currentQ + 1, score: fb.score, skill: QUESTIONS[currentQ].skill }]);
        speakText(`Score: ${fb.score} out of 100. ${fb.comments}`);
        setPhase('feedback');
      }
    } catch { toast.error('AI analysis failed. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleNext = () => {
    const next = currentQ + 1;
    if (next >= QUESTIONS.length) { setPhase('summary'); return; }
    setCurrentQ(next); setAnswer(''); setFeedback(null); setPhase('interview');
    setTimeout(() => speakText(QUESTIONS[next].question), 400);
  };

  const avgScore = sessionScores.length > 0 ? Math.round(sessionScores.reduce((a,b) => a + b.score, 0) / sessionScores.length) : 0;

  return (
    <div className="min-h-screen bg-[#0A0D1A] pt-20 pb-12 px-4 sm:px-6 font-sans text-white">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <BrainCircuit className="w-6 h-6 text-white" />
              </div>
              Live AI Interview
            </h1>
            <p className="text-slate-400 mt-1 ml-14">Real-time voice interview powered by Claude AI</p>
          </div>
          <div className="flex items-center gap-3">
            {sessionScores.length > 0 && (
              <div className="px-4 py-2 bg-slate-800 rounded-xl border border-slate-700 text-sm">
                <span className="text-slate-400">Avg Score: </span>
                <span className={`font-black text-lg ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}</span>
                <span className="text-slate-400">/100</span>
              </div>
            )}
            <Badge variant="primary" className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Claude AI
            </Badge>
          </div>
        </div>

        {/* ===== PERMISSION FIX BANNER ===== */}
        {permError && (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row gap-4 items-start">
            <div className="text-3xl">⚠️</div>
            <div className="flex-1">
              <h3 className="font-black text-amber-400 text-lg mb-1">
                {permError === 'camera' ? 'Camera Access Blocked' : 'Microphone Access Blocked'}
              </h3>
              <p className="text-amber-200/80 text-sm mb-3">Chrome remembered your previous "Block" choice. Follow these steps to fix it:</p>
              <ol className="space-y-1 text-sm text-amber-100">
                <li><span className="font-black text-amber-400">1.</span> Click the 🔒 <strong>lock icon</strong> in your browser address bar (left of the URL)</li>
                <li><span className="font-black text-amber-400">2.</span> Find <strong>Camera</strong> or <strong>Microphone</strong> in the dropdown</li>
                <li><span className="font-black text-amber-400">3.</span> Change it from <span className="text-red-400 font-bold">Block</span> to <span className="text-emerald-400 font-bold">Allow</span></li>
                <li><span className="font-black text-amber-400">4.</span> <strong>Refresh this page</strong> (press F5) and try again</li>
              </ol>
            </div>
            <button onClick={() => setPermError(null)} className="text-amber-400 hover:text-white text-xl font-black px-2">✕</button>
          </div>
        )}


        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center py-20 text-center max-w-2xl mx-auto">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-8 bg-indigo-600/20 border-2 border-indigo-500/30 relative`}>
              <BrainCircuit className="w-16 h-16 text-indigo-400" />
              <div className="absolute inset-0 rounded-full border-2 border-indigo-400/20 animate-ping" />
            </div>
            <h2 className="text-4xl font-black text-white mb-4">Ready for your AI Interview?</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">The AI will ask you {QUESTIONS.length} real interview questions. Speak your answers clearly and Claude will analyze your performance with detailed feedback.</p>
            <div className="grid grid-cols-3 gap-4 mb-10 w-full">
              {[['🎥', 'Camera On', 'Face-to-face video experience'], ['🎙️', 'Voice Input', 'Speak naturally, AI transcribes'], ['🤖', 'AI Analysis', 'Claude scores each answer']].map(([icon, title, desc]) => (
                <div key={title} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="font-bold text-white text-sm">{title}</p>
                  <p className="text-xs text-slate-400 mt-1">{desc}</p>
                </div>
              ))}
            </div>
            <button onClick={startInterview} className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xl rounded-2xl shadow-xl shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95 flex items-center gap-3">
              <PlayCircle className="w-7 h-7" /> Start Interview
            </button>
          </div>
        )}

        {/* INTERVIEW / FEEDBACK SCREEN */}
        {(phase === 'interview' || phase === 'feedback') && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Left: Video + Controls */}
            <div className="lg:col-span-2 space-y-5">

              {/* Video */}
              <div className="relative aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-700 shadow-2xl">
                <video ref={videoRef} autoPlay playsInline muted className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />

                {!isCameraOn && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800/90 rounded-full flex items-center justify-center mx-auto mb-3 border border-slate-600">
                        <User className="w-10 h-10 text-slate-400" />
                      </div>
                      <p className="text-slate-400 font-semibold text-sm">Camera is off</p>
                    </div>
                  </div>
                )}

                {/* Top overlays */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-white">LIVE</span>
                </div>
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded-full border border-white/10">
                  <span className="text-xs font-bold text-white">{currentQ + 1} / {QUESTIONS.length}</span>
                </div>

                {/* Recording badge */}
                {isListening && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 bg-red-500/90 backdrop-blur px-5 py-2.5 rounded-full pointer-events-none">
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
                    <span className="text-sm font-black text-white uppercase tracking-widest">Listening...</span>
                  </div>
                )}

                {/* AI Avatar bottom-left */}
                <div className="absolute bottom-16 left-4 flex items-center gap-3 bg-black/70 backdrop-blur p-2 pr-4 rounded-full border border-white/10">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isAiSpeaking ? 'bg-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.6)]' : 'bg-slate-700'}`}>
                    <BrainCircuit className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">Claude AI</p>
                    <p className="text-sm font-semibold text-white">{isAiSpeaking ? 'Speaking...' : 'Ready'}</p>
                  </div>
                </div>

                {/* ====== ZOOM-STYLE CONTROL BAR ====== */}
                <div className="absolute bottom-0 left-0 right-0 h-14 bg-black/80 backdrop-blur-md flex items-center justify-center gap-4 border-t border-white/10">
                  {/* Mic Toggle */}
                  <button
                    onClick={toggleListening}
                    title={isListening ? 'Mute Mic' : 'Unmute Mic'}
                    className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all group ${
                      isListening ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40' : 'bg-slate-700 hover:bg-slate-600'
                    }`}
                  >
                    {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  <span className="text-xs text-slate-400 -mt-0 hidden sm:block w-14 text-center">{isListening ? 'Mute' : 'Unmute'}</span>

                  {/* Camera Toggle */}
                  <button
                    onClick={isCameraOn ? stopCamera : startCamera}
                    title={isCameraOn ? 'Stop Camera' : 'Start Camera'}
                    className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all ${
                      isCameraOn ? 'bg-slate-700 hover:bg-slate-600' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/40'
                    }`}
                  >
                    {isCameraOn ? <Video className="w-5 h-5 text-white" /> : <VideoOff className="w-5 h-5 text-white" />}
                  </button>
                  <span className="text-xs text-slate-400 hidden sm:block w-14 text-center">{isCameraOn ? 'Camera' : 'No Cam'}</span>

                  {/* Divider */}
                  <div className="w-px h-6 bg-white/20 mx-1" />

                  {/* Speak / Stop Answering */}
                  <button
                    onClick={toggleListening}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      isListening ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-indigo-600 text-white hover:bg-indigo-500'
                    }`}
                  >
                    {isListening ? <><StopCircle className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Speak</>}
                  </button>

                  {/* Repeat question */}
                  <button onClick={() => speakText(QUESTIONS[currentQ].question)} className="flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-600 text-white transition-all">
                    <Volume2 className="w-4 h-4 text-indigo-400" /> Repeat
                  </button>
                </div>
              </div>

              {/* Controls + Transcript */}
              <div className="bg-slate-800/80 backdrop-blur rounded-3xl p-6 border border-slate-700">
                <div className="flex flex-col md:flex-row gap-5">
                  <div className="flex flex-col gap-3 min-w-[180px]">
                    <button onClick={handleAnalyze} disabled={loading || !answer.trim()} className="flex items-center justify-center gap-2 py-4 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm border border-emerald-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                      {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      {loading ? 'Analyzing...' : 'Analyze Answer'}
                    </button>
                    <p className="text-xs text-slate-500 text-center">Use the control bar on the video to toggle camera &amp; mic</p>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <Mic className="w-3.5 h-3.5" /> Your Answer {isListening && <span className="text-red-400 animate-pulse">● Live</span>}
                    </label>
                    <textarea value={answer} onChange={e => setAnswer(e.target.value)} rows={6}
                      placeholder="Click 'Speak Answer' and answer verbally. Your words will appear here in real-time. You can also type directly."
                      className="w-full px-4 py-3 rounded-xl border border-slate-600 bg-slate-900/60 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-sm leading-relaxed transition-all"
                    />
                    <p className="text-right text-xs text-slate-500 mt-1">{answer.length} chars</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Panel */}
            <div className="space-y-5">
              {/* Question Card */}
              <div className="bg-gradient-to-br from-indigo-900/50 to-purple-900/30 border border-indigo-500/30 rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 opacity-5 -translate-y-2 translate-x-2">
                  <BrainCircuit className="w-32 h-32 text-indigo-400" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${CATEGORY_COLORS[QUESTIONS[currentQ].category]}`}>
                      {QUESTIONS[currentQ].category}
                    </span>
                    <span className="text-xs text-slate-400">{QUESTIONS[currentQ].skill}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white leading-tight mb-6">
                    "{QUESTIONS[currentQ].question}"
                  </h3>
                  <div className="flex gap-2">
                    <button onClick={() => { if(currentQ > 0) { setCurrentQ(q => q-1); setAnswer(''); setFeedback(null); }}} disabled={currentQ === 0} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 font-bold text-sm hover:bg-slate-800 disabled:opacity-30 transition-all flex items-center justify-center gap-1">
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>
                    <button onClick={handleNext} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-300 font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-1">
                      Skip <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Question Map */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Progress</p>
                <div className="grid grid-cols-7 gap-1.5">
                  {QUESTIONS.map((q, i) => {
                    const scored = sessionScores.find(s => s.q === i+1);
                    return (
                      <button key={i} onClick={() => { setCurrentQ(i); setAnswer(''); setFeedback(null); setPhase('interview'); }}
                        className={`h-8 rounded-lg text-xs font-bold transition-all ${i === currentQ ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' : scored ? (scored.score >= 80 ? 'bg-emerald-600/60 text-emerald-200' : scored.score >= 60 ? 'bg-amber-600/60 text-amber-200' : 'bg-red-600/60 text-red-200') : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                        {i+1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="bg-slate-800/80 border border-slate-700 rounded-3xl p-5 animate-fade-in space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" /> AI Feedback
                    </h4>
                    <div className="text-right">
                      <span className={`text-3xl font-black ${feedback.score >= 80 ? 'text-emerald-400' : feedback.score >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{feedback.score}</span>
                      <span className="text-slate-400 text-xs">/100</span>
                    </div>
                  </div>

                  {/* Score bar */}
                  <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${feedback.score >= 80 ? 'bg-emerald-500' : feedback.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${feedback.score}%` }} />
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">{feedback.comments}</p>

                  {feedback.strengths?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Strengths</p>
                      <ul className="space-y-1">{feedback.strengths.map((s,i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 shrink-0"></span>{s}</li>)}</ul>
                    </div>
                  )}
                  {feedback.improvements?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Improvements</p>
                      <ul className="space-y-1">{feedback.improvements.map((s,i) => <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5"><span className="w-1 h-1 rounded-full bg-amber-400 mt-1.5 shrink-0"></span>{s}</li>)}</ul>
                    </div>
                  )}
                  {feedback.betterAnswerTip && (
                    <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3">
                      <p className="text-xs font-bold text-indigo-400 flex items-center gap-1 mb-1"><Lightbulb className="w-3.5 h-3.5" /> Pro Tip</p>
                      <p className="text-xs text-indigo-200">{feedback.betterAnswerTip}</p>
                    </div>
                  )}
                  <button onClick={handleNext} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2">
                    {currentQ + 1 >= QUESTIONS.length ? '🎉 Finish Interview' : <>Next Question <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SUMMARY SCREEN */}
        {phase === 'summary' && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-24 h-24 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500/40">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-4xl font-black text-white mb-2">Interview Complete! 🎉</h2>
            <p className="text-slate-400 mb-8">Here's your session performance summary</p>
            <div className="bg-slate-800 border border-slate-700 rounded-3xl p-6 mb-8">
              <p className="text-slate-400 text-sm mb-1">Overall Average Score</p>
              <p className={`text-6xl font-black mb-6 ${avgScore >= 80 ? 'text-emerald-400' : avgScore >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{avgScore}<span className="text-2xl text-slate-400">/100</span></p>
              <div className="space-y-3">
                {sessionScores.map((s,i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 w-4">Q{s.q}</span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.score >= 80 ? 'bg-emerald-500' : s.score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${s.score}%` }} />
                    </div>
                    <span className="text-xs font-bold text-white w-8 text-right">{s.score}</span>
                    <span className="text-xs text-slate-400 w-28 text-left">{s.skill}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { setPhase('idle'); setSessionScores([]); setFeedback(null); setAnswer(''); stopCamera(); window.speechSynthesis?.cancel(); }}
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 mx-auto">
              <RefreshCcw className="w-5 h-5" /> Start New Interview
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
