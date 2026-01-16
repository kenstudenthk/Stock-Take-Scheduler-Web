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
  
  // ✅ 1. Standardized Menu Order
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // ✅ 2. Precise Index for the Sliding Animation
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-[#0d1117]">
      {/* --- Left Sidebar (Optimized Width 260px) --- */}
      <aside className="w-[260px] h-screen flex flex-col relative z-[500] border-r border-white/5">
        <div className="px-6 py-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg border border-white/10">
            <span style={{ fontWeight: 900, fontSize: '18px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-sm font-bold leading-none tracking-tight">Stock Take</h1>
            <p className="text-[9px] font-black text-blue-400 mt-1 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* ✅ 3. FH638 Navigation with Sliding Indicator */}
        <nav 
          className="input flex-1 px-3" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <div className="relative">
             {/* THE 3D SLIDING PILL */}
             <div className="nav-indicator">
                <div className="nav-indicator-bottom-curve" />
             </div>

             <div className="menu-list-container relative z-10 flex flex-col gap-1">
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
          </div>
        </nav>

        {/* User Profile Card */}
        <div className="p-4 mt-auto">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
              <Avatar size="small" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-[11px] font-bold text-white m-0">Administrator</p>
                <button className="text-[10px] text-blue-400 text-left hover:underline p-0 border-none bg-transparent">Logout</button>
              </div>
           </div>
        </div>
      </aside>

      {/* --- Right Main Slab --- */}
      <div className="flex-1 flex flex-col main-content-area relative z-[100]">
        <header className="app-header px-12 flex justify-between items-center bg-transparent border-none h-20">
          <div className="flex flex-col">
             <h2 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] m-0">Stock Take Pro</h2>
             <span className="text-xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="middle">
            <Tag color="blue" className="font-black px-3 py-0.5 rounded-full border-none shadow-sm text-[11px]">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
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
