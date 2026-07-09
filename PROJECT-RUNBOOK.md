# Project RunBook — Stock Take Scheduler Web

> Audience: Developers, DevOps, App Owners  
> Last updated: 2026-06-24

---

## 1. Project Overview

**Stock Take Scheduler Web** is an internal React SPA used by PCCW/HKT retail operations to plan, schedule, and track inventory stock takes across 300+ shops in Hong Kong and Macau.

| Item | Detail |
|------|--------|
| **Repo** | `kenstudenthk/Stock-Take-Scheduler-Web` |
| **Stack** | React 18 + TypeScript 5.7 + Vite 6 |
| **UI** | Ant Design 5 + Tailwind CSS 3 |
| **Backend** | Microsoft Graph API → SharePoint Online (no custom backend server) |
| **Map** | AMap JS API (GCJ-02 coordinate system) |
| **Token Sync** | Cloudflare Worker + KV (`stock-take-token-sync`) |
| **PWA** | `vite-plugin-pwa` with Workbox (app shell caching) |
| **CI** | GitHub Actions (type-check + build on PR) |

---

## 2. Architecture

```
┌────────────────────────────────────────────────────────────────┐
│  Browser (PWA / Desktop)                                       │
│  React SPA ─── Ant Design ─── Tailwind ─── FullCalendar        │
│       │              │                │                         │
│  SharePointService  TokenService   AMap JS API                  │
│       │              │                                          │
└───────┼──────────────┼──────────────────────────────────────────┘
        │              │
        ▼              ▼
┌──────────────┐  ┌──────────────────────────────────┐
│ MS Graph API │  │ Cloudflare Worker (KV)            │
│ (SharePoint) │  │ GET/POST / → token sync           │
│              │  │ POST /image-proxy → SPO images     │
└──────────────┘  └──────────────────────────────────┘
```

### Data Flow

1. User pastes a Graph API token in Settings → stored in `localStorage` and broadcast to Cloudflare KV.
2. Other users/sessions auto-fetch the shared token from KV every 5 minutes.
3. All CRUD goes through `SharePointService.ts` → Microsoft Graph API → SharePoint lists.
4. No server-side database; SharePoint Online is the single source of truth.

### SharePoint Lists

| List | Config Key | Purpose |
|------|-----------|---------|
| Shop List | `shopListId` | All shops: code, name, region, status, schedule |
| Member List | `memberListId` | User accounts, roles, password hashes |
| Inventory List | `inventoryListId` | Asset tracking per shop |
| Error Log | `errorLogListId` | In-app bug reports |
| Time Card | `timeCardListId` | FE check-in/check-out records |

IDs are in `constants/config.ts` with env var overrides (`VITE_*`).

---

## 3. Local Development Setup

### Prerequisites

- Node.js 18+ (20 recommended)
- npm (comes with Node)
- A valid Microsoft Graph API token with `Sites.ReadWrite.All` permission
- (Optional) AMap API key for map features

### Quick Start

```bash
git clone https://github.com/kenstudenthk/Stock-Take-Scheduler-Web.git
cd Stock-Take-Scheduler-Web
npm install
npm run dev          # → http://localhost:3000
```

### Environment Variables

Copy `.env.example` to `.env` and fill in values. The app works without `.env` using fallback values in `constants/config.ts`.

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SHAREPOINT_SITE_ID` | No | SharePoint site identifier |
| `VITE_SHOP_LIST_ID` | No | Shop list GUID |
| `VITE_MEMBER_LIST_ID` | No | Member list GUID |
| `VITE_INVENTORY_LIST_ID` | No | Inventory list GUID |
| `VITE_ERROR_LOG_LIST_ID` | No | Error log list GUID |
| `VITE_TIME_CARD_LIST_ID` | No | Time card list GUID |
| `VITE_AMAP_API_KEY` | For map | AMap JS API key |
| `VITE_AMAP_SECURITY_CODE` | For map | AMap security code |
| `GEMINI_API_KEY` | No | Gemini API (if using AI features) |

### Available Commands

```bash
npm run dev       # Start dev server on port 3000
npm run build     # Production build (tsc + vite)
npm run preview   # Preview production build locally
npm run tsc       # Type-check only (no emit)
npm run lint      # ESLint check
```

---

## 4. Build & Deployment

### Production Build

```bash
npm run build
```

Output goes to `dist/`. The build includes:
- Minified JS/CSS bundles
- PWA service worker and manifest
- Static assets (icons, HTML)

### Deployment

The app is a static SPA. Deploy `dist/` to any static hosting:
- **Cloudflare Pages** (recommended — already has Worker infra)
- **Azure Static Web Apps**
- **Netlify / Vercel**
- **GitHub Pages**

No server-side runtime required.

### CI/CD Pipeline

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| `pr-verification.yml` | PR → main | `npm install` → `tsc --noEmit` → `npm run build` |
| `claude-code.yml` | PR opened/synced | Claude Code AI review (bugs, security, performance) |
| `pr-autofix-and-verify.yml` | PR | Auto-fix + verify |
| `gemini-review.yml` | PR | Gemini AI review |

All CI runs on `ubuntu-latest` with Node 20.

---

## 5. Key Source Files

### Core

| File | Purpose |
|------|---------|
| `App.tsx` | Root component — state management, routing, data fetching |
| `types.ts` | All TypeScript interfaces, enums, RBAC definitions |
| `constants.ts` | `SP_FIELDS` and `INV_FIELDS` — SharePoint column name mappings |
| `constants/config.ts` | API URLs, IDs, token config, batch settings |
| `constants/holidays.ts` | HK public holidays 2025–2028 |
| `constants/groups.ts` | Group A/B/C color and label config |

### Services

| File | Purpose |
|------|---------|
| `services/SharePointService.ts` | All Graph API calls (CRUD for shops, members, inventory, time cards) |
| `services/TokenService.ts` | Cloudflare KV token fetch/broadcast |
| `services/api.ts` | API utilities |

### Utilities

| File | Purpose |
|------|---------|
| `utils/scheduleGeneration.ts` | `isWorkingDay`, `getNextWorkingDay`, `filterSchedulePool`, `generateSchedule` |
| `utils/batchOperations.ts` | Concurrent API batch processor with retry and exponential backoff |
| `utils/coordTransform.ts` | WGS-84 → GCJ-02 coordinate conversion for AMap |
| `utils/kmeans.ts` | K-means clustering for geographic shop grouping |
| `utils/loadAMap.ts` | `loadAMap()` promise + `useAMap()` hook |

### Components

| Component | Page |
|-----------|------|
| `Dashboard.tsx` | Stats overview, shop actions (Reschedule/Pool/Close/Resume) |
| `Calendar.tsx` | FullCalendar month view, Excel/PDF export |
| `Generator.tsx` | Schedule generation wizard (Configure → Preview → Sync) |
| `Shops.tsx` | Unified wrapper: ShopList (table) + Locations (map) with Segmented toggle |
| `ShopList.tsx` | Filterable shop table with inline editing |
| `Locations.tsx` | AMap interactive map with batched markers |
| `Inventory.tsx` | Asset tracking and inventory CRUD |
| `Permission.tsx` | Role management (Admin only) |
| `Reports.tsx` | Strategic analytics (schedule progress, BU breakdown) |
| `TimeCard.tsx` | FE attendance tracking |
| `Login.tsx` | Authentication (alias email + bcrypt password) |
| `Settings.tsx` | Token management and API config |
| `MobileMapView/` | Mobile PWA map navigation for field engineers |

---

## 6. State Management

All state lives in `App.tsx` (no Redux/Zustand):

| State | Storage | Scope |
|-------|---------|-------|
| `graphToken` | `localStorage` (`stockTakeToken`) | Persisted across sessions |
| `allShops` | In-memory (fetched on load) | Session-lived |
| `allInventory` | In-memory (paginated fetch) | Session-lived |
| `allTimeCards` | In-memory | Session-lived |
| `currentUser` | `sessionStorage` (`currentUser`) | Tab-scoped |
| `isDarkMode` | `localStorage` (`theme`) | Persisted |

Data refresh: Manual "Refresh Data" button or automatic on login/token change.

---

## 7. Authentication & Authorization

### Authentication Flow

1. User enters **Alias Email** + **Password** on Login page
2. `SharePointService.getUserByAliasEmail()` queries the Member List
3. Password verified against `PasswordHash` field using `bcryptjs`
4. On success, user object stored in `sessionStorage`

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| **Admin** | All actions (full access) |
| **App Owner** | All actions (same as Admin) |
| **User** | `view_dashboard` only |

Permissions are defined in `types.ts` → `ROLE_PERMISSIONS`. UI components check `hasPermission(user, action)` or `hasAdminAccess(user)`.

### Token Management

- Graph API tokens expire after ~60 minutes (Azure AD default)
- App warns at 45 minutes via animated truck banner
- Token shared across users via Cloudflare Worker KV
- Any user can update the token; it auto-syncs to all sessions within 5 minutes

---

## 8. Cloudflare Worker

**Worker name:** `stock-take-token-sync`  
**URL:** `https://stock-take-token-sync.f6v9zfjpcs.workers.dev/`

### Endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/` | Return stored Graph API token from KV |
| `POST` | `/` | Store new Graph API token to KV |
| `POST` | `/image-proxy` | Proxy SharePoint list attachment images (requires `X-SP-Cookie` header) |

### KV Namespace

- **Binding:** `TOKEN_STORE`
- **Key:** `graph_token`
- CORS enabled for all origins

Source: `cloudflare-worker/worker.js`

---

## 9. Schedule Generation Algorithm

Located in `utils/scheduleGeneration.ts`:

1. **Filter pool** — by region, district, MTR status; only `Unplanned` shops
2. **Start from given date** — skip to next working day if needed
3. **Assign shops** — N shops per day (default 9), cycling through groups (default 3: A/B/C)
4. **Skip non-working days** — weekends (Sat/Sun) and HK public holidays (2025–2028)
5. **K-means clustering** — geographic grouping so shops in same group are geographically close

### Reschedule Pool

Shops enter the pool when: `status === 'Rescheduled'` AND `scheduledDate` is empty.  
Pool generation uses the same algorithm but writes to separate state (`poolGeneratedResult`).

---

## 10. Map Integration (AMap)

- **API:** AMap JS API v2
- **Coordinate system:** GCJ-02 (Chinese standard); WGS-84 input converted via `utils/coordTransform.ts`
- **Loading:** `utils/loadAMap.ts` polls every 50ms with 10s timeout
- **Hook:** `useAMap()` — returns `{ amap, loading, error }`
- **Performance:** Batched marker creation (80 markers/frame), DOM class toggling for active state, 2D only

### Mobile Map (screens ≤640px)

Renders `MobileMapView` with:
- Group selector dropdown
- Today's schedule filter
- GPS geolocation (on-demand)
- Haversine distance calculation
- Walking/transit route planning via AMap plugins (`AMap.Walking`, `AMap.Transfer`)

---

## 11. Known Operational Issues

### Token Expiry

- **Symptom:** Animated truck banner appears; API calls return 401
- **Resolution:** Any admin goes to [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer), signs in, copies token, pastes in Settings page
- **Auto-sync:** New token broadcasts to all sessions via Cloudflare KV within 5 minutes

### SharePoint `$orderby` on Non-Indexed Columns

- **Symptom:** Empty data or 400 error from Graph API
- **Rule:** NEVER use `$orderby=fields/<Column>` unless the column is indexed in SharePoint
- **Workaround:** Sort client-side using Ant Design table `defaultSortOrder`

### SharePoint 999-Item Limit

- **Symptom:** Missing data when list has >999 items
- **Resolution:** Inventory fetch uses `@odata.nextLink` pagination (already implemented)

### Linter Hook File Clearing

- **Symptom:** File content becomes 0 bytes after Edit tool
- **Affected files:** `types.ts`, `services/SharePointService.ts`
- **Workaround:** Use Write tool with full content; restore from `git show HEAD:<file>` if wiped

---

## 12. Monitoring & Debugging

### Browser Console

The app logs with emoji prefixes:
- `✅` — Success
- `❌` — Error
- `🔄` — Sync/update operation
- `[Inventory]`, `[TimeCard]` — Module-scoped logs

### Error Boundary

`ErrorBoundary.tsx` catches React rendering errors and shows a recovery UI.

### Error Reports

Users can submit bug reports via the in-app Error Report modal → saved to the Error Log SharePoint list.

### Health Check

1. Open Settings page → check "SharePoint Connection" status indicator
2. If red: token expired or network issue
3. If green: Graph API connection healthy

---

## 13. Security Considerations

| Area | Implementation |
|------|---------------|
| **Password storage** | bcryptjs hash (never stored in plaintext) |
| **OData injection** | `sanitizeFilterValue()` escapes single quotes |
| **XSS** | React's default JSX escaping; no `dangerouslySetInnerHTML` |
| **Token storage** | `localStorage` (client-only); shared via Cloudflare KV (no auth on Worker — internal use only) |
| **CORS** | Cloudflare Worker allows `*` origin (acceptable for internal tool) |
| **Secrets in code** | SharePoint list IDs in `config.ts` (not secret); actual tokens never committed |

### Security Risks to Monitor

- Cloudflare Worker has no authentication — anyone with the URL can read/write the token
- Graph API token grants `Sites.ReadWrite.All` — broad SharePoint access
- No CSRF protection (SPA with token-based auth)

---

## 14. Dependency Management

### Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `react` | ^18.3.1 | UI framework |
| `antd` | ^5.24.1 | Component library |
| `tailwindcss` | ^3.4.17 | Utility CSS |
| `@fullcalendar/react` | ^6.1.20 | Calendar view |
| `exceljs` | ^4.4.0 | Excel export |
| `jspdf` + `jspdf-autotable` | ^4.1.0 / ^5.0.7 | PDF export |
| `bcryptjs` | ^3.0.3 | Password hashing |
| `dayjs` | ^1.11.13 | Date manipulation |
| `recharts` | ^3.8.1 | Charts in Reports |
| `axios` | ^1.7.9 | HTTP client (limited use) |

### Updating Dependencies

```bash
npm outdated              # Check for updates
npm update                # Update within semver range
npm install <pkg>@latest  # Major version upgrade (test thoroughly)
```

Always run `npm run build` after dependency updates to verify no breaking changes.

---

## 15. Adding a New SharePoint List

1. Create the list in SharePoint Online
2. Add list ID to `constants/config.ts` under `SHAREPOINT_CONFIG`
3. Add env var override (`VITE_*_LIST_ID`) to `.env.example`
4. Add API URL getter to `API_URLS` in `constants/config.ts`
5. Add field mappings to `constants.ts` (new `*_FIELDS` object)
6. Add fetch logic in `App.tsx` (inside `fetchAllData`)
7. Create TypeScript interface in `types.ts`
8. Add service methods in `SharePointService.ts`

---

## 16. Adding a New Page/View

1. Add enum value to `View` in `types.ts`
2. Create component in `components/`
3. Add `case` to `renderContent()` in `App.tsx`
4. Add nav item in `Layout.tsx`
5. Import and wire props in `App.tsx`

---

## 17. Holiday Data Maintenance

Public holidays are hardcoded in `constants/holidays.ts` (2025–2028).

**Annual task:** Before each year, add the next year's holidays from [gov.hk](https://www.gov.hk/en/about/abouthk/holiday/).

Format: `'YYYY-MM-DD'` strings in the `HK_HOLIDAYS` record, keyed by year.

---

## 18. Troubleshooting Quick Reference

| Problem | Likely Cause | Fix |
|---------|-------------|-----|
| No data loads | Token expired | Update token in Settings |
| 401 errors in console | Token expired | Update token in Settings |
| Map doesn't render | Missing AMap API key | Add `VITE_AMAP_API_KEY` to `.env` |
| Inventory missing items | Pagination issue | Check `@odata.nextLink` handling |
| Schedule skips a day | Day is holiday or weekend | Check `constants/holidays.ts` |
| Build fails | Type errors | Run `npm run tsc -- --noEmit` to see errors |
| PWA not updating | Service worker cached | Hard refresh or clear site data |
| Token not syncing | Cloudflare Worker down | Check Worker status at Cloudflare dashboard |
| Empty Time Card page | `$orderby` on non-indexed column | Ensure no server-side sort in Graph URL |
