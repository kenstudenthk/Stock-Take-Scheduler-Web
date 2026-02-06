# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Take Scheduler Web is a React application for managing and scheduling inventory stock takes across retail shop locations in Hong Kong. It integrates with Microsoft SharePoint via Graph API for data persistence.

## Development Commands

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production (tsc + vite build)
npm run preview   # Preview production build
npm run lint      # Run ESLint
```

ESLint is configured via `eslint.config.js` (flat config) with TypeScript, React Hooks, and React Refresh plugins. No test runner is configured.

## Architecture

### Tech Stack
- **Frontend:** React 18, TypeScript 5.7, Vite 6
- **UI:** Ant Design 5, Tailwind CSS 3
- **Backend:** Microsoft Graph API (SharePoint Online)
- **Maps:** AMap JS API (requires WGS-84 to GCJ-02 coordinate conversion)
- **Calendar:** FullCalendar 6 (daygrid, timegrid, interaction)
- **Icons:** Ant Design Icons, lucide-react
- **Export:** ExcelJS (.xlsx), jsPDF (.pdf)
- **Auth:** bcryptjs for password hashing

### State Management
State is centralized in `App.tsx` using React hooks. Key state:
- `graphToken` / `invToken` - SharePoint API tokens (localStorage)
- `allShops` - Master shop data from SharePoint
- `currentUser` - Authenticated user (sessionStorage)

### Service Layer
`services/SharePointService.ts` is the main service handling all SharePoint API communication. It uses:
- Bearer token authentication via Graph API
- OData queries with `$filter`, `$select`, `$expand`
- Headers: `Prefer: HonorNonIndexedQueriesWarningMayFailOverTime`, `ConsistencyLevel: eventual`

### Key Utilities
- `utils/kmeans.ts` - K-means clustering for grouping shops by geographic proximity
- `utils/batchOperations.ts` - Concurrent API requests with retry logic (5 concurrent, exponential backoff)
- `utils/coordTransform.ts` - WGS-84 to GCJ-02 coordinate conversion for AMap

### Custom Hooks
- `hooks/useGeolocation.ts` - GPS location via AMap.Geolocation plugin (on-demand, returns GCJ-02 coords)
- `hooks/useAMapRoute.ts` - Route planning via AMap.Walking and AMap.Transfer plugins

### Configuration
- `constants/config.ts` - SharePoint site/list IDs, API URLs, batch settings
- `constants/holidays.ts` - HK public holidays (2025-2028) for schedule generation
- `constants.ts` (root) - SharePoint field name mappings (`SP_FIELDS`, `INV_FIELDS`)

## Component Structure

```
App.tsx (root state, routing)
├── Layout.tsx (sidebar navigation)
├── Login.tsx (authentication)
├── Dashboard.tsx (stats overview, shop actions: Resume/Pool/Close/Reschedule)
├── Generator.tsx (schedule generation with K-means clustering)
├── Calendar.tsx (calendar view, Excel/PDF export)
├── ShopList.tsx (shop management, inline editing)
├── Locations.tsx (AMap visualization, batched markers, SummaryCard stats)
│   └── MobileMapView/ (mobile-only, renders on screens ≤640px)
│       ├── MobileMapView.tsx (main mobile map component)
│       ├── GroupSelector.tsx (A/B/C group toggle buttons)
│       ├── BottomSheet.tsx (swipeable shop list)
│       └── RoutePanel.tsx (walk/transit route options)
├── Inventory.tsx (asset tracking)
├── Settings.tsx (token management)
└── ErrorBoundary.tsx (error catching)
```

## Data Flow Pattern

1. App.tsx fetches all shops from SharePoint on mount
2. Shop data passed as props to child components
3. Components call SharePointService for mutations
4. `onRefresh` callback triggers data refresh in App.tsx
5. `useMemo` used extensively for filtering/sorting to prevent recalculation

## SharePoint Integration

All API calls follow this pattern:
```typescript
const response = await fetch(url, {
  headers: {
    'Authorization': `Bearer ${this.graphToken}`,
    'Content-Type': 'application/json',
    'Prefer': 'HonorNonIndexedQueriesWarningMayFailOverTime',
    'ConsistencyLevel': 'eventual'
  }
});
```

Input sanitization: `sanitizeFilterValue()` escapes single quotes in OData filters to prevent injection.

## Token Management

- Tokens stored in localStorage with timestamps
- 45-minute warning threshold for token expiry
- Users must manually refresh tokens from Microsoft Graph Explorer

## CI/CD

GitHub Actions workflows in `.github/workflows/`:
- **claude-code.yml** - Automated Claude Code review on PRs (opened/synchronize)
- **gemini-review.yml** - Automated Gemini review on PRs (via workflow_call)
- Additional Gemini workflows for dispatch, invocation, triage, and scheduled triage

## Dashboard Shop Actions

The Dashboard provides per-shop action buttons (permission-gated):
- **Reschedule** (`reschedule_shop`) - Open date picker to reschedule an active shop
- **Move to Pool** (`reschedule_shop`) - Clear scheduled date and set status to "Rescheduled"
- **Close** (`close_shop`) - Mark a shop as closed
- **Resume** (`close_shop`) - Re-open a closed shop, setting status back to "Pending"

## Locations Page Performance

The Locations (map) component uses performance optimizations for large datasets:
- Batched marker creation (80 per frame) to prevent UI freeze
- Lightweight active state via DOM CSS class toggling instead of full marker re-render
- `setFitView` only on first render, not on every filter change
- 2D map view (satellite layer removed for faster load)

## Mobile Map Navigation (PWA)

The `MobileMapView` component provides a mobile-optimized map for Field Engineers (FEs) to navigate between shops during stock takes. It renders automatically on screens ≤640px width.

### Features
- **Group Selection**: A/B/C toggle buttons filter shops by assigned group
- **Today's Filter**: Auto-filters to shops scheduled for today only
- **GPS Location**: On-demand location button (saves battery), shows blue pulsing marker
- **Distance Display**: Haversine formula calculates distance from user to each shop
- **Route Planning**: Both walking and transit routes calculated via AMap.Walking/AMap.Transfer
- **Bottom Sheet**: Swipeable shop list with 3 states (collapsed 64px, half 40vh, expanded 80vh)

### Component Architecture
```
MobileMapView.tsx
├── GroupSelector.tsx      # A/B/C toggle at top
├── BottomSheet.tsx        # Swipeable shop list
├── RoutePanel.tsx         # Walk/transit options
└── hooks/
    ├── useGeolocation.ts  # AMap.Geolocation wrapper
    └── useAMapRoute.ts    # AMap.Walking + AMap.Transfer
```

### AMap Plugins Used
- `AMap.Geolocation` - Returns GCJ-02 coordinates (native to AMap, no conversion needed)
- `AMap.Walking` - Walking routes with distance/time/steps
- `AMap.Transfer` - Public transit routes (configured for Hong Kong)
- `AMap.Scale` - Map scale control

### UX Flow
1. FE opens Map View on mobile → sees Group A/B/C selector
2. Taps their assigned group → map shows today's shops for that group
3. Taps GPS button → locates user, shows distance to each shop
4. Taps shop card → map centers on shop
5. Taps navigate button → sees walk AND transit options side-by-side
6. Taps preferred route → route drawn on map with turn-by-turn directions
