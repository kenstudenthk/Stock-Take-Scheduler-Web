import React, { useMemo } from 'react';
import { 
  HomeOutlined, 
  UnorderedListOutlined, 
  CalendarOutlined, 
  ToolOutlined, 
  ShopOutlined, 
  SettingOutlined,
  LogoutOutlined
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
  
  // ✅ 1. Navigation items in fixed order for sliding logic
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // ✅ 2. Calculate current index for the CSS --active-index variable
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-sidebar-bg">
      {/* Sidebar (The Base) */}
      <aside className="custom-sider w-[280px] h-screen flex flex-col relative">
        <div className="px-8 py-12 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl border border-white/5">
            <span style={{ fontWeight: 900, fontSize: '20px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-xl font-black leading-none tracking-tighter italic">STOCK PRO</h1>
            <p className="text-[10px] font-black text-teal-400 mt-1 uppercase tracking-widest">Enterprise</p>
          </div>
        </div>

        {/* ✅ 3. THE SLIDING PILL NAVIGATION */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul>
            {/* ✅ This is the mechanical bridge component */}
            <div className="nav-indicator">
              <div className="nav-indicator-bottom-curve" />
            </div>

            {menuItems.map((item) => (
              <li 
                key={item.id} 
                className={currentView === item.id ? 'active' : ''}
                onClick={() => onNavigate(item.id)}
              >
                <a href="#" onClick={(e) => e.preventDefault()}>
                  <span className="icon">{item.icon}</span>
                  <span className="title">{item.label}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-8">
           <button className="flex items-center gap-4 text-white/40 hover:text-rose-400 transition-colors">
              <LogoutOutlined className="text-xl" />
              <span className="font-bold">Log Out</span>
           </button>
        </div>
      </aside>

      {/* --- ✅ 4. THE 3D SLAB (One Unified Component) --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header px-14 flex justify-between items-center bg-transparent">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] m-0 mb-1">Navigation System</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="cyan" className="font-black px-4 py-1 rounded-full border-none shadow-sm">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:rotate-12">
               <span className="material-symbols-outlined text-[24px] dark:text-white">settings_brightness</span>
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
