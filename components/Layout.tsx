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
    { key: View.SETTINGS, label: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f2f5f7] overflow-hidden">
      
      {/* ✅ Tooltip Style Sidebar */}
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
          
          {/* 分隔線與 Profile / Logout */}
          <li className="nav-li-separator"></li>
          
          <li>
            <a className="profile-btn">
              <i><User size={22} /></i>
              <span>{user?.Name || 'User'}</span>
            </a>
          </li>
          <li>
            <a onClick={onLogout} className="logout-btn">
              <i><LogOut size={22} /></i>
              <span>LOGOUT</span>
            </a>
          </li>
        </ul>
      </aside>

      {/* 主內容區：ml-[100px] 給側邊欄留空間 */}
      <main className="flex-1 overflow-y-auto p-8 ml-[100px]">
        {children}
      </main>
    </div>
  );
};
