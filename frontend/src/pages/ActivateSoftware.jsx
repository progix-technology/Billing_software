import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Key, 
  Copy, 
  Check, 
  PhoneCall, 
  ShieldAlert, 
  Sparkles, 
  ExternalLink,
  Laptop,
  ArrowRight
} from 'lucide-react';
import { api } from '../context/AuthContext';
import logoImg from '../assets/progix_logo.png';
import bgImg from '../assets/splash_screen_bg.png';

const ActivateSoftware = () => {
  const navigate = useNavigate();
  const [machineId, setMachineId] = useState('');
  const [licenseKey, setLicenseKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [copiedId, setCopiedId] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      setFetching(true);
      const res = await api.get('/api/system/setup-status');
      if (res.data.success) {
        setMachineId(res.data.license?.machineId || '');
        // If already activated on this device, send directly to login
        if (res.data.isActivated) {
          navigate('/login');
        }
      }
    } catch (err) {
      console.error('Failed to get status', err);
    } finally {
      setFetching(false);
    }
  };

  const handleCopyMachineId = () => {
    if (!machineId) return;
    navigator.clipboard.writeText(machineId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2500);
  };

  const handleActivate = async (e) => {
    e.preventDefault();
    if (!licenseKey.trim()) {
      setMessage({ type: 'error', text: 'Please enter a valid activation key.' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await api.post('/api/license/activate', {
        licenseKey: licenseKey.trim().toUpperCase()
      });

      if (res.data.success) {
        const plan = res.data.planName || 'Active';
        const days = res.data.durationDays || '365';
        const msg = res.data.message || `🎉 ${plan} (${days} Days) Package Activated Successfully!`;
        setMessage({
          type: 'success',
          text: msg
        });

        // If key auto-configured the admin, save email to prefill on login screen
        if (res.data.adminEmail) {
          localStorage.setItem('prefill_admin_email', res.data.adminEmail);
        }

        setTimeout(() => {
          navigate('/login');
        }, 1200);
      }
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'Invalid or expired activation key for this computer.'
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hello Progix Support, I am setting up PRO Billing Software on my computer.\nMy Hardware Machine ID is: ${machineId}\nPlease provide my Activation Key.`
  );
  const whatsappUrl = `https://wa.me/918953208952?text=${whatsappMessage}`;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden select-none bg-slate-900"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top right branding */}
      <div className="absolute top-6 right-8 hidden sm:flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-slate-400 uppercase z-0">
        <span>Offline Engine</span>
        <span className="text-slate-600">|</span>
        <span>Hardware Locked</span>
        <span className="text-slate-600">|</span>
        <span>SuperAdmin Secured</span>
      </div>

      {/* Main Activation Card */}
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden relative z-10 animate-fade-in">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-600 to-primary-700 p-6 text-white text-center relative">
          <div className="w-16 h-16 bg-white rounded-2xl shadow-md p-2.5 mx-auto mb-3 flex items-center justify-center">
            <img src={logoImg} alt="ProBilling Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">PRO Billing Software</h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Device Registration & Software Activation
          </p>
        </div>

        <div className="p-7 space-y-5">
          {/* Notice Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <p className="font-bold">Hardware Activation Required</p>
              <p className="mt-0.5 text-amber-800">
                This software is bound to this computer's unique hardware. Please enter your activation key to unlock and proceed to login.
              </p>
            </div>
          </div>

          {/* Machine Hardware ID Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Laptop className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Your Machine Hardware ID
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-semibold bg-slate-200/80 px-2 py-0.5 rounded">
                Unique PC Identifier
              </span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={machineId || (fetching ? 'Detecting Hardware ID...' : 'Unable to read ID')}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-slate-900 tracking-wider select-all"
              />
              <button
                type="button"
                onClick={handleCopyMachineId}
                disabled={!machineId}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
              >
                {copiedId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy ID</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* WhatsApp Support Button */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-emerald-900 transition-colors group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <PhoneCall className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold leading-tight">Get Activation Key on WhatsApp</p>
                <p className="text-[11px] text-emerald-700">Helpline: +91 89532 08952</p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-emerald-700 group-hover:text-emerald-900">
              <span>Send ID</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </div>
          </a>

          {/* Activation Key Form */}
          <form onSubmit={handleActivate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Enter Activation Key *
              </label>
              <input
                type="text"
                required
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value.toUpperCase())}
                placeholder="PRO-GOLD-XXXX-XXXX-XXXX-XXXX"
                className="w-full bg-slate-50 border border-slate-300 focus:border-blue-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-mono font-bold tracking-wider text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all uppercase"
              />
            </div>

            {/* Error or Success notification */}
            {message.text && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 animate-fade-in' 
                  : 'bg-red-50 text-red-700 border border-red-200 animate-fade-in'
              }`}>
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !licenseKey.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Verify & Activate Software</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Bottom Security Note */}
          <div className="text-center pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>PRO Billing Software v1.0.0</span>
            <span className="text-slate-500 font-medium">Secured with Hardware License</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivateSoftware;
