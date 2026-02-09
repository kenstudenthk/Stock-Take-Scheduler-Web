/**
 * Application Configuration
 * Reads from environment variables with fallback values for development
 */

// SharePoint Configuration
export const SHAREPOINT_CONFIG = {
  siteId: import.meta.env.VITE_SHAREPOINT_SITE_ID || 'pccw0.sharepoint.com:/sites/BonniesTeam:',
  shopListId: import.meta.env.VITE_SHOP_LIST_ID || 'ce3a752e-7609-4468-81f8-8babaf503ad8',
  memberListId: import.meta.env.VITE_MEMBER_LIST_ID || 'c01997f9-3589-45ff-bccc-d9b0f16d6770',
  inventoryListId: import.meta.env.VITE_INVENTORY_LIST_ID || '2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48',
  errorLogListId: import.meta.env.VITE_ERROR_LOG_LIST_ID || '5d722abb-ab79-4fc5-b03c-099580db85ba',
} as const;

// API Base URLs
export const API_URLS = {
  graphBase: 'https://graph.microsoft.com/v1.0',
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
} as const;

// AMap Configuration
export const AMAP_CONFIG = {
  apiKey: import.meta.env.VITE_AMAP_API_KEY || '',
  securityCode: import.meta.env.VITE_AMAP_SECURITY_CODE || '',
} as const;

// Token Management
export const TOKEN_CONFIG = {
  // Token warning threshold in minutes (warn user before expiry)
  warningThresholdMinutes: 45,
  // Token storage keys
  storageKeys: {
    graphToken: 'stockTakeToken',
    tokenTimestamp: 'stockTakeTokenTimestamp',
  },
} as const;

// Cloudflare Token Sync
export const CLOUDFLARE_CONFIG = {
  tokenSyncEndpoint: 'https://stock-take-token-sync.f6v9zfjpcs.workers.dev/',
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
