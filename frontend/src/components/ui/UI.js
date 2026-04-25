import React from 'react';

// ─── Spinner ──────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md' }) => {
    const sizes = { sm: 'w-5 h-5 border-2', md: 'w-10 h-10 border-4', lg: 'w-16 h-16 border-4' };
    return (
        <div className="flex justify-center items-center">
            <div className={`${sizes[size]} border-indigo-200 dark:border-indigo-900 border-t-indigo-500 rounded-full animate-spin`} />
        </div>
    );
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────
export const ProgressBar = ({ value, label, color = 'indigo', showValue = true }) => {
    const colors = {
        indigo: 'from-indigo-500 to-violet-500',
        green: 'from-emerald-500 to-teal-500',
        red: 'from-red-500 to-pink-500',
        yellow: 'from-yellow-400 to-orange-500',
        blue: 'from-blue-500 to-cyan-500',
    };
    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between mb-2 text-sm font-medium">
                    {label && <span className="text-slate-600 dark:text-slate-400">{label}</span>}
                    {showValue && <span className="text-slate-800 dark:text-slate-200">{value}%</span>}
                </div>
            )}
            <div className="progress-track">
                <div
                    className={`progress-fill bg-gradient-to-r ${colors[color]}`}
                    style={{ width: `${Math.min(value, 100)}%` }}
                />
            </div>
        </div>
    );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon: Icon, gradient, trend }) => (
    <div className="section-card flex flex-col gap-3 group hover:-translate-y-1 transition-transform duration-300">
        <div className="flex items-start justify-between">
            <div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
                <p className={`text-3xl font-bold mt-1 gradient-text`}>{value}</p>
                {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
            </div>
            {Icon && (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient || 'from-indigo-500/20 to-violet-500/20'}`}>
                    <Icon className="w-6 h-6 text-indigo-500" />
                </div>
            )}
        </div>
        {trend !== undefined && (
            <div className={`text-xs font-medium ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% from last analysis
            </div>
        )}
    </div>
);

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge = ({ children, variant = 'default' }) => {
    const variants = {
        default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
        success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]}`}>
            {children}
        </span>
    );
};

// ─── Empty State ──────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
        {Icon && (
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-indigo-400" />
            </div>
        )}
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500 dark:text-slate-500 mt-1 max-w-xs">{subtitle}</p>}
        {action && <div className="mt-4">{action}</div>}
    </div>
);

// ─── Page Header ──────────────────────────────────────────────────────────────
export const PageHeader = ({ title, subtitle, action }) => (
    <div className="flex items-start justify-between mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">{title}</h1>
            {subtitle && <p className="text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {action && <div className="ml-4">{action}</div>}
    </div>
);
