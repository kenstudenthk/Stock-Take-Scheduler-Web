import React, { useState, useEffect } from "react";
import {
  HomeOutlined,
  EnvironmentOutlined,
  DatabaseOutlined,
  CalendarOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  ThunderboltOutlined,
  BugOutlined,
  TeamOutlined,
  AppstoreOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Popover } from "antd";
import { View, User, hasAdminAccess } from "../types";

type TokenHealth = "valid" | "warning" | "expired";

const TOKEN_DOT_COLOR: Record<TokenHealth, string> = {
  valid: "#22c55e",
  warning: "#f59e0b",
  expired: "#ef4444",
};

function useTokenHealth(): TokenHealth {
  const [health, setHealth] = useState<TokenHealth>("expired");

  useEffect(() => {
    const check = () => {
      const token = localStorage.getItem("graphToken");
      const ts = localStorage.getItem("graphTokenTimestamp");
      if (!token || !ts) {
        setHealth("expired");
        return;
      }
      const minutesLeft = Math.floor(
        (60 * 60 * 1000 - (Date.now() - Number(ts))) / 60000,
      );
      if (minutesLeft <= 0) setHealth("expired");
      else if (minutesLeft <= 15) setHealth("warning");
      else setHealth("valid");
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  return health;
}

export const Layout: React.FC<any> = ({
  children,
  onLogout,
  user,
  onViewChange,
  currentView,
  onReportError,
}) => {
  const isAdmin = hasAdminAccess(user as User | null);
  const tokenHealth = useTokenHealth();
  const [moreOpen, setMoreOpen] = useState(false);

  const allMenuItems = [
    {
      key: View.DASHBOARD,
      label: "Dashboard",
      icon: <HomeOutlined />,
      requiresAdmin: false,
    },
    {
      key: View.CALENDAR,
      label: "Schedules",
      icon: <CalendarOutlined />,
      requiresAdmin: false,
    },
    {
      key: View.GENERATOR,
      label: "Generator",
      icon: <ThunderboltOutlined />,
      requiresAdmin: true,
    },
    {
      key: View.SHOPS,
      label: "Shops",
      icon: <AppstoreOutlined />,
      requiresAdmin: false,
    },
    {
      key: View.REPORTS,
      label: "Reports",
      icon: <BarChartOutlined />,
      requiresAdmin: false,
    },
    {
      key: View.TIME_CARD,
      label: "Time Card",
      icon: <ClockCircleOutlined />,
      requiresAdmin: false,
    },
    {
      key: View.INVENTORY,
      label: "Inventory",
      icon: <DatabaseOutlined />,
      requiresAdmin: true,
    },
    {
      key: View.PERMISSION,
      label: "Permission",
      icon: <TeamOutlined />,
      requiresAdmin: true,
    },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    (item) => !item.requiresAdmin || isAdmin,
  );

  const tokenDot = (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: TOKEN_DOT_COLOR[tokenHealth],
        position: "absolute",
        top: 8,
        right: 8,
        boxShadow: `0 0 4px ${TOKEN_DOT_COLOR[tokenHealth]}`,
      }}
      aria-label={`Token status: ${tokenHealth}`}
    />
  );

  return (
    <div className="custom-app-layout">
      <aside className="uiverse-sidebar-wrapper">
        {/* ✅ 1. 品牌標誌：固定在紅圈位置 (對齊 Header) */}
        <div className="nav-brand-logo">ST</div>

        {/* ✅ 2. 獨立選單條：負責垂直置中 */}
        <ul className="uiverse-nav-ul">
          {/* Schedule group: Dashboard, Schedules, Generator */}
          {menuItems
            .filter((item) =>
              [View.DASHBOARD, View.CALENDAR, View.GENERATOR].includes(
                item.key,
              ),
            )
            .map((item) => (
              <li key={item.key}>
                <a
                  onClick={() => onViewChange(item.key)}
                  className={currentView === item.key ? "active" : ""}
                >
                  <i className="nav-icon-slot">{item.icon}</i>
                  <span className="nav-label-tooltip">{item.label}</span>
                </a>
              </li>
            ))}

          {/* Separator between schedule and data groups */}
          <li
            className="nav-group-sep"
            aria-hidden="true"
            style={{
              margin: "4px 12px",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: 0,
              height: 0,
            }}
          />

          {/* Data group: Shops, Reports, Time Card */}
          {menuItems
            .filter((item) =>
              [View.SHOPS, View.REPORTS, View.TIME_CARD].includes(item.key),
            )
            .map((item) => (
              <li key={item.key}>
                <a
                  onClick={() => onViewChange(item.key)}
                  className={currentView === item.key ? "active" : ""}
                >
                  <i className="nav-icon-slot">{item.icon}</i>
                  <span className="nav-label-tooltip">{item.label}</span>
                </a>
              </li>
            ))}

          {/* Admin group: Inventory, Permission */}
          {isAdmin &&
            menuItems
              .filter((item) =>
                [View.INVENTORY, View.PERMISSION].includes(item.key),
              )
              .map((item) => (
                <li key={item.key}>
                  <a
                    onClick={() => onViewChange(item.key)}
                    className={currentView === item.key ? "active" : ""}
                  >
                    <i className="nav-icon-slot">{item.icon}</i>
                    <span className="nav-label-tooltip">{item.label}</span>
                  </a>
                </li>
              ))}

          <li className="nav-item-sep">
            <a
              onClick={() => onViewChange(View.SETTINGS)}
              className={currentView === View.SETTINGS ? "active" : ""}
              style={{ position: "relative" }}
            >
              <i className="nav-icon-slot">
                <SettingOutlined />
              </i>
              <span className="nav-label-tooltip">Settings</span>
              {tokenDot}
            </a>
          </li>

          <li onClick={onReportError}>
            <a className="report-link">
              <i className="nav-icon-slot text-red-400">
                <BugOutlined />
              </i>
              <span className="nav-label-tooltip text-red-400">
                Report Error
              </span>
            </a>
          </li>

          <li>
            <a className="profile-nav-btn">
              <i className="nav-icon-slot">
                <UserOutlined />
              </i>
              <span className="nav-label-tooltip">
                {user?.Name || "Profile"}
              </span>
            </a>
          </li>

          <li>
            <a onClick={onLogout} className="logout-nav-btn">
              <i className="nav-icon-slot">
                <LogoutOutlined />
              </i>
              <span className="nav-label-tooltip">Logout</span>
            </a>
          </li>
        </ul>
      </aside>

      <main className="custom-main-content">{children}</main>

      {/* Mobile Bottom Navigation - Hidden by default via CSS, shown only on mobile */}
      <nav className="mobile-bottom-nav">
        {[View.DASHBOARD, View.SHOPS, View.CALENDAR].map((viewKey) => {
          const item = menuItems.find((i) => i.key === viewKey);
          if (!item) return null;
          return (
            <button
              key={item.key}
              className={`mobile-nav-item ${currentView === item.key ? "active" : ""}`}
              onClick={() => onViewChange(item.key)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}

        {isAdmin ? (
          <Popover
            open={moreOpen}
            onOpenChange={setMoreOpen}
            placement="topRight"
            trigger="click"
            content={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 4,
                  minWidth: 140,
                }}
              >
                {[
                  {
                    key: View.REPORTS,
                    label: "Reports",
                    icon: <BarChartOutlined />,
                  },
                  {
                    key: View.TIME_CARD,
                    label: "Time Card",
                    icon: <ClockCircleOutlined />,
                  },
                  {
                    key: View.GENERATOR,
                    label: "Generator",
                    icon: <ThunderboltOutlined />,
                  },
                  {
                    key: View.INVENTORY,
                    label: "Inventory",
                    icon: <DatabaseOutlined />,
                  },
                  {
                    key: View.PERMISSION,
                    label: "Permission",
                    icon: <TeamOutlined />,
                  },
                  {
                    key: View.SETTINGS,
                    label: "Settings",
                    icon: <SettingOutlined />,
                  },
                ].map((item) => (
                  <button
                    key={item.key}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 12px",
                      border: "none",
                      background:
                        currentView === item.key ? "#f0fdfa" : "transparent",
                      borderRadius: 8,
                      cursor: "pointer",
                      color: currentView === item.key ? "#0d9488" : "#334155",
                      fontWeight: currentView === item.key ? 700 : 500,
                      fontSize: 13,
                      width: "100%",
                      textAlign: "left",
                    }}
                    onClick={() => {
                      onViewChange(item.key);
                      setMoreOpen(false);
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    {item.key === View.SETTINGS && tokenDot}
                  </button>
                ))}
              </div>
            }
          >
            <button
              className={`mobile-nav-item ${[View.GENERATOR, View.INVENTORY, View.PERMISSION, View.SETTINGS, View.TIME_CARD].includes(currentView) ? "active" : ""}`}
              style={{ position: "relative" }}
            >
              <AppstoreOutlined />
              <span>More</span>
              {[View.SETTINGS].includes(currentView) && tokenDot}
            </button>
          </Popover>
        ) : (
          <button
            className={`mobile-nav-item ${currentView === View.SETTINGS ? "active" : ""}`}
            onClick={() => onViewChange(View.SETTINGS)}
            style={{ position: "relative" }}
          >
            <SettingOutlined />
            {tokenDot}
            <span>Settings</span>
          </button>
        )}
      </nav>
    </div>
  );
};
