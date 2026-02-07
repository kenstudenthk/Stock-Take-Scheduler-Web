# Stock Take Scheduler - Component Library Guide

This document describes all the React/Tailwind components generated from the Scheduler.pen design file.

## Directory Structure

```
src/
├── components/
│   ├── index.ts                 # Component exports
│   ├── Sidebar.tsx              # Sidebar layout component
│   ├── PageHeader.tsx           # Page header component
│   ├── Layout.tsx               # Main layout wrapper
│   ├── pages/
│   │   ├── Dashboard.tsx        # Stock Take Dashboard
│   │   ├── CalendarPage.tsx     # Calendar view
│   │   ├── GeneratorPage.tsx    # Schedule generator
│   │   ├── ShopListPage.tsx     # Shop management
│   │   ├── MapViewPage.tsx      # Map visualization
│   │   ├── SettingsPage.tsx     # Settings/configuration
│   │   ├── PermissionsPage.tsx  # Permission management
│   │   └── LoginPage.tsx        # Authentication
│   └── mobile/
│       ├── MobileDashboard.tsx  # Mobile dashboard
│       ├── MobileMapView.tsx    # Mobile map
│       └── MobileShopDetail.tsx # Mobile shop detail
├── globals.css                   # Global styles & CSS variables
├── tailwind.config.ts           # Tailwind configuration
└── lib/utils.ts                 # Utility functions
```

## Core Components

### Layout Components

#### Sidebar
Renders the fixed left sidebar (88px width)

```tsx
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '@/components';

<Sidebar>
  <SidebarTop>
    <SidebarLogo>{/* Logo */}</SidebarLogo>
    <SidebarNavItems>{/* Nav items */}</SidebarNavItems>
  </SidebarTop>
  <SidebarBottom>
    <SidebarAvatar>{/* User avatar */}</SidebarAvatar>
  </SidebarBottom>
</Sidebar>
```

#### PageHeader
Renders the page header with left and right sections

```tsx
import { PageHeader, HeaderLeft, HeaderRight } from '@/components';

<PageHeader>
  <HeaderLeft>{/* Title/breadcrumbs */}</HeaderLeft>
  <HeaderRight>{/* Actions/buttons */}</HeaderRight>
</PageHeader>
```

#### Layout
Main layout wrapper combining Sidebar and content area

```tsx
import { Layout } from '@/components';

<Layout>
  {/* Page content goes here */}
</Layout>
```

## Page Components

### 1. Dashboard (`Dashboard.tsx`)
Main dashboard with metrics, charts, and upcoming stock takes

**Features:**
- 4-column metric cards grid
- Chart area with recent shops list
- Promotional banner
- Table of upcoming stock takes

**Usage:**
```tsx
import { Dashboard } from '@/components';

<Dashboard />
```

### 2. CalendarPage (`CalendarPage.tsx`)
Full calendar view with legend

**Features:**
- Calendar grid (7 columns, day headers)
- Legend with color indicators
- Responsive layout

**Usage:**
```tsx
import { CalendarPage } from '@/components';

<CalendarPage />
```

### 3. GeneratorPage (`GeneratorPage.tsx`)
Multi-step schedule generation wizard

**Features:**
- 3-step wizard UI
- Form sections (left/right columns)
- Progress indicators

**Usage:**
```tsx
import { GeneratorPage } from '@/components';

<GeneratorPage />
```

### 4. ShopListPage (`ShopListPage.tsx`)
Shop management with filtering and table

**Features:**
- Filter chips row
- Sortable data table
- Pagination controls

**Usage:**
```tsx
import { ShopListPage } from '@/components';

<ShopListPage />
```

### 5. MapViewPage (`MapViewPage.tsx`)
Map visualization with markers and side panel

**Features:**
- Interactive map area with markers
- Map controls (zoom in/out)
- Legend
- Side panel with shop list

**Usage:**
```tsx
import { MapViewPage } from '@/components';

<MapViewPage />
```

### 6. SettingsPage (`SettingsPage.tsx`)
User settings and preferences

**Features:**
- Settings sections
- Form inputs
- Account management buttons

**Usage:**
```tsx
import { SettingsPage } from '@/components';

<SettingsPage />
```

### 7. PermissionsPage (`PermissionsPage.tsx`)
Permission and role management

**Features:**
- Role cards (Admin, Manager, Viewer)
- Permission checkboxes
- User table with role selection

**Usage:**
```tsx
import { PermissionsPage } from '@/components';

<PermissionsPage />
```

### 8. LoginPage (`LoginPage.tsx`)
Authentication page with branding

**Features:**
- Left side: Brand messaging
- Right side: Login form
- Microsoft sign-in option

**Usage:**
```tsx
import { LoginPage } from '@/components';

<LoginPage />
```

## Mobile Components

### MobileDashboard
Mobile version of dashboard with tab navigation

**Features:**
- Status bar
- Header with notification button
- Metric cards
- Today's schedule list
- Weekly stats
- Tab bar navigation

**Usage:**
```tsx
import { MobileDashboard } from '@/components/mobile/MobileDashboard';

<MobileDashboard />
```

### MobileMapView
Mobile map with bottom sheet

**Features:**
- Map with markers
- Group selector
- Bottom sheet with shop list

**Usage:**
```tsx
import { MobileMapView } from '@/components/mobile/MobileMapView';

<MobileMapView onBack={() => {}} />
```

### MobileShopDetail
Mobile shop detail view

**Features:**
- Shop title and address
- Badges (status)
- Schedule details card
- Contact information
- Action buttons (Navigate, Mark Complete)
- Notes section

**Usage:**
```tsx
import { MobileShopDetail } from '@/components/mobile/MobileShopDetail';

<MobileShopDetail />
```

## Styling System

### CSS Variables

All design colors are mapped as CSS variables in `globals.css`:

- **Primary Colors:** `--primary`, `--secondary`, `--accent`
- **BH Theme:** `--bh-black`, `--bh-white`, `--bh-blue`, `--bh-red`, `--bh-yellow`
- **IH Theme:** `--ih-text`, `--ih-surface`, `--ih-accent`, `--ih-border`
- **Semantic:** `--color-error`, `--color-success`, `--color-warning`, `--color-info`

### Usage in Components

Use CSS variables with Tailwind arbitrary values:

```tsx
<div className="bg-[var(--primary)] text-[var(--primary-foreground)]">
  Content
</div>
```

### Dark Mode

Dark mode is supported via `data-theme="dark"` attribute on HTML element:

```html
<html data-theme="dark">
  {/* Content */}
</html>
```

## Tailwind Configuration

The `tailwind.config.ts` file extends Tailwind with:
- All design system colors
- Custom border radius values
- Font family utilities

## Integration with Existing Code

### 1. Update App.tsx
```tsx
import { Layout } from '@/components';
import { Dashboard } from '@/components/pages/Dashboard';

function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

### 2. Update Route Handlers
```tsx
import * as PageComponents from '@/components';

const routes = {
  '/': PageComponents.Dashboard,
  '/calendar': PageComponents.CalendarPage,
  '/generator': PageComponents.GeneratorPage,
  '/shops': PageComponents.ShopListPage,
  '/map': PageComponents.MapViewPage,
  '/settings': PageComponents.SettingsPage,
  '/permissions': PageComponents.PermissionsPage,
  '/login': PageComponents.LoginPage,
};
```

### 3. Responsive Design
Components use Tailwind responsive prefixes for mobile:
- Desktop: 1440x900px layouts
- Mobile: 402px width layouts

Add media queries in your router to conditionally render desktop/mobile versions.

## Customization

### Modifying Colors

1. Update `--color-name` in `globals.css`
2. Use in components: `className="bg-[var(--color-name)]"`

### Modifying Spacing

Use Tailwind's spacing scale:
- `p-4` = 1rem padding
- `gap-6` = 1.5rem gap
- `px-12` = 3rem horizontal padding

### Extending Components

Extend any component:

```tsx
import { Dashboard } from '@/components';

export function CustomDashboard() {
  return (
    <Dashboard>
      {/* Additional content */}
    </Dashboard>
  );
}
```

## Font Setup

Three font families are configured:

1. **Font Display** - `Space Grotesk` (headings)
2. **Font Mono** - `Space Mono` (data/code)
3. **Font Primary** - `JetBrains Mono` (body)
4. **Font Secondary** - `Geist` (fallback)

Load fonts in your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=JetBrains+Mono:wght@400;500;600;700&family=Geist:wght@400;500;600;700&display=swap" rel="stylesheet">
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS custom properties support required
- Flexbox/Grid support required

## Performance Notes

- Components use `React.FC` for type safety
- Inline SVG icons via lucide-react
- CSS variables for dynamic theming
- No external dependencies beyond existing stack (React, Tailwind)

## Next Steps

1. **Connect Data:** Map actual data from SharePoint to components
2. **Add Interactions:** Connect forms, buttons, and navigation
3. **Theme Toggle:** Implement dark/light mode switching
4. **Mobile Routing:** Add responsive routing logic
5. **State Management:** Connect to Redux/Context as needed
6. **API Integration:** Link to SharePointService calls

## Component Props Reference

All page components accept `React.FC` interface with optional children/props.

For interactive features (forms, tables, modals), wrap components with your state management or build form logic in parent components.

---

**Generated from:** Scheduler.pen design file
**Design Variables:** 50+ color tokens, 4 font families, 3 radius scales
**Component Count:** 8 web pages + 3 mobile pages + 3 layout utilities
