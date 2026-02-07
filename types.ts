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
 * Granular permissions for each page/feature
 */
export interface UserPermissions {
  // Page Access
  pages: {
    dashboard: boolean;
    calendar: boolean;
    generator: boolean;
    locations: boolean;
    shopList: boolean;
    inventory: boolean;
    permission: boolean;
    settings: boolean;
  };
  // Feature Actions
  actions: {
    reschedule_shop: boolean;
    close_shop: boolean;
    edit_shop: boolean;
    add_shop: boolean;
    delete_shop: boolean;
    generate_schedule: boolean;
    reset_schedule: boolean;
    export_data: boolean;
    manage_inventory: boolean;
    manage_users: boolean;
  };
}

/**
 * Default permissions by role
 */
export const DEFAULT_PERMISSIONS: Record<UserRole, UserPermissions> = {
  'Admin': {
    pages: {
      dashboard: true,
      calendar: true,
      generator: true,
      locations: true,
      shopList: true,
      inventory: true,
      permission: true,
      settings: true,
    },
    actions: {
      reschedule_shop: true,
      close_shop: true,
      edit_shop: true,
      add_shop: true,
      delete_shop: true,
      generate_schedule: true,
      reset_schedule: true,
      export_data: true,
      manage_inventory: true,
      manage_users: true,
    },
  },
  'App Owner': {
    pages: {
      dashboard: true,
      calendar: true,
      generator: true,
      locations: true,
      shopList: true,
      inventory: true,
      permission: true,
      settings: true,
    },
    actions: {
      reschedule_shop: true,
      close_shop: true,
      edit_shop: true,
      add_shop: true,
      delete_shop: false,
      generate_schedule: true,
      reset_schedule: true,
      export_data: true,
      manage_inventory: true,
      manage_users: true,
    },
  },
  'User': {
    pages: {
      dashboard: true,
      calendar: false,
      generator: false,
      locations: true,
      shopList: false,
      inventory: false,
      permission: false,
      settings: true,
    },
    actions: {
      reschedule_shop: false,
      close_shop: false,
      edit_shop: false,
      add_shop: false,
      delete_shop: false,
      generate_schedule: false,
      reset_schedule: false,
      export_data: false,
      manage_inventory: false,
      manage_users: false,
    },
  },
};

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
  Permissions?: UserPermissions; // Granular permissions (JSON stored in SharePoint)
}

/**
 * Check if user has admin access
 */
export const hasAdminAccess = (user: User | null): boolean => {
  if (!user) return false;
  return user.UserRole === 'Admin' || user.UserRole === 'App Owner';
};

/**
 * Permission actions for role-based access control (legacy - for backward compatibility)
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
 * Role-to-permission mapping (legacy - for backward compatibility)
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
 * Check if user has a specific permission (supports both legacy and granular)
 */
export const hasPermission = (user: User | null, action: PermissionAction): boolean => {
  if (!user || !user.UserRole) return false;

  // Use granular permissions if available
  if (user.Permissions) {
    const actionMap: Record<PermissionAction, keyof UserPermissions['actions'] | keyof UserPermissions['pages']> = {
      'view_dashboard': 'dashboard',
      'reschedule_shop': 'reschedule_shop',
      'close_shop': 'close_shop',
      'edit_shop': 'edit_shop',
      'generate_schedule': 'generate_schedule',
      'reset_schedule': 'reset_schedule',
      'manage_inventory': 'manage_inventory',
      'manage_users': 'manage_users',
      'view_settings': 'settings',
    };

    const key = actionMap[action];
    if (key in user.Permissions.pages) {
      return user.Permissions.pages[key as keyof UserPermissions['pages']];
    }
    if (key in user.Permissions.actions) {
      return user.Permissions.actions[key as keyof UserPermissions['actions']];
    }
  }

  // Fallback to role-based permissions
  return (ROLE_PERMISSIONS[user.UserRole] || []).includes(action);
};

/**
 * Check if user can access a specific page
 */
export const canAccessPage = (user: User | null, page: keyof UserPermissions['pages']): boolean => {
  if (!user) return false;

  // Admin always has access
  if (user.UserRole === 'Admin') return true;

  // Use granular permissions if available
  if (user.Permissions) {
    return user.Permissions.pages[page] === true;
  }

  // Fallback to default permissions based on role
  const role = user.UserRole || 'User';
  return DEFAULT_PERMISSIONS[role].pages[page];
};

/**
 * Check if user can perform a specific action
 */
export const canPerformAction = (user: User | null, action: keyof UserPermissions['actions']): boolean => {
  if (!user) return false;

  // Admin always has access
  if (user.UserRole === 'Admin') return true;

  // Use granular permissions if available
  if (user.Permissions) {
    return user.Permissions.actions[action] === true;
  }

  // Fallback to default permissions based on role
  const role = user.UserRole || 'User';
  return DEFAULT_PERMISSIONS[role].actions[action];
};

/**
 * Get user's effective permissions (granular or default based on role)
 */
export const getEffectivePermissions = (user: User | null): UserPermissions => {
  if (!user) {
    return DEFAULT_PERMISSIONS['User'];
  }

  if (user.Permissions) {
    return user.Permissions;
  }

  const role = user.UserRole || 'User';
  return DEFAULT_PERMISSIONS[role];
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
