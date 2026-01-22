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
    { key: View.SHOP_LIST, label: 'Shop List', icon: <Package />, path: '/shop-list' },
    { key: View.CALENDAR, label: 'Calendar', icon: <CalendarIcon />, path: '/calendar' },
    { key: View.GENERATOR, label: 'Generator', icon: <ShieldAlert />, path: '/generator' },
    { key: View.LOCATIONS, label: 'Locations', icon: <MapPin />, path: '/locations' },
    { key: View.INVENTORY, label: 'Inventory', icon: <FileWarning />, path: '/inventory' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f2f5f7] overflow-hidden">
      
      {/* ✅ 懸浮式導航 (基於你的 HTML 結構) */}
      <aside className="uiverse-nav-wrapper">
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
          
          {/* ✅ 分隔線後的 Settings 與 Profile/Logout */}
          <li className="nav-li-separator">
            <a 
              onClick={() => navigate('/settings')}
              className={location.pathname === '/settings' ? 'active' : ''}
            >
              <i><SettingsIcon /></i>
              <span>Settings</span>
            </a>
          </li>
          <li>
            <a className="profile-nav-item">
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

      {/* ✅ 主內容區域：加上左邊距 ml-[110px] 給側邊欄留位置 */}
      <main className="flex-1 overflow-y-auto p-8 ml-[110px]">
        {children}
      </main>
    </div>
  );
};
