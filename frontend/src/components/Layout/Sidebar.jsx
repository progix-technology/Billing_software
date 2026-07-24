import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import {
  LayoutDashboard,
  Calculator,
  Package,
  Tags,
  Users,
  Truck,
  IndianRupee,
  History,
  BarChart3,
  Settings,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const storeName = settings?.storeName || 'ERP Enterprise';

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
    { name: 'POS Billing', path: '/billing', icon: Calculator, roles: ['admin', 'manager', 'staff'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
    { name: 'Categories', path: '/categories', icon: Tags, roles: ['admin', 'manager'] },
    { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
    { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
    { name: 'Inventory Logs', path: '/inventory', icon: History, roles: ['admin', 'manager'] },
    { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredItems = menuItems.filter(
    (item) => user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div className={`w-64 bg-cream-50 text-slate-700 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-cream-200 transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        {/* Brand Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-cream-200">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg overflow-hidden border border-cream-200 flex items-center justify-center bg-white flex-shrink-0">
              <img src="./progix_logo.jpg" alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-xl font-bold tracking-tight text-primary-600 truncate">{storeName}</span>
          </div>
          <button 
            className="lg:hidden text-slate-500 hover:text-slate-800"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Nav Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-4 space-y-1">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              onClick={() => setIsOpen(false)} // close sidebar on mobile when navigating
              className={`flex items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-500/10'
                  : 'hover:bg-primary-50 hover:text-slate-900 text-slate-600'
              }`}
            >
              <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Badge */}
      <Link 
        to="/profile"
        className="p-4 border-t border-cream-200 bg-cream-100 flex items-center gap-3 cursor-pointer hover:bg-cream-200/60 transition-all duration-200"
        title="Click to view profile details"
      >
        <div className="h-9 w-9 rounded-full bg-primary-600 flex items-center justify-center font-bold text-white uppercase shadow-md overflow-hidden">
          {user?.profileImage ? (
            <img src={user.profileImage} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            user ? user.username.slice(0, 2) : 'US'
          )}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-semibold text-slate-800 truncate">{user?.username}</p>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-600 capitalize">
            {user?.role}
          </span>
        </div>
      </Link>
    </div>
    </>
  );
};

export default Sidebar;
