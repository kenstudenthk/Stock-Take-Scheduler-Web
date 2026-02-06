import { useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}

export interface RouteInfo {
  distance: number; // meters
  duration: number; // seconds
  steps?: string[]; // turn-by-turn directions
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

          // Extract transit steps
          plan.segments?.forEach((segment: any) => {
            if (segment.transit) {
              const line = segment.transit.lines?.[0];
              if (line) {
                steps.push(`Take ${line.name} from ${segment.transit.on?.name || 'station'} to ${segment.transit.off?.name || 'station'}`);
              }
            } else if (segment.walking) {
              steps.push(`Walk ${segment.walking.distance}m`);
            }
          });

          transitResult = {
            distance: plan.distance,
            duration: plan.time,
            steps,
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
