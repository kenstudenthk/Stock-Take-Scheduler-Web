import React, { useState } from 'react';
import { MapPin, Navigation, ChevronDown, ChevronUp } from 'lucide-react';
import { Select } from 'antd';
import { Shop } from '../../types';

interface TopShopPanelProps {
  selectedGroup: number | null;
  onSelectGroup: (groupId: number) => void;
  shops: (Shop & { distance?: number })[];
  selectedShopId: string | null;
  onSelectShop: (shop: Shop) => void;
  onNavigate: (shop: Shop) => void;
  groupCounts: Record<number, number>;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
}

const CATEGORY_COLORS: Record<number, string> = {
  1: '#3B82F6', // Group A
  2: '#A855F7', // Group B
  3: '#F59E0B', // Group C
};

export const TopShopPanel: React.FC<TopShopPanelProps> = ({
  selectedGroup,
  onSelectGroup,
  shops,
  selectedShopId,
  onSelectShop,
  onNavigate,
  groupCounts,
  expanded,
  onExpandChange
}) => {
  const formatDistance = (distanceKm?: number): string => {
    if (distanceKm === undefined) return '--';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
  };

  // Sort shops by distance
  const sortedShops = [...shops].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    return 0;
  });

  return (
    <div className="mobile-top-panel">
      {/* Header Row: Group Select + Toggle */}
      <div className="mobile-top-header">
        <div className="flex-1">
          <Select
            value={selectedGroup}
            onChange={(val) => {
              onSelectGroup(val);
              onExpandChange(true); // Auto-expand when group changes
            }}
            bordered={false}
            className="mobile-top-group-select"
            popupMatchSelectWidth={false}
            dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            options={[
              { value: 1, label: <span className="font-bold text-slate-800">Group A ({groupCounts[1] || 0})</span> },
              { value: 2, label: <span className="font-bold text-slate-800">Group B ({groupCounts[2] || 0})</span> },
              { value: 3, label: <span className="font-bold text-slate-800">Group C ({groupCounts[3] || 0})</span> },
            ]}
          />
        </div>
        
        <button 
          className="mobile-top-toggle-btn"
          onClick={() => onExpandChange(!expanded)}
        >
          <span className="text-xs font-bold text-slate-500 mr-1">
            {shops.length} Shops
          </span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Shop List */}
      {expanded && (
        <div className="mobile-top-list">
          {sortedShops.length === 0 ? (
            <div className="p-4 text-center text-slate-400 text-sm">
              No shops scheduled for today in this group.
            </div>
          ) : (
            sortedShops.map((shop) => {
              const isSelected = shop.id === selectedShopId;
              const groupColor = CATEGORY_COLORS[shop.groupId] || '#94A3B8';
              
              return (
                <div
                  key={shop.id}
                  className={`mobile-shop-row ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectShop(shop)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 truncate text-sm">{shop.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                        {shop.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-slate-500 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{shop.address}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">
                      {formatDistance(shop.distance)}
                    </span>
                    <button
                      className="p-1.5 bg-blue-50 text-blue-600 rounded-lg active:scale-95 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        onNavigate(shop);
                      }}
                    >
                      <Navigation className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      <style>{`
        .mobile-top-panel {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          background: white;
          border-bottom-left-radius: 20px;
          border-bottom-right-radius: 20px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          max-height: 70vh;
          display: flex;
          flex-direction: column;
        }
        
        .mobile-top-header {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f1f5f9;
        }

        .mobile-top-group-select .ant-select-selector {
          padding: 0 !important;
          font-size: 16px !important;
          font-weight: 800 !important;
        }

        .mobile-top-toggle-btn {
          display: flex;
          align-items: center;
          padding: 6px 12px;
          background: #f8fafc;
          border-radius: 20px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
        }

        .mobile-top-list {
          overflow-y: auto;
          padding: 8px 0;
          -webkit-overflow-scrolling: touch;
        }

        .mobile-shop-row {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #f8fafc;
          transition: background 0.2s;
        }

        .mobile-shop-row:active {
          background: #f1f5f9;
        }

        .mobile-shop-row.selected {
          background: #eff6ff;
          border-left: 3px solid #3b82f6;
        }

        .mobile-shop-row:last-child {
          border-bottom: none;
        }
      `}</style>
    </div>
  );
};
