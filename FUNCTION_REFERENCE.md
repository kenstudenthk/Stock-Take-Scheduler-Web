# Stock Take Scheduler Web - Complete Function Reference

> Use this documentation with AI UI generators to recreate the app without losing functionality.

---

## Core Data Models

### User System
```typescript
interface User {
  Name: string;
  UserEmail: string;
  AliasEmail: string;
  PasswordHash: string;
  UserRole: 'Admin' | 'App Owner' | 'User';
  AccountStatus: 'Active' | 'Inactive';
  AccountCreateDate: string;
}
```

### Shop Data
```typescript
interface Shop {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  region: string;
  district: string;
  area: string;
  brand: string;
  brandIcon: string;
  is_mtr: boolean;
  status: string;
  masterStatus: string;
  groupId: 1 | 2 | 3;
  scheduledDate: string;
  phone: string;
  contactName: string;
  sharePointItemId: string;
  businessUnit: string;
}
```

### Inventory
```typescript
interface InventoryItem {
  shopCode: string;
  businessUnit: string;
  assetItemId: string;
  brand: string;
  assetName: string;
  CMDB: string;
  serialNo: string;
  ipAddress: string;
  status: string;
}
```

---

## Granular Permission System

The app uses a granular permission system where each user can have individual page access and action permissions configured.

### User Interface with Permissions
```typescript
interface User {
  id?: string;
  Name: string;
  UserEmail: string;
  AliasEmail: string;
  PasswordHash?: string;
  UserRole?: 'Admin' | 'App Owner' | 'User';
  AccountStatus?: 'Active' | 'Inactive';
  AccountCreateDate?: string;
  Permissions?: UserPermissions;  // Custom permissions (JSON in SharePoint)
}
```

### Permission Structure
```typescript
interface UserPermissions {
  // Page Access - controls menu visibility and page access
  pages: {
    dashboard: boolean;    // Dashboard page
    calendar: boolean;     // Calendar/Schedules page
    generator: boolean;    // Schedule Generator wizard
    locations: boolean;    // Map View page
    shopList: boolean;     // Shop Master List page
    inventory: boolean;    // Inventory management page
    permission: boolean;   // Permission management page
    settings: boolean;     // Settings page
  };
  // Feature Actions - controls specific functionality
  actions: {
    reschedule_shop: boolean;    // Change shop scheduled dates
    close_shop: boolean;         // Mark shops as closed/resume
    edit_shop: boolean;          // Modify shop details
    add_shop: boolean;           // Create new shops
    delete_shop: boolean;        // Remove shops from system
    generate_schedule: boolean;  // Run K-means schedule generation
    reset_schedule: boolean;     // Clear and reset all schedules
    export_data: boolean;        // Export to Excel/PDF
    manage_inventory: boolean;   // Add/edit/delete inventory items
    manage_users: boolean;       // Modify user accounts and roles
  };
}
```

### Default Permissions by Role
```typescript
const DEFAULT_PERMISSIONS = {
  'Admin': {
    pages: { all: true },
    actions: { all: true }
  },
  'App Owner': {
    pages: { all: true },
    actions: { all: true, delete_shop: false }
  },
  'User': {
    pages: { dashboard: true, locations: true, settings: true },
    actions: { all: false }
  }
};
```

### Permission Helper Functions
```typescript
// Check if user can access a specific page
canAccessPage(user: User | null, page: keyof UserPermissions['pages']): boolean;

// Check if user can perform a specific action
canPerformAction(user: User | null, action: keyof UserPermissions['actions']): boolean;

// Get user's effective permissions (custom or role defaults)
getEffectivePermissions(user: User | null): UserPermissions;

// Legacy helper (backward compatible)
hasPermission(user: User | null, action: PermissionAction): boolean;
```

### Permission Mapping by Page

| Page | Page Permission | Available Actions |
|------|-----------------|-------------------|
| **Dashboard** | `pages.dashboard` | `reschedule_shop`, `close_shop`, `edit_shop` |
| **Calendar** | `pages.calendar` | `reschedule_shop`, `export_data` |
| **Generator** | `pages.generator` | `generate_schedule`, `reset_schedule` |
| **Locations** | `pages.locations` | (view only) |
| **Shop List** | `pages.shopList` | `edit_shop`, `add_shop`, `delete_shop`, `export_data` |
| **Inventory** | `pages.inventory` | `manage_inventory` |
| **Permission** | `pages.permission` | `manage_users` |
| **Settings** | `pages.settings` | (token management) |

### SharePoint Storage
Permissions are stored as JSON in the `Permissions` column (Multiple lines of text) in the Member List.

Example stored value:
```json
{
  "pages": {
    "dashboard": true,
    "calendar": true,
    "generator": false,
    "locations": true,
    "shopList": true,
    "inventory": false,
    "permission": false,
    "settings": true
  },
  "actions": {
    "reschedule_shop": true,
    "close_shop": false,
    "edit_shop": true,
    "add_shop": false,
    "delete_shop": false,
    "generate_schedule": false,
    "reset_schedule": false,
    "export_data": true,
    "manage_inventory": false,
    "manage_users": false
  }
}
```

### Usage in Components

```typescript
// In any component that needs permission checking
import { canAccessPage, canPerformAction } from '../types';

// Check page access (used in Layout.tsx for menu filtering)
if (canAccessPage(currentUser, 'generator')) {
  // Show generator menu item
}

// Check action permission (used in components for button visibility)
{canPerformAction(currentUser, 'reschedule_shop') && (
  <Button onClick={handleReschedule}>Reschedule</Button>
)}

// Check action permission for disabling
<Button
  disabled={!canPerformAction(currentUser, 'export_data')}
  onClick={handleExport}
>
  Export
</Button>
```

---

## Page Components

### 1. Login Component
```typescript
interface LoginProps {
  onLoginSuccess: (user: User) => void;
  sharePointService: SharePointService;
  onNavigateToSettings: () => void;
}
```
**Features:**
- Flip-card authentication UI with animations
- 3 modes: Login, Set Password, Change Password, Register
- Password hashing with bcryptjs
- Connection status indicator
- Auto-fill after registration

---

### 2. Dashboard Component
```typescript
interface DashboardProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  onUpdateShop: undefined;
  currentUser: User;
}
```
**Features:**
- Stats cards: Total, Completed, Closed, Remaining
- Date picker to filter by scheduled date
- Group filter (A/B/C/All)
- Per-shop actions:
  - **Reschedule** - Date picker with smart suggestions
  - **Move to Pool** - Clear date, set status "Rescheduled"
  - **Close** - Mark shop as closed (Admin only)
  - **Resume** - Re-open closed shop
- Shop cards: brand logo, name, address, group, status

---

### 3. Calendar Component
```typescript
interface CalendarProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
}
```
**Features:**
- FullCalendar month/week views
- Drag-and-drop to reschedule
- Holiday background highlighting (HK 2025-2028)
- Group color coding: A=Blue, B=Purple, C=Orange
- Event click to change group
- Locked events (today/past/next week)
- Sidebar daily summary
- Export to Excel/PDF with date range picker

---

### 4. Generator Component (Schedule Wizard)
```typescript
interface GeneratorProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser: User;
}
```
**3-Step Wizard:**
1. **Configure** - Date range, regions, K-means clusters
2. **Generate** - Run clustering, preview schedule
3. **Sync** - Batch update to SharePoint

**Features:**
- Region selection (HK Island, Kowloon, N.T.)
- K-means clustering for geographic grouping
- 9 shops/day, 3 groups distribution
- Progress tracking with percentage
- Batch API with retry logic

---

### 5. ShopList Component
```typescript
interface ShopListProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser: User;
}
```
**Features:**
- Bento-grid stats cards
- Cascading filters: brand, district, region, area, group, status
- Search by name/code
- Date range picker
- Inline editing
- Add new shop modal
- Excel export

---

### 6. Locations Component (Map)
```typescript
interface LocationsProps {
  shops: Shop[];
}
```
**Features:**
- AMap interactive map
- Markers with group colors
- Legend (Groups A/B/C, Completed, Closed)
- Batched marker creation (80/frame)
- Summary stat cards
- Click to center on shop
- Auto-switches to MobileMapView on screens ≤640px

---

### 7. Inventory Component
```typescript
interface InventoryProps {
  invToken: string;
  shops: Shop[];
}
```
**Features:**
- Asset inventory table
- Filters: shop, serial number, CMDB
- Add/edit inventory items
- Shop autocomplete with auto-fill
- Status tracking

---

### 8. Permission Component
```typescript
interface PermissionProps {
  graphToken: string;
  currentUser: User;
}
```
**Features:**
- User management table with avatar, role, status
- Role assignment dropdown (Admin/App Owner/User)
- Status toggle (Active/Inactive)
- **Configure button** - Opens permission editor modal
- Bento stat cards (Total, Active, Admins, App Owners, Custom Perms)
- Search by name/email/role

**Permission Editor Modal:**
- Two tabs: **Page Access** and **Actions**
- Toggle switches for each permission
- **Reset to Defaults** button - Restores role-based defaults
- Admins shown as locked (cannot be modified)
- Shows "Custom" tag for users with custom permissions

---

### 9. Settings Component
```typescript
interface SettingsProps {
  token: string;
  onUpdateToken: (token: string) => void;
  tokenTimestamp: number | null;
  onLogout?: () => void;
}
```
**Features:**
- Token status with expiry countdown
- Token update form (shared across all users)
- Copy SharePoint URL button
- Open Graph Explorer helper
- Logout button (mobile)

---

## Mobile Components

### MobileMapView
```typescript
interface MobileMapViewProps {
  shops: Shop[];
}
```
**Features:**
- Full-screen AMap
- GPS location button
- User marker with pulsing animation
- Distance to each shop (Haversine formula)
- Route planning (walking + transit)
- Auto-show walking route
- Bottom sheet (3 states)

---

### GroupSelector
```typescript
interface GroupSelectorProps {
  selectedGroup: number | null;
  onSelectGroup: (group: number | null) => void;
  groupCounts: Record<number, number>;
}
```
**Features:**
- A/B/C toggle buttons
- Shop count per group
- Active highlighting

---

### BottomSheet
```typescript
interface BottomSheetProps {
  shops: Shop[];
  selectedShopId: string | null;
  onSelectShop: (shop: Shop) => void;
  onNavigate: (shop: Shop) => void;
  state: 'collapsed' | 'half' | 'expanded';
  onStateChange: (state: BottomSheetState) => void;
}
```
**Features:**
- Swipeable with 3 states
- Shop list with distance
- Navigate button per shop
- Smooth transitions

---

### RoutePanel
```typescript
interface RoutePanelProps {
  walking: RouteInfo | null;
  transit: RouteInfo | null;
  activeRoute: 'walking' | 'transit' | null;
  loading: boolean;
  onSelectRoute: (type: 'walking' | 'transit') => void;
  shopName: string;
  distanceKm?: number;
}
```
**Features:**
- Walking/Transit side-by-side
- Distance and duration display
- Transit hidden for <1km distance
- Expandable turn-by-turn directions

---

## Hooks

### useGeolocation
```typescript
interface UseGeolocationReturn {
  position: { lat: number; lng: number } | null;
  loading: boolean;
  error: string | null;
  getCurrentPosition: () => void;
  clearError: () => void;
}
```
**Features:**
- On-demand GPS via AMap.Geolocation
- Returns GCJ-02 coordinates
- Error handling for permissions

---

### useAMapRoute
```typescript
interface UseAMapRouteReturn {
  walking: RouteInfo | null;
  transit: RouteInfo | null;
  activeRoute: 'walking' | 'transit' | null;
  loading: boolean;
  error: string | null;
  planRoute: (from, to, mapInstance) => void;
  showRoute: (type: 'walking' | 'transit') => void;
  clearRoute: () => void;
}

interface RouteInfo {
  distance: number;  // meters
  duration: number;  // seconds
  steps?: string[];  // turn-by-turn
}
```

---

## Services

### SharePointService
```typescript
class SharePointService {
  constructor(graphToken: string);

  // User Management
  getUserByAliasEmail(email: string): Promise<User | null>;
  registerMember(userData: object): Promise<boolean>;
  updatePasswordByEmail(email: string, hash: string): Promise<boolean>;
  getAllMembers(): Promise<User[]>;  // Returns users with Permissions parsed from JSON
  updateMemberRole(id: string, role: string): Promise<boolean>;
  updateMemberStatus(id: string, status: string): Promise<boolean>;

  // Permission Management
  updateMemberPermissions(id: string, permissions: UserPermissions): Promise<boolean>;
  resetMemberPermissions(id: string, role: UserRole): Promise<boolean>;

  // Shop Management
  getShops(): Promise<Shop[]>;
  updateShopScheduleStatus(id: string, date: string, group: number, status: string): Promise<boolean>;
  saveSchedulesToSharePoint(schedules: Schedule[]): Promise<BatchResult>;

  // Utility
  checkMemberListConnection(): Promise<boolean>;
}
```

---

### TokenService
```typescript
const TokenService = {
  getToken(): Promise<{ token: string; timestamp: number | null }>;
  setToken(token: string): Promise<boolean>;
  isTokenExpired(timestamp: number | null): boolean;
  getTimeRemaining(timestamp: number | null): number;
};
```

---

## Utilities

### kmeans.ts
```typescript
function performKmeans(
  shops: Shop[],
  k: number,
  maxIterations?: number
): ShopCluster[];

function generateSchedulesByDate(
  clusters: ShopCluster[],
  params: ScheduleParams
): DaySchedule[];

// Helpers
function calculateDistance(lat1, lon1, lat2, lon2): number;  // km
function isBusinessDay(date: Date): boolean;
function nextBusinessDay(date: Date): Date;
```

---

### coordTransform.ts
```typescript
function wgs84ToGcj02(lng: number, lat: number): [number, number];
function gcj02towgs84(lng: number, lat: number): [number, number];
```

---

### batchOperations.ts
```typescript
interface BatchOptions {
  concurrency?: number;      // default: 5
  retryAttempts?: number;    // default: 2
  batchDelay?: number;       // ms between batches
  onProgress?: (completed: number, total: number) => void;
}

function executeBatch<T, R>(
  items: T[],
  operation: (item: T) => Promise<R>,
  options?: BatchOptions
): Promise<BatchResult<R>>;

function retryFailed<T, R>(
  previousResult: BatchResult<R>,
  operation: (item: T) => Promise<R>,
  options?: BatchOptions
): Promise<BatchResult<R>>;
```

---

## Configuration Constants

### SharePoint Config
```typescript
const SHAREPOINT_CONFIG = {
  siteId: 'pccw0.sharepoint.com:/sites/BonniesTeam',
  shopListId: 'ce3a752e-7609-4468-81f8-8babaf503ad8',
  memberListId: 'c01997f9-3589-45ff-bccc-d9b0f16d6770',
  inventoryListId: '2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48'
};
```

### Generator Defaults
```typescript
const GENERATOR_DEFAULTS = {
  shopsPerDay: 9,
  groupsPerDay: 3
};
```

### Token Config
```typescript
const TOKEN_CONFIG = {
  warningThreshold: 45,  // minutes
  storageKeys: {
    graphToken: 'graph_token',
    tokenTimestamp: 'graph_token_timestamp'
  }
};
```

### Batch Config
```typescript
const BATCH_CONFIG = {
  concurrency: 5,
  retryAttempts: 2,
  batchDelay: 100
};
```

---

## State Management (App.tsx)

```typescript
// Central State
const [graphToken, setGraphToken] = useState<string>('');
const [tokenTimestamp, setTokenTimestamp] = useState<number | null>(null);
const [allShops, setAllShops] = useState<Shop[]>([]);
const [currentUser, setCurrentUser] = useState<User | null>(null);
const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
const [loading, setLoading] = useState(false);
const [hasTokenError, setHasTokenError] = useState(false);

// Data Flow
// 1. Load shared token from API on mount
// 2. Fetch all shops with token
// 3. Pass shops to components via props
// 4. Components call SharePointService for mutations
// 5. onRefresh() triggers data refetch
```

---

## UI Framework & Styling

- **UI Library:** Ant Design 5
- **CSS:** Tailwind CSS 3
- **Icons:** @ant-design/icons, lucide-react
- **Theme:** Primary color #05043e, border-radius 8px
- **Dark Mode:** Toggle via body class

---

## Feature Summary Table

| Feature | Component | Key Functionality |
|---------|-----------|-------------------|
| Authentication | Login | Email/password with RBAC |
| Dashboard | Dashboard | Stats, filtering, shop actions |
| Calendar | Calendar | Drag-drop scheduling, export |
| Auto-Schedule | Generator | K-means clustering wizard |
| Shop Management | ShopList | CRUD, filters, inline edit |
| Map View | Locations | AMap markers, legend |
| Mobile Navigation | MobileMapView | GPS, routing, bottom sheet |
| Asset Tracking | Inventory | CRUD, status tracking |
| User Management | Permission | Roles, status |
| Token Management | Settings | Shared token, expiry |

---

## API Endpoints (Cloudflare Pages Functions)

### Token API
```
GET  /api/token  - Get shared token
POST /api/token  - Update shared token { token: string }
```

---

## Dependencies

```json
{
  "react": "^18",
  "antd": "^5",
  "tailwindcss": "^3",
  "@fullcalendar/react": "^6",
  "dayjs": "^1",
  "exceljs": "^4",
  "jspdf": "^2",
  "bcryptjs": "^2",
  "lucide-react": "^0.400"
}
```
