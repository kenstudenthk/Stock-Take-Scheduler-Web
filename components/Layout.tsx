import React from 'react';
import { 
  HomeOutlined, EnvironmentOutlined, DatabaseOutlined, 
  CalendarOutlined, SettingOutlined, LogoutOutlined, 
  UserOutlined, SafetyCertificateOutlined, BugOutlined 
} from '@ant-design/icons';
import { View } from '../types';

export const Layout: React.FC<any> = ({ children, onLogout, user, onViewChange, currentView, onReportError }) => {
  const menuItems = [
    { key: View.DASHBOARD, label: 'Home', icon: <HomeOutlined /> },
    { key: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined /> },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined /> },
    { key: View.GENERATOR, label: 'Generator', icon: <SafetyCertificateOutlined /> },
    { key: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined /> },
    { key: View.INVENTORY, label: 'Inventory', icon: <DatabaseOutlined /> },
    { key: View.SETTINGS, label: 'Settings', icon: <SettingOutlined /> },
  ];

  return (
    <div className="custom-app-layout">
      {/* 側邊導航總容器 */}
      <aside className="uiverse-sidebar-wrapper">
        
        {/* ✅ Logo：獨立在頂部，CSS 會將其固定在左上角紅圈處 */}
        <div className="nav-brand-logo">ST</div>

        {/* ✅ Gooey 選單條：CSS 會將這塊條狀物獨立垂直置中 */}
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
