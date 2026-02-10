import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { message } from 'antd';
import { Locate, AlertCircle, X } from 'lucide-react';
import dayjs from 'dayjs';
import { Shop } from '../../types';
import { wgs84ToGcj02 } from '../../utils/coordTransform';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useAMapRoute } from '../../hooks/useAMapRoute';
import { TopShopPanel } from './TopShopPanel';
import { RoutePanel } from './RoutePanel';

declare global {
  interface Window {
    AMap: any;
  }
}

interface MobileMapViewProps {
  shops: Shop[];
}

const CATEGORY_COLORS: Record<number, string> = {
  1: '#3B82F6', // Group A
  2: '#A855F7', // Group B
  3: '#F59E0B', // Group C
};

/**
 * Calculate Haversine distance between two points in km
 */
const haversineDistance = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Mobile-optimized map view for Field Engineers.
 * Features: Top Dropdown Shop List, GPS location, route planning.
 */
export const MobileMapView: React.FC<MobileMapViewProps> = ({ shops }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});
  const userMarkerRef = useRef<any>(null);

  const [selectedGroup, setSelectedGroup] = useState<number | null>(1); // Default to Group A
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);

  const {
    position: userPosition,
    loading: gpsLoading,
    error: gpsError,
    getCurrentPosition,
    clearError: clearGpsError,
  } = useGeolocation();

  const {
    walking,
    transit,
    activeRoute,
    loading: routeLoading,
    planRoute,
    showRoute,
    clearRoute,
  } = useAMapRoute();

  // Filter shops: today's date + selected group
  const todayShops = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    return shops.filter(s =>
      s.groupId === selectedGroup &&
      s.scheduledDate &&
      dayjs(s.scheduledDate).format('YYYY-MM-DD') === today
    );
  }, [shops, selectedGroup]);

  // Add distance to shops if user position is known
  const shopsWithDistance = useMemo(() => {
    if (!userPosition) return todayShops;

    return todayShops.map(shop => {
      const [shopLng, shopLat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      const distance = haversineDistance(
        userPosition.lat, userPosition.lng,
        shopLat, shopLng
      );
      return { ...shop, distance };
    });
  }, [todayShops, userPosition]);

  // Group counts for selector
  const groupCounts = useMemo(() => {
    const today = dayjs().format('YYYY-MM-DD');
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0 };
    shops.forEach(s => {
      if (s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === today) {
        if (s.groupId && counts[s.groupId] !== undefined) {
          counts[s.groupId]++;
        }
      }
    });
    return counts;
  }, [shops]);

  // Selected shop object
  const selectedShop = useMemo(() => {
    return shopsWithDistance.find(s => s.id === selectedShopId) || null;
  }, [shopsWithDistance, selectedShopId]);

  // Initialize map
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;

    mapRef.current = new window.AMap.Map('mobile-map-container', {
      center: [114.177216, 22.303719], // Hong Kong center
      zoom: 13,
      touchZoom: true,
      dragEnable: true,
      zoomEnable: true,
    });

    // Add scale control
    window.AMap.plugin('AMap.Scale', () => {
      mapRef.current.addControl(new window.AMap.Scale({
        position: 'LB',
      }));
    });
  }, []);

  // Update markers when filtered shops change
  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    const existing = Object.values(markersRef.current);
    if (existing.length > 0) {
      mapRef.current.remove(existing);
      markersRef.current = {};
    }

    // Add markers for today's shops
    todayShops.forEach(shop => {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      const color = CATEGORY_COLORS[shop.groupId] || '#94A3B8';

      const markerContent = `
        <div class="mobile-map-marker" style="--marker-color:${color};">
          <div class="mobile-map-marker-inner"></div>
        </div>
      `;

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: markerContent,
        anchor: 'bottom-center',
      });

      marker.on('click', () => {
        setSelectedShopId(shop.id);
      });

      markersRef.current[shop.id] = marker;
      mapRef.current.add(marker);
    });

    // Fit view to show all markers
    if (todayShops.length > 0) {
      mapRef.current.setFitView(Object.values(markersRef.current), false, [100, 60, 100, 60]);
    }
  }, [todayShops]);

  // Update user location marker
  useEffect(() => {
    if (!mapRef.current || !userPosition) return;

    if (userMarkerRef.current) {
      mapRef.current.remove(userMarkerRef.current);
    }

    const userMarkerContent = `
      <div class="mobile-user-marker">
        <div class="mobile-user-marker-dot"></div>
        <div class="mobile-user-marker-pulse"></div>
      </div>
    `;

    userMarkerRef.current = new window.AMap.Marker({
      position: [userPosition.lng, userPosition.lat],
      content: userMarkerContent,
      anchor: 'center',
      zIndex: 1000,
    });

    mapRef.current.add(userMarkerRef.current);
  }, [userPosition]);

  // Handle shop selection - center map on shop
  useEffect(() => {
    if (!mapRef.current || !selectedShopId) return;

    const shop = todayShops.find(s => s.id === selectedShopId);
    if (!shop) return;

    const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
    mapRef.current.setCenter([lng, lat]);
    mapRef.current.setZoom(16);

    // Highlight selected marker
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const dom = marker.getContentDom?.();
      if (!dom) return;
      const el = dom.querySelector('.mobile-map-marker');
      if (!el) return;

      if (id === selectedShopId) {
        el.classList.add('mobile-map-marker--selected');
      } else {
        el.classList.remove('mobile-map-marker--selected');
      }
    });
  }, [selectedShopId, todayShops]);

  // Handle navigation request
  const handleNavigate = useCallback((shop: Shop) => {
    if (!userPosition) {
      message.info('Tap the GPS button to get your location first');
      getCurrentPosition();
      return;
    }

    const [shopLng, shopLat] = wgs84ToGcj02(shop.longitude, shop.latitude);

    clearRoute();

    planRoute(
      { lng: userPosition.lng, lat: userPosition.lat },
      { lng: shopLng, lat: shopLat },
      mapRef.current
    );

    setSelectedShopId(shop.id);
    setShowRoutePanel(true);
    setIsPanelExpanded(false); // Collapse list to show map and route
  }, [userPosition, getCurrentPosition, planRoute, clearRoute]);

  const handleGpsClick = useCallback(() => {
    getCurrentPosition();
    if (userPosition && mapRef.current) {
      mapRef.current.setCenter([userPosition.lng, userPosition.lat]);
      mapRef.current.setZoom(15);
    }
  }, [getCurrentPosition, userPosition]);

  const handleRouteSelect = useCallback((type: 'walking' | 'transit') => {
    showRoute(type);
  }, [showRoute]);

  const handleCloseRoutePanel = useCallback(() => {
    setShowRoutePanel(false);
    clearRoute();
  }, [clearRoute]);

  return (
    <div className="mobile-map-view">
      {/* Top Shop List Panel */}
      <TopShopPanel
        selectedGroup={selectedGroup}
        onSelectGroup={setSelectedGroup}
        shops={shopsWithDistance}
        selectedShopId={selectedShopId}
        onSelectShop={(shop) => {
          setSelectedShopId(shop.id);
          setShowRoutePanel(false);
          clearRoute();
        }}
        onNavigate={handleNavigate}
        groupCounts={groupCounts}
        expanded={isPanelExpanded}
        onExpandChange={setIsPanelExpanded}
      />

      {/* Map Container */}
      <div id="mobile-map-container" className="mobile-map-container" />

      {/* GPS Floating Action Button */}
      <button
        className={`mobile-gps-fab ${gpsLoading ? 'loading' : ''} ${userPosition ? 'active' : ''}`}
        onClick={handleGpsClick}
        disabled={gpsLoading}
        aria-label="Get my location"
      >
        {gpsLoading ? (
          <div className="mobile-gps-spinner" />
        ) : (
          <Locate className="w-6 h-6" />
        )}
      </button>

      {/* GPS Error Toast */}
      {gpsError && (
        <div className="mobile-gps-error">
          <AlertCircle className="w-4 h-4" />
          <span>{gpsError}</span>
          <button onClick={clearGpsError} aria-label="Dismiss error">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Route Panel - Shows when navigating */}
      {showRoutePanel && selectedShop && (
        <div className="mobile-route-panel-container">
          <button
            className="mobile-route-close"
            onClick={handleCloseRoutePanel}
            aria-label="Close route panel"
          >
            <X className="w-5 h-5" />
          </button>
          <RoutePanel
            walking={walking}
            transit={transit}
            activeRoute={activeRoute}
            loading={routeLoading}
            onSelectRoute={handleRouteSelect}
            shopName={selectedShop.name}
            mapInstance={mapRef.current}
          />
        </div>
      )}
    </div>
  );
};
