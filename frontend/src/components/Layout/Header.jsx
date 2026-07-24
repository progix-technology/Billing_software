import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Bell, LogOut, ShieldAlert, Menu } from 'lucide-react';
import { api } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [alerts, setAlerts] = useState([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchStockAlerts = async () => {
      try {
        const res = await api.get('/api/products/alerts/low-stock');
        if (res.data.success) {
          setAlerts(res.data.products);
        }
      } catch (err) {
        console.error('Failed to load stock alerts', err);
      }
    };
    fetchStockAlerts();
    
    // Refresh alerts every 2 minutes
    const interval = setInterval(fetchStockAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-64 z-10 transition-colors duration-300">
      {/* Search Bar / Welcome Greeting */}
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="h-6 w-6" />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-800 dark:text-white">
            Welcome back, <span className="text-primary-500 capitalize">{user?.username}</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center space-x-4">
        {/* Notifications / Alerts center */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotificationMenu(!showNotificationMenu)}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 relative transition-colors"
          >
            <Bell className="h-5 w-5" />
            {alerts.length > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold animate-pulse">
                {alerts.length}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Panel */}
          {showNotificationMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl py-2 z-30 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="font-semibold text-slate-800 dark:text-white">Alert Notifications</span>
                <span className="text-xs font-medium text-red-500 px-2 py-0.5 rounded-full bg-red-500/10">
                  {alerts.length} Warnings
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {alerts.length === 0 ? (
                  <p className="text-center text-sm py-6 text-slate-500">No warning alerts found</p>
                ) : (
                  alerts.map((prod) => (
                    <div key={prod._id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-start gap-3 border-b border-slate-100 dark:border-slate-700/30">
                      <ShieldAlert className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-white truncate w-48">{prod.name}</p>
                        <p className="text-xs text-red-500">
                          Critical Stock: {prod.stockQuantity} (Min: {prod.minStockLevel})
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Logout Control */}
        <button
          onClick={logout}
          className="flex items-center text-sm font-semibold text-red-600 hover:text-red-500 transition-colors"
        >
          <LogOut className="h-5 w-5 mr-1" />
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
