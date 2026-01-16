import React, { useMemo } from 'react';
import { View } from '../types';
import { Space, Avatar, Tag } from 'antd';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  poolCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, poolCount = 0 }) => {
  
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { id: View.SHOP_LIST, label: 'Master List', icon: 'inventory' },
    { id: View.CALENDAR, label: 'Schedules', icon: 'event' },
    { id: View.GENERATOR, label: 'Generator', icon: 'auto_settings' },
    { id: View.LOCATIONS, label: 'Map View', icon: 'distance' },
    { id: View.INVENTORY, label: 'Inventory', icon: 'database' },
    { id: View.SETTINGS, label: 'Settings', icon: 'settings_accessibility' },
  ], []);

  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen w-full bg-[#0d1117] overflow-hidden">
      {/* --- 左側 Sidebar (寬度優化) --- */}
      <aside className="custom-sider flex flex-col">
        <div className="px-8 py-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg text-white">
              <span className="material-symbols-outlined">dataset</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-white text-base font-bold leading-none tracking-tight">StockTake</h1>
              <p className="text-blue-400 text-[10px] font-black uppercase mt-1">Enterprise</p>
            </div>
          </div>
        </div>

        {/* 導航容器 */}
        <nav 
          className="input flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          {/* ✅ 3D 滑塊實體 */}
          <div className="nav-indicator">
            <div className="nav-indicator-bottom-curve" />
          </div>

          {menuItems.map((item) => (
            <button 
              key={item.id}
              className={`value ${currentView === item.id ? 'active-nav' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="material-symbols-outlined !text-[22px]">{item.icon}</span>
              <span className="font-bold">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* 底部使用者資訊 */}
        <div className="p-6 mt-auto">
          <div className="flex items-center gap-3 bg-[#161b22] p-3 rounded-2xl border border-[#30363d]">
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <div className="flex flex-col">
              <span className="text-white text-xs font-bold">Admin Manager</span>
              <span className="text-[#7d8590] text-[10px]">Verified Account</span>
            </div>
          </div>
        </div>
      </aside>

      {/* --- 右側 3D Slab --- */}
      <div className="main-content-area flex-1 flex flex-col">
        <header className="app-header">
          <div className="flex justify-between items-center w-full">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Navigation / Index</span>
              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter capitalize">
                {currentView.replace('-', ' ')}
              </h2>
            </div>
            
            <Space size="middle">
              <Tag color="blue" className="px-4 py-1 rounded-full font-bold border-none shadow-sm">POOL: {poolCount}</Tag>
              <button onClick={toggleDarkMode} className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[20px] dark:text-white">contrast</span>
              </button>
            </Space>
          </div>
        </header>

        <main className="main-scroll-content">
          {children}
        </main>
      </div>
    </div>
  );
};