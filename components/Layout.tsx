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
  
  // ✅ 導航項目清單與對應圖標
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, label: 'Dashboard', icon: 'dashboard' },
    { id: View.SHOP_LIST, label: 'Master List', icon: 'list_alt' },
    { id: View.CALENDAR, label: 'Schedules', icon: 'calendar_today' },
    { id: View.GENERATOR, icon: 'settings_suggest', label: 'Generator' },
    { id: View.LOCATIONS, icon: 'map', label: 'Map View' },
    { id: View.INVENTORY, icon: 'inventory_2', label: 'Inventory' },
    { id: View.SETTINGS, icon: 'settings', label: 'Settings' },
  ], []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#0d1117]">
      {/* --- 左側導航欄 (採用新設計) --- */}
      <aside className="w-[260px] flex flex-col p-4">
        <div className="px-4 py-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <span className="material-symbols-outlined">analytics</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold text-white">Stock Take</h1>
            <p className="text-[10px] text-slate-500 uppercase font-black">Pro Edition</p>
          </div>
        </div>

        {/* ✅ Uiverse 結構：.input 容器 */}
        <nav className="input flex-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              className={`value ${currentView === item.id ? 'active-nav' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              {/* 使用 Material Icons 以保持一致性，或替換為您提供的 SVG */}
              <span className="material-symbols-outlined !text-[20px]">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* 使用者卡片 */}
        <div className="mt-auto p-2">
           <div className="flex items-center gap-3 rounded-xl bg-[#161b22] p-3 border border-[#30363d]">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" size="small" />
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-white m-0">Admin User</p>
                <button className="text-[10px] text-blue-400 text-left hover:underline">Sign out</button>
              </div>
           </div>
        </div>
      </aside>

      {/* --- 右側內容區 (維持原本 3D Slab 結構，但背景微調) --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header px-10 flex justify-between items-center bg-transparent">
          <span className="text-lg font-bold text-slate-800 dark:text-white capitalize">
            {currentView.replace('-', ' ')}
          </span>
          <Space size="middle">
            <Tag color="blue" className="rounded-full px-3">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
               <span className="material-symbols-outlined text-[20px] dark:text-white">dark_mode</span>
            </button>
          </Space>
        </header>
        
        <main className="main-scroll-content">
          {children}
        </main>
      </div>
    </div>
  );
};