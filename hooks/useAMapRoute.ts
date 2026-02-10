import { useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}

export interface RouteSegment {
  type: 'walking' | 'transit';
  description: string;
  path?: any[]; // AMap path coordinates for this segment
  bounds?: { southwest: any; northeast: any }; // Bounding box for zoom
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  steps?: string[]; // turn-by-turn directions
  segments?: RouteSegment[]; // Individual segments with paths for zoom
}

export interface RouteState {
  walking: RouteInfo | null;
  transit: RouteInfo | null;
  activeRoute: 'walking' | 'transit' | null;
  loading: boolean;
  error: string | null;
}

export interface UseAMapRouteReturn extends RouteState {
  planRoute: (
    from: { lng: number; lat: number },
    to: { lng: number; lat: number },
    mapInstance: any
  ) => void;
  showRoute: (type: 'walking' | 'transit') => void;
  clearRoute: () => void;
}

/**
 * Hook for planning walking and transit routes using AMap APIs.
 * Calculates both route options and allows displaying either on the map.
 */
export const useAMapRoute = (): UseAMapRouteReturn => {
  const [state, setState] = useState<RouteState>({
    walking: null,
    transit: null,
    activeRoute: null,
    loading: false,
    error: null,
  });

  const walkingRef = useRef<any>(null);
  const transferRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const fromRef = useRef<{ lng: number; lat: number } | null>(null);
  const toRef = useRef<{ lng: number; lat: number } | null>(null);

  const clearRoute = useCallback(() => {
    // Clear walking route from map
    if (walkingRef.current) {
      walkingRef.current.clear();
    }
    // Clear transit route from map
    if (transferRef.current) {
      transferRef.current.clear();
    }
    setState({
      walking: null,
      transit: null,
      activeRoute: null,
      loading: false,
      error: null,
    });
  }, []);

  const planRoute = useCallback((
    from: { lng: number; lat: number },
    to: { lng: number; lat: number },
    mapInstance: any
  ) => {
    if (!window.AMap || !mapInstance) {
      setState(prev => ({ ...prev, error: 'Map not initialized' }));
      return;
    }

    mapRef.current = mapInstance;
    fromRef.current = from;
    toRef.current = to;

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Clear previous routes
    if (walkingRef.current) walkingRef.current.clear();
    if (transferRef.current) transferRef.current.clear();

    const fromPos = new window.AMap.LngLat(from.lng, from.lat);
    const toPos = new window.AMap.LngLat(to.lng, to.lat);

    let completedCount = 0;
    let walkingResult: RouteInfo | null = null;
    let transitResult: RouteInfo | null = null;
    let hasError = false;

    const checkComplete = () => {
      completedCount++;
      if (completedCount >= 2) {
        setState({
          walking: walkingResult,
          transit: transitResult,
          activeRoute: null,
          loading: false,
          error: hasError && !walkingResult && !transitResult
            ? 'Unable to plan route. Try a different destination.'
            : null,
        });
      }
    };

    // Plan walking route
    window.AMap.plugin('AMap.Walking', () => {
      if (!walkingRef.current) {
        walkingRef.current = new window.AMap.Walking({
          map: null, // Don't draw initially
          autoFitView: false,
        });
      }

      walkingRef.current.search(fromPos, toPos, (status: string, result: any) => {
        if (status === 'complete' && result.routes && result.routes.length > 0) {
          const route = result.routes[0];
          const steps = route.steps?.map((step: any) => step.instruction) || [];
          walkingResult = {
            distance: route.distance,
            duration: route.time,
            steps,
          };
        } else {
          hasError = true;
        }
        checkComplete();
      });
    });

    // Plan transit route
    window.AMap.plugin('AMap.Transfer', () => {
      if (!transferRef.current) {
        transferRef.current = new window.AMap.Transfer({
          map: null, // Don't draw initially
          city: '香港',
          autoFitView: false,
          policy: window.AMap.TransferPolicy?.LEAST_TIME || 0,
        });
      }

      transferRef.current.search(fromPos, toPos, (status: string, result: any) => {
        if (status === 'complete' && result.plans && result.plans.length > 0) {
          const plan = result.plans[0];
          const steps: string[] = [];
          const segments: RouteSegment[] = [];

          console.log('🔍 Transit Plan Data:', JSON.stringify(plan, null, 2)); // DEBUG

          // Extract transit steps with enhanced details
          plan.segments?.forEach((segment: any, segIndex: number) => {
            console.log(`📦 Segment ${segIndex}:`, segment); // DEBUG

            // Check if this is a walking segment
            if (segment.transit_mode === 'WALK') {
              console.log('🚶 Walking Segment:', segment.transit); // DEBUG

              const walkDist = segment.distance || 0;
              const walkTime = segment.time || 0;

              // Walking segment header
              const walkDescription = segIndex === 0
                ? `🚶 Walk to boarding point (${walkDist}m, ~${Math.round(walkTime / 60)} min)`
                : `🚶 Walk ${walkDist}m (~${Math.round(walkTime / 60)} min)`;

              steps.push(walkDescription);

              // Store segment with path for zoom capability
              segments.push({
                type: 'walking',
                description: walkDescription,
                path: segment.transit?.path || [],
              });

              // Detailed walking instructions if available
              if (segment.transit?.steps && segment.transit.steps.length > 0) {
                segment.transit.steps.forEach((s: any, idx: number) => {
                  if (s.instruction) {
                    // Add indentation for walking sub-steps
                    const instruction = s.instruction.trim();
                    const distance = s.distance ? ` (${s.distance}m)` : '';
                    steps.push(`   ${idx + 1}. ${instruction}${distance}`);
                  }
                });
              }

              steps.push(''); // Empty line for spacing
            } else if (segment.transit) {
              const line = segment.transit.lines?.[0];
              console.log('🚇 Transit Line:', line); // DEBUG
              console.log('🚏 On Station:', segment.transit.on_station); // DEBUG
              console.log('🚏 Off Station:', segment.transit.off_station); // DEBUG

              if (line) {
                const stopCount = segment.transit.via_num || 0;
                const lineName = line.name ? line.name.replace(/\(.*?\)/g, '').trim() : 'Unknown Line';

                // Handle different transit types
                let transitType = 'Transit';
                if (line.type === '地铁线路' || line.type === 'SUBWAY') {
                  transitType = 'MTR';
                } else if (line.type === '普通公交线路' || line.type === 'BUS') {
                  transitType = 'Bus';
                }

                // Get station names from correct fields
                const onStopName = segment.transit.on_station?.name || 'Starting station';
                const offStopName = segment.transit.off_station?.name || 'Destination station';

                // Route header with type
                const transitDescription = `🚌 Take ${lineName} (${transitType})`;
                steps.push(transitDescription);
                steps.push(''); // Empty line for spacing

                // Store segment with path for zoom capability
                segments.push({
                  type: 'transit',
                  description: transitDescription,
                  path: segment.transit.path || [],
                });

                // Boarding info with entrance (for MTR)
                if (segment.transit.entrance?.name) {
                  steps.push(`📍 Board at: ${onStopName} (${segment.transit.entrance.name})`);
                } else {
                  steps.push(`📍 Board at: ${onStopName}`);
                }

                // Show via stops if available
                if (segment.transit.via_stops && segment.transit.via_stops.length > 0) {
                  const viaStopNames = segment.transit.via_stops.map((stop: any) => stop.name).join(' → ');
                  steps.push(`   Via: ${viaStopNames}`);
                } else if (stopCount > 0) {
                  steps.push(`   Pass ${stopCount} stop${stopCount > 1 ? 's' : ''}`);
                }

                // Exit info with exit gate (for MTR)
                if (segment.transit.exit?.name) {
                  steps.push(`📍 Exit at: ${offStopName} (${segment.transit.exit.name})`);
                } else {
                  steps.push(`📍 Exit at: ${offStopName}`);
                }

                // Transit segment duration/distance if available
                if (segment.transit.distance) {
                  const distKm = (segment.transit.distance / 1000).toFixed(1);
                  steps.push(`   Distance: ${distKm}km`);
                }
                if (segment.transit.duration || segment.transit.time) {
                  const duration = segment.transit.duration || segment.transit.time;
                  const mins = Math.round(duration / 60);
                  steps.push(`   Duration: ~${mins} min`);
                }

                steps.push(''); // Empty line for spacing
              }
            }
          });

          transitResult = {
            distance: plan.distance,
            duration: plan.time,
            steps,
            segments,
          };
        } else {
          hasError = true;
        }
        checkComplete();
      });
    });
  }, []);

  const showRoute = useCallback((type: 'walking' | 'transit') => {
    if (!mapRef.current || !fromRef.current || !toRef.current) return;

    const fromPos = new window.AMap.LngLat(fromRef.current.lng, fromRef.current.lat);
    const toPos = new window.AMap.LngLat(toRef.current.lng, toRef.current.lat);

    // Clear previous visual routes
    if (walkingRef.current) walkingRef.current.clear();
    if (transferRef.current) transferRef.current.clear();

    if (type === 'walking') {
      // Re-create walking with map
      const walking = new window.AMap.Walking({
        map: mapRef.current,
        autoFitView: true,
      });
      walking.search(fromPos, toPos);
      walkingRef.current = walking;
    } else {
      // Re-create transit with map
      const transfer = new window.AMap.Transfer({
        map: mapRef.current,
        city: '香港',
        autoFitView: true,
        policy: window.AMap.TransferPolicy?.LEAST_TIME || 0,
      });
      transfer.search(fromPos, toPos);
      transferRef.current = transfer;
    }

    setState(prev => ({ ...prev, activeRoute: type }));
  }, []);

  return {
    ...state,
    planRoute,
    showRoute,
    clearRoute,
  };
};
