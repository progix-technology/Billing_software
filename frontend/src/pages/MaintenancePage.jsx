import React from 'react';
import { AlertTriangle, Clock, ServerCrash } from 'lucide-react';

const MaintenancePage = ({ message }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl overflow-hidden text-center animate-fade-in-up">
        {/* Header Graphic */}
        <div className="bg-orange-500 p-8 flex justify-center items-center">
          <div className="bg-white p-4 rounded-full shadow-lg relative">
            <ServerCrash className="h-16 w-16 text-orange-500 animate-pulse" />
            <div className="absolute -bottom-2 -right-2 bg-yellow-400 p-1.5 rounded-full border-2 border-white">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="p-10 space-y-6">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">We'll be back soon!</h1>

          <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
            <div className="flex items-center justify-center gap-2 text-orange-600 mb-2">
              <AlertTriangle className="h-5 w-5" />
              <h2 className="font-bold text-lg">Under Maintenance</h2>
            </div>
            <p className="text-slate-600 text-lg leading-relaxed">
              {message || "We're currently performing some scheduled maintenance to improve the platform. Please check back later."}
            </p>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
            <p className="text-sm text-slate-500 font-medium">Thank you for your patience.</p>
            <p className="text-xs text-slate-400">If you are the Superadmin, you can still access the login portal to manage settings.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
