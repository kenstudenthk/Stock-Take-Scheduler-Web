export enum View {
  DASHBOARD = 'dashboard',
  CALENDAR = 'schedules',
  GENERATOR = 'generator',
  LOCATIONS = 'shop-locations',
  SHOP_LIST = 'shop-list',
  REPORTS = 'reports',
  SETTINGS = 'settings',
  INVENTORY = 'inventory',
  PERMISSION = 'permission'
}

/**
 * User roles for access control
 */
export type UserRole = 'Admin' | 'App Owner' | 'User';

/**
 * User interface for authentication and authorization
 */
export interface User {
  id?: string;
  Name: string;
  UserEmail: string;
  AliasEmail: string;
  PasswordHash?: string;
  UserRole?: UserRole;
  AccountStatus?: 'Active' | 'Inactive';
  AccountCreateDate?: string;
}

/**
 * Check if user has admin access
 */
export const hasAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.UserRole === 'Admin' || user.UserRole === 'App Owner';
};

/**
 * Permission actions for role-based access control
 */
export type PermissionAction =
  | 'view_dashboard'
  | 'reschedule_shop'
  | 'close_shop'
  | 'edit_shop'
  | 'generate_schedule'
  | 'reset_schedule'
  | 'manage_inventory'
  | 'manage_users'
  | 'view_settings';

/**
 * Role-to-permission mapping
 */
export const ROLE_PERMISSIONS: Record<UserRole, PermissionAction[]> = {
  'Admin': [
    'view_dashboard', 'reschedule_shop', 'close_shop', 'edit_shop',
    'generate_schedule', 'reset_schedule', 'manage_inventory',
    'manage_users', 'view_settings'
  ],
  'App Owner': [
    'view_dashboard', 'reschedule_shop', 'close_shop', 'edit_shop',
    'generate_schedule', 'reset_schedule', 'manage_inventory',
    'manage_users', 'view_settings'
  ],
  'User': ['view_dashboard']
};

/**
 * Check if user has a specific permission
 */
export const hasPermission = (user: User | null, action: PermissionAction): boolean => {
  if (!user || !user.UserRole) return false;
  return (ROLE_PERMISSIONS[user.UserRole] || []).includes(action);
};

export interface Shop {
  id: string;
  sharePointItemId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;   
  district: string; 
  area: string;     
  brand: string;    
  brandIcon?: string; // ✅ 加入這一行，允許儲存 Logo 網址
  is_mtr: boolean;  
  status: string; // 修正為 string 以相容 'Rescheduled' 等狀態
  scheduleStatus: string;
  masterStatus: string;
  groupId: number;  
  scheduledDate?: string; 
  phone?: string;       // 對應 field_37
  contactName?: string; // 對應 field_38
}

export interface NavItemProps {
  view: View;
  currentView: View;
  icon: string;
  label: string;
  onClick: (view: View) => void;
  filled?: boolean;
}

export interface InventoryItem {
  id: string; // SharePoint Item ID
  mirrorId: string;
  shopCode: string;
  businessUnit: string;
  shopBrand: string;
  shopName: string;
  productTypeEng: string;
  productTypeChi: string;
  stockTakeStatus: string;
  recordTime: string;
  assetItemId: string;
  brand: string;
  assetName: string;
  cmdb: string;
  serialNo: string;
  ipAddress: string;
  inUseStatus: string;
  productStatus: string;
  stockTake2026Status: string;
  appSyncStatus: string;
  remarks: string;
  wToW: string;
  uploadPhoto: string;
  createdBy: string;
}
