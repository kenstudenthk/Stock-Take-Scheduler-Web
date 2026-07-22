// 定義 SharePoint 欄位對照表
// Updated for new site MX_Assets_Audit Shop List — column internal names changed to field_N (2026-07-22)
export const SP_FIELDS = {
  OLD_STATUS: "field_7", // Close Status — drives masterStatus (Open/Closed)
  STATUS: "field_2", // Schedule Status
  SCHEDULE_DATE: "field_5", // Schedule Date
  CLOSE_STATUS: "field_7", // Close Status (unused in app logic today)
  CLOSE_DATE: "field_8", // ShopCloseDate (unused in app logic today)
  SHOP_CODE: "field_9", // Shop Code
  SHOP_NAME: "field_10", // ShopName
  ADDRESS_CHI: "field_11", // Address(Chi)
  REGION: "field_12", // Region
  AREA: "field_13", // Area
  BRAND: "field_14", // Brand
  SYS: "field_17", // SYS
  BUSINESS_UNIT: "field_18", // Business Unit
  ADDRESS_ENG: "field_19", // Address(Eng)
  BUILDING: "field_20", // Building
  DISTRICT: "field_21", // District
  MTR: "field_22", // MTR(Y/N)
  LATITUDE: "field_15", // Latitude
  LONGITUDE: "field_16", // Longitude
  BRAND_ICON: "field_26", // Brandicon
  DURATION: "field_37", // DurationMins
  PHONE: "field_42", // Telephone Number
  CONTACT: "field_43", // Contact name
  REMARK: "field_47", // Remark
  SCHEDULE_GROUP: "field_48", // Schedule Group
  CALL_STATUS: "field_44", // Call Status (Choice Column)
  CALL_DATE: "field_45", // Call Date
  CALL_REMARK: "field_46", // Call Remark
  START_TIME: "field_28", // Start Time
  END_TIME: "field_29", // End Time
  TIME_USE: "field_32", // Time use
  MAIN_FE: "field_39", // Main FE
  ASSISTANT_FE: "field_40", // Assistant FE
  STAFF_NO: "field_34", // Staff No.
  STAFF_NAME: "field_33", // Staff Name
};

// --- Inventory List 欄位對照表 ---
export const INV_FIELDS = {
  MIRROR_ID: "Mirror_ID",
  SHOP_CODE: "ShopCode",
  BUSINESS_UNIT: "Business_x0020_Unit",
  SHOP_BRAND: "Shop_x0020_Brand",
  SHOP_NAME: "Shop_x0020_Name",
  PRODUCT_TYPE_ENG: "Product_x0020_Type_x0020__x0028_",
  PRODUCT_TYPE_CHI: "Product_x0020_Type_x0020__x0028_0",
  STOCK_TAKE_STATUS: "Stock_x0020_Take_x0020_Status",
  RECORD_TIME: "Record_x0020_Time",
  ASSET_ITEM_ID: "Asset_x0020_Item_x0020_ID",
  BRAND: "Brand",
  ASSET_NAME: "Asset_x0020_Name",
  CMDB: "CMDB",
  SERIAL_NO: "SerialNo",
  IP_ADDRESS: "IP_x0020_Address",
  IN_USE_STATUS: "In_x0020_Use_x0020_Status",
  PRODUCT_STATUS: "ProductStatus",
  STOCK_TAKE_2026_STATUS: "StockTake2026Status", // 針對 2026 年度
  APP_SYNC_STATUS: "AppSyncStatus",
  REMARKS: "Remarks",
  W_TO_W: "W_x0020_to_x0020_W",
  UPLOAD_PHOTO: "UploadPhoto",
  PRODUCT_IMAGE: "ProductImage",
  PRODUCT_IMAGE2: "ProductImage2",
  CREATED_BY: "Created_x0020_By1",
  RECORD_TIME_ALT: "Created1", // 你提到的 Created1 對應 Record Time
};
