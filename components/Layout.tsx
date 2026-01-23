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
    <div className="custom-app-layout">
      {/* 側邊導航容器 */}
      <aside className="uiverse-sidebar-wrapper">
        
        {/* ✅ Logo：獨立在頂部，CSS 會將它移動到左上角對齊 Header */}
        <div className="nav-brand-logo">ST</div>
        
        {/* ✅ 選單：在螢幕垂直置中 */}
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
      </aside>

      {/* 主內容區 */}
      <main className="custom-main-content">
        {children}
      </main>
    </div>
  );
};
