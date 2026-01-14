import React, { useState } from 'react';
import { View, NavItemProps } from '../types';

const NavItem: React.FC<NavItemProps> = ({ view, currentView, icon, label, onClick, filled = false }) => {
  const isActive = currentView === view;
  return (
    <button
      onClick={() => onClick(view)}
      className={`group flex w-full items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
        isActive
          ? 'bg-primary/10 text-primary dark:text-teal-400'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-teal-400'
      }`}
    >
      <span
        className="material-symbols-outlined text-[24px]"
        style={{ fontVariationSettings: isActive || filled ? "'FILL' 1" : "'FILL' 0" }}
      >
        {icon}
      </span>
      <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
};

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onNavigate: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate }) => {
  // ✅ 新增：控制側邊欄開啟狀態
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
  };

  return (
    <div className="flex h-screen w-full relative overflow-hidden">
      {/* Sidebar - 側邊欄 */}
      <aside 
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col 
          border-r border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark 
          transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        `}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-emerald-600 text-white shadow-lg shadow-primary/30">
              <span className="material-symbols-outlined">inventory_2</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-none text-slate-900 dark:text-white">Stock Take</h1>
              <p className="text-xs font-medium text-primary dark:text-teal-400 mt-1">Scheduler Pro</p>
            </div>
          </div>

          {/* ✅ 移至此處的 Uiverse 樣式按鈕 (僅在側邊欄內顯示) */}
          <div className="flex items-center justify-center">
            <input 
              type="checkbox" 
              id="checkbox" 
              checked={isSidebarOpen} 
              onChange={() => setIsSidebarOpen(!isSidebarOpen)} 
            />
            <label htmlFor="checkbox" className="toggle">
              <div className="bars" id="bar1"></div>
              <div className="bars" id="bar2"></div>
              <div className="bars" id="bar3"></div>
            </label>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-2 px-4 py-4">
          <NavItem
            view={View.DASHBOARD}
            currentView={currentView}
            icon="dashboard"
            label="Dashboard"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
            filled
          />
          <NavItem
            view={View.LOCATIONS}
            currentView={currentView}
            icon="storefront"
            label="Shop Locations"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
          />
           <NavItem
            view={View.GENERATOR}
            currentView={currentView}
            icon="manufacturing"
            label="Generator"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
          />
          <NavItem
            view={View.CALENDAR}
            currentView={currentView}
            icon="calendar_month"
            label="Schedules"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
          />
          <NavItem
            view={View.REPORTS}
            currentView={currentView}
            icon="description"
            label="Reports"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
          />
          <NavItem
            view={View.SETTINGS}
            currentView={currentView}
            icon="settings"
            label="Settings"
            onClick={(v) => { onNavigate(v); setIsSidebarOpen(false); }}
          />
        </nav>

        <div className="border-t border-slate-200 dark:border-slate-700 p-4">
          <div className="flex items-center gap-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 border border-slate-100 dark:border-slate-700/50">
            <div
              className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 bg-cover bg-center"
              style={{
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCOwRhaVG0nys6AQtFT7UbpaKinLDW-zCp5RiCkIq62lIEC1nF2x8omMYhE3J5-dOXSqE5G79TMwlGuN9ktspu_Y9fpOMXeX3Ou1q4xlbD2HhrbhHNMXp_55Bh2KBA0G_R5Apm-9MQrQQCIWZgSL7IPPaB4nRDhHtk5K7kNB9KU0fLQ9v86FWvH5oMefWTLVg9rIwyVyb-Tfc8Hv1APU3p59t--RlHrskkf7J8JYe51-yf94OclIUIq2oQ1pw5ivQPWeHpZL1S3W-o')",
              }}
            ></div>
            <div className="flex flex-col overflow-hidden">
              <p className="truncate text-sm font-bold text-slate-900 dark:text-white">John Doe</p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">Inventory Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* 背景遮罩 (手機版開啟側邊欄時) */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Main Content - 主內容區 */}
      <main className="flex flex-1 flex-col overflow-hidden relative">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-700 bg-surface-light dark:bg-surface-dark px-6 transition-colors duration-200 z-20">
          <div className="flex items-center gap-4 lg:hidden">
            {/* ✅ 手機版 Header 內也放一個相同的按鈕，以便在側邊欄關閉時開啟它 */}
            <div className="flex items-center justify-center">
              <input 
                type="checkbox" 
                id="checkbox-header" 
                checked={isSidebarOpen} 
                onChange={() => setIsSidebarOpen(!isSidebarOpen)} 
                className="hidden"
              />
              <label htmlFor="checkbox-header" className="toggle scale-75">
                <div className="bars" id="bar1"></div>
                <div className="bars" id="bar2"></div>
                <div className="bars" id="bar3"></div>
              </label>
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Stock Take</h2>
          </div>
          
          <div className="hidden lg:flex items-center gap-4">
            <nav className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400">
               <span>App</span>
               <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
               <span className="text-primary dark:text-teal-400 capitalize">{currentView.toLowerCase().replace('_', ' ')}</span>
            </nav>
          </div>

          <div className="flex flex-1 justify-end items-center gap-4">
            <div className="hidden md:flex relative max-w-md w-full">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
              </div>
              <input
                className="block w-full rounded-lg border-0 bg-slate-100 dark:bg-slate-800 py-2 pl-10 pr-4 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-primary sm:text-sm"
                placeholder="Search shops, schedules..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2">
              <button className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative">
                <span className="material-symbols-outlined text-[20px]">notifications</span>
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-secondary border-2 border-surface-light dark:border-surface-dark"></span>
              </button>
              <button
                className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                onClick={toggleDarkMode}
              >
                <span className="material-symbols-outlined text-[20px] hidden dark:block">light_mode</span>
                <span className="material-symbols-outlined text-[20px] dark:hidden">dark_mode</span>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark scroll-smooth">
            {children}
        </div>
      </main>
    </div>
  );
};
