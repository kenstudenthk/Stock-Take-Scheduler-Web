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

  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <LayoutDashboard />, path: '/' },
    { key: View.SHOP_LIST, label: 'Master List', icon: <Package />, path: '/shop-list' },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarIcon />, path: '/calendar' },
    { key: View.GENERATOR, label: 'Generator', icon: <ShieldAlert />, path: '/generator' },
    { key: View.LOCATIONS, label: 'Map View', icon: <MapPin />, path: '/locations' },
    { key: View.INVENTORY, label: 'Inventory', icon: <FileWarning />, path: '/inventory' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f2f5f7] overflow-hidden">
      
      {/* ✅ 這是你指定的懸浮 Tooltip 導航列 */}
      <aside className="uiverse-sidebar-wrapper">
        <div className="nav-brand-logo">ST</div>
        <ul className="uiverse-nav-ul">
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

          {/* ✅ 第 6 項之後的分隔線與功能 */}
          <li className="nav-item-sep">
            <a 
              onClick={() => navigate('/settings')}
              className={location.pathname === '/settings' ? 'active' : ''}
            >
              <i><SettingsIcon /></i>
              <span>Settings</span>
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

      {/* ✅ 主內容區：ml-[110px] 確保不會被側邊欄擋住 */}
      <main className="flex-1 overflow-y-auto p-8 ml-[110px]">
        {children}
      </main>
    </div>
  );
};
