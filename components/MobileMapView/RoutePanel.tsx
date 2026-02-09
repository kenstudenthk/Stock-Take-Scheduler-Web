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
}) => {
  const [showDirections, setShowDirections] = useState(false);

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
    <div className="mobile-route-panel">
      {/* Route destination */}
      <div className="mobile-route-header">
        <span className="mobile-route-to">To: {shopName}</span>
      </div>

      {/* Route options */}
      <div className="mobile-route-options">
        {/* Walking option - only if <= 1km */}
        {showWalking && (
          <button
            className={`mobile-route-option ${activeRoute === 'walking' ? 'active' : ''}`}
            onClick={() => onSelectRoute('walking')}
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
          onClick={() => transit && onSelectRoute('transit')}
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
                // Heuristic to style transit steps differently
                const isBoarding = step.includes('Board at');
                const isExiting = step.includes('Exit at');
                const isTransit = step.includes('Take ');
                
                return (
                  <li key={index} className={`mobile-route-step ${isTransit ? 'transit-main' : ''}`}>
                    <span className="mobile-route-step-num">
                      {isTransit ? <Bus className="w-3 h-3" /> : index + 1}
                    </span>
                    <span className={`mobile-route-step-text ${isBoarding || isExiting ? 'font-bold text-slate-800' : ''}`}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}
      <style>{`
        .transit-main {
          background-color: #f0f9ff;
          border-left: 4px solid #0ea5e9;
          margin: 8px 0;
          padding: 8px !important;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};
