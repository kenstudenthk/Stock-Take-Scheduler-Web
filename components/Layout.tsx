import React from 'react';
import { 
  HomeOutlined, 
  EnvironmentOutlined, 
  DatabaseOutlined, 
  CalendarOutlined, 
  WarningOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  SafetyCertificateOutlined,
  BugOutlined
} from '@ant-design/icons';
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
    { key: View.DASHBOARD, label: 'Dashboard', icon: <HomeOutlined /> },
    { key: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined /> },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined /> },
    { key: View.GENERATOR, label: 'Generator', icon: <SafetyCertificateOutlined /> },
    { key: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined /> },
    { key: View.INVENTORY, label: 'Inventory', icon: <WarningOutlined /> },
  ];

  return (
    <div className="flex h-screen w-full bg-[#f2f5f7] overflow-hidden">
      
      <aside className="uiverse-sidebar-wrapper">
        {/* ✅ Logo 獨立於選單之外 */}
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

          <li className="nav-item-sep">
            <a 
              onClick={() => onViewChange(View.SETTINGS)}
              className={currentView === View.SETTINGS ? 'active' : ''}
            >
              <i><SettingOutlined /></i>
              <span>Settings</span>
            </a>
          </li>
          
          <li>
            <a className="report-link" onClick={onReportError}>
              <i className="text-red-400"><BugOutlined /></i>
              <span className="text-red-400">Report Error</span>
            </a>
          </li>

          <li>
            <a className="profile-nav-btn">
              <i><UserOutlined /></i>
              <span>{user?.Name || 'Profile'}</span>
            </a>
          </li>
          
          <li>
            <a onClick={onLogout} className="logout-nav-btn">
              <i><LogoutOutlined /></i>
              <span>Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      <main className="flex-1 overflow-y-auto p-8 ml-[100px]">
        {children}
      </main>
    </div>
  );
};
