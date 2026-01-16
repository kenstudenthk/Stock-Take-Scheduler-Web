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
  
  // ✅ 1. 定義導航項目與順序 (這決定了 3D 滑塊的 Y 軸位置)
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // ✅ 2. 計算目前選中項目的索引以驅動 CSS 動畫
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-sidebar-bg">
      {/* --- 左側導航欄 (The Floor) --- */}
      <aside className="custom-sider w-[280px] h-screen flex flex-col relative z-[300]">
        <div className="px-8 py-10 flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white shadow-xl border border-white/5">
            <span style={{ fontWeight: 900, fontSize: '20px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-lg font-black leading-none tracking-tighter">Stock Take</h1>
            <p className="text-[10px] font-bold text-teal-400 mt-1 uppercase tracking-widest">Pro Edition</p>
          </div>
        </div>

        {/* ✅ 3. 核心滑塊容器：傳遞 --active-index */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul className="relative">
            {/* ✅ 這是那個會滑動的物理白色 3D 高亮膠囊 (The Fill Pill) */}
            <div className="nav-indicator">
              {/* 反向圓角輔助元素 */}
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
                <span className="icon"><BugOutlined /></span>
                <span className="title font-bold text-[12px]">Report Error</span>
              </a>
            </li>
          </ul>
        </nav>

        {/* 底部使用者卡片 */}
        <div className="p-6">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-4 border border-white/10 shadow-lg">
              <Avatar size="large" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="border border-teal-500" />
              <div className="flex flex-col overflow-hidden">
                <p className="truncate text-sm font-bold text-white m-0">Administrator</p>
                <p className="truncate text-[10px] text-teal-400 m-0 font-black uppercase">Active session</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- ✅ 4. 右側一體化 3D 平台 (The Slab) --- */}
      <div className="flex-1 flex flex-col main-content-area">
        <header className="app-header px-14 flex justify-between items-center bg-transparent border-none">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] m-0 mb-1">Navigation / Context</h2>
             <span className="text-2xl font-black text-slate-800 dark:text-white capitalize tracking-tighter">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Tag color="cyan" className="font-black px-4 py-1 rounded-full border-none shadow-sm text-[12px]">POOL: {poolCount}</Tag>
            <Button size="large" shape="round" className="font-bold border-slate-200 hover:border-teal-500 transition-all">Refresh Data</Button>
            <button onClick={toggleDarkMode} className="h-12 w-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center transition-all hover:scale-110 active:scale-95 shadow-sm">
               <span className="material-symbols-outlined text-[24px] dark:text-white">palette</span>
            </button>
          </Space>
        </header>
        
        <main className="main-scroll-content">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
