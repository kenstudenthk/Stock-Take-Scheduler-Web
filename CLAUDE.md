# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Stock Take Scheduler Web — React app for scheduling inventory stock takes across HK retail shops. Integrates with Microsoft SharePoint via Graph API for data persistence.

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

#### ⚠️ Known Issue: Calendar — Drag-and-Drop Removed
- **Date**: 2026-03-20
- **Problem**: DnD reschedule bypassed capacity/MTR/region validation; also had no visual affordance
- **Root Cause**: Two separate interaction paths (drag for date, click for group) with inconsistent validation
- **Fix**: Removed DnD entirely. Click any shop chip or sidebar card → combined modal (date + group in one action). `interactionPlugin` kept for `dateClick` (sidebar date selection) but `editable`/`droppable`/`eventDrop` props removed. ExcelJS/jsPDF moved to dynamic imports.
- **Rule**: NEVER re-add DnD to Calendar without also adding shared validateReschedule utility (see peppy-waddling-ritchie.md T1-7)

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
