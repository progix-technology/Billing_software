import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const AdminLayout = () => {
  const { token, loading } = useAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // If auth is loading, render skeleton splash screen
  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-sm font-medium text-slate-400">Loading Enterprise Platform...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 transition-colors duration-300">
      {/* Sidebar Panel */}
      <Sidebar 
        isOpen={isMobileSidebarOpen} 
        setIsOpen={setIsMobileSidebarOpen} 
      />

      {/* Main Panel */}
      <div className="lg:pl-60 pl-0 flex flex-col min-h-screen transition-all duration-300">
        {/* Topbar Header */}
        <Header 
          toggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)} 
        />

        {/* Content Section */}
        <main className="flex-1 mt-16 p-4 md:p-6 overflow-y-auto w-full max-w-full overflow-x-hidden">
          <div className="max-w-7xl mx-auto animate-fade-in w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
