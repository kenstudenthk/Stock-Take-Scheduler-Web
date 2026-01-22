import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
}

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // 定義選單數據
  const topMenuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { key: View.SHOP_LIST, label: 'Master List', icon: <Package />, path: '/shop-list' },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarIcon />, path: '/calendar' },
    { key: View.GENERATOR, label: 'Generator', icon: <ShieldAlert />, path: '/generator' },
    { key: View.LOCATIONS, label: 'Map View', icon: <MapPin />, path: '/locations' },
  ];

  const bottomMenuItems = [
    { key: View.INVENTORY, label: 'Inventory', icon: <FileWarning />, path: '/inventory' },
    { key: View.SETTINGS, label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <div className="flex w-full bg-[#f2f5f7]">
      
      {/* ✅ 側邊導航容器 */}
      <aside className="side-nav-container">
        <div className="nav-st-logo">ST</div>
        
        <ul className="uiverse-nav-ul">
          {/* 上半部分選單 */}
          {topMenuItems.map((item) => (
            <li key={item.key}>
              <a 
                onClick={() => navigate(item.path)}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <i>{item.icon}</i>
                <span>{item.label}</span>
              </a>
            </li>
          ))}

          {/* ✅ 下半部分選單 (從第 6 項開始，加上分隔線) */}
          {bottomMenuItems.map((item, index) => (
            <li key={item.key} className={index === 0 ? 'nav-item-separator' : ''}>
              <a 
                onClick={() => navigate(item.path)}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <i>{item.icon}</i>
                <span>{item.label}</span>
              </a>
            </li>
          ))}

          {/* Profile & Logout */}
          <li>
            <a className="profile-link">
              <i><User /></i>
              <span>{user?.Name || 'Profile'}</span>
            </a>
          </li>
          <li>
            <a onClick={onLogout} className="logout-nav-item">
              <i><LogOut /></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* 主內容區 */}
      <main className="main-content-layout">
        {children}
      </main>
    </div>
  );
};
