# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Stock Take Scheduler Web — React app for scheduling inventory stock takes across HK retail shops. Integrates with Microsoft SharePoint via Graph API for data persistence.

> **Update history:** See [`UPDATE.md`](./UPDATE.md) for a full changelog of all features and bug fixes.

## UI/UX Improvement Plan

Full improvement plan (Tier 1–4, all pages): `C:\Users\user\.claude\plans\peppy-waddling-ritchie.md`

---

## ⚠️ After-Fix Protocol (MANDATORY)

After EVERY bug fix, issue resolution, or feature addition:

1. Update this CLAUDE.md in the same commit or PR.
2. Append a new entry to `## Known Pitfalls` with root cause, fix, and prevention rule.
3. NEVER close a task or open a PR without updating this file.

**Format:**
```
#### ⚠️ Known Issue: [Component or Area]
- **Date**: YYYY-MM-DD
- **Problem**: [What went wrong]
- **Root Cause**: [Why it happened]
- **Fix**: [What was changed]
- **Rule**: ALWAYS/NEVER [prevention rule]
```

---

## Known Pitfalls

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

#### ⚠️ Known Issue: StatCard Duplication (T2-6)
- **Date**: 2026-03-20
- **Problem**: Dashboard, Generator, and Locations each had their own `SummaryCard` implementation with slight differences
- **Root Cause**: Component copy-pasted as pages were built, never extracted
- **Fix**: Created `components/StatCard.tsx` with `bgColor` prop. All 3 pages now import it. Dashboard cards now use explicit hex colors (#1E40AF, #10B981, #EF4444, #F59E0B) instead of `type`/CSS vars.
- **Rule**: ALWAYS import `StatCard` from `components/StatCard.tsx`; NEVER define a local SummaryCard/StatCard

#### ⚠️ Known Issue: Layout — Nav Item Order (T2-1)
- **Date**: 2026-03-20
- **Problem**: Calendar, Generator, Dashboard were scattered in nav with no visual grouping
- **Root Cause**: Items added in creation order, not by functional relationship
- **Fix**: Reordered to Dashboard→Calendar→Generator (schedule group) with thin separator, then Master List→Map View, then admin items. Three-group rendering with `isAdmin` guard.
- **Rule**: Nav order in Layout.tsx: [Dashboard, Calendar, Generator] | [ShopList, Locations] | [Inventory, Permission]

#### ⚠️ Known Issue: Locations — Raw window.AMap Access (T3-17)
- **Date**: 2026-03-20
- **Problem**: AMap used via `window.AMap` directly — no loading state, no error handling, race condition possible
- **Root Cause**: AMap injected as static script tag; component guards with `!window.AMap` but no async handling
- **Fix**: Created `utils/loadAMap.ts` with `loadAMap(): Promise<any>` (polls 50ms, 10s timeout) and `useAMap()` hook; Locations.tsx now uses `const { amap } = useAMap()`
- **Rule**: ALWAYS use `useAMap()` hook for AMap access; NEVER access `window.AMap` directly in component code

#### ⚠️ Known Issue: ShopList — Hidden Call Tracking Affordance (T3-11)
- **Date**: 2026-03-20
- **Problem**: Call tracking trigger was a rotating SVG icon with no label — users couldn't discover it
- **Root Cause**: Decorative icon with `title="Log Call"` but no visible text
- **Fix**: Replaced with Ant Design `Button` with `PhoneOutlined` icon and status-aware label ("Called"/"No Answer"/"Log Call") + color-coded border
- **Rule**: NEVER use icon-only buttons for non-obvious features; always include a text label

#### ⚠️ Known Issue: App — Dark Mode First Load (T3-16)
- **Date**: 2026-03-20
- **Problem**: Dark mode initialized from localStorage only; first-time visitors always got light mode
- **Root Cause**: `useState<boolean>(localStorage.getItem('theme') === 'dark')` returns false when key is absent
- **Fix**: Lazy initializer: check localStorage first; fall back to `window.matchMedia('(prefers-color-scheme: dark)').matches`
- **Rule**: ALWAYS use lazy initializer for theme state; user preference (localStorage) takes priority over system

#### ⚠️ Known Issue: Permission — Stale Generic Role Descriptions (T3-13)
- **Date**: 2026-03-20
- **Problem**: `rolePermissions` in Permission.tsx used generic CMS descriptions unrelated to the app
- **Root Cause**: Was never updated after initial scaffold; descriptions referenced billing, media, etc.
- **Fix**: Rewrote `rolePermissions` based on `ROLE_PERMISSIONS` in `types.ts` (actual permission actions)
- **Rule**: ALWAYS keep `rolePermissions` in sync with `ROLE_PERMISSIONS` in `types.ts` when permissions change

#### ⚠️ Known Issue: Generator — Vertical Wizard Sidebar (T2-7)
- **Date**: 2026-03-20
- **Problem**: Vertical sidebar wizard progress (Col span=4) competed with app sidebar, narrowing config area
- **Root Cause**: `WizardProgressBarVertical` component rendered in its own right-column
- **Fix**: Removed vertical sidebar entirely. Added Ant Design `Steps` horizontal stepper above the content area. Main content expanded to full 24 cols.
- **Rule**: NEVER add a vertical wizard sidebar — use horizontal stepper (Ant Design Steps) at top of content

#### ⚠️ Known Issue: Generator Wizard — Step 1 Color Was Red (T2-5)
- **Date**: 2026-03-20
- **Problem**: Step 1 Configure used red (#EF4444) — a danger/error signal — causing user hesitation
- **Root Cause**: `DESIGN_COLORS.step1` in both Generator.tsx and SchedulingWizard.tsx set to red
- **Fix**: Remapped step1 → teal #0D9488 (brand primary), step2 → amber #D97706, step3 green unchanged
- **Rule**: NEVER use red for non-error states; wizard steps use teal→amber→green progression

#### ⚠️ Known Issue: Schedule Generation Logic Duplicated (T1-6)
- **Date**: 2026-03-20
- **Problem**: `isWorkingDay`, `getNextWorkingDay`, pool filtering, and the generation loop were duplicated across Generator.tsx and SchedulingWizard.tsx with slight divergence
- **Root Cause**: SchedulingWizard was built separately without extracting shared logic
- **Fix**: Created `utils/scheduleGeneration.ts` with `isWorkingDay`, `getNextWorkingDay`, `filterSchedulePool`, `generateSchedule`. Both components now import from this module.
- **Rule**: ALWAYS use `filterSchedulePool()` and `generateSchedule()` from `utils/scheduleGeneration.ts`; NEVER reimplement filtering or generation logic in components

#### ⚠️ Known Issue: ShopList + Locations Were Separate Nav Items (T2-2)
- **Date**: 2026-03-20
- **Problem**: ShopList ("Master List") and Locations ("Map View") were two separate nav items showing the same shop data in different views
- **Root Cause**: Built as independent components at different times, never unified
- **Fix**: Created `components/Shops.tsx` wrapper with Table/Map `Segmented` toggle (session-persisted). `View.SHOP_LIST` and `View.LOCATIONS` replaced by `View.SHOPS` in enum, App.tsx, and Layout.tsx.
- **Rule**: ALWAYS navigate to `View.SHOPS`; NEVER restore `View.SHOP_LIST` or `View.LOCATIONS` as separate nav items

#### ⚠️ Known Issue: SchedulingWizard — Planned % Hidden (T2-11)
- **Date**: 2026-03-20
- **Problem**: Region card planned % was only visible on hover tooltip, not always-visible
- **Root Cause**: `reg.plannedPct` was only in `Tooltip` title; no visible text in card body
- **Fix**: Added footer row with `{reg.plannedPct}% done` label always rendered in card
- **Rule**: Critical planning stats (fill %, counts) must be always-visible in card body; tooltips are supplemental only

#### ⚠️ Known Issue: Dashboard — Pool Badge (T2-3)
- **Date**: 2026-03-20
- **Problem**: No visibility into how many shops are in the Reschedule Pool from the Dashboard
- **Root Cause**: Pool count was not surfaced in the stats useMemo or the UI
- **Fix**: Added `pool` to `stats` useMemo (filtered from `activeShops` by `status === 'Rescheduled' && !scheduledDate`). Added orange `<Tag>` with spinning `SyncOutlined` in the header when `pool > 0`.
- **Rule**: Pool filter is `activeShops.filter(s => s.status === 'Rescheduled' && !s.scheduledDate)` — `activeShops` already excludes `masterStatus === 'Closed'`

#### ⚠️ Known Issue: Calendar — Drag-and-Drop Removed
- **Date**: 2026-03-20
- **Problem**: DnD reschedule bypassed capacity/MTR/region validation; also had no visual affordance
- **Root Cause**: Two separate interaction paths (drag for date, click for group) with inconsistent validation
- **Fix**: Removed DnD entirely. Click any shop chip or sidebar card → combined modal (date + group in one action). `interactionPlugin` kept for `dateClick` (sidebar date selection) but `editable`/`droppable`/`eventDrop` props removed. ExcelJS/jsPDF moved to dynamic imports.
- **Rule**: NEVER re-add DnD to Calendar without also adding shared validateReschedule utility (see peppy-waddling-ritchie.md T1-7)

#### ⚠️ Known Issue: Generator — Pool Generation Shared generatedResult State
- **Date**: 2026-03-25
- **Problem**: `handleGeneratePool` wrote into `generatedResult`, causing the wizard stepper to auto-advance to step 2 when a pool schedule was generated — even with no regular schedule
- **Root Cause**: Both regular and pool generation used the same `generatedResult` state; the wizard auto-step `useEffect` reads `generatedResult.length > 0`
- **Fix**: Added separate `poolGeneratedResult` state. `handleGeneratePool` now calls `setPoolGeneratedResult`. Pool preview renders from `poolGeneratedResult`. Regular wizard flow reads only `generatedResult`.
- **Rule**: ALWAYS use `poolGeneratedResult` for pool generation output; NEVER write pool results into `generatedResult`

#### ⚠️ Known Issue: Generator — Configure Step Left-Side Region Cards Cluttered Layout
- **Date**: 2026-03-25
- **Problem**: Configure step used a Row/Col split (span=9 region cards + span=15 settings), narrowing the settings area and duplicating region info already shown in the stats banner
- **Root Cause**: Original design rendered animated region cards alongside the form fields
- **Fix**: Removed left-side region card panel entirely. Settings form now renders in a centered `maxWidth: 720` wrapper. `UnplannedStatsBanner` above the stepper shows the same region breakdown compactly.
- **Rule**: NEVER restore the left-side region card panel in Configure step; use `UnplannedStatsBanner` + centered form instead

#### ⚠️ Known Issue: Generator — Configure Form Visible During Preview (pre-fix)
- **Date**: 2026-03-25
- **Problem**: Configure form and Preview table were both visible simultaneously after generation, causing layout confusion
- **Root Cause**: The Configure `<div>` block rendered unconditionally regardless of `generatedResult.length`
- **Fix**: Wrapped Configure block with `{generatedResult.length === 0 && (...)}` guard
- **Rule**: ALWAYS guard Configure step content with `generatedResult.length === 0`; NEVER render form and preview table simultaneously

#### ⚠️ Known Issue: Generator — Pool Preview Had No Sync Button
- **Date**: 2026-03-25
- **Problem**: Pool Schedule Preview card showed results but had no way to commit them to SharePoint
- **Root Cause**: `handleConfirmSyncPool` function and its button were never added when the pool preview was built
- **Fix**: Added `handleConfirmSyncPool` (mirrors `saveToSharePoint` but reads `poolGeneratedResult`); added "Confirm & Sync Pool Schedule" button in pool preview card alongside Back button
- **Rule**: ALWAYS add a Confirm & Sync button to any schedule preview card; NEVER show a preview without a save action

#### ⚠️ Known Issue: Generator — Stale Docblock Step 1 Color Annotation
- **Date**: 2026-03-25
- **Problem**: File-level JSDoc said `Step 1 (紅色/Problem)` after step colors were remapped to teal
- **Root Cause**: Docblock not updated when `DESIGN_COLORS.step1` was changed from red to teal
- **Fix**: Changed annotation to `Step 1 (青色/Configure)` matching actual `DESIGN_COLORS.step1 = "#0D9488"`
- **Rule**: ALWAYS update JSDoc step annotations when `DESIGN_COLORS` step values change

#### ⚠️ Known Issue: Linter Hook Clears Files on Edit
- **Date**: 2026-03-26
- **Problem**: Using the Edit tool on certain files (types.ts, SharePointService.ts) caused the linter hook to clear the file to 0 bytes, losing all content
- **Root Cause**: The linter hook triggers on file edits and wipes the file if it detects an error mid-edit (e.g. partial content during a failed edit)
- **Fix**: Used Write tool with full file content instead of Edit for all modified files in the session
- **Rule**: ALWAYS use the Write tool (never Edit) when modifying `types.ts`, `services/SharePointService.ts`, or any file that has been wiped before. If a file reads as 0 lines after an Edit, restore from `git show HEAD:<file>` and rewrite with Write tool

#### ⚠️ Known Issue: TimeCard — $orderby on Non-Indexed Column
- **Date**: 2026-03-26
- **Problem**: Time Card page loaded no data after release
- **Root Cause**: `$orderby=fields/ActionTime desc` in the Graph API URL causes a 400 error for non-indexed SharePoint columns; the `if (!response.ok) break` silently returned an empty array with no UI error
- **Fix**: Removed `$orderby` from the URL — the table's `defaultSortOrder: "descend"` handles client-side sorting
- **Rule**: NEVER use `$orderby=fields/<Column>` in Graph API list queries unless that column is indexed in SharePoint. Sort client-side instead

#### ⚠️ Known Issue: MobileMapView — Route Button Discoverability & Panel Not Showing
- **Date**: 2026-03-26
- **Problem**: (1) Navigate button was icon-only — users didn't know it opened a route. (2) Route panel never appeared because `handleNavigate` returned early before setting `showRoutePanel=true` when GPS was unavailable. (3) `RoutePanel` returned `null` (invisible) when both walking and transit routes failed. (4) No route entry point when user tapped a map pin directly.
- **Root Cause**: `handleNavigate` had an early-return guard before `setShowRoutePanel(true)`. `RoutePanel` lacked a fallback UI for the no-route state. No floating Route button existed for pin-tap flow.
- **Fix**: (1) Added "Route" text label to navigate button in `TopShopPanel`. (2) Moved `setSelectedShopId`, `setShowRoutePanel(true)`, `setIsPanelExpanded(false)` BEFORE the GPS guard in `handleNavigate` so panel always opens. (3) `RoutePanel` now renders a "Route unavailable" message instead of `null`. (4) Added `.mobile-route-fab` floating button (centered, bottom) in `MobileMapView` that shows when a shop is selected but the route panel is closed.
- **Rule**: ALWAYS call `setShowRoutePanel(true)` before any early-return guards in `handleNavigate`; NEVER let `RoutePanel` return null — always render a visible fallback state

---

## Development Commands

```bash
npm run dev       # Start dev server (http://localhost:3000)
npm run build     # Production build (tsc + vite)
npm run lint      # ESLint
```

## Architecture

**Tech Stack:** React 18 + TypeScript 5.7 + Vite 6, Ant Design 5, Tailwind CSS 3, Microsoft Graph API (SharePoint), AMap JS API, FullCalendar 6, ExcelJS, jsPDF

**Key files:**
- `services/SharePointService.ts` — all SharePoint API calls
- `utils/kmeans.ts` — K-means clustering for shop grouping
- `utils/batchOperations.ts` — concurrent API requests (5 concurrent, exponential backoff)
- `utils/coordTransform.ts` — WGS-84 → GCJ-02 for AMap
- `constants/config.ts` — SharePoint site/list IDs, API URLs
- `constants.ts` — `SP_FIELDS`, `INV_FIELDS` field name mappings

**State:** Centralized in `App.tsx` — `graphToken`/`invToken` (localStorage), `allShops`, `currentUser` (sessionStorage)

## Component Structure

```
App.tsx (root state, routing)
├── Layout.tsx
├── Login.tsx
├── Dashboard.tsx (shop actions: Resume/Pool/Close/Reschedule)
├── Generator.tsx (schedule generation, Reschedule Pool)
├── Calendar.tsx (Excel/PDF export)
├── ShopList.tsx
├── Locations.tsx (AMap map, batched markers)
│   └── MobileMapView/ (screens ≤640px) — see README.md
├── Inventory.tsx
├── Settings.tsx
└── ErrorBoundary.tsx
```

## SharePoint Integration

All API calls require:
```typescript
headers: {
  'Authorization': `Bearer ${this.graphToken}`,
  'Content-Type': 'application/json',
  'Prefer': 'HonorNonIndexedQueriesWarningMayFailOverTime',
  'ConsistencyLevel': 'eventual'
}
```

`sanitizeFilterValue()` escapes single quotes in OData `$filter` to prevent injection. Tokens expire after 45 min — users refresh manually via Graph Explorer.

## Dashboard Shop Actions

| Action | Permission | Behaviour |
|--------|-----------|-----------|
| Reschedule | `reschedule_shop` | Opens Smart Reschedule modal |
| Move to Pool | `reschedule_shop` | Clears date, sets status → `Rescheduled` |
| Close | `close_shop` | Sets status → `Closed` |
| Resume | `close_shop` | Sets status → `Pending` |

Pool shops: `status === 'Rescheduled'` AND `!scheduledDate`

Smart Reschedule modal buttons: **Move to Pool** / **Cancel** / **Confirm New Date** (disabled until date selected)

## Reschedule Pool (Generator)

Pool shop filter:
```typescript
shops.filter(s => s.masterStatus !== 'Closed' && s.status === 'Rescheduled' && !s.scheduledDate)
```

**Generate Pool Schedule** — runs same algorithm as regular generate using current `startDate`/`shopsPerDay`/`groupsPerDay`. Result feeds into Preview Table → Confirm & Sync saves to SharePoint, setting status → `Planned`.

## Locations Page Performance

Batched marker creation (80/frame), DOM CSS class toggling for active state (not full re-render), `setFitView` only on first render, 2D map only (no satellite layer).
