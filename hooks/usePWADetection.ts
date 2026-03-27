export type PlatformType = 'ios' | 'android' | 'desktop';

export interface PWADetectionResult {
  isPWA: boolean;
  platform: PlatformType;
}

export function usePWADetection(): PWADetectionResult {
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.startsWith('android-app://');

  const ua = navigator.userAgent;
  let platform: PlatformType = 'desktop';
  if (/iPad|iPhone|iPod/.test(ua)) platform = 'ios';
  else if (/Android/.test(ua)) platform = 'android';

  return { isPWA, platform };
}
