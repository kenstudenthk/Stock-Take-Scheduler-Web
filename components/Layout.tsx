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
  
  // ✅ 1. 定義導航順序 (這決定了滑動塊的 Y 軸位置)
  const menuItems = useMemo(() => [
    { id: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
    { id: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
    { id: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
    { id: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
    { id: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
    { id: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
  ], []);

  // ✅ 2. 計算目前選中項的索引
  const activeIndex = menuItems.findIndex(item => item.id === currentView);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="h-screen w-full flex flex-row overflow-hidden bg-sidebar-bg">
      {/* --- 左側導航欄 (The Floor) --- */}
      <aside className="custom-sider w-[260px] h-screen flex flex-col relative z-[300]">
        <div className="px-6 py-8 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
            <span style={{ fontWeight: 900, fontSize: '18px' }}>ST</span>
          </div>
          <div className="flex flex-col text-white">
            <h1 className="text-base font-bold leading-none">Stock Take</h1>
            <p className="text-[10px] font-medium text-teal-400 mt-1 uppercase tracking-widest">Pro</p>
          </div>
        </div>

        {/* ✅ 3. 滑動導航核心 (The Mechanical Bridge) */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul>
            {/* 這是那個會上下滑動的白色實體 3D 滑塊 */}
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

            <li className="list mt-auto opacity-70 hover:opacity-100">
              <a href="#" className="text-red-400">
                <span className="icon"><BugOutlined /></span>
                <span className="title font-bold">Report Error</span>
              </a>
            </li>
          </ul>
        </nav>

        <div className="px-4 py-6">
           <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 border border-white/10">
              <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
              <div className="flex flex-col">
                <p className="text-[12px] font-bold text-white m-0">Administrator</p>
                <p className="text-[10px] text-teal-400 m-0 font-black uppercase">Stock Manager</p>
              </div>
           </div>
        </div>
      </aside>

      {/* --- ✅ 4. 右側一體化 3D 平台 (The Slab) --- */}
      <div className="flex-1 flex flex-col main-content-area relative z-[100]">
        <header className="app-header px-10 flex justify-between items-center bg-transparent">
          <div className="flex flex-col">
             <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] m-0">System Monitor</h2>
             <span className="text-lg font-bold text-slate-800 dark:text-white capitalize">
               {currentView.replace('-', ' ')}
             </span>
          </div>

          <Space size="large">
            <Button className="rounded-xl font-bold border-slate-200 shadow-sm">Sync Status</Button>
            <Tag color="cyan" className="font-black px-3 rounded-lg border-none shadow-sm">POOL: {poolCount}</Tag>
            <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 transition-all hover:scale-110">
               <span className="material-symbols-outlined text-[20px] dark:text-white">style</span>
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
