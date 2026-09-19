import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Sun,
  Moon,
  Bell,
  LogOut,
  ShieldAlert,
  Menu,
  User,
  Settings,
  Search,
  X,
  ArrowRight,
  Calculator,
  Package,
  Users,
  BarChart3,
  CheckCheck,
  ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../context/AuthContext';

const Header = ({ toggleSidebar }) => {
  const { logout, user } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Notification state
  const [alerts, setAlerts] = useState([]);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [readAlertIds, setReadAlertIds] = useState([]);
  const notificationRef = useRef(null);

  // Profile state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef(null);

  // Global Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef(null);

  // Quick navigation items for search palette
  const quickLinks = [
    { name: 'POS Billing', path: '/billing', icon: Calculator, category: 'Quick Action' },
    { name: 'Dashboard', path: '/', icon: BarChart3, category: 'Page' },
    { name: 'Products Catalog', path: '/products', icon: Package, category: 'Page' },
    { name: 'Customer Management', path: '/customers', icon: Users, category: 'Page' },
    { name: 'Sales & Inventory Reports', path: '/reports', icon: BarChart3, category: 'Page' },
    { name: 'System Settings', path: '/settings', icon: Settings, category: 'Page' },
  ];

  // Outside click & Keyboard shortcuts handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };

    const handleKeyDown = (event) => {
      // Ctrl+K or Cmd+K to open Search
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
      // Escape closes everything
      if (event.key === 'Escape') {
        setShowNotificationMenu(false);
        setShowProfileMenu(false);
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Focus search input when modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isSearchOpen]);

  // Live product search debounced
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await api.get(`/api/products?search=${encodeURIComponent(searchQuery.trim())}&limit=6`);
        if (res.data.success) {
          setSearchResults(res.data.products || []);
        }
      } catch (err) {
        console.error('Error searching products:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch low stock alerts
  const fetchStockAlerts = async () => {
    try {
      const res = await api.get('/api/products/alerts/low-stock');
      if (res.data.success) {
        setAlerts(res.data.products || []);
      }
    } catch (err) {
      console.error('Failed to load stock alerts', err);
    }
  };

  useEffect(() => {
    fetchStockAlerts();
    const interval = setInterval(fetchStockAlerts, 120000);
    return () => clearInterval(interval);
  }, []);

  const unreadAlerts = alerts.filter(a => !readAlertIds.includes(a._id));

  const handleMarkAllRead = () => {
    setReadAlertIds(alerts.map(a => a._id));
  };

  const handleNavigateFromSearch = (path) => {
    setIsSearchOpen(false);
    navigate(path);
  };

  const filteredQuickLinks = searchQuery.trim()
    ? quickLinks.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : quickLinks;

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 fixed top-0 right-0 left-0 lg:left-60 z-10 transition-colors duration-300">
        {/* Mobile Toggle & Greeting */}
        <div className="flex items-center flex-1 gap-4 lg:gap-8">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Greeting */}
          <h1 className="hidden sm:block text-base font-bold text-slate-800 ml-2">
            Welcome, <span className="text-blue-600">{user?.username || 'Administrator'}</span> 👋
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Current Date */}
          <div className="hidden md:block text-right mr-2 border-r border-slate-200 pr-4">
            <p className="text-sm font-semibold text-slate-700">
              {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase mt-0.5">
              {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
            </p>
          </div>

          {/* Search Button */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-all group border border-slate-200/60"
            title="Search products, orders, pages (Ctrl+K)"
          >
            <Search className="h-4 w-4 text-slate-500 group-hover:text-blue-600 transition-colors" />
            <span className="hidden sm:inline text-xs font-medium text-slate-500 group-hover:text-slate-700">Search...</span>
            <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-400">
              ⌘K
            </kbd>
          </button>

          {/* Notifications / Alerts center */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-600 relative transition-all border border-slate-200/60"
              title="Notifications"
            >
              <Bell className="h-5 w-5 text-slate-600" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold ring-2 ring-white animate-pulse">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Panel */}
            {showNotificationMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl py-3 z-30 animate-fade-in">
                <div className="px-4 py-2 border-b border-slate-100 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">Notifications</span>
                    {unreadAlerts.length > 0 && (
                      <span className="text-[11px] font-bold text-red-600 px-2 py-0.5 rounded-full bg-red-50 border border-red-100">
                        {unreadAlerts.length} Low Stock
                      </span>
                    )}
                  </div>
                  {unreadAlerts.length > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 transition-colors"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {alerts.length === 0 ? (
                    <div className="text-center py-8 px-4">
                      <div className="h-10 w-10 mx-auto rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center mb-2">
                        <CheckCheck className="h-5 w-5" />
                      </div>
                      <p className="text-sm font-semibold text-slate-700">All Good!</p>
                      <p className="text-xs text-slate-400 mt-0.5">No low stock warnings right now.</p>
                    </div>
                  ) : (
                    alerts.map((prod) => (
                      <div
                        key={prod._id}
                        onClick={() => {
                          setShowNotificationMenu(false);
                          navigate(`/products?search=${encodeURIComponent(prod.name)}`);
                        }}
                        className="px-4 py-3 hover:bg-slate-50 flex items-start gap-3 cursor-pointer transition-colors group"
                      >
                        <div className="h-8 w-8 rounded-lg bg-rose-50 border border-rose-100 text-rose-500 flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                          <ShieldAlert className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                            <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded border border-red-100 flex-shrink-0">
                              {prod.stockQuantity} left
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Minimum threshold is {prod.minStockLevel} {prod.unit || 'units'}.
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {alerts.length > 0 && (
                  <div className="px-4 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setShowNotificationMenu(false);
                        navigate('/products');
                      }}
                      className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      View inventory in Products <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* Profile Avatar / Dropdown trigger */}
          <div className="relative" ref={profileRef}>
            <div
              className="flex items-center gap-3 cursor-pointer p-1.5 transition-all duration-200 select-none rounded-xl hover:bg-slate-50"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white uppercase overflow-hidden shadow-sm">
                {user?.profileImage ? (
                  <img src={user.profileImage} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs">{user ? user.username.slice(0, 2) : 'US'}</span>
                )}
              </div>
              <div className="hidden md:block text-left mr-1">
                <p className="text-xs font-bold text-slate-700 leading-none truncate max-w-[100px]">
                  {user?.username || 'Administrator'}
                </p>
                <p className="text-[9px] font-medium text-slate-400 mt-1 capitalize">
                  {user?.role || 'Admin'}
                </p>
              </div>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-3.5 w-3.5 text-slate-400 hidden md:block transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
              </svg>
            </div>

            {/* Premium Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 animate-fade-in p-1.5">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <p className="text-xs font-bold text-slate-800 truncate">{user?.username || 'Administrator'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user?.email || 'admin@example.com'}</p>
                </div>

                <Link
                  to="/profile"
                  className="w-full flex items-center px-2.5 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <User className="h-4 w-4 mr-2 text-slate-400" />
                  Profile Account
                </Link>
                <Link
                  to="/settings"
                  className="w-full flex items-center px-2.5 py-2 text-xs font-medium text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  onClick={() => setShowProfileMenu(false)}
                >
                  <Settings className="h-4 w-4 mr-2 text-slate-400" />
                  System Settings
                </Link>

                <div className="pt-1 mt-1 border-t border-slate-100">
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-2.5 py-2 text-xs font-semibold text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2 text-red-500" />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Quick Search & Command Palette Modal (Ctrl+K) */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200">
              <Search className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, SKU, barcodes, or jump to pages..."
                className="w-full bg-transparent text-sm text-slate-900 placeholder-slate-400 outline-none font-medium"
              />
              <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[11px] text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition-colors"
                    title="Clear text"
                  >
                    Clear
                  </button>
                )}
                <button
                  onClick={() => setIsSearchOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 transition-all flex items-center justify-center border border-slate-200"
                  title="Close Search (ESC)"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Results Area */}
            <div className="max-h-96 overflow-y-auto p-2 divide-y divide-slate-100">
              {/* Product Live Search Results */}
              {searchLoading && (
                <div className="py-6 text-center text-xs text-slate-400">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-2" />
                  Searching products...
                </div>
              )}

              {!searchLoading && searchResults.length > 0 && (
                <div className="pb-2">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Products ({searchResults.length})
                  </div>
                  {searchResults.map((prod) => (
                    <div
                      key={prod._id}
                      onClick={() => handleNavigateFromSearch(`/products?search=${encodeURIComponent(prod.name)}`)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-blue-50 cursor-pointer transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                          <Package className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {prod.name}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            SKU: {prod.sku || 'N/A'} • Barcode: {prod.barcode || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-800">₹{prod.price}</p>
                        <p className="text-[10px] text-slate-400">Stock: {prod.stockQuantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Page Links */}
              <div className="pt-2">
                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Navigation & Pages
                </div>
                {filteredQuickLinks.length === 0 ? (
                  <p className="text-xs text-slate-400 px-3 py-2">No matching pages found.</p>
                ) : (
                  filteredQuickLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.name}
                        onClick={() => handleNavigateFromSearch(item.path)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-7 w-7 rounded-lg bg-slate-100 group-hover:bg-blue-100 text-slate-500 group-hover:text-blue-600 flex items-center justify-center transition-colors">
                            <Icon className="h-3.5 w-3.5" />
                          </div>
                          <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-600 transition-colors">
                            {item.name}
                          </span>
                        </div>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-blue-600 transition-colors" />
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Footer Tip */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tip: Press <kbd className="font-mono bg-white px-1 py-0.5 rounded border border-slate-200">ESC</kbd> to close</span>
              <span>ProBilling Quick Launcher</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;

