import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  Calendar as CalendarIcon, 
  FileWarning, 
  Settings as SettingsIcon,
  LogOut,
  User,
  ShieldAlert
} from 'lucide-react';
import { View } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  user: any;
  onViewChange: (view: View) => void;
  currentView: View;
  onReportError: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, 
  onLogout, 
  user, 
  onViewChange, 
  currentView,
  onReportError
}) => {
  
  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard /> },
    { key: View.SHOP_LIST, label: 'Master List', icon: <Package /> },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarIcon /> },
    { key: View.GENERATOR, label: 'Generator', icon: <ShieldAlert /> },
    { key: View.LOCATIONS, label: 'Map View', icon: <MapPin /> },
    { key: View.INVENTORY, label: 'Inventory', icon: <FileWarning /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f2f5f7] overflow-hidden">
      {/* 懸浮側邊欄 */}
      <aside className="uiverse-sidebar-wrapper">
        <div className="nav-brand-logo">ST</div>
        <ul className="uiverse-nav-ul">
          {menuItems.map((item) => (
            <li key={item.key}>
              <a 
                onClick={() => onViewChange(item.key)}
                className={currentView === item.key ? 'active' : ''}
              >
                <i>{item.icon}</i>
                <span>{item.label}</span>
              </a>
            </li>
          ))}

          {/* 分隔線與功能項 */}
          <li className="nav-item-sep">
            <a 
              onClick={() => onViewChange(View.SETTINGS)}
              className={currentView === View.SETTINGS ? 'active' : ''}
            >
              <i><SettingsIcon /></i>
              <span>Settings</span>
            </a>
          </li>
          
          <li>
            <a className="report-link" onClick={onReportError} style={{ cursor: 'pointer' }}>
              <i className="text-red-400"><FileWarning /></i>
              <span className="text-red-400">Report Error</span>
            </a>
          </li>

          <li>
            <a className="profile-nav-btn">
              <i><User /></i>
              <span>{user?.Name || 'Profile'}</span>
            </a>
          </li>
          
          <li>
            <a onClick={onLogout} className="logout-nav-btn">
              <i><LogOut /></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* 主內容區 */}
      <main className="flex-1 overflow-y-auto p-8 ml-[110px]">
        {children}
      </main>
    </div>
  );
};
