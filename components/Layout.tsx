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
  
  // ✅ 1. 定義導航順序，這決定了滑動塊的位移位置
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // ✅ 2. 計算目前視圖的索引 (用於 CSS 變數)
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-sidebar-bg">
      {/* --- 左側導航欄 --- */}
      <aside className="custom-sider w-[280px] h-screen flex flex-col relative">
        <div className="px-8 py-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl border border-white/5">
            <span style={{ fontWeight: 900, fontSize: '20px' }}>ST</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold leading-none text-white tracking-tight">Stock Take</h1>
            <p className="text-[10px] font-black text-teal-400 mt-1 uppercase tracking-[0.2em]">Scheduler Pro</p>
          </div>
        </div>

        {/* ✅ 3. 滑動導航 (The Mechanical Bridge) */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul>
            {/* 這是那個會上下滑動的實體 3D 滑塊 */}
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
                  <span className="title">{item.label}</span>
                </a>
              </li>
            ))}

            <li className="list mt-auto opacity-50 hover:opacity-100 transition-opacity">
              <a href="#" className="text-rose-400">
                <span className="icon"><LogoutOutlined /></span>
                <span className="title font-bold">Sign Out</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="p-6">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10">
              <Avatar size="large" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="border-2 border-teal-500" />
              <div className="flex flex-col">
                <p className="text-sm font-bold text-white m-0">Administrator</p>
                <p className="text-[10px] text-teal-400 m-0 uppercase font-black">Online Now</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- ✅ 4. 右側一體化 3D 內容區 (The Slab) --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header flex justify-between items-center bg-transparent">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] m-0 mb-1">Navigation / Context</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="middle">
            <Tag color="cyan" className="font-black px-4 py-1 rounded-full border-none shadow-sm text-[12px]">POOL: {poolCount}</Tag>
            <Button size="large" shape="round" className="font-bold border-slate-200 shadow-sm">Sync Data</Button>
            <button onClick={toggleDarkMode} className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95">
               <span className="material-symbols-outlined text-[24px] dark:text-white">palette</span>
            </button>
          </Space>
        </header>
        
        <main className="main-scroll-content">
          <div className="fade-in-content">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
