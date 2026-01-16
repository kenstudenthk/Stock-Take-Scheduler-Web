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
import { Space, Avatar, Tag, Button } from 'antd';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  poolCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, poolCount = 0 }) => {
  
  // ✅ Standardized items based on your Enum (types.ts)
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
      {/* --- Sidebar Floor --- */}
      <aside className="w-[280px] h-screen flex flex-col relative z-[500]">
        {/* Top Branding */}
        <div className="px-8 py-10 flex items-center gap-3 flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg">
            <span style={{ fontWeight: 900, fontSize: '18px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-sm font-bold leading-none">Stock Take</h1>
            <p className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* ✅ Center-aligned FH638 Navigation */}
        <div className="flex-1 flex flex-col justify-center px-4 overflow-hidden">
          <nav className="input">
            {menuItems.map((item) => (
              <button 
                key={item.id}
                className={`value ${currentView === item.id ? 'active-nav' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <span className="icon-box">{item.icon}</span>
                <span className="label-text font-bold">{item.label}</span>
              </button>
            ))}
            
            {/* Separate item for Error Reporting at bottom of group */}
            <button className="value mt-4 text-rose-400">
               <span className="icon-box"><BugOutlined /></span>
               <span className="label-text font-bold">Report Error</span>
            </button>
          </nav>
        </div>

        {/* Bottom User Info */}
        <div className="p-6 mt-auto flex-shrink-0">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10 shadow-lg">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
              <div className="flex flex-col overflow-hidden text-white">
                <p className="truncate text-xs font-bold m-0">Administrator</p>
                <p className="truncate text-[9px] text-blue-400 m-0 uppercase font-black">Active session</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- Right 3D Slab Surface --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header px-14 flex justify-between items-center bg-transparent h-20 border-none">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] m-0">Navigation Index</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="blue" className="font-black px-4 py-1 rounded-full border-none shadow-sm">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 shadow-sm">
               <span className="material-symbols-outlined text-[22px] dark:text-white">contrast</span>
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
