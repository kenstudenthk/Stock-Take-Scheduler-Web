// 定義 SharePoint 欄位對照表
export const SP_FIELDS = {
  OLD_STATUS: 'field_1',        // Keep last year's status for reference
  STATUS: 'ScheduleStatus',
  SCHEDULE_DATE: 'field_2',
  CLOSE_STATUS: 'field_4',
  CLOSE_DATE: 'field_5',
  SHOP_CODE: 'field_6',
  SHOP_NAME: 'field_7',
  ADDRESS_CHI: 'field_8',
  REGION: 'field_9',
  AREA: 'field_10',
  BRAND: 'field_11',
  SYS: 'field_12',
  BUSINESS_UNIT: 'field_13',
  ADDRESS_ENG: 'field_14',
  BUILDING: 'field_15',
  DISTRICT: 'field_16',
  MTR: 'field_17',
  LATITUDE: 'field_20',
  LONGITUDE: 'field_21',
  BRAND_ICON: 'field_23',
  DURATION: 'field_33',
  PHONE: 'field_37',
  CONTACT: 'field_38',
  REMARK: 'Remark', // 根據你的資料，Remark 是唯一一個直接用名稱的
  SCHEDULE_GROUP: 'Schedule_x0020_Group' // ✅ Add this for Group mapping
  CALL_STATUS: 'field_39',  // Choice Column
  CALL_DATE: 'field_40',    // Date Column
  CALL_REMARK: 'CallRemark' // Text Column
};

// --- Inventory List 欄位對照表 ---
export const INV_FIELDS = {
  MIRROR_ID: 'Mirror_ID',
  SHOP_CODE: 'ShopCode',
  BUSINESS_UNIT: 'Business_x0020_Unit',
  SHOP_BRAND: 'Shop_x0020_Brand',
  SHOP_NAME: 'Shop_x0020_Name',
  PRODUCT_TYPE_ENG: 'Product_x0020_Type_x0020__x0028_',
  PRODUCT_TYPE_CHI: 'Product_x0020_Type_x0020__x0028_0',
  STOCK_TAKE_STATUS: 'Stock_x0020_Take_x0020_Status',
  RECORD_TIME: 'Record_x0020_Time',
  ASSET_ITEM_ID: 'Asset_x0020_Item_x0020_ID',
  BRAND: 'Brand',
  ASSET_NAME: 'Asset_x0020_Name',
  CMDB: 'CMDB',
  SERIAL_NO: 'SerialNo',
  IP_ADDRESS: 'IP_x0020_Address',
  IN_USE_STATUS: 'In_x0020_Use_x0020_Status',
  PRODUCT_STATUS: 'ProductStatus',
  STOCK_TAKE_2026_STATUS: 'StockTake2026Status', // 針對 2026 年度
  APP_SYNC_STATUS: 'AppSyncStatus',
  REMARKS: 'Remarks',
  W_TO_W: 'W_x0020_to_x0020_W',
  UPLOAD_PHOTO: 'UploadPhoto',
  CREATED_BY: 'Created_x0020_By1',
  RECORD_TIME_ALT: 'Created1' // 你提到的 Created1 對應 Record Time
};
