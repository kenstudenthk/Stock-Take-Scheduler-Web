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
// Updated for new site MX_Assets_Audit Inventory List — column internal names changed to field_N (2026-07-22)
// Note: Mirror_ID column no longer exists in the new list; mirrorId is now sourced
// directly from the SharePoint list item's built-in `id` (see App.tsx mapInvItem).
export const INV_FIELDS = {
  SHOP_CODE: "field_1", // ShopCode
  BUSINESS_UNIT: "field_2", // Business Unit
  SHOP_BRAND: "field_3", // Shop Brand
  SHOP_NAME: "field_4", // Shop Name
  PRODUCT_TYPE_ENG: "field_5", // Product Type (Eng)
  PRODUCT_TYPE_CHI: "field_6", // Product Type (Chi)
  STOCK_TAKE_STATUS: "field_7", // Stock Take Status
  RECORD_TIME: "field_8", // Record Time
  ASSET_ITEM_ID: "field_9", // Asset Item ID
  BRAND: "field_10", // Brand
  ASSET_NAME: "field_11", // Asset Name
  CMDB: "field_12", // CMDB
  SERIAL_NO: "field_13", // SerialNo
  IP_ADDRESS: "field_15", // IP Address
  IN_USE_STATUS: "field_16", // In Use Status
  PRODUCT_STATUS: "field_17", // Product Status
  STOCK_TAKE_2026_STATUS: "field_18", // Stock Take 2026 Status
  APP_SYNC_STATUS: "field_19", // App Sync Status
  REMARKS: "field_20", // Remarks
  W_TO_W: "field_21", // W to W
  PRODUCT_IMAGE: "field_22", // ProductImage (confirmed with user)
  PRODUCT_IMAGE2: "field_23", // ProductImage2 (confirmed with user)
  UPLOAD_PHOTO: "field_24", // UploadPhoto
  RECORD_TIME_ALT: "field_25", // Created1
  CREATED_BY: "field_26", // Created By1
};

// --- Member List 欄位對照表 ---
// Updated for new site MX_Assets_Audit Member List — column internal names changed to field_N (2026-07-22)
// Note: "Title" is SharePoint's built-in system column and is kept as a literal
// name (not field_N); registration writes both Title and NAME (field_1) for the
// display name, per user confirmation.
export const MEMBER_FIELDS = {
  NAME: "field_1", // User
  USER_EMAIL: "field_2", // User Email
  ALIAS_EMAIL: "field_3", // Alias Email
  ROLE: "field_4", // Role
  WORKING_SHOP: "field_5", // Working Shop (not yet consumed by the app)
  CHECK_IN_TIME: "field_6", // Check In Time (not yet consumed by the app)
  CHECK_IN_ROLE: "field_7", // Check In Role (not yet consumed by the app)
  PASSWORD_HASH: "field_8", // PasswordHash
  LAST_LOGIN: "field_9", // LastLogin (not yet consumed by the app)
  ACCOUNT_STATUS: "field_10", // Account Status
  ACCOUNT_CREATE_DATE: "field_11", // Account Create Date
};

// --- Time Card List 欄位對照表 ---
// Updated for new site MX_Assets_Audit Time Card List — column internal names changed to field_N (2026-07-22)
export const TIME_CARD_FIELDS = {
  FE_NAME: "field_1", // FE Name
  ACTION_TIME: "field_2", // Action Time
  ACTION: "field_3", // Action
  SHOP_NAME: "field_4", // Shop Name
  ROLE: "field_5", // Role
};
