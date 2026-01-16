import React, { useMemo } from 'react';
import { 
  DashboardOutlined, 
  UnorderedListOutlined, 
  CalendarOutlined, 
  ToolOutlined, 
  ShopOutlined, 
  SettingOutlined,
  BugOutlined 
} from '@ant-design/icons';
import { View } from '../types';
import { Space, Avatar, Tag } from 'antd';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  poolCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, poolCount = 0 }) => {
  
  // ✅ Menu items configuration
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#0d1117]">
      {/* --- Left Sidebar (The Floor) --- */}
      <aside className="w-[280px] h-screen flex flex-col relative z-[500] border-r border-white/5">
        {/* Top Logo Section */}
        <div className="px-8 py-10 flex items-center gap-3 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <span style={{ fontWeight: 900, fontSize: '18px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-sm font-bold leading-none tracking-tight">Stock Take</h1>
            <p className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* ✅ Center-aligned Navigation (FH638 Effect) */}
        <nav className="input flex-1 flex flex-col justify-center px-4">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                className={`value ${currentView === item.id ? 'active-view' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="icon-box">{item.icon}</span>
                <span className="label-text font-bold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom User Info */}
        <div className="p-6 mt-auto flex-shrink-0">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10 shadow-lg">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-xs font-bold text-white m-0">Administrator</p>
                <button className="text-[10px] text-blue-400 text-left hover:underline p-0 border-none bg-transparent">Sign Out</button>
              </div>
           </div>
        </div>
      </aside>

      {/* --- Right 3D Slab (The Main Surface) --- */}
      <div className="flex-1 flex flex-col main-content-area relative z-[100]">
        <header className="app-header px-14 flex justify-between items-center bg-transparent border-none">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] m-0 mb-1">Navigation / Context</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="blue" className="font-black px-4 py-1 rounded-full border-none shadow-sm text-[12px]">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm">
               <span className="material-symbols-outlined text-[24px] dark:text-white">contrast</span>
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
