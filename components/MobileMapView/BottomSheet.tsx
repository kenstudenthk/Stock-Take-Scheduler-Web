import React, { useRef, useCallback, useEffect } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { Shop } from '../../types';

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
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startStateRef = useRef<BottomSheetState>(state);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startYRef.current = e.touches[0].clientY;
    startStateRef.current = state;
  }, [state]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
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

      {/* Header */}
      <div className="mobile-sheet-header">
        <span className="mobile-sheet-title">
          {shops.length} {shops.length === 1 ? 'shop' : 'shops'} scheduled today
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
    </div>
  );
};
