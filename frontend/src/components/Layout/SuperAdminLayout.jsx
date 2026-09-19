import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, LayoutDashboard, Settings } from 'lucide-react';

const SuperAdminLayout = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin h-10 w-10 border-4 border-primary-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // Ensure they are authenticated and have the 'superadmin' role
  if (!user || user.role !== 'superadmin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 shadow-xl z-20">
        <div className="h-16 flex items-center justify-center border-b border-slate-800 px-4">
          <h1 className="text-xl font-bold text-white tracking-wider flex items-center gap-2">
            SUPER<span className="text-primary-500">ADMIN</span>
          </h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
          <Link 
            to="/superadmin" 
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group"
          >
            <LayoutDashboard className="h-5 w-5 text-slate-400 group-hover:text-primary-400" />
            <span className="font-medium">Tenants</span>
          </Link>
          <Link 
            to="/superadmin/packages" 
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group"
          >
            <Settings className="h-5 w-5 text-slate-400 group-hover:text-primary-400" />
            <span className="font-medium">Packages</span>
          </Link>
          <Link 
            to="/superadmin/settings" 
            className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-slate-800 hover:text-white transition-all group"
          >
            <Settings className="h-5 w-5 text-slate-400 group-hover:text-primary-400" />
            <span className="font-medium">System Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all font-medium"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <h2 className="text-xl font-semibold text-slate-800">Superadmin Portal</h2>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium bg-slate-100 px-3 py-1.5 rounded-full text-slate-600">
              {user.email}
            </span>
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
              SA
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-50/50 p-6 relative">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
