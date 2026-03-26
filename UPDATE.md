# Update Log

All notable changes to Stock Take Scheduler Web are recorded here, newest first.

---

## 2026-03-26

### ✨ New Features
- **Time Card page** — new page reading from "Maxims Stock Take 2026 Time Card" SharePoint list. Displays FE check-in/check-out attendance with filters (FE Name, Shop Name, Action, Role, Date Range) and stat cards (Total / Unique FEs / Check Ins / Check Outs).
- **Reports page** — strategic management analytics page with schedule progress, business unit breakdown, and regional stats.

### 🐛 Bug Fixes
- **Time Card data not loading** — removed `$orderby=fields/ActionTime desc` from Graph API URL; non-indexed SP columns reject server-side ordering. Table now sorts client-side via `defaultSortOrder`.

---

## 2026-03-25

### ✨ New Features
- **Generator — Unplanned/Reschedule tabs** — separate tab views for regular schedule generation and reschedule pool, with full-width configure form.
- **Shop Detail Modal** — added Stock Take Info and Shop Agreement sections.

### 🐛 Bug Fixes
- **Generator** — configure form now hidden when previewing results; pool sync button added to pool preview card; `generatedResult` typed as `Shop[]`; stats banner hidden when total is 0.
- **Generator** — step 1 color canonicalized to teal `#0D9488` (was red).
- **Inventory** — switched to 2-step attachment fetch to resolve Graph API 400 error on Image columns.

---

## 2026-03-24

### ✨ New Features
- **Inventory** — photo carousel with full pagination; loads SharePoint Image column photos via Graph API attachments.

### 🐛 Bug Fixes
- **Inventory** — `ProductImage` / `ProductImage2` fields correctly mapped from SharePoint; inventory fetch paginated to handle lists beyond 999 items; flexible shop name matching.

---

## 2026-03-23

### ✨ New Features
- **Inventory** — syncing spinner; Inventory Detail navigation chain from Shop modal.
- **Calendar** — command-center visual redesign.

### 🐛 Bug Fixes
- **Calendar** — public holiday badge overlap fixed; chip name font size corrected; Pool stat card label renamed.

---

## 2026-03-22

### ✨ New Features
- **Inventory state centralized** — `allInventory` moved to `App.tsx`; `ShopDetailModal` chains to `ShopInventoryModal` for per-shop inventory drill-down.

---

## 2026-03-20 — UI/UX Improvement Sprint (Tier 1–3)

### ✨ New Features
- **Shops page** — unified `ShopList` + `Locations` into a single `View.SHOPS` page with Table/Map toggle (`Segmented`).
- **StatCard** — extracted shared `components/StatCard.tsx`; all pages import from single source.
- **Schedule generation utilities** — `isWorkingDay`, `getNextWorkingDay`, `filterSchedulePool`, `generateSchedule` extracted to `utils/scheduleGeneration.ts`.
- **Nav order** — Dashboard → Schedules → Generator | Shops | Reports | Inventory → Permission.
- **AMap hook** — `useAMap()` / `loadAMap()` utility replaces direct `window.AMap` access.
- **Call tracking button** — replaced icon-only rotating SVG with labelled Ant Design Button (status-aware: Called / No Answer / Log Call).
- **Dark mode first load** — system `prefers-color-scheme` used as fallback when no localStorage preference.
- **Role descriptions** — `rolePermissions` in Permission.tsx rewritten to match actual `ROLE_PERMISSIONS` in `types.ts`.
- **Generator wizard** — replaced vertical sidebar with horizontal Ant Design `Steps` stepper.
- **Wizard step colours** — step 1 teal `#0D9488`, step 2 amber `#D97706`, step 3 green.
- **Region cards** — planned % always visible in card body (not tooltip-only).
- **Pool badge** — Dashboard header shows reschedule pool count with `SyncOutlined` tag.
- **Mobile nav** — role-aware bottom nav; admin gets More overflow popover.
- **Login** — Login/Register tab toggle; password show/hide eye; real-time email validation; `autoComplete` attributes.
- **Calendar** — removed drag-and-drop; click-to-reschedule modal with combined date + group selection.
- **Dashboard** — date-contextual micro-stats row; 3px group-colour left border on shop cards; Reset All confirmation.

---

## 2026-02-23

### ✨ New Features
- **Reschedule Pool** — shops with `status === 'Rescheduled'` and no `scheduledDate` enter the pool; Generator can generate and sync a pool schedule separately from the regular schedule.

---

## 2026-02-09–10

### ✨ New Features
- **Cloudflare token sync** — unified token broadcast/fetch via Cloudflare Worker; auto-polls every 5 min.
- **Mobile Map** — transit route details (walking segments, station info, line colours); tap-to-zoom for route segments; collapsible bottom sheet `RoutePanel`; `TopShopPanel` replaces old bottom sheet.

### 🐛 Bug Fixes
- **Mobile Map** — group selector dropdown z-index fixed; walking segments detected via `transit_mode === 'WALK'` (not `steps`).

---

## 2026-02-04–06

### ✨ New Features
- **Mobile PWA** — service worker, offline support, mobile-responsive layout.
- **Mobile Map navigation** — full turn-by-turn transit/walking directions for Field Engineers (screens ≤640px).
- **Locations performance** — batched marker creation (80/frame); DOM CSS class toggling for active state; `setFitView` only on first render; 2D map only.

---

## 2026-01-27–29

### ✨ New Features
- **Calendar** — FullCalendar integration with multi-view (month/week/day), public holidays, shop chips.
- **Permission management** — role-based access control; admin-only routes guarded.
- **Generator wizard** — 3-step progress bar (Configure → Preview → Confirm).
- **ShopList** — persistent filters (sessionStorage); inline stats bar; pencil icon hover hint.
- **CLAUDE.md** — project architecture and development guidance document added.

---

## 2026-01-13–26

### ✨ New Features
- **Login** — SharePoint member list authentication; register flow; password hashing with bcryptjs.
- **Generator** — schedule generation algorithm; shops-per-day / groups-per-day config; public holiday awareness.
- **Dashboard** — shop action buttons (Reschedule / Move to Pool / Close / Resume); group colour cards; date picker.
- **Inventory** — full CRUD against SharePoint inventory list.
- **Settings** — Graph API token management; token health indicator.

---

## 2026-01-09–12

### 🎉 Project Start
- Initial commit — React 18 + TypeScript + Vite scaffold.
- Core pages: Dashboard, Calendar, ShopList, Locations, Generator.
- SharePoint Graph API integration (`SharePointService.ts`).
- AMap JS API integration for shop map view.
- Dark mode toggle; theme persistence in localStorage.
