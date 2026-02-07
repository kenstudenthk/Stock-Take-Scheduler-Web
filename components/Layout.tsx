import React, { useState, useEffect } from 'react';
import { View, User, hasAdminAccess } from '../types';
import { Menu, Settings, LogOut, AlertCircle, Users, Home, Map, Package, Calendar, Database, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user?: User | null;
  onViewChange: (view: View) => void;
  currentView: View;
  onReportError: () => void;
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  onLogout,
  user,
  onViewChange,
  currentView,
  onReportError,
}) => {
  const isAdmin = hasAdminAccess(user as User | null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: Home },
    { key: View.SHOP_LIST, label: 'Master List', icon: Database },
    { key: View.CALENDAR, label: 'Schedules', icon: Calendar },
    ...(isAdmin ? [{ key: View.GENERATOR, label: 'Generator', icon: Zap }] : []),
    { key: View.LOCATIONS, label: 'Map View', icon: Map },
    ...(isAdmin ? [{ key: View.INVENTORY, label: 'Inventory', icon: Package }] : []),
    ...(isAdmin ? [{ key: View.PERMISSION, label: 'Permission', icon: Users }] : []),
  ];

  const getIcon = (IconComponent: any) => <IconComponent className="w-5 h-5" />;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col ${isMobile ? 'absolute z-50' : ''}`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-gray-800">
          <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-lg">
            ST
          </div>
          {isSidebarOpen && !isMobile && <span className="ml-3 font-bold text-lg">Stock Take</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="px-2 space-y-1">
            {menuItems.map(item => {
              const IconComponent = item.icon;
              const isActive = currentView === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    onViewChange(item.key);
                    if (isMobile) setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  {getIcon(IconComponent)}
                  {isSidebarOpen && !isMobile && <span className="text-sm font-medium">{item.label}</span>}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="border-t border-gray-800 p-2 space-y-1">
          <button
            onClick={() => onViewChange(View.SETTINGS)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
              currentView === View.SETTINGS
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <Settings className="w-5 h-5" />
            {isSidebarOpen && !isMobile && <span className="text-sm font-medium">Settings</span>}
          </button>

          <button
            onClick={onReportError}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-gray-800 transition"
          >
            <AlertCircle className="w-5 h-5" />
            {isSidebarOpen && !isMobile && <span className="text-sm font-medium">Report Error</span>}
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-white transition"
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && !isMobile && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>

        {/* User Info */}
        {isSidebarOpen && !isMobile && (
          <div className="border-t border-gray-800 p-4">
            <div className="text-xs">
              <p className="text-gray-400">Logged in as</p>
              <p className="font-bold text-white truncate">{user?.Name || 'User'}</p>
              <p className="text-gray-500 text-xs">{user?.UserRole || 'Member'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <h1 className="font-bold text-lg text-gray-900">Stock Take</h1>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
};

export default Layout;
