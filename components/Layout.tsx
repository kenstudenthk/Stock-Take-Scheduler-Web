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

  // 定義選單
  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { key: View.SHOP_LIST, label: 'Master List', icon: <Package />, path: '/shop-list' },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarIcon />, path: '/calendar' },
    { key: View.GENERATOR, label: 'Generator', icon: <ShieldAlert />, path: '/generator' },
    { key: View.LOCATIONS, label: 'Map View', icon: <MapPin />, path: '/locations' },
    { key: View.INVENTORY, label: 'Inventory', icon: <FileWarning />, path: '/inventory' },
  ];

  return (
    <div className="app-layout-root">
      {/* ✅ 這裡改用你提供的 HTML 結構，完全不使用 Ant Design */}
      <aside className="uiverse-sidebar-nav">
        <div className="nav-brand-st">ST</div>
        
        <ul className="nav-ul-container">
          {menuItems.map((item) => (
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

          {/* 分隔線 (Settings 之前) */}
          <li className="nav-item-separator">
            <a 
              onClick={() => navigate('/settings')}
              className={location.pathname === '/settings' ? 'active' : ''}
            >
              <i><SettingsIcon /></i>
              <span>Settings</span>
            </a>
          </li>

          <li>
            <a className="profile-nav-link">
              <i><User /></i>
              <span>{user?.Name || 'Profile'}</span>
            </a>
          </li>

          <li>
            <a onClick={onLogout} className="logout-nav-link">
              <i><LogOut /></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* ✅ 主內容區域：不需要再被 Layout 包裹 */}
      <main className="app-main-content">
        {children}
      </main>
    </div>
  );
};
