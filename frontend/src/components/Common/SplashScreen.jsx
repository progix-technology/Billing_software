import React from 'react';


const SplashScreen = ({ fadeOut }) => {
  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-cream-100 transition-opacity duration-500 ease-in-out select-none ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Soft background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full bg-primary-500/5 blur-[80px] pointer-events-none animate-pulse" />

      <div className="flex flex-col items-center space-y-6 z-10">
        {/* Animated Icon Container */}
        <div className="relative flex items-center justify-center">
          {/* Pulsing ring outer */}
          <div className="absolute inset-0 rounded-3xl bg-primary-500/10 blur-xl animate-ping opacity-75" />
          
          {/* Glowing background container with image */}
          <div className="relative h-20 w-20 rounded-3xl overflow-hidden shadow-2xl shadow-primary-500/20 border border-slate-200 dark:border-slate-800 animate-bounce-slow flex items-center justify-center bg-white">
            <img 
              src="./progix_logo.jpg" 
              alt="Progix Logo" 
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Text Details with slide/fade animation */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-600 drop-shadow-sm font-sans uppercase">
            Billing Software
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1">
            <span className="h-px w-6 bg-primary-500/30" />
            <p className="text-[11px] md:text-xs font-bold text-primary-600 tracking-[0.25em] uppercase">
              by progix
            </p>
            <span className="h-px w-6 bg-primary-500/30" />
          </div>
        </div>

        {/* Progress loader micro-animation */}
        <div className="w-36 h-[3px] bg-cream-200 rounded-full overflow-hidden relative">
          <div className="absolute top-0 bottom-0 left-0 w-1/2 bg-gradient-to-r from-primary-500 to-indigo-500 rounded-full animate-progress" />
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;

