# Stock Take Scheduler Web

A modern web application for managing and scheduling inventory stock takes across multiple retail shop locations. Built with React, TypeScript, and integrated with Microsoft SharePoint via Graph API.

> **Changelog:** See [`UPDATE.md`](./UPDATE.md) for a full history of features and bug fixes.

---

## Application Pages & Features

### 1. Login Page

Secure authentication system for team members.

**Features:**
- Login with Alias Email and Password
- First-time password setup for new accounts
- Change password functionality with old password verification
- New member registration with automatic account creation
- Real-time SharePoint connection status indicator
- Flip card animation between login and registration forms

---

### 2. Dashboard

Central hub providing an overview of all stock take operations.

**Features:**
- **Statistics Cards:**
  - Total active shops count
  - Completed stock takes this year
  - Remaining unplanned shops
  - Reschedule Pool count (animated badge when pool is non-empty)
  - Shops by schedule status (Planned, Unplanned, Done)

- **Quick Filters:**
  - Filter shops by status (All, Planned, Unplanned, Completed)
  - View shops requiring attention

- **Shop Actions:**
  - **Reschedule** — opens Smart Reschedule modal (date + Move to Pool)
  - **Move to Pool** — clears date, sets status to `Rescheduled`
  - **Close** — sets status to `Closed`
  - **Resume** — reopens a closed shop back to `Pending`

---

### 3. Schedule Generator

Intelligent scheduling system with automatic optimization, presented as a horizontal step wizard (Configure → Preview → Confirm & Sync).

**Features:**
- **Smart Filtering:**
  - Filter by Region (HK Island, Kowloon, N.T., Lantau, Macau)
  - Filter by District (Wan Chai, Central, Mong Kok, etc.)
  - Include/Exclude MTR shops toggle

- **Schedule Configuration:**
  - Set start date with calendar picker
  - Configure shops per day (default: 9)
  - Configure groups per day (default: 3)

- **Automatic Optimization:**
  - Auto-skip weekends (Saturday, Sunday)
  - Auto-skip Hong Kong public holidays (2025–2028)
  - Geographic grouping using K-means clustering
  - Shops sorted by location proximity

- **Preview & Sync:**
  - Preview generated schedule in table format
  - View date, group, shop name, and district
  - Batch sync to SharePoint with progress indicator
  - Retry failed items with one click

- **Reschedule Pool tab:**
  - Separate tab for shops with `status === 'Rescheduled'` and no date
  - Generates and syncs a pool schedule independently from the regular schedule

- **Reset Functions:**
  - Reset by date period (select date range)
  - Reset all planned schedules

---

### 4. Schedules (Calendar)

Visual calendar interface for schedule management.

**Features:**
- **Monthly Calendar (FullCalendar):**
  - View all scheduled stock takes by date
  - Color-coded by group (Group A, B, C)
  - Click date or shop chip to open a combined reschedule modal (date + group in one action)

- **Schedule Details:**
  - View shop name, brand, and district
  - View assigned group for each shop
  - Total shops count per day

- **Export Functions:**
  - Export to Excel (.xlsx) with full details
  - Export to PDF with formatted table
  - Custom date range selection for export

- **Quick Navigation:**
  - Previous/Next month buttons
  - Jump to specific month/year

---

### 5. Shops (Master List + Map View)

Unified shop database and map, combined behind a single **Table / Map** toggle (`Segmented`, session-persisted).

**Table view — Advanced Filtering (9 filter options):**
- Region (HK, KN, NT, Islands, MO)
- District (50+ districts)
- Brand (CSL, 1O1O, SUN Mobile, etc.)
- MTR Status (MTR shops / Non-MTR)
- Schedule Status (Planned, Unplanned, Done, Rescheduled)
- Master Status (Active, Closed)
- Search by Shop Name / Shop Code / Address

**Table view — Data & Editing:**
- Shop Code, Name, Brand (with logo icon), Region, District, Address, Phone, Contact person
- Schedule status tag + scheduled date + group assignment
- Inline editing of contact phone/name with auto-save to SharePoint
- Call logging with timestamp and status-aware button (Called / No Answer / Log Call)
- Bulk selection and batch status update

**Map view — AMap Integration:**
- Full Hong Kong map coverage, 2D only (optimised for performance)
- Batched marker creation (80/frame) to prevent UI freeze
- Color-coded markers by region; click marker for shop detail popup
- Filter markers by region, brand, and status
- WGS-84 → GCJ-02 coordinate conversion for accurate AMap positioning

---

### 5b. Mobile Map Navigation (PWA)

Mobile-optimised map for Field Engineers (FEs) navigating between shops during stock takes. Renders automatically on screens ≤640px.

**Features:**
- **Date Picker**: view scheduled shops for any date, not just today
- **Group Selection**: dropdown to switch between Groups A/B/C
- **GPS Location**: on-demand button (saves battery), blue pulsing marker
- **Distance Display**: Haversine distance from user to each shop
- **Route Planning**: walking and transit routes via AMap, with a floating Route button when a shop is selected
- **Bottom Sheet Route Panel**: fixed to bottom, collapsible, drag handle
  - Walking: shown only if distance ≤ 1km, turn-by-turn directions
  - Transit: route number, via stops, MTR entrance/exit info
  - Tap segment header → map zooms to that segment
  - Falls back to a visible "Route unavailable" message instead of disappearing

**Component Structure:**
```
components/MobileMapView/
├── MobileMapView.tsx
├── TopShopPanel.tsx   # Date picker + group dropdown + distance-sorted shop list
├── RoutePanel.tsx     # Walk/transit details with tap-to-zoom segments
└── index.ts

hooks/
├── useGeolocation.ts   # AMap.Geolocation (on-demand GPS)
└── useAMapRoute.ts     # AMap.Walking + AMap.Transfer
```

**AMap Plugins:** `AMap.Geolocation`, `AMap.Walking`, `AMap.Transfer`, `AMap.Scale`

---

### 6. Reports

Strategic management analytics and operational health dashboard.

**Features:**
- Business Unit / brand share breakdown (company-wide)
- Coverage matrices filtered by region/district
- Operational health indicators (filtered)
- Completion trend over time (area/bar charts via Recharts)
- District-level detail table with done / planned / pending / rescheduled counts

---

### 7. Time Card

Attendance tracking for Field Engineer check-ins/check-outs, backed by the SharePoint "Time Card" list.

**Features:**
- Filters: FE Name, Shop Name, Action (Check In/Check Out), Role (Main/Assistant), Date Range
- Stat cards: Total entries / Unique FEs / Check Ins / Check Outs
- Client-side sorted table (sorting is done client-side to avoid Graph API `$orderby` errors on non-indexed columns)

---

### 8. Inventory Management

Asset tracking and inventory item management.

**Features:**
- **Asset List:**
  - View all inventory items
  - Filter by shop, product type, status

- **Asset Details:**
  - Asset Item ID, Brand, Product Name, Serial Number
  - CMDB Reference, IP Address
  - In-Use Status, Product Status

- **Data Management:**
  - Edit asset details, update status, add remarks
  - Photo carousel with pagination (loaded via SharePoint Image column attachments)
  - Drill-down navigation from Shop Detail Modal → per-shop inventory

---

### 9. Permission (Admin)

Role-based access control management, kept in sync with `ROLE_PERMISSIONS` in `types.ts`.

**Roles:** `Admin`, `App Owner`, `User` — each with a distinct capability matrix (scheduling, inventory, user management, settings).

---

### 10. Settings

Application configuration and token management.

**Features:**
- **SharePoint Token Management:**
  - Paste and save Graph API token
  - Separate tokens for Shop List and Inventory
  - Token validation check and connection status indicator
  - Automatic cross-device token sync via Cloudflare Worker (polls every 5 minutes)

- **Token Expiry Warning:**
  - Automatic warning after 45 minutes
  - Guide to refresh token via Microsoft Graph Explorer

- **API Information:**
  - Display current Site ID, List IDs, API endpoint reference

---

### 11. Error Report

Built-in bug reporting system.

**Features:**
- Report categories: UI/Display Issues, Data Sync Problems, Feature Requests, Other
- Description text area with automatic user info + timestamp capture
- Direct submission to SharePoint with confirmation message

---

## Additional Features

### Theme Support
- Light mode (default), dark mode toggle
- Persistent preference: localStorage first, falls back to `prefers-color-scheme` on first visit

### Responsive Design
- Desktop sidebar navigation with collapsible menu
- Mobile bottom navigation bar with role-aware "More" overflow popover
- Dedicated mobile map view (see [Section 5b](#5b-mobile-map-navigation-pwa))

### PWA Support
- Installable via `vite-plugin-pwa` (service worker, offline app shell caching)
- Full-screen install guide shown to browser users (not yet installed as PWA)

### Data Security
- Password hashing with bcrypt
- Input sanitization for OData `$filter` queries (`sanitizeFilterValue()`)
- Token-based authentication

### Error Handling
- Error boundary for crash recovery
- User-friendly error messages with retry options for failed operations

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | React 18, TypeScript 5.7 |
| **Build Tool** | Vite 6 |
| **UI Components** | Ant Design 5 |
| **Styling** | Tailwind CSS 3 |
| **Calendar** | FullCalendar 6 (daygrid, timegrid, interaction) |
| **Charts** | Recharts |
| **Icons** | Ant Design Icons, Lucide React |
| **Maps** | AMap JS API (`@amap/amap-jsapi-loader`) |
| **Backend** | Microsoft Graph API (SharePoint Online) |
| **Token Sync** | Cloudflare Workers + KV |
| **Export** | ExcelJS, jsPDF / jspdf-autotable |
| **Dates** | dayjs |
| **HTTP** | axios |
| **Auth** | bcryptjs |
| **PWA** | vite-plugin-pwa |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Microsoft Graph API access token

### Installation

```bash
# Clone the repository
git clone https://github.com/kenstudenthk/Stock-Take-Scheduler-Web.git

# Navigate to project directory
cd Stock-Take-Scheduler-Web

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Available Scripts

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build (tsc + vite)
npm run preview   # Preview production build
npm run tsc       # Type-check only
npm run lint      # ESLint
```

---

## Configuration

### Environment Variables (Optional)

Create a `.env` file based on `.env.example`:

```env
# SharePoint Configuration
VITE_SHAREPOINT_SITE_ID=your-site-id
VITE_SHOP_LIST_ID=your-shop-list-id
VITE_MEMBER_LIST_ID=your-member-list-id
VITE_INVENTORY_LIST_ID=your-inventory-list-id
VITE_ERROR_LOG_LIST_ID=your-error-log-list-id

# Map Configuration
VITE_AMAP_API_KEY=your-amap-key
VITE_AMAP_SECURITY_CODE=your-amap-security-code

# Token Settings
VITE_TOKEN_WARNING_MINUTES=45
```

> **Note:** The app works without a `.env` file using built-in fallback values in `constants/config.ts`.
>
> ⚠️ Never commit real secrets (client secrets, tokens) to the repo, even in scratch/test scripts — use `.env`, which is gitignored.

### SharePoint Token Setup

1. Go to [Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)
2. Sign in with your Microsoft account
3. Request permissions for `Sites.ReadWrite.All`
4. Copy the access token
5. Paste in the app's Settings page

---

## Project Structure

```
Stock-Take-Scheduler-Web/
├── App.tsx                     # Main application, routing & global state
├── main.tsx / index.tsx        # React entry point
├── types.ts                    # TypeScript interfaces, View enum, ROLE_PERMISSIONS
│
├── components/
│   ├── Dashboard.tsx           # Statistics & shop actions
│   ├── Calendar.tsx            # FullCalendar schedule view & export
│   ├── Generator.tsx           # Schedule generation wizard
│   ├── Generator/               # Wizard sub-components (steps, progress bar)
│   ├── Shops.tsx                # Table/Map toggle wrapper
│   ├── ShopList.tsx             # Master list table
│   ├── Locations.tsx            # Map visualization
│   ├── MobileMapView/           # Mobile PWA map navigation (≤640px)
│   ├── Reports.tsx              # Strategic analytics
│   ├── TimeCard.tsx             # FE attendance tracking
│   ├── Inventory.tsx            # Asset tracking
│   ├── Permission.tsx           # Role management (admin)
│   ├── Settings.tsx             # Token configuration
│   ├── Login.tsx                # Authentication
│   ├── Layout.tsx                # Sidebar + mobile bottom nav
│   ├── ErrorBoundary.tsx / ErrorReport.tsx
│   ├── PWAInstallGuide.tsx      # Full-screen install prompt for browser users
│   ├── StatCard.tsx             # Shared stat card used across pages
│   └── *Modal.tsx                # AddShopModal, ShopFormModal, ShopDetailModal, ShopInventoryModal
│
├── services/
│   ├── SharePointService.ts    # Graph API integration (all SharePoint calls)
│   ├── TokenService.ts         # Cloudflare Worker token fetch/broadcast
│   └── api.ts
│
├── hooks/
│   ├── useAMapRoute.ts         # AMap.Walking + AMap.Transfer
│   ├── useGeolocation.ts       # AMap.Geolocation (on-demand GPS)
│   └── usePWADetection.ts      # Detect PWA vs browser install state
│
├── utils/
│   ├── batchOperations.ts      # Concurrent API requests (5 concurrent, backoff)
│   ├── coordTransform.ts       # WGS-84 → GCJ-02 map coordinate conversion
│   ├── kmeans.ts                # Clustering algorithm for scheduling
│   ├── loadAMap.ts              # useAMap() hook / AMap script loader
│   └── scheduleGeneration.ts   # Shared schedule generation & pool filtering
│
├── constants/
│   ├── config.ts                # SharePoint site/list IDs, API URLs
│   ├── groups.ts
│   └── holidays.ts              # HK public holidays (2025–2028)
│
├── constants.ts                 # SP_FIELDS, INV_FIELDS field name mappings
├── cloudflare-worker/
│   └── worker.js                # Token sync + image proxy Worker
│
├── design-system/               # UI/UX pattern documentation per page
└── index.css                    # Global styles & animations
```

---

## License

Private - All rights reserved.

## Support

For issues and feature requests, please contact the development team.
