import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../context/AuthContext';
import MaintenancePage from './MaintenancePage';
import logoImg from '../assets/progix_logo.png';
import bgImg from '../assets/splash_screen_bg.png';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemMaintenance, setSystemMaintenance] = useState({ active: false, message: '' });
  const [overrideMaintenance, setOverrideMaintenance] = useState(false);

  React.useEffect(() => {
    const checkSettings = async () => {
      try {
        const res = await api.get('/api/system/settings');
        if (res.data.settings?.isMaintenanceMode) {
          setSystemMaintenance({ active: true, message: res.data.settings.maintenanceMessage });
        }
      } catch (err) {
        console.error('Could not check system settings', err);
      }
    };
    checkSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(emailOrUsername, password);
    setLoading(false);

    if (result.success) {
      if (result.user?.role === 'superadmin') {
        navigate('/superadmin');
      } else {
        navigate('/');
      }
    } else {
      if (result.isMaintenanceMode) {
        setSystemMaintenance({ active: true, message: result.message });
        setOverrideMaintenance(false);
      } else {
        setError(result.message);
      }
    }
  };

  if (systemMaintenance.active && !overrideMaintenance) {
    return (
      <div className="relative">
        <MaintenancePage message={systemMaintenance.message} />
        {/* Secret/Subtle way for superadmin to bypass the block screen and reach login */}
        <button
          onClick={() => setOverrideMaintenance(true)}
          className="absolute bottom-4 right-4 text-xs text-slate-300 hover:text-slate-500 opacity-50 flex items-center gap-1"
        >
          <ShieldAlert className="h-3 w-3" />
          Admin Access
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none bg-slate-50"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top right tagline */}
      <div className="absolute top-6 right-8 hidden sm:flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase z-0">
        <span>Simple</span>
        <span className="text-slate-300">|</span>
        <span>Smart</span>
        <span className="text-slate-300">|</span>
        <span>Grow Together</span>
      </div>

      {/* Bottom left tagline */}
      <div className="absolute bottom-7 left-8 hidden sm:block text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase z-0">
        Powering Businesses&nbsp;&nbsp;Everyday
      </div>

      {/* Floating side icons */}
      {/* Left icons */}
      <div className="hidden md:flex absolute left-[8%] top-[35%] h-10 w-10 rounded-full bg-white/80 shadow items-center justify-center text-blue-400 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="hidden md:flex absolute left-[14%] top-[55%] h-10 w-10 rounded-full bg-white/80 shadow items-center justify-center text-blue-400 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>

      {/* Right icons */}
      <div className="hidden md:flex absolute right-[8%] top-[35%] h-10 w-10 rounded-full bg-white/80 shadow items-center justify-center text-blue-500 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="hidden md:flex absolute right-[14%] top-[55%] h-10 w-10 rounded-full bg-white/80 shadow items-center justify-center text-blue-400 pointer-events-none">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      </div>

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl p-8 relative z-10 transition-colors duration-350">
        <div className="flex flex-col items-center mb-6">
          {/* Square Logo Badge */}
          <div className="h-16 w-16 aspect-square bg-white rounded-2xl shadow-md border border-slate-100 flex items-center justify-center p-2.5 mb-3">
            <img src={logoImg} alt="ProBilling Logo" className="w-full h-full object-contain" />
          </div>

          {/* Brand Name */}
          <div className="text-center">
            <h1 className="text-3xl font-extrabold tracking-tight">
              <span className="text-blue-600">PRO</span>
              <span className="text-slate-800">BILLING</span>
            </h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">A Smart Billing Software</p>
            <div className="flex items-center justify-center gap-3 mt-1.5">
              <span className="h-px w-6 bg-blue-300" />
              <p className="text-[10px] font-bold tracking-[0.2em] text-blue-600 uppercase">By Progix</p>
              <span className="h-px w-6 bg-blue-300" />
            </div>
          </div>
        </div>

        {systemMaintenance.active && overrideMaintenance && (
          <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-sm text-orange-700 animate-fade-in">
            <ShieldAlert className="h-5 w-5 flex-shrink-0" />
            <p><strong>Maintenance Mode Active.</strong> Only Superadmins can log in right now.</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-650 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email or Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Email or Username
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail className="h-5 w-5" />
              </span>
              <input
                type="text"
                required
                value={emailOrUsername}
                onChange={(e) => setEmailOrUsername(e.target.value)}
                placeholder="admin or admin@erp.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-primary-600 hover:text-primary-500 transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock className="h-5 w-5" />
              </span>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-12 text-slate-950 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:bg-white transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-800"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-500 active:bg-primary-700 text-white font-semibold py-3 rounded-xl shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-slate-500">
            For support, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
