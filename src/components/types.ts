/**
 * Component Type Definitions
 *
 * This file contains TypeScript types and interfaces for all components
 * in the Stock Take Scheduler component library.
 */

import React from 'react';

/**
 * Common Props
 */
export interface CommonProps {
  /** Additional CSS class names */
  className?: string;
  /** Child elements */
  children?: React.ReactNode;
  /** Component ID for analytics/tracking */
  id?: string;
  /** Test ID for testing */
  'data-testid'?: string;
}

/**
 * Layout Component Props
 */
export interface SidebarProps extends CommonProps {
  /** Sidebar background color */
  bgColor?: string;
  /** Sidebar width (default: 88px) */
  width?: number;
}

export interface PageHeaderProps extends CommonProps {
  /** Alignment of header content */
  align?: 'left' | 'center' | 'right' | 'space-between';
}

export interface LayoutProps extends CommonProps {
  /** Sidebar configuration */
  sidebarConfig?: {
    showNavItems?: boolean;
    showAvatar?: boolean;
  };
}

/**
 * Page Component Props
 */
export interface PageProps extends CommonProps {
  /** Page title */
  title?: string;
  /** Show loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string | null;
}

export interface DashboardProps extends PageProps {
  /** Stats data for metric cards */
  stats?: {
    red?: { title: string; value: string };
    blue?: { title: string; value: string };
    yellow?: { title: string; value: string };
    black?: { title: string; value: string };
  };
  /** Recent shops data */
  recentShops?: Array<{
    id: string;
    name: string;
    status: string;
  }>;
  /** Upcoming stock takes data */
  stockTakes?: Array<{
    id: string;
    shop: string;
    date: string;
    time: string;
    status: string;
  }>;
  /** On banner close callback */
  onBannerClose?: () => void;
}

export interface CalendarPageProps extends PageProps {
  /** Calendar data */
  events?: Array<{
    date: string;
    status: 'pending' | 'in-progress' | 'complete';
    label?: string;
  }>;
  /** On date select callback */
  onDateSelect?: (date: string) => void;
}

export interface GeneratorPageProps extends PageProps {
  /** Current step (1-3) */
  currentStep?: 1 | 2 | 3;
  /** Form data */
  formData?: Record<string, any>;
  /** On form change callback */
  onChange?: (data: Record<string, any>) => void;
  /** On step change callback */
  onStepChange?: (step: 1 | 2 | 3) => void;
}

export interface ShopListPageProps extends PageProps {
  /** Shops list data */
  shops?: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
    schedule?: string;
  }>;
  /** Applied filters */
  filters?: string[];
  /** On filter change callback */
  onFilterChange?: (filters: string[]) => void;
  /** On shop select callback */
  onShopSelect?: (shopId: string) => void;
}

export interface MapViewPageProps extends PageProps {
  /** Map markers data */
  markers?: Array<{
    id: string;
    number: number;
    x: number;
    y: number;
    color: 'red' | 'blue' | 'yellow' | 'green';
    label?: string;
  }>;
  /** Selected marker ID */
  selectedMarker?: string;
  /** On marker click callback */
  onMarkerClick?: (markerId: string) => void;
  /** Shop list data for side panel */
  shops?: Array<{
    id: string;
    name: string;
    location: string;
    status: string;
  }>;
}

export interface SettingsPageProps extends PageProps {
  /** Settings data */
  settings?: Record<string, any>;
  /** On settings change callback */
  onChange?: (settings: Record<string, any>) => void;
  /** On save callback */
  onSave?: (settings: Record<string, any>) => void;
}

export interface PermissionsPageProps extends PageProps {
  /** Users list */
  users?: Array<{
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'manager' | 'viewer';
    status: 'active' | 'inactive';
  }>;
  /** Role definitions */
  roles?: Array<{
    id: string;
    name: string;
    permissions: string[];
  }>;
  /** On user role change callback */
  onRoleChange?: (userId: string, role: string) => void;
}

export interface LoginPageProps extends PageProps {
  /** On login callback */
  onLogin?: (email: string, password: string) => Promise<void>;
  /** On Microsoft sign in callback */
  onMicrosoftSignIn?: () => Promise<void>;
  /** Loading state */
  isLoading?: boolean;
  /** Error message */
  error?: string | null;
}

/**
 * Mobile Component Props
 */
export interface MobileDashboardProps extends PageProps {
  /** Current time for status bar */
  time?: string;
  /** Today's schedule items */
  scheduleItems?: Array<{
    id: string;
    shop: string;
    time: string;
    status: string;
  }>;
  /** Weekly progress percentage */
  weeklyProgress?: number;
  /** On tab change callback */
  onTabChange?: (tab: 'dashboard' | 'calendar' | 'map' | 'more') => void;
}

export interface MobileMapViewProps extends PageProps {
  /** Current time for status bar */
  time?: string;
  /** Map markers */
  markers?: Array<{
    id: string;
    number: number;
    color: string;
  }>;
  /** Active group */
  activeGroup?: 'A' | 'B' | 'C';
  /** Nearby shops in bottom sheet */
  nearbyShops?: Array<{
    id: string;
    name: string;
    distance: string;
    status: string;
  }>;
  /** On back callback */
  onBack?: () => void;
  /** On group select callback */
  onGroupSelect?: (group: 'A' | 'B' | 'C') => void;
}

export interface MobileShopDetailProps extends PageProps {
  /** Shop data */
  shop?: {
    id: string;
    name: string;
    address: string;
    phone: string;
    manager: string;
    email: string;
    scheduledDate: string;
    timeSlot: string;
    assignedStaff: string;
    status: string;
    badges?: string[];
  };
  /** On navigate callback */
  onNavigate?: () => void;
  /** On mark complete callback */
  onMarkComplete?: () => void;
  /** On add note callback */
  onAddNote?: (note: string) => void;
  /** On back callback */
  onBack?: () => void;
}

/**
 * Component Status Types
 */
export type ShopStatus = 'pending' | 'in-progress' | 'complete' | 'cancelled' | 'rescheduled';
export type UserRole = 'admin' | 'manager' | 'viewer' | 'guest';
export type MarkerColor = 'red' | 'blue' | 'yellow' | 'green' | 'black';

/**
 * Table & List Types
 */
export interface TableRow {
  id: string;
  [key: string]: any;
}

export interface ListItem {
  id: string;
  label: string;
  [key: string]: any;
}

/**
 * Form Types
 */
export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'date' | 'select' | 'checkbox';
  required?: boolean;
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
}

export interface FormData {
  [key: string]: any;
}

/**
 * Event/Callback Types
 */
export type EventCallback<T = any> = (data: T) => void | Promise<void>;
export type StateCallback<T> = (state: T) => void;
export type AsyncCallback<T = any> = (data: T) => Promise<void>;
