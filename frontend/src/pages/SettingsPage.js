import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Lock, Save } from 'lucide-react';
import { authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { PageHeader, Spinner } from '../components/ui/UI';

export default function SettingsPage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [passwords, setPasswords] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwords.newPassword.length < 6) {
            toast.error('New password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            await authAPI.changePassword({
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword
            });
            toast.success('Password updated successfully! 🎉');
            setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto">
                <PageHeader
                    title="Account Settings"
                    subtitle="Manage your profile and security preferences"
                />

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Profile Information (Read-only for now) */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="section-card flex flex-col items-center text-center">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white text-3xl font-bold mb-4 shadow-lg">
                                {user?.name?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">{user?.name}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{user?.email}</p>
                            <span className="mt-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 capitalize">
                                {user?.role} Account
                            </span>
                        </div>
                    </div>

                    {/* Change Password Form */}
                    <div className="md:col-span-2">
                        <div className="section-card">
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-100 dark:border-white/5">
                                <Lock className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Change Password</h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                        Current Password
                                    </label>
                                    <input
                                        type="password"
                                        name="currentPassword"
                                        value={passwords.currentPassword}
                                        onChange={handleChange}
                                        className="input-field w-full"
                                        required
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="newPassword"
                                            value={passwords.newPassword}
                                            onChange={handleChange}
                                            className="input-field w-full"
                                            required
                                            placeholder="Min. 6 characters"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Confirm New Password
                                        </label>
                                        <input
                                            type="password"
                                            name="confirmPassword"
                                            value={passwords.confirmPassword}
                                            onChange={handleChange}
                                            className="input-field w-full"
                                            required
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>
                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-gradient w-full sm:w-auto py-2.5 px-6 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
                                        Update Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
