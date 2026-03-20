import { useState, useEffect } from 'react';

declare global {
  interface Window {
    AMap: any;
  }
}

/**
 * Returns a Promise that resolves with window.AMap once it has loaded.
 * Polls every 50ms for up to 10 seconds, then rejects.
 */
export function loadAMap(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.AMap) {
      resolve(window.AMap);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      if (window.AMap) {
        clearInterval(timer);
        resolve(window.AMap);
      } else if (Date.now() - start > 10_000) {
        clearInterval(timer);
        reject(new Error('AMap failed to load within 10 seconds'));
      }
    }, 50);
  });
}

/**
 * React hook that loads AMap and returns { amap, loading, error }.
 * - amap: the window.AMap instance once ready, or null while loading
 * - loading: true until AMap resolves or rejects
 * - error: error message string if load failed, otherwise null
 */
export function useAMap(): { amap: any; loading: boolean; error: string | null } {
  const [amap, setAmap] = useState<any>(typeof window !== 'undefined' && window.AMap ? window.AMap : null);
  const [loading, setLoading] = useState<boolean>(!amap);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (amap) return;
    let cancelled = false;
    loadAMap()
      .then((instance) => { if (!cancelled) setAmap(instance); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { amap, loading, error };
}
