import { useEffect, useState } from 'react';

/**
 * Responsive breakpoints
 */
export const BREAKPOINTS = {
  mobile: 480,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
} as const;

/**
 * Hook to detect if device is mobile
 *
 * @returns true if viewport width <= mobile breakpoint
 *
 * @example
 * const isMobile = useIsMobile();
 * return isMobile ? <MobileComponent /> : <DesktopComponent />;
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth <= BREAKPOINTS.mobile);
    };

    checkIsMobile();

    const handleResize = () => checkIsMobile();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if device is tablet
 *
 * @returns true if viewport width is between mobile and desktop
 */
export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkIsTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width > BREAKPOINTS.mobile && width <= BREAKPOINTS.tablet);
    };

    checkIsTablet();

    const handleResize = () => checkIsTablet();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isTablet;
}

/**
 * Hook to detect if device is desktop
 *
 * @returns true if viewport width > tablet breakpoint
 */
export function useIsDesktop(): boolean {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const checkIsDesktop = () => {
      setIsDesktop(window.innerWidth > BREAKPOINTS.tablet);
    };

    checkIsDesktop();

    const handleResize = () => checkIsDesktop();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isDesktop;
}

/**
 * Hook to get current viewport size
 *
 * @returns object with width and height of viewport
 */
export function useViewport(): { width: number; height: number } {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return viewport;
}

/**
 * Hook to check if orientation is portrait
 *
 * @returns true if viewport height > width
 */
export function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkPortrait = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };

    checkPortrait();

    const handleResize = () => checkPortrait();
    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return isPortrait;
}

/**
 * Component that conditionally renders based on viewport size
 *
 * @example
 * <ResponsiveRender
 *   mobile={<MobileComponent />}
 *   desktop={<DesktopComponent />}
 * />
 */
export interface ResponsiveRenderProps {
  mobile?: React.ReactNode;
  tablet?: React.ReactNode;
  desktop?: React.ReactNode;
}

export function ResponsiveRender({ mobile, tablet, desktop }: ResponsiveRenderProps) {
  const isMobileView = useIsMobile();
  const isTabletView = useIsTablet();
  const isDesktopView = useIsDesktop();

  if (isMobileView && mobile) return <>{mobile}</>;
  if (isTabletView && tablet) return <>{tablet}</>;
  if (isDesktopView && desktop) return <>{desktop}</>;

  // Fallback to first available option
  return <>{mobile || tablet || desktop}</>;
}
