import React, { useState } from 'react';
import { Footprints, Bus, ChevronDown, ChevronUp, Clock, Route } from 'lucide-react';
import { RouteInfo } from '../../hooks/useAMapRoute';

interface RoutePanelProps {
  walking: RouteInfo | null;
  transit: RouteInfo | null;
  activeRoute: 'walking' | 'transit' | null;
  loading: boolean;
  onSelectRoute: (type: 'walking' | 'transit') => void;
  shopName: string;
  mapInstance?: any;
}

/**
 * Route panel showing walking and transit options side-by-side.
 * Displays distance and estimated time for each option.
 */
export const RoutePanel: React.FC<RoutePanelProps> = ({
  walking,
  transit,
  activeRoute,
  loading,
  onSelectRoute,
  shopName,
  mapInstance,
}) => {
  const [showDirections, setShowDirections] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Handle clicking on route option - zoom to that route segment
  const handleRouteClick = (type: 'walking' | 'transit') => {
    onSelectRoute(type);

    // Collapse panel after a short delay to ensure route is drawn first
    setTimeout(() => {
      setIsCollapsed(true);
    }, 300);
  };

  // Handle clicking on specific segment step - zoom map to that segment
  const handleSegmentClick = (step: string) => {
    console.log('🎯 Segment clicked:', step);
    const routeInfo = activeRoute === 'walking' ? walking : transit;
    console.log('📊 Route info:', routeInfo);
    console.log('🗺️ Map instance:', mapInstance);

    if (!routeInfo?.segments || !mapInstance) {
      console.log('❌ Missing route info or map instance');
      return;
    }

    // Find the segment that matches this step description
    const segment = routeInfo.segments.find(seg => step.includes(seg.description));
    console.log('🔍 Found segment:', segment);

    if (!segment || !segment.path || segment.path.length === 0) {
      console.log('❌ No segment or path found');
      return;
    }

    console.log('✅ Segment path length:', segment.path.length);
    console.log('📍 First path point:', segment.path[0]);

    // Collapse panel to show map
    setIsCollapsed(true);

    // Zoom map to fit this segment's path
    setTimeout(() => {
      try {
        // Check if path has valid coordinates
        if (!segment.path || segment.path.length === 0) {
          console.log('❌ Empty path');
          return;
        }

        // Simply use setFitView which accepts the path directly
        console.log('🎯 Calling setFitView with path');
        mapInstance.setFitView(segment.path, false, [80, 80, 80, 220]);
        console.log('✅ Map zoom successful');
      } catch (error) {
        console.error('❌ Error with setFitView:', error);

        // Fallback: try to extract center and set manual zoom
        try {
          console.log('🔄 Trying fallback method...');
          const firstPoint = segment.path[0];
          const lastPoint = segment.path[segment.path.length - 1];

          console.log('First point:', firstPoint);
          console.log('Last point:', lastPoint);

          // Calculate center
          let centerLng, centerLat;
          if (firstPoint.getLng && typeof firstPoint.getLng === 'function') {
            centerLng = (firstPoint.getLng() + lastPoint.getLng()) / 2;
            centerLat = (firstPoint.getLat() + lastPoint.getLat()) / 2;
          } else if (firstPoint.KL !== undefined) {
            centerLng = (firstPoint.KL + lastPoint.KL) / 2;
            centerLat = (firstPoint.kT + lastPoint.kT) / 2;
          }

          if (centerLng && centerLat) {
            console.log('📍 Setting center:', centerLng, centerLat);
            mapInstance.setZoomAndCenter(15, [centerLng, centerLat]);
            console.log('✅ Fallback zoom successful');
          }
        } catch (fallbackError) {
          console.error('❌ Fallback also failed:', fallbackError);
        }
      }
    }, 300);
  };

  const formatDistance = (meters: number): string => {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="mobile-route-panel mobile-route-panel--loading">
        <div className="mobile-route-loading">
          <div className="mobile-route-spinner" />
          <span>Planning routes...</span>
        </div>
      </div>
    );
  }

  if (!walking && !transit) {
    return null;
  }

  const activeRouteInfo = activeRoute === 'walking' ? walking : activeRoute === 'transit' ? transit : null;
  const showWalking = walking && walking.distance <= 1000;

  return (
    <div className={`mobile-route-panel ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapsible header with drag handle */}
      <div
        className="mobile-route-drag-header"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="mobile-route-drag-handle"></div>
        <div className="mobile-route-header-content">
          <span className="mobile-route-to">To: {shopName}</span>
          {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Collapsible content */}
      <div className="mobile-route-content">{/* Route destination */}

      {/* Route options */}
      <div className="mobile-route-options">
        {/* Walking option - only if <= 1km */}
        {showWalking && (
          <button
            className={`mobile-route-option ${activeRoute === 'walking' ? 'active' : ''}`}
            onClick={() => handleRouteClick('walking')}
            aria-pressed={activeRoute === 'walking'}
          >
            <div className="mobile-route-icon">
              <Footprints className="w-5 h-5" />
            </div>
            <div className="mobile-route-label">Walk</div>
            <div className="mobile-route-distance">
              <Route className="w-3 h-3" />
              {formatDistance(walking.distance)}
            </div>
            <div className="mobile-route-time">
              <Clock className="w-3 h-3" />
              {formatDuration(walking.duration)}
            </div>
          </button>
        )}

        {/* Transit option */}
        <button
          className={`mobile-route-option ${activeRoute === 'transit' ? 'active' : ''} ${!transit ? 'disabled' : ''} ${!showWalking ? 'w-full' : ''}`}
          onClick={() => transit && handleRouteClick('transit')}
          disabled={!transit}
          aria-pressed={activeRoute === 'transit'}
        >
          <div className="mobile-route-icon">
            <Bus className="w-5 h-5" />
          </div>
          <div className="mobile-route-label">Transit</div>
          {transit ? (
            <>
              <div className="mobile-route-distance">
                <Route className="w-3 h-3" />
                {formatDistance(transit.distance)}
              </div>
              <div className="mobile-route-time">
                <Clock className="w-3 h-3" />
                {formatDuration(transit.duration)}
              </div>
            </>
          ) : (
            <div className="mobile-route-unavailable">N/A</div>
          )}
        </button>
      </div>

      {/* Expandable directions */}
      {activeRouteInfo && activeRouteInfo.steps && activeRouteInfo.steps.length > 0 && (
        <div className="mobile-route-directions">
          <button
            className="mobile-route-directions-toggle"
            onClick={() => setShowDirections(!showDirections)}
            aria-expanded={showDirections}
          >
            <span>{activeRoute === 'transit' ? 'Transit Details' : 'Walk Directions'} ({activeRouteInfo.steps.length} steps)</span>
            {showDirections ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showDirections && (
            <ol className="mobile-route-steps">
              {activeRouteInfo.steps.map((step, index) => {
                // Skip empty lines for cleaner display
                if (!step || step.trim() === '') {
                  return <li key={index} className="mobile-route-spacer" />;
                }

                // Enhanced styling based on step content
                const isTransitHeader = step.includes('🚌 Take');
                const isWalkHeader = step.includes('🚶 Walk');
                const isBoardingPoint = step.includes('📍 Board at');
                const isExitPoint = step.includes('📍 Exit at');
                const isViaInfo = step.includes('Via:') || step.includes('Pass ') || step.includes('Distance:') || step.includes('Duration:');
                const isWalkSubStep = step.trim().match(/^\d+\./); // Walking sub-steps like "1.", "2."
                const isIndented = step.startsWith('   ');
                const isEmpty = step.trim() === '';
                const isClickable = isTransitHeader || isWalkHeader; // Main segment headers are clickable

                return (
                  <li
                    key={index}
                    className={`mobile-route-step
                      ${isTransitHeader ? 'transit-header' : ''}
                      ${isWalkHeader ? 'walk-header' : ''}
                      ${isBoardingPoint || isExitPoint ? 'station-point' : ''}
                      ${isViaInfo ? 'via-info' : ''}
                      ${isIndented ? 'indented-step' : ''}
                      ${isEmpty ? 'empty-line' : ''}
                      ${isClickable ? 'clickable-segment' : ''}
                    `}
                    onClick={() => isClickable && handleSegmentClick(step)}
                    style={{ cursor: isClickable ? 'pointer' : 'default' }}
                  >
                    {!isIndented && !isViaInfo && !isEmpty && (
                      <span className="mobile-route-step-num">
                        {isTransitHeader ? <Bus className="w-3 h-3" /> :
                         isWalkHeader ? <Footprints className="w-3 h-3" /> :
                         index + 1}
                      </span>
                    )}
                    <span className="mobile-route-step-text">
                      {step || '\u00A0'}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
      </div>
      <style>{`
        .mobile-route-drag-header {
          background: #f8fafc;
          padding: 8px 16px;
          cursor: pointer;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .mobile-route-drag-handle {
          width: 40px;
          height: 4px;
          background: #cbd5e1;
          border-radius: 2px;
        }

        .mobile-route-header-content {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .mobile-route-content {
          overflow: hidden;
          transition: max-height 0.3s ease-in-out;
          max-height: 100vh;
        }

        .mobile-route-panel.collapsed .mobile-route-content {
          max-height: 0 !important;
          overflow: hidden;
        }

        .transit-header {
          background-color: #eff6ff;
          border-left: 4px solid #3b82f6;
          margin: 12px 0 4px 0;
          padding: 8px !important;
          border-radius: 6px;
          font-weight: 600;
          color: #1e40af;
          transition: all 0.2s ease;
        }

        .transit-header.clickable-segment:hover {
          background-color: #dbeafe;
          transform: translateX(4px);
        }

        .transit-header.clickable-segment:active {
          background-color: #bfdbfe;
        }

        .walk-header {
          background-color: #f0fdf4;
          border-left: 4px solid #22c55e;
          margin: 12px 0 4px 0;
          padding: 8px !important;
          border-radius: 6px;
          font-weight: 600;
          color: #166534;
          transition: all 0.2s ease;
        }

        .walk-header.clickable-segment:hover {
          background-color: #dcfce7;
          transform: translateX(4px);
        }

        .walk-header.clickable-segment:active {
          background-color: #bbf7d0;
        }

        .station-point {
          background-color: #fef3c7;
          padding: 6px 8px !important;
          margin: 2px 0 2px 12px;
          border-radius: 4px;
          font-weight: 500;
          color: #92400e;
        }

        .via-info {
          color: #64748b;
          font-size: 0.85rem;
          padding: 2px 8px !important;
          margin: 2px 0 2px 12px;
          font-style: italic;
        }

        .indented-step {
          padding-left: 24px !important;
          color: #475569;
          font-size: 0.9rem;
          margin: 2px 0;
        }

        .mobile-route-step {
          list-style: none;
          padding: 4px 0;
        }

        .mobile-route-spacer {
          height: 8px;
          list-style: none;
        }

        .empty-line {
          height: 8px;
        }

        .mobile-route-step-num {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 24px;
          margin-right: 8px;
        }

        .mobile-route-step-text {
          vertical-align: middle;
        }
      `}</style>
    </div>
  );
};
