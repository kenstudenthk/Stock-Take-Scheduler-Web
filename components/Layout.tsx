import React from 'react';
import { 
  HomeOutlined, 
  EnvironmentOutlined, 
  DatabaseOutlined, 
  CalendarOutlined, 
  SettingOutlined, 
  LogoutOutlined, 
  UserOutlined, 
  SafetyCertificateOutlined,
  BugOutlined,
  WarningOutlined
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

export const Layout: React.FC<LayoutProps> = ({ children, onLogout, user, onViewChange, currentView, onReportError }) => {
  
  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <HomeOutlined /> },
    { key: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined /> },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined /> },
    { key: View.GENERATOR, label: 'Generator', icon: <SafetyCertificateOutlined /> },
    { key: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined /> },
    { key: View.INVENTORY, label: 'Inventory', icon: <WarningOutlined /> },
  ];

  return (
    <div className="custom-app-layout flex">
      <aside className="uiverse-sidebar-wrapper">
        {/* ✅ Logo 獨立在頂部，這會對齊內容區的 Header */}
        <div className="nav-brand-logo">ST</div>
        
        {/* ✅ 選單列表在側邊欄中間垂直置中 */}
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

          {/* 分隔線效果 */}
          <li className="nav-item-sep">
            <a onClick={() => onViewChange(View.SETTINGS)} className={currentView === View.SETTINGS ? 'active' : ''}>
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

      <main className="custom-main-content">
        {children}
      </main>
    </div>
  );
};
