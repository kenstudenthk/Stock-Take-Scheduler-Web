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
  region: string;   
  district: string; 
  area: string;     
  brand: string;    
  brandIcon?: string; // ✅ 加入這一行，允許儲存 Logo 網址
  is_mtr: boolean;  
  status: string; // 修正為 string 以相容 'Rescheduled' 等狀態
  scheduleStatus: string;
  groupId: number;  
  scheduledDate?: string; 
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
