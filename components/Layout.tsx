import React, { useMemo } from 'react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  
  // ✅ 1. 確保視圖順序與 CSS 滑動位置一致
  const views = useMemo(() => [
    { id: View.DASHBOARD, icon: 'dashboard', label: 'Dashboard' },
    { id: View.SHOP_LIST, icon: 'storefront', label: 'Shop List' },
    { id: View.CALENDAR, icon: 'calendar_month', label: 'Schedules' },
    { id: View.GENERATOR, icon: 'manufacturing', label: 'Generator' },
    { id: View.LOCATIONS, icon: 'map', label: 'Locations' },
    { id: View.SETTINGS, icon: 'settings', label: 'Settings' },
  ], []);

  // ✅ 2. 計算滑動索引
  const activeIndex = views.findIndex(v => v.id === currentView);

  return (
    <div className="flex h-screen w-full bg-sidebar-bg overflow-hidden">
      {/* Sidebar */}
      <aside className="custom-sider w-72 flex flex-col relative">
        <div className="p-8">
           <h1 className="text-white font-black text-xl tracking-tighter italic">STOCK TAKE PRO</h1>
        </div>

        {/* ✅ 3. 傳遞 --active-index 到 CSS */}
        <nav 
          className="navigation flex-1" 
          style={{ '--active-index': activeIndex } as React.CSSProperties}
        >
          <ul>
            {/* ✅ 這是那個實體滑塊組件 */}
            <div className="nav-indicator">
              <div className="nav-indicator-bottom-curve" />
            </div>

            {views.map((item) => (
              <li key={item.id} className={currentView === item.id ? 'active' : ''}>
                <button onClick={() => onNavigate(item.id)}>
                   <span className="material-symbols-outlined icon text-[24px]">
                     {item.icon}
                   </span>
                   <span className="text-sm title">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Slab */}
      <div className="main-content-area flex-1 flex flex-col">
        <header className="app-header">
           <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
             {currentView.replace('_', ' ')}
           </h2>
        </header>

        <main className="main-scroll-content">
          {children}
        </main>
      </div>
    </div>
  );
};
