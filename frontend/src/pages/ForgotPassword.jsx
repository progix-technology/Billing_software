import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../context/AuthContext';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [mockResetLink, setMockResetLink] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/auth/forgot-password', { email });
      if (res.data.success) {
        setSuccess(true);
        // Display reset URL for direct testing convenience
        setMockResetLink(`/reset-password/${res.data.resetToken}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check your email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-600/5 rounded-full filter blur-3xl" />

      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl p-8 relative z-10 transition-colors duration-350">
        <Link to="/login" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
        </Link>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
          <p className="text-sm text-slate-500 mt-1">Enter your registered email to request recovery link</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-55 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-650 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className="space-y-6 text-center py-4">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Verification Link Sent</h3>
              <p className="text-sm text-slate-500 mt-2">
                We've generated your password recovery code. For easy local verification:
              </p>
            </div>
            
            {mockResetLink && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs break-all">
                <Link to={mockResetLink} className="text-primary-600 hover:underline font-semibold">
                  Click here to simulate opening your reset link ({mockResetLink})
                </Link>
              </div>
            )}

            <p className="text-xs text-slate-400">
              In production environments, this link is dispatched securely via SMTP mailers.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-5 w-5" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@erp.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-205"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
            >
              {loading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                'Send Recovery Link'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;

