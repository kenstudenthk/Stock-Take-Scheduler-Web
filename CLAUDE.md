# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Take Scheduler Web is a React application for managing and scheduling inventory stock takes across retail shop locations in Hong Kong. It integrates with Microsoft SharePoint via Graph API for data persistence.

---

## ⚠️ After-Fix Protocol (MANDATORY)

**You MUST follow this protocol after EVERY bug fix, issue resolution, or feature addition — no exceptions.**

### Rules

1. After fixing any bug or issue, ALWAYS update this CLAUDE.md file **in the same commit or PR**.
2. Document the root cause, the fix applied, and a prevention rule for the future.
3. If the same type of bug appears again, check the "Known Pitfalls" section first before attempting a fix.
4. NEVER close a task or open a PR without updating this file.

### What to document

- **Root cause** — Why did this bug happen? (e.g. wrong API field, missing null check, z-index conflict)
- **Fix applied** — What file(s) were changed and what was done?
- **Prevention rule** — A clear rule starting with "ALWAYS" or "NEVER" to prevent recurrence

### Where to add it

| Type of issue | Where to document |
|---|---|
| Bug in a specific component | Add under that component's section in this file |
| Recurring pattern / gotcha | Add to `## Known Pitfalls` section below |
| SharePoint / API issue | Add under `## SharePoint Integration` |
| Performance issue | Add under relevant component or `## Known Pitfalls` |

### Format to use

```
#### ⚠️ Known Issue: [Component or Area Name]
- **Date**: YYYY-MM-DD
- **Problem**: [What went wrong]
- **Root Cause**: [Why it happened]
- **Fix**: [What was changed]
- **Rule**: ALWAYS/NEVER [prevention rule going forward]
```

---

## Known Pitfalls

> This section is auto-maintained. Claude MUST append new entries here after every fix.

#### ⚠️ Known Issue: MobileMapView — Group Selector Dropdown
- **Date**: 2026-02-10
- **Problem**: Dropdown was unclickable on mobile
- **Root Cause**: z-index conflict with map canvas stacking context
- **Fix**: Increased dropdown z-index to 9999, added `getPopupContainer`, added `isolation: isolate`
- **Rule**: ALWAYS set `getPopupContainer` and `isolation: isolate` on Ant Design dropdowns rendered over map or canvas elements

#### ⚠️ Known Issue: MobileMapView — Walking Segments Not Displaying
- **Date**: 2026-02-10
- **Problem**: Walking turn-by-turn directions were missing in RoutePanel
- **Root Cause**: Incorrect field detection; used `segment.walking.steps` instead of `segment.transit.steps` with `transit_mode === 'WALK'`
- **Fix**: Corrected field path to `segment.transit.steps` and detection to `transit_mode === 'WALK'`
- **Rule**: ALWAYS check AMap API response shape in browser devtools before accessing nested fields; do NOT assume field names match documentation

---

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
│       ├── TopShopPanel.tsx (collapsible top panel with group selector & shop list)
│       └── RoutePanel.tsx (walk/transit route options with detailed directions)
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
- **Reschedule** (`reschedule_shop`) - Open Smart Reschedule modal with date picker
- **Move to Pool** (`reschedule_shop`) - Clear scheduled date and set status to "Rescheduled" (row button)
- **Close** (`close_shop`) - Mark a shop as closed
- **Resume** (`close_shop`) - Re-open a closed shop, setting status back to "Pending"

### Smart Reschedule Modal
The modal (`isReschedOpen`) has a custom footer with three buttons:
1. **Move to Reschedule Pool** — calls `handleMoveToPool()` inline, closes modal; use when date cannot be confirmed immediately
2. **Cancel** — closes modal without changes
3. **Confirm New Date** — disabled until a date is selected; calls `handleConfirmReschedule()`

Pool shops are identified by: `status === 'Rescheduled'` AND `!scheduledDate`.

## Reschedule Pool (Generator)

The Generator page includes a **Reschedule Pool section** that appears automatically when pool shops exist.

### Pool shop identification
```typescript
shops.filter(s => s.masterStatus !== 'Closed' && s.status === 'Rescheduled' && !s.scheduledDate)
```

### Pool section behaviour
- Rendered as a Card above the Preview Table, only when `reschedulePool.length > 0`
- Shows a table of pool shops (name/brand icon, region, district, MTR tag)
- **Generate Pool Schedule** button (`generate_schedule` permission) — runs same scheduling algorithm as regular generate, using current `startDate`, `shopsPerDay`, `groupsPerDay` settings
- Result feeds into `generatedResult` → existing Preview Table + Confirm & Sync flow handles saving to SharePoint
- Syncing sets status to `Planned` and assigns a date/group, removing the shop from the pool

## Locations Page Performance

The Locations (map) component uses performance optimizations for large datasets:
- Batched marker creation (80 per frame) to prevent UI freeze
- Lightweight active state via DOM CSS class toggling instead of full marker re-render
- `setFitView` only on first render, not on every filter change
- 2D map view (satellite layer removed for faster load)

## Mobile Map Navigation (PWA)

The `MobileMapView` component provides a mobile-optimized map for Field Engineers (FEs) to navigate between shops during stock takes. It renders automatically on screens ≤640px width.

### Features
- **Group Selection**: Ant Design Select dropdown in top panel to switch between Groups A/B/C (z-index 9999, isolated stacking context)
- **Today's Filter**: Auto-filters to shops scheduled for today only
- **Top Panel**: Collapsible shop list panel at top showing distance-sorted shops (expandable/collapsible)
- **GPS Location**: On-demand location button (saves battery), shows blue pulsing marker
- **Distance Display**: Haversine formula calculates distance from user to each shop
- **Route Planning**: Both walking and transit routes calculated via AMap.Walking and AMap.Transfer
- **Bottom Sheet Route Panel**: AMap-inspired design with collapsible interface
  - Fixed to bottom of screen with drag handle
  - Tap to collapse/expand for better map visibility
  - Smooth animation transitions
  - Close button in top-right corner
- **Enhanced Transit Details**: Comprehensive route information including:
  - Via stops list with all intermediate stations (stop1 → stop2 → stop3)
  - Distance and duration for each transit segment
  - Detailed turn-by-turn walking directions with distances
  - MTR entrance/exit information (e.g., "A出入口", "D出入口")
  - Emoji indicators (🚌 transit, 🚶 walking, 📍 stations)
  - Color-coded styling (blue for transit, green for walking, yellow for stations)
  - Scrollable content with max-height constraints for smaller screens
  - **Clickable segment headers** - Tap any segment to zoom map to that specific part

### Component Architecture
```
MobileMapView.tsx
├── TopShopPanel.tsx       # Top collapsible panel with group dropdown + shop list
├── RoutePanel.tsx         # Walk/transit route options with enhanced details
└── hooks/
    ├── useGeolocation.ts  # AMap.Geolocation wrapper (on-demand GPS)
    └── useAMapRoute.ts    # AMap.Walking + AMap.Transfer (enhanced route extraction)
```

### AMap Plugins Used
- `AMap.Geolocation` - Returns GCJ-02 coordinates (native to AMap, no conversion needed)
- `AMap.Walking` - Walking routes with distance/time/steps
- `AMap.Transfer` - Public transit routes (configured for Hong Kong)
- `AMap.Scale` - Map scale control

### UX Flow
1. FE opens Map View on mobile → sees top panel with Group A dropdown (default)
2. Taps group dropdown → selects their assigned group → panel auto-expands showing today's shops
3. Taps GPS button (floating action button) → locates user, calculates distances to all shops
4. Taps shop card in list → map centers on shop, shows shop details
5. Taps navigate button → bottom sheet slides up with walk AND transit options:
   - Walking: Only shown if distance ≤ 1km, includes turn-by-turn directions
   - Transit: Shows route number, boarding stop, all via stops, exit stop, segment distances/durations
6. Taps preferred route → route drawn on map, panel auto-collapses, expandable directions available
7. Taps individual segment (🚶 Walk or 🚌 Transit header) → map zooms to that specific segment, panel collapses
8. Taps drag handle or header → bottom sheet collapses/expands to toggle between map view and details

### Recent Improvements (2026-02-10)

#### 1. Fixed Group Selector Dropdown
- Resolved z-index issue where dropdown was unclickable
- Increased dropdown z-index to 9999
- Added `getPopupContainer` to render in correct DOM context
- Added `isolation: isolate` to create proper stacking context

#### 2. Enhanced Transit Route Details
- Extracts via stops list from AMap Transit API showing all intermediate stations
- Displays distance (km) and duration (min) for each transit segment
- Shows detailed walking directions with turn-by-turn instructions and distances
- Handles Chinese transit type names (地铁线路 for MTR, 普通公交线路 for Bus)
- Uses correct AMap API fields: `on_station`/`off_station` instead of `on`/`off`
- Displays MTR entrance/exit information when available
- Color-coded UI with emoji icons for better visual hierarchy

#### 3. Fixed Walking Segments Display
- Corrected detection using `transit_mode === 'WALK'` field
- Walking data is in `segment.transit.steps`, not `segment.walking.steps`
- All walking directions now display correctly with turn-by-turn instructions

#### 4. Responsive Route Panel for Small Screens
- Added max-height constraints for iPhone 14 Pro and smaller devices
- Made route steps scrollable with `overflow-y: auto`
- Added iOS smooth scrolling with `-webkit-overflow-scrolling: touch`

#### 5. Bottom Sheet Design (AMap-inspired)
- Positioned panel as fixed bottom sheet instead of floating card
- Added drag handle visual indicator for intuitive interaction
- Implemented tap-to-collapse/expand functionality
- Rounded only top corners (20px 20px 0 0) for sheet appearance
- Smooth animations for collapse/expand transitions (max-height with ease-in-out)
- Auto-collapse when selecting route to immediately show map
- Users can now see full map with route while navigating

#### 6. Tap-to-Zoom Individual Segments
- Each route segment header (🚶 Walk, 🚌 Transit) is now clickable
- Tapping a segment collapses the panel and zooms map to that specific part
- Uses AMap's `setFitView()` to properly frame the segment path
- Fallback method centers map if primary zoom fails
- Visual feedback: hover effect with translateX and lighter background
- Allows users to focus on specific walking or transit portions of the route
- Mimics AMap's native segment selection behavior
