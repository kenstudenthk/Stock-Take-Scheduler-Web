export enum View {
  DASHBOARD = 'dashboard',
  CALENDAR = 'schedules',
  GENERATOR = 'generator',
  LOCATIONS = 'shop-locations',
  SHOP_LIST = 'shop-list', // ✅ 新增：解決 ts(2339) 報錯
  REPORTS = 'reports',
  SETTINGS = 'settings',
  INVENTORY = 'inventory'
}

export interface Shop {
  id: string;
  sharePointItemId?: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;   // field_9
  district: string; // field_16
  area: string;     // field_10
  brand: string;    // field_11
  is_mtr: boolean;  // field_17
  status: 'completed' | 'scheduled' | 'pending' | 'closed';
  scheduleStatus: string;
  groupId: number;  // Schedule_x0020_Group
  scheduledDate?: string; // field_2
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
