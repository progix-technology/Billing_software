import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff
} from 'lucide-react';
import { api, useAuth } from '../context/AuthContext';
import logoImg from '../assets/progix_logo.png';
import bgImg from '../assets/splash_screen_bg.png';

const InitialSetup = () => {
  const navigate = useNavigate();
  const { setToken, setUser } = useAuth();

  const [formData, setFormData] = useState({
    storeName: '',
    ownerName: '',
    phone: '',
    address: '',
    gstNumber: '',
    adminEmail: '',
    adminPassword: '',
    cleanSampleData: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.storeName || !formData.adminEmail || !formData.adminPassword) {
      setError('Please provide Store Name, Admin Email, and Admin Password.');
      return;
    }

    if (formData.adminPassword.length < 6) {
      setError('Admin Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/api/system/initial-setup', formData);
      if (res.data.success) {
        // Save token and user in AuthContext & LocalStorage
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
          if (setToken) setToken(res.data.token);
          if (setUser) setUser(res.data.user);
        }

        // Direct to Dashboard with fresh store
        setTimeout(() => {
          window.location.href = '#/';
        }, 800);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete initial store setup.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none bg-slate-900"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fade-in my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-primary-700 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white rounded-2xl shadow-md p-2 mx-auto mb-2.5 flex items-center justify-center">
            <img src={logoImg} alt="ProBilling Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Manual Store & Memory Setup</h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Configure your business details and admin account for this computer
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-semibold text-red-700 animate-fade-in">
              {error}
            </div>
          )}

          {/* Quick jump to Login for SuperAdmin or existing accounts */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-blue-50 border border-blue-200 rounded-2xl text-xs">
            <span className="text-slate-700 font-medium">Already have an account or logging in as SuperAdmin?</span>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-sm shrink-0 text-center"
            >
              Go to Login Page →
            </button>
          </div>

          {/* Section 1: Business Profile */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Store className="w-4 h-4 text-primary-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                1. Store / Business Information
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Store / Business Name *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Store className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="storeName"
                    required
                    placeholder="e.g. Ramesh General Store"
                    value={formData.storeName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Owner / Manager Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="ownerName"
                    placeholder="e.g. Ramesh Kumar"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Phone className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="phone"
                    placeholder="e.g. 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  GST Number (Optional)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <FileText className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="gstNumber"
                    placeholder="e.g. 07AAAAA0000A1Z5"
                    value={formData.gstNumber}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Store Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    name="address"
                    placeholder="e.g. Shop 12, Main Market, Indore, M.P."
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Admin Login Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Lock className="w-4 h-4 text-primary-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                2. Admin Login Account Setup
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Admin Login Email *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    name="adminEmail"
                    required
                    placeholder="admin@yourbusiness.com"
                    value={formData.adminEmail}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Create Admin Password *
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="adminPassword"
                    required
                    placeholder="Min. 6 characters"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-10 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Clean Memory Option */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                name="cleanSampleData"
                checked={formData.cleanSampleData}
                onChange={handleChange}
                className="mt-0.5 h-4 w-4 rounded text-primary-600 focus:ring-primary-500 border-slate-300"
              />
              <div className="text-xs">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  Start with a Fresh Clean Database
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Removes demo products, test invoices, and sample customers so you can enter your own fresh inventory and billing records.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Save Setup & Launch Software</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default InitialSetup;
