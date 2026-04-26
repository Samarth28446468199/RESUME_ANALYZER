import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authAPI } from '../api';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        try {
            const stored = localStorage.getItem('user');
            return stored ? JSON.parse(stored) : null;
        } catch { return null; }
    });

    const [token, setToken] = useState(() => localStorage.getItem('token') || null);
    const [loading, setLoading] = useState(false);

    const saveSession = (userData, jwtToken) => {
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', jwtToken);
    };

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }, []);

    useEffect(() => {
        if (token) {
            authAPI.getMe()
                .then(res => {
                    setUser(res.data.user);
                })
                .catch(() => {
                    logout();
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                try {
                    const { data } = await authAPI.googleLogin({
                        email: session.user.email,
                        name: session.user.user_metadata?.full_name || session.user.email.split('@')[0],
                    });
                    if (data.token) {
                        setUser(data.user);
                        setToken(data.token);
                        localStorage.setItem('user', JSON.stringify(data.user));
                        localStorage.setItem('token', data.token);
                    }
                } catch (err) {
                    console.error('Local sync failed', err);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, [token, logout]);

    const register = useCallback(async (name, email, password) => {
        setLoading(true);
        try {
            const { data } = await authAPI.register({ name, email, password });
            saveSession(data.user, data.token);
            return { success: true };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Registration failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const login = useCallback(async (email, password) => {
        setLoading(true);
        try {
            const { data } = await authAPI.login({ email, password });
            saveSession(data.user, data.token);
            return { success: true, role: data.user.role };
        } catch (err) {
            return { success: false, message: err.response?.data?.message || 'Login failed' };
        } finally {
            setLoading(false);
        }
    }, []);

    const isAuthenticated = !!token;
    const isAdmin = user?.role === 'admin';

    return (
        <AuthContext.Provider value={{ user, token, loading, isAuthenticated, isAdmin, register, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};
