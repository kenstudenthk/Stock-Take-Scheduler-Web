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
    { key: View.SETTINGS, label: 'Settings', icon: <SettingOutlined /> },
  ];

  return (
    <div className="custom-app-layout">
      {/* 側邊導航容器 */}
      <aside className="uiverse-sidebar-wrapper">
        
        {/* ✅ Logo 固定在左上角 (紅圈位置) */}
        <div className="nav-brand-logo">ST</div>

        {/* ✅ 新的 Gooey Navbar 結構 */}
        <nav className="navbar">
          <ul className="navbar__menu">
            {menuItems.map((item) => (
              <li key={item.key} className="navbar__item">
                <a 
                  onClick={() => onViewChange(item.key)}
                  className={`navbar__link ${currentView === item.key ? 'active' : ''}`}
                >
                  <i className="anticon-wrapper">{item.icon}</i>
                  <span>{item.label}</span>
                </a>
              </li>
            ))}

            <li className="navbar__item" onClick={onReportError}>
              <a className="navbar__link">
                <i className="anticon-wrapper text-red-500"><BugOutlined /></i>
                <span className="text-red-500">Report Error</span>
              </a>
            </li>

            <li className="navbar__item">
              <a className="navbar__link">
                <i className="anticon-wrapper"><UserOutlined /></i>
                <span>{user?.Name || 'Profile'}</span>
              </a>
            </li>

            <li className="navbar__item">
              <a onClick={onLogout} className="navbar__link">
                <i className="anticon-wrapper"><LogoutOutlined /></i>
                <span>Logout</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>

      {/* 主內容區 */}
      <main className="custom-main-content">
        {children}
      </main>
    </div>
  );
};
