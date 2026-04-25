import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Zap, Mail, Lock, User, Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/UI';
import { supabase } from '../supabase';

function AuthInput({ type, placeholder, value, onChange, icon: Icon, suffix }) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
        <Icon className="w-5 h-5" />
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full pl-12 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-slate-700
          bg-slate-50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400
          focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
          transition-all duration-300 shadow-sm hover:shadow-md"
        required
      />
      {suffix && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
          {suffix}
        </div>
      )}
    </div>
  );
}

export default function AuthPage({ mode = 'login' }) {
  const [isLogin, setIsLogin] = useState(mode === 'login');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, loading } = useAuth();

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  // Sync state if URL changes
  useEffect(() => {
    setIsLogin(location.pathname === '/login' || mode === 'login');
  }, [location.pathname, mode]);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const toggleMode = () => {
    setIsLogin(!isLogin);
    navigate(!isLogin ? '/login' : '/register', { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let result;
    if (isLogin) {
      result = await login(form.email, form.password);
    } else {
      if (form.password.length < 6) {
        toast.error('Password must be at least 6 characters');
        return;
      }
      result = await register(form.name, form.email, form.password);
    }

    if (result.success) {
      toast.success(isLogin ? 'Welcome back, explorer! 🎉' : 'Account created! Welcome to the future. 🚀');
      navigate('/dashboard');
    } else {
      toast.error(result.message || 'An error occurred during authentication.');
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
      if (error) throw error;
    } catch (err) {
      toast.error('Could not initialize Google Login');
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50 dark:bg-[#0B0F19]">
      {/* Visual Section */}
      <div className="hidden md:flex w-1/2 relative bg-indigo-600 overflow-hidden text-white flex-col justify-center px-12 lg:px-20">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 opacity-90"></div>
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        
        {/* Abstract Blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-1/2 -right-24 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-24 left-1/4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>

        <div className="relative z-10 max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-yellow-300" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight">SkillGap AI</h2>
          </div>
          <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
            Elevate Your <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-emerald-300">Career Trajectory</span>
          </h1>
          <p className="text-lg lg:text-xl text-indigo-100 font-medium mb-12">
            Harness the power of AI to analyze your resume, pinpoint skill gaps, and land your next big role with confidence.
          </p>
          
          <div className="space-y-4">
            {[
              "Real-time Resume Analysis",
              "Personalized Course Recommendations",
              "AI Mock Interviews"
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 p-3 rounded-xl backdrop-blur-sm border border-white/10 w-fit">
                <ShieldCheck className="w-5 h-5 text-emerald-300" />
                <span className="font-semibold text-indigo-50">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        <div className="w-full max-w-md bg-white dark:bg-[#111827] rounded-[2rem] shadow-2xl p-8 sm:p-10 border border-slate-100 dark:border-slate-800 relative z-10 animate-fade-in">
          
          <div className="text-center mb-10 text-slate-800 dark:text-white">
            <h2 className="text-3xl font-black mb-2">
              {isLogin ? 'Welcome Back!' : 'Start Your Journey'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {isLogin ? 'Sign in to review your insights.' : 'Register to unlock your potential.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full relative flex items-center justify-center gap-3 py-4 mb-6 rounded-2xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-bold text-slate-700 dark:text-slate-200 shadow-sm hover:shadow-md"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
            <span className="text-slate-400 font-semibold text-sm">OR</span>
            <div className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <AuthInput
                type="text"
                placeholder="Full Legal Name"
                value={form.name}
                onChange={set('name')}
                icon={User}
              />
            )}
            <AuthInput
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={set('email')}
              icon={Mail}
            />
            <AuthInput
              type={showPass ? 'text' : 'password'}
              placeholder="Secure Password"
              value={form.password}
              onChange={set('password')}
              icon={Lock}
              suffix={
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors group-focus-within:text-indigo-500">
                  {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 shadow-lg shadow-indigo-500/30 disabled:opacity-70"
            >
              {loading ? <Spinner size="sm" /> : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-slate-500 dark:text-slate-400 font-medium">
            {isLogin ? "New here? " : 'Already a member? '}
            <button
              onClick={toggleMode}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline decoration-2 underline-offset-4"
            >
              {isLogin ? 'Create an account' : 'Sign in instead'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
