import React from 'react';

const SplashScreen = ({ fadeOut }) => {
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col transition-opacity duration-500 ease-in-out select-none ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
        }`}
      style={{
        backgroundImage: `url('/splash_screen_bg.png')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Top right tagline */}
      <div className="absolute top-6 right-8 flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-slate-500 uppercase">
        <span>Simple</span>
        <span className="text-slate-300">|</span>
        <span>Smart</span>
        <span className="text-slate-300">|</span>
        <span>Grow Together</span>
      </div>

      {/* Bottom left tagline */}
      <div className="absolute bottom-7 left-8 text-[10px] font-bold tracking-[0.25em] text-slate-400 uppercase">
        Powering Businesses&nbsp;&nbsp;Everyday
      </div>

      {/* Floating side icons */}
      {/* Left icons */}
      <div className="absolute left-[10%] top-[38%] h-10 w-10 rounded-full bg-white/80 shadow flex items-center justify-center text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="absolute left-[18%] top-[55%] h-10 w-10 rounded-full bg-white/80 shadow flex items-center justify-center text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>

      {/* Right icons */}
      <div className="absolute right-[10%] top-[38%] h-10 w-10 rounded-full bg-white/80 shadow flex items-center justify-center text-blue-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="absolute right-[18%] top-[55%] h-10 w-10 rounded-full bg-white/80 shadow flex items-center justify-center text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
        </svg>
      </div>

      {/* Center Content */}
      <div className="flex flex-col items-center justify-center flex-1 space-y-4">
        {/* Logo with Larger Square Shape Badge Background */}
        <div className="h-28 w-28 sm:h-32 sm:w-32 aspect-square bg-white rounded-3xl shadow-2xl border border-slate-100/90 flex items-center justify-center p-4 animate-bounce-slow">
          <img src="/progix_logo.png" alt="ProBilling Logo" className="h-full w-full object-contain" />
        </div>

        {/* Brand name */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight">
            <span className="text-blue-600">PRO</span>
            <span className="text-slate-800">BILLING</span>
          </h1>
          <p className="text-slate-500 text-base mt-1 font-medium">A Smart Billing Software</p>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="h-px w-8 bg-blue-300" />
            <p className="text-[11px] font-bold tracking-[0.2em] text-blue-600 uppercase">By Progix</p>
            <span className="h-px w-8 bg-blue-300" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-52 mt-4">
          <div className="w-full h-[3px] bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full animate-progress" />
          </div>
          <p className="text-center text-[11px] text-slate-400 mt-2 font-medium">Loading your workspace...</p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
