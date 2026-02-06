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
      try {
        walkingRef.current.clear();
      } catch (e) {
        // Ignore errors when clearing
      }
    }
    // Clear transit route from map
    if (transferRef.current) {
      try {
        transferRef.current.clear();
      } catch (e) {
        // Ignore errors when clearing
      }
    }
    walkingRef.current = null;
    transferRef.current = null;
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
      setState(prev => ({ ...prev, error: 'Map not initialized', loading: false }));
      return;
    }

    mapRef.current = mapInstance;
    fromRef.current = from;
    toRef.current = to;

    setState(prev => ({ ...prev, loading: true, error: null, walking: null, transit: null }));

    // Clear previous routes
    if (walkingRef.current) {
      try { walkingRef.current.clear(); } catch (e) {}
      walkingRef.current = null;
    }
    if (transferRef.current) {
      try { transferRef.current.clear(); } catch (e) {}
      transferRef.current = null;
    }

    const fromPos = new window.AMap.LngLat(from.lng, from.lat);
    const toPos = new window.AMap.LngLat(to.lng, to.lat);

    let completedCount = 0;
    let walkingResult: RouteInfo | null = null;
    let transitResult: RouteInfo | null = null;

    const checkComplete = () => {
      completedCount++;
      if (completedCount >= 2) {
        setState({
          walking: walkingResult,
          transit: transitResult,
          activeRoute: null,
          loading: false,
          error: !walkingResult && !transitResult
            ? 'Unable to plan route. Try a different destination.'
            : null,
        });
      }
    };

    // Load plugins and search
    const loadAndSearch = () => {
      // Plan walking route
      try {
        const walking = new window.AMap.Walking({
          map: null,
          autoFitView: false,
        });

        walking.search(fromPos, toPos, (status: string, result: any) => {
          if (status === 'complete' && result.routes && result.routes.length > 0) {
            const route = result.routes[0];
            const steps = route.steps?.map((step: any) => step.instruction) || [];
            walkingResult = {
              distance: route.distance,
              duration: route.time,
              steps,
            };
          }
          checkComplete();
        });
      } catch (e) {
        console.error('Walking route error:', e);
        checkComplete();
      }

      // Plan transit route
      try {
        const transfer = new window.AMap.Transfer({
          map: null,
          city: '香港',
          autoFitView: false,
          policy: window.AMap.TransferPolicy?.LEAST_TIME || 0,
        });

        transfer.search(fromPos, toPos, (status: string, result: any) => {
          if (status === 'complete' && result.plans && result.plans.length > 0) {
            const plan = result.plans[0];
            const steps: string[] = [];

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
          }
          checkComplete();
        });
      } catch (e) {
        console.error('Transit route error:', e);
        checkComplete();
      }
    };

    // Check if plugins are already loaded
    if (window.AMap.Walking && window.AMap.Transfer) {
      loadAndSearch();
    } else {
      // Load plugins first
      window.AMap.plugin(['AMap.Walking', 'AMap.Transfer'], () => {
        loadAndSearch();
      });
    }
  }, []);

  const showRoute = useCallback((type: 'walking' | 'transit') => {
    if (!mapRef.current || !fromRef.current || !toRef.current) {
      console.error('Cannot show route: missing map or positions');
      return;
    }

    const fromPos = new window.AMap.LngLat(fromRef.current.lng, fromRef.current.lat);
    const toPos = new window.AMap.LngLat(toRef.current.lng, toRef.current.lat);

    // Clear previous visual routes
    if (walkingRef.current) {
      try { walkingRef.current.clear(); } catch (e) {}
    }
    if (transferRef.current) {
      try { transferRef.current.clear(); } catch (e) {}
    }

    const doShowRoute = () => {
      if (type === 'walking') {
        const walking = new window.AMap.Walking({
          map: mapRef.current,
          autoFitView: true,
        });
        walking.search(fromPos, toPos);
        walkingRef.current = walking;
      } else {
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
    };

    // Ensure plugins are loaded
    if (window.AMap.Walking && window.AMap.Transfer) {
      doShowRoute();
    } else {
      window.AMap.plugin(['AMap.Walking', 'AMap.Transfer'], doShowRoute);
    }
  }, []);

  return {
    ...state,
    planRoute,
    showRoute,
    clearRoute,
  };
};
