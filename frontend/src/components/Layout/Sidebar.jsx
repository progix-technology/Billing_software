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
  X,
  LogOut
} from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();

  const storeName = settings?.storeName || 'ERP Enterprise';

  const menuGroups = [
    {
      label: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'manager', 'staff'] },
        { name: 'POS Billing', path: '/billing', icon: Calculator, roles: ['admin', 'manager', 'staff'] },
      ]
    },
    {
      label: 'CATALOG',
      items: [
        { name: 'Products', path: '/products', icon: Package, roles: ['admin', 'manager', 'staff'] },
        { name: 'Categories', path: '/categories', icon: Tags, roles: ['admin', 'manager'] },
      ]
    },
    {
      label: 'PEOPLE',
      items: [
        { name: 'Customers', path: '/customers', icon: Users, roles: ['admin', 'manager', 'staff'] },
        { name: 'Suppliers', path: '/suppliers', icon: Truck, roles: ['admin', 'manager'] },
      ]
    },
    {
      label: 'INVENTORY',
      items: [
        { name: 'Inventory Logs', path: '/inventory', icon: History, roles: ['admin', 'manager'] },
      ]
    },
    {
      label: 'ANALYTICS',
      items: [
        { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'manager'] },
      ]
    },
    {
      label: 'SYSTEM',
      items: [
        { name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
      ]
    }
  ];

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
      <div className={`w-60 bg-white text-slate-700 flex flex-col h-screen fixed left-0 top-0 z-50 border-r border-slate-200 shadow-sm transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>

        {/* Logo/Brand Area */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-8 w-8 aspect-square rounded overflow-hidden flex items-center justify-center flex-shrink-0">
              <img src="/progix_logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-blue-600 leading-tight truncate">Billing Software</span>
              <span className="text-[9px] font-semibold text-slate-400 tracking-wider">BY PROGIX</span>
            </div>
          </div>
          <button
            className="lg:hidden text-slate-400 hover:text-slate-600 p-1 rounded transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Nav Menu */}
        <nav className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2.5 space-y-2.5">
          {menuGroups.map((group) => {
            const groupItems = group.items.filter((item) => user && item.roles.includes(user.role));
            if (groupItems.length === 0) return null;

            return (
              <div key={group.label} className="space-y-0.5">
                <h3 className="px-2.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {group.label}
                </h3>
                {groupItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-4 w-4 mr-2.5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User Badge & Logout */}
        <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-2.5 w-full p-1.5 rounded-lg transition-colors group bg-white border border-slate-200/60 shadow-xs">
            <div className="h-7 w-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white uppercase overflow-hidden ring-2 ring-blue-50 flex-shrink-0">
              {user?.profileImage ? (
                <img src={user.profileImage} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user ? user.username.slice(0, 2) : 'US'
              )}
            </div>
            <div className="flex-1 overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">{user?.username || storeName}</p>
              <p className="text-[9px] text-slate-400 font-medium capitalize truncate">{user?.role || 'Staff'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-1.5 px-2 rounded-lg text-red-500 hover:bg-red-50 font-medium text-xs transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
