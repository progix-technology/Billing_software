import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, ArrowLeft, ShieldCheck, Headphones } from 'lucide-react';
import bgImg from '../assets/splash_screen_bg.png';

const ForgotPassword = () => {
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

      <div className="w-full max-w-md bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl shadow-2xl p-8 relative z-10">
        <Link
          to="/login"
          className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-blue-600 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Login
        </Link>

        <div className="flex flex-col items-center text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-inner">
            <Headphones className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Contact Super Admin
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-xs">
            To reset or recover your account password, please contact the Super Admin team directly.
          </p>
        </div>

        {/* Contact Cards */}
        <div className="space-y-3 mb-6">
          {/* Mobile / Call */}
          <a
            href="tel:+918953208952"
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/70 hover:border-blue-300 transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-lg bg-blue-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Phone className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Call / Mobile Number
              </div>
              <div className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                +91 89532 08952
              </div>
            </div>
          </a>

          {/* Email */}
          <a
            href="mailto:info@progixtechnology.com"
            className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-blue-50/70 hover:border-blue-300 transition-all duration-200 group"
          >
            <div className="h-10 w-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform shadow-sm">
              <Mail className="h-5 w-5" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Email Address
              </div>
              <div className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors break-all">
                info@progixtechnology.com
              </div>
            </div>
          </a>
        </div>

        {/* Footer Support Info */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-500 flex-shrink-0" />
          <span>Support Hours: 10:00 AM – 7:00 PM (Mon-Sat)</span>
        </div>

        <div className="mt-6">
          <Link
            to="/login"
            className="w-full inline-flex justify-center items-center py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all duration-200"
          >
            Return to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
