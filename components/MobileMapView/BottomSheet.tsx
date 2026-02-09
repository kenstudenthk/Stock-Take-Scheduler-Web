import React, { useRef, useCallback, useEffect } from 'react';
import { MapPin, Navigation, ChevronDown } from 'lucide-react';
import { Shop } from '../../types';
import { Select } from 'antd';

export type BottomSheetState = 'collapsed' | 'half' | 'expanded';

interface ShopWithDistance extends Shop {
  distance?: number; // km from user
}

interface BottomSheetProps {
  shops: ShopWithDistance[];
  selectedShopId: string | null;
  onSelectShop: (shop: Shop) => void;
  onNavigate: (shop: Shop) => void;
  state: BottomSheetState;
  onStateChange: (state: BottomSheetState) => void;
  selectedGroup: number | null;
  onGroupChange: (groupId: number) => void;
}

const CATEGORY_COLORS: Record<number, string> = {
  1: '#3B82F6', // Group A
  2: '#A855F7', // Group B
  3: '#F59E0B', // Group C
};

/**
 * Swipeable bottom sheet displaying shop list with distances.
 * Three states: collapsed (64px), half (40vh), expanded (80vh)
 */
export const BottomSheet: React.FC<BottomSheetProps> = ({
  shops,
  selectedShopId,
  onSelectShop,
  onNavigate,
  state,
  onStateChange,
  selectedGroup,
  onGroupChange,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startStateRef = useRef<BottomSheetState>(state);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Don't drag if touching the selector
    if ((e.target as HTMLElement).closest('.ant-select')) return;
    
    startYRef.current = e.touches[0].clientY;
    startStateRef.current = state;
  }, [state]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    // Don't drag if touching the selector
    if ((e.target as HTMLElement).closest('.ant-select')) return;

    const endY = e.changedTouches[0].clientY;
    const deltaY = startYRef.current - endY;
    const threshold = 50;

    // Determine new state based on swipe direction and current state
    if (deltaY > threshold) {
      // Swipe up
      if (startStateRef.current === 'collapsed') onStateChange('half');
      else if (startStateRef.current === 'half') onStateChange('expanded');
    } else if (deltaY < -threshold) {
      // Swipe down
      if (startStateRef.current === 'expanded') onStateChange('half');
      else if (startStateRef.current === 'half') onStateChange('collapsed');
    }
  }, [onStateChange]);

  const handleDragHandleClick = useCallback(() => {
    // Cycle through states on handle tap
    if (state === 'collapsed') onStateChange('half');
    else if (state === 'half') onStateChange('expanded');
    else onStateChange('collapsed');
  }, [state, onStateChange]);

  const formatDistance = (distanceKm?: number): string => {
    if (distanceKm === undefined) return '--';
    if (distanceKm < 1) return `${Math.round(distanceKm * 1000)}m`;
    return `${distanceKm.toFixed(1)}km`;
  };

  // Sort shops by distance (nearest first), then by name
  const sortedShops = [...shops].sort((a, b) => {
    if (a.distance !== undefined && b.distance !== undefined) {
      return a.distance - b.distance;
    }
    if (a.distance !== undefined) return -1;
    if (b.distance !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

  // Auto-expand when a shop is selected
  useEffect(() => {
    if (selectedShopId && state === 'collapsed') {
      onStateChange('half');
    }
  }, [selectedShopId, state, onStateChange]);

  return (
    <div
      ref={sheetRef}
      className={`mobile-bottom-sheet mobile-bottom-sheet--${state}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Drag Handle */}
      <div
        className="mobile-sheet-handle"
        onClick={handleDragHandleClick}
        role="button"
        aria-label="Toggle sheet size"
      >
        <div className="mobile-sheet-handle-bar" />
      </div>

      {/* Header with Group Selector */}
      <div className="mobile-sheet-header flex items-center justify-between px-4 pb-2">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider mb-0.5">Assigned Group</span>
          <Select
            value={selectedGroup}
            onChange={onGroupChange}
            bordered={false}
            className="mobile-group-select"
            popupMatchSelectWidth={false}
            suffixIcon={<ChevronDown className="w-4 h-4 text-slate-800" />}
            dropdownStyle={{ borderRadius: '12px', padding: '8px' }}
            options={[
              { value: 1, label: <span className="font-bold text-slate-800 text-lg">Group A</span> },
              { value: 2, label: <span className="font-bold text-slate-800 text-lg">Group B</span> },
              { value: 3, label: <span className="font-bold text-slate-800 text-lg">Group C</span> },
            ]}
          />
        </div>
        <span className="mobile-sheet-title text-right">
          <span className="text-xl font-black text-slate-800 block leading-none">{shops.length}</span>
          <span className="text-[10px] text-slate-400 uppercase font-bold">Shops Today</span>
        </span>
      </div>

      {/* Shop List */}
      <div className="mobile-sheet-content">
        {sortedShops.length === 0 ? (
          <div className="mobile-sheet-empty">
            <MapPin className="w-8 h-8 text-slate-300" />
            <p>No shops scheduled for today in this group</p>
          </div>
        ) : (
          sortedShops.map((shop) => {
            const isSelected = shop.id === selectedShopId;
            const groupColor = CATEGORY_COLORS[shop.groupId] || '#94A3B8';
            const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : '-';

            return (
              <div
                key={shop.id}
                className={`mobile-shop-card ${isSelected ? 'mobile-shop-card--selected' : ''}`}
                onClick={() => onSelectShop(shop)}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
              >
                <div className="mobile-shop-card-main">
                  <div className="mobile-shop-card-header">
                    <span className="mobile-shop-name">{shop.name}</span>
                    <span
                      className="mobile-shop-group-badge"
                      style={{ backgroundColor: groupColor }}
                    >
                      {groupLetter}
                    </span>
                  </div>
                  <div className="mobile-shop-address">
                    <MapPin className="w-3 h-3" />
                    <span>{shop.address}</span>
                  </div>
                  <div className="mobile-shop-meta">
                    <span className="mobile-shop-id">{shop.id}</span>
                    <span
                      className="mobile-shop-status"
                      data-status={shop.status?.toLowerCase()}
                    >
                      {shop.status}
                    </span>
                  </div>
                </div>
                <div className="mobile-shop-card-action">
                  <div className="mobile-shop-distance">
                    {formatDistance(shop.distance)}
                  </div>
                  <button
                    className="mobile-navigate-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigate(shop);
                    }}
                    aria-label={`Navigate to ${shop.name}`}
                  >
                    <Navigation className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      <style>{`
        .mobile-group-select .ant-select-selector {
          padding-left: 0 !important;
          background-color: transparent !important;
        }
        .mobile-group-select .ant-select-selection-item {
          padding-right: 24px !important;
        }
      `}</style>
    </div>
  );
};
