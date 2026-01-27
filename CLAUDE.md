# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock Take Scheduler Web is a React application for managing and scheduling inventory stock takes across retail shop locations in Hong Kong. It integrates with Microsoft SharePoint via Graph API for data persistence.

## Development Commands

```bash
npm run dev       # Start development server on http://localhost:3000
npm run build     # Build for production
npm run preview   # Preview production build
```

No test runner or linter is configured in this project.

## Architecture

### Tech Stack
- **Frontend:** React 18, TypeScript 5.7, Vite 6
- **UI:** Ant Design 5, Tailwind CSS 3
- **Backend:** Microsoft Graph API (SharePoint Online)
- **Maps:** AMap JS API (requires WGS-84 to GCJ-02 coordinate conversion)
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

### Configuration
- `constants/config.ts` - SharePoint site/list IDs, API URLs, batch settings
- `constants/holidays.ts` - HK public holidays (2025-2028) for schedule generation
- `constants.ts` (root) - SharePoint field name mappings (`SP_FIELDS`, `INV_FIELDS`)

## Component Structure

```
App.tsx (root state, routing)
├── Layout.tsx (sidebar navigation)
├── Login.tsx (authentication)
├── Dashboard.tsx (stats overview)
├── Generator.tsx (schedule generation with K-means clustering)
├── Calendar.tsx (calendar view, Excel/PDF export)
├── ShopList.tsx (shop management, inline editing)
├── Locations.tsx (AMap visualization)
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
