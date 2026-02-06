import { useState, useCallback, useRef } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}

export interface GeolocationState {
  position: { lng: number; lat: number } | null;
  loading: boolean;
  error: string | null;
}

export interface UseGeolocationReturn extends GeolocationState {
  getCurrentPosition: () => void;
  clearError: () => void;
}

/**
 * Hook for getting user's GPS location using AMap.Geolocation plugin.
 * Returns GCJ-02 coordinates (compatible with AMap).
 * On-demand only - call getCurrentPosition() to get location.
 */
export const useGeolocation = (): UseGeolocationReturn => {
  const [state, setState] = useState<GeolocationState>({
    position: null,
    loading: false,
    error: null,
  });

  const geolocationRef = useRef<any>(null);

  const getCurrentPosition = useCallback(() => {
    if (!window.AMap) {
      setState(prev => ({ ...prev, error: 'Map not loaded' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    // Initialize geolocation plugin if not already done
    if (!geolocationRef.current) {
      window.AMap.plugin('AMap.Geolocation', () => {
        geolocationRef.current = new window.AMap.Geolocation({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
          showButton: false,
          showMarker: false,
          showCircle: false,
        });

        // Now get position
        fetchPosition();
      });
    } else {
      fetchPosition();
    }

    function fetchPosition() {
      geolocationRef.current.getCurrentPosition((status: string, result: any) => {
        if (status === 'complete') {
          // AMap.Geolocation returns GCJ-02 coordinates directly
          setState({
            position: {
              lng: result.position.lng,
              lat: result.position.lat,
            },
            loading: false,
            error: null,
          });
        } else {
          // Handle errors
          let errorMsg = 'Unable to get location';

          if (result.message) {
            if (result.message.includes('denied') || result.message.includes('permission')) {
              errorMsg = 'Location permission denied. Please enable location access in your browser settings.';
            } else if (result.message.includes('timeout')) {
              errorMsg = 'Location request timed out. Please try again.';
            } else if (result.message.includes('unavailable')) {
              errorMsg = 'Location unavailable. Please check your GPS settings.';
            } else {
              errorMsg = result.message;
            }
          }

          setState({
            position: null,
            loading: false,
            error: errorMsg,
          });
        }
      });
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    getCurrentPosition,
    clearError,
  };
};
