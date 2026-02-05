import React from 'react';
import {
  HomeOutlined, EnvironmentOutlined, DatabaseOutlined,
  CalendarOutlined, SettingOutlined, LogoutOutlined,
  UserOutlined, SafetyCertificateOutlined, BugOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { View, User, hasAdminAccess } from '../types';

export const Layout: React.FC<any> = ({ children, onLogout, user, onViewChange, currentView, onReportError }) => {
  const isAdmin = hasAdminAccess(user as User | null);

  const allMenuItems = [
    { key: View.DASHBOARD, label: 'Dashboard', icon: <HomeOutlined />, requiresAdmin: false },
    { key: View.SHOP_LIST, label: 'Master List', icon: <DatabaseOutlined />, requiresAdmin: false },
    { key: View.CALENDAR, label: 'Schedules', icon: <CalendarOutlined />, requiresAdmin: false },
    { key: View.GENERATOR, label: 'Generator', icon: <SafetyCertificateOutlined />, requiresAdmin: true },
    { key: View.LOCATIONS, label: 'Map View', icon: <EnvironmentOutlined />, requiresAdmin: false },
    { key: View.INVENTORY, label: 'Inventory', icon: <DatabaseOutlined />, requiresAdmin: true },
    { key: View.PERMISSION, label: 'Permission', icon: <TeamOutlined />, requiresAdmin: true },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(item => !item.requiresAdmin || isAdmin);

return (
    <div className="custom-app-layout">
      <aside className="uiverse-sidebar-wrapper">
        
        {/* ✅ 1. 品牌標誌：固定在紅圈位置 (對齊 Header) */}
        <div className="nav-brand-logo">ST</div>
        
        {/* ✅ 2. 獨立選單條：負責垂直置中 */}
        <ul className="uiverse-nav-ul">
          {menuItems.map((item) => (
            <li key={item.key}>
                <a 
                  onClick={() => onViewChange(item.key)}
                  className={currentView === item.key ? 'active' : ''}
                >
                  {/* ❗ 這裡就是紅圈位置 (圖標) */}
                <i className="nav-icon-slot">{item.icon}</i>
                {/* ❗ 這裡就是紅框位置 (文字)，CSS 會將其移至右側避免重疊 */}
                <span className="nav-label-tooltip">{item.label}</span>
                </a>
              </li>
            ))}

           <li className="nav-item-sep">
            <a onClick={() => onViewChange(View.SETTINGS)} className={currentView === View.SETTINGS ? 'active' : ''}>
              <i className="nav-icon-slot"><SettingOutlined /></i>
              <span className="nav-label-tooltip">Settings</span>
            </a>
          </li>
          
          <li onClick={onReportError}>
            <a className="report-link">
              <i className="nav-icon-slot text-red-400"><BugOutlined /></i>
              <span className="nav-label-tooltip text-red-400">Report Error</span>
            </a>
          </li>

          <li>
            <a className="profile-nav-btn">
              <i className="nav-icon-slot"><UserOutlined /></i>
              <span className="nav-label-tooltip">{user?.Name || 'Profile'}</span>
            </a>
          </li>
          
          <li>
            <a onClick={onLogout} className="logout-nav-btn">
              <i className="nav-icon-slot"><LogoutOutlined /></i>
              <span className="nav-label-tooltip">Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      <main className="custom-main-content">
        {children}
      </main>

      {/* Mobile Bottom Navigation - Hidden by default via CSS, shown only on mobile */}
      <nav className="mobile-bottom-nav">
        {[
          ...menuItems.filter(i => [View.DASHBOARD, View.SHOP_LIST, View.CALENDAR, View.LOCATIONS].includes(i.key)),
          { key: View.SETTINGS, label: 'Settings', icon: <SettingOutlined /> }
        ].map((item) => (
          <button
            key={item.key}
            className={`mobile-nav-item ${currentView === item.key ? 'active' : ''}`}
            onClick={() => onViewChange(item.key)}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};
