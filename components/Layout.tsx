import React, { useMemo } from 'react';
import { 
  HomeOutlined, 
  UnorderedListOutlined, 
  CalendarOutlined, 
  ToolOutlined, 
  ShopOutlined, 
  SettingOutlined,
  BugOutlined
} from '@ant-design/icons';
import { View } from '../types';
import { Button, Space, Avatar, Tag } from 'antd';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
  poolCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, poolCount = 0 }) => {
  
  // 1. Navigation items in fixed order for sliding logic
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // 2. Calculate current index for the CSS --active-index variable
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-sidebar-bg">
      {/* Sidebar (The Floor) */}
      <aside className="custom-sider w-[280px] h-screen flex flex-col relative z-[50]">
        <div className="px-8 py-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl border border-white/5">
            <span style={{ fontWeight: 900, fontSize: '20px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-xl font-black leading-none italic">STOCK PRO</h1>
            <p className="text-[10px] font-black text-teal-400 mt-1 uppercase">Enterprise</p>
          </div>
        </div>

        {/* 3. Sliding Pill Navigation Area */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul className="relative">
            {/* THIS IS THE PILL HIGHLIGHT THAT SLIDES */}
            <div className="nav-indicator">
              <div className="nav-indicator-bottom-curve" />
            </div>

            {menuItems.map((item) => (
              <li 
                key={item.id} 
                className={`list ${currentView === item.id ? 'active' : ''}`}
                onClick={() => onNavigate(item.id)}
              >
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <span className="icon">{item.icon}</span>
                  <span className="title font-bold">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-8">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white m-0">Admin</p>
                <p className="text-[10px] text-teal-400 m-0 uppercase font-black">Online</p>
              </div>
           </div>
        </div>
      </aside>

      {/* 4. THE 3D SLAB (Main Area) */}
      <div className="flex-1 flex flex-col main-content-area z-[100]">
        <header className="app-header px-14 flex justify-between items-center bg-transparent">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] m-0">Navigation</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="cyan" className="font-black px-4 py-1 rounded-full border-none">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-sm">
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
