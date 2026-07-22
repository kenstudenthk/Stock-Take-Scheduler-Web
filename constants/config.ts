/**
 * Application Configuration
 * Reads from environment variables with fallback values for development
 */

// SharePoint Configuration
export const SHAREPOINT_CONFIG = {
  siteId:
    import.meta.env.VITE_SHAREPOINT_SITE_ID ||
    "pccw0.sharepoint.com:/sites/MX_Assets_Audit:",
  shopListId:
    import.meta.env.VITE_SHOP_LIST_ID || "142ee1aa-c0d0-4846-91f9-0b9b8a6c0e83",
  memberListId:
    import.meta.env.VITE_MEMBER_LIST_ID ||
    "5239aa9c-32a3-4372-b6ef-01f117bafb98",
  inventoryListId:
    import.meta.env.VITE_INVENTORY_LIST_ID ||
    "4febed7a-6b09-42c5-8ff9-9ae6331faeb2",
  errorLogListId:
    import.meta.env.VITE_ERROR_LOG_LIST_ID ||
    "2bb7f712-dcaa-4b7c-aaa9-0055d32afffc",
  timeCardListId:
    import.meta.env.VITE_TIME_CARD_LIST_ID ||
    "47e29fdc-ab5b-4cce-873f-9d81a7f17cd2",
} as const;

// API Base URLs
export const API_URLS = {
  graphBase: "https://graph.microsoft.com/v1.0",
  get sites() {
    return `${this.graphBase}/sites/${SHAREPOINT_CONFIG.siteId}`;
  },
  get shopList() {
    return `${this.sites}/lists/${SHAREPOINT_CONFIG.shopListId}`;
  },
  get memberList() {
    return `${this.sites}/lists/${SHAREPOINT_CONFIG.memberListId}`;
  },
  get inventoryList() {
    return `${this.sites}/lists/${SHAREPOINT_CONFIG.inventoryListId}`;
  },
  get errorLogList() {
    return `${this.sites}/lists/${SHAREPOINT_CONFIG.errorLogListId}`;
  },
  get timeCardList() {
    return `${this.sites}/lists/${SHAREPOINT_CONFIG.timeCardListId}`;
  },
} as const;

// AMap Configuration
export const AMAP_CONFIG = {
  apiKey: import.meta.env.VITE_AMAP_API_KEY || "",
  securityCode: import.meta.env.VITE_AMAP_SECURITY_CODE || "",
} as const;

// Token Management
export const TOKEN_CONFIG = {
  // Token warning threshold in minutes (warn user before expiry)
  warningThresholdMinutes: 45,
  // Token storage keys
  storageKeys: {
    graphToken: "stockTakeToken",
    tokenTimestamp: "stockTakeTokenTimestamp",
  },
} as const;

// Cloudflare Token Sync
export const CLOUDFLARE_CONFIG = {
  tokenSyncEndpoint: "https://stock-take-token-sync.f6v9zfjpcs.workers.dev/",
  imageProxy:
    "https://stock-take-token-sync.f6v9zfjpcs.workers.dev/image-proxy",
} as const;

// Default Values for Generator
export const GENERATOR_DEFAULTS = {
  shopsPerDay: 9,
  groupsPerDay: 3,
} as const;

// Batch Operation Settings
export const BATCH_CONFIG = {
  // Number of concurrent API requests
  concurrentRequests: 5,
  // Delay between batches in milliseconds
  batchDelayMs: 100,
  // Maximum retry attempts for failed requests
  maxRetries: 2,
} as const;
