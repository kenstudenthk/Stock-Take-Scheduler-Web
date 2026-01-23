import React from 'react';
import { 
  HomeOutlined, EnvironmentOutlined, DatabaseOutlined, 
  CalendarOutlined, SettingOutlined, LogoutOutlined, 
  UserOutlined, SafetyCertificateOutlined, BugOutlined 
} from '@ant-design/icons';
import { View } from '../types';

export const Layout: React.FC<any> = ({ children, onLogout, user, onViewChange, currentView, onReportError }) => {
  const menuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <HomeOutlined /> },
    { key: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined /> },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined /> },
    { key: View.GENERATOR, label: 'Generator', icon: <SafetyCertificateOutlined /> },
    { key: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined /> },
    { key: View.INVENTORY, label: 'Inventory', icon: <DatabaseOutlined /> },
  ];

return (
  <div className="custom-app-layout flex">
    {/* 側邊導航 */}
    <aside className="uiverse-sidebar-wrapper">
      
      {/* ✅ 1. 獨立的 Logo 區塊：負責對齊 Header */}
      <div className="nav-logo-slot">
        <div className="nav-brand-logo">ST</div>
      </div>
      
      {/* ✅ 2. 獨立的選單區塊：負責在剩餘空間垂直置中 */}
      <div className="nav-menu-slot">
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
              <a onClick={() => onViewChange(View.SETTINGS)} className={currentView === View.SETTINGS ? 'active' : ''}>
                <i><SettingOutlined /></i>
                <span>Settings</span>
              </a>
            </li>
            
            <li onClick={onReportError}>
              <a className="report-link">
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
        </div>

    </aside>

      {/* 主內容區 */}
      <main className="custom-main-content">
        {children}
      </main>
    </div>
  );
};
