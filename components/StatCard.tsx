import React from "react";

interface StatCardProps {
  label: string;
  value: number;
  subtext: string;
  bgColor: string;
  icon: React.ReactNode;
  isPulsing?: boolean;
}

/**
 * Shared summary stat card used on Dashboard, Generator, and Locations pages.
 * Uses `bgColor` for the icon area background and left-border accent.
 */
const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  bgColor,
  icon,
  isPulsing = false,
}) => (
  <div
    className={`summary-card-item${isPulsing ? " status-pulse status-pulse--danger" : ""}`}
    style={{ borderLeft: `4px solid ${bgColor}` }}
    aria-label={`${label}: ${value} ${subtext}`}
  >
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu" aria-hidden="true">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

export default StatCard;
