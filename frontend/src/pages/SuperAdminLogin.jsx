import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, Eye, EyeOff, AlertCircle, Database, KeyRound, Sparkles } from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';

const SuperAdminLogin = () => {
  const navigate = useNavigate();
  const { setUser, setToken } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/superadmin/login', {
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });

      if (res.data.success && res.data.token) {
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('superadmin_token', res.data.token);
        localStorage.setItem('superadmin_user', JSON.stringify(res.data.user));

        // Immediately update axios default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;

        if (setToken) setToken(res.data.token);
        if (setUser) setUser(res.data.user);

        navigate('/superadmin');
      } else {
        setError(res.data.message || 'SuperAdmin authentication failed.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to connect to SuperAdmin Cloud Server. Please verify credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[350px] h-[350px] bg-purple-600/15 rounded-full blur-[110px] pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in">
        {/* Header Badge & Title */}
        <div className="text-center pb-6">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-500 shadow-xl shadow-indigo-600/30 text-white mb-4 animate-bounce-slow">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-semibold mb-2">
            <Database className="w-3 h-3 text-indigo-400" />
            <span>MongoDB Atlas Cloud Connected</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">SuperAdmin Master Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized License Management & Multi-Store Control
          </p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              SuperAdmin Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter SuperAdmin Email"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-4 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
              Master Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl py-3 pl-11 pr-11 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:from-indigo-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                <span>Sign In to SuperAdmin</span>
              </>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 text-center space-y-2">
          <p className="text-[11px] text-slate-500">
            Protected with Rate Limiting (5 Attempts) & SHA-256 HMAC Signatures
          </p>
          <p className="text-xs text-slate-400">
            Store Billing Operator?{' '}
            <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold hover:underline">
              Go to Store Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;
