import React, { useMemo } from 'react';
import { 
  DashboardOutlined, 
  ShopOutlined, 
  CalendarOutlined, 
  ToolOutlined, 
  EnvironmentOutlined, 
  DatabaseOutlined, 
  SettingOutlined 
} from '@ant-design/icons';
import { View } from '../types';
import { Avatar, Space, Tag } from 'antd';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  poolCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, poolCount = 0 }) => {
  
  // ✅ 定義與視圖對應的菜單項
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, label: 'Dashboard', icon: <DashboardOutlined /> },
    { id: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined /> },
    { id: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined /> },
    { id: View.GENERATOR, label: 'Generator', icon: <ToolOutlined /> },
    { id: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined /> },
    { id: View.INVENTORY, label: 'Inventory', icon: <ShopOutlined /> },
    { id: View.SETTINGS, label: 'Settings', icon: <SettingOutlined /> },
  ], []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#0d1117]">
      {/* --- 左側 Sidebar --- */}
      <aside className="w-[280px] flex flex-col p-4 z-50">
        {/* Logo 區域 */}
        <div className="px-4 py-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <span style={{ fontWeight: 900 }}>ST</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-white text-sm font-bold leading-none">Stock Take</h1>
            <p className="text-[#7d8590] text-[10px] uppercase font-black mt-1">Enterprise Pro</p>
          </div>
        </div>

        {/* ✅ Uiverse FH638 選單結構 */}
        <nav className="input flex-1">
          {menuItems.map((item) => (
            <button 
              key={item.id}
              className={`value ${currentView === item.id ? 'active-view' : ''}`}
              onClick={() => onNavigate(item.id)}
            >
              <span className="icon-wrapper">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* 使用者卡片 */}
        <div className="mt-auto p-2">
           <div className="flex items-center gap-3 rounded-xl bg-[#161b22] p-3 border border-[#30363d]">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" size="small" />
              <div className="flex flex-col">
                <p className="text-[11px] font-bold text-white m-0">Administrator</p>
                <p className="text-[9px] text-[#7d8590] m-0 uppercase">System Manager</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- 右側 3D Slab 內容區 --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header px-14 flex justify-between items-center bg-transparent border-none">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] m-0">Navigation Index</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="blue" className="font-black px-4 py-1 rounded-full border-none shadow-sm text-[12px]">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:scale-110 transition-transform">
               <span className="material-symbols-outlined text-[20px] dark:text-white">contrast</span>
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
