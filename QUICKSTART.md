# Quick Start Guide - Generated Components

Get up and running with the Stock Take Scheduler components in 5 minutes.

## 1. Setup

### Ensure CSS is imported in your main entry point

```typescript
// src/main.tsx or src/index.tsx
import './globals.css'
import App from './App'
```

### Update your `package.json` dependencies

The components require:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "lucide-react": "^latest",
    "tailwindcss": "^3.0.0"
  }
}
```

## 2. Choose Your Page

### Option A: Desktop Application

Display the full desktop interface:

```typescript
// src/App.tsx
import { Layout } from '@/components';
import { Dashboard } from '@/components/pages/Dashboard';

export default function App() {
  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

### Option B: Mobile Application

Display the mobile interface:

```typescript
// src/App.tsx
import { MobileDashboard } from '@/components/mobile/MobileDashboard';

export default function App() {
  return <MobileDashboard />;
}
```

### Option C: Responsive Application

Auto-detect device and show appropriate version:

```typescript
// src/App.tsx
import { useIsMobile } from '@/hooks/useResponsive';
import { Layout, Dashboard } from '@/components';
import { MobileDashboard } from '@/components/mobile/MobileDashboard';

export default function App() {
  const isMobile = useIsMobile();

  return isMobile ? (
    <MobileDashboard />
  ) : (
    <Layout>
      <Dashboard />
    </Layout>
  );
}
```

## 3. Add Routing

### Setup with React Router

```typescript
// src/routes.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import {
  Dashboard,
  CalendarPage,
  GeneratorPage,
  ShopListPage,
  MapViewPage,
  SettingsPage,
  PermissionsPage,
  LoginPage,
} from '@/components';
import { Layout } from '@/components';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <Layout>
              <Dashboard />
            </Layout>
          }
        />
        <Route
          path="/calendar"
          element={
            <Layout>
              <CalendarPage />
            </Layout>
          }
        />
        <Route
          path="/generator"
          element={
            <Layout>
              <GeneratorPage />
            </Layout>
          }
        />
        <Route
          path="/shops"
          element={
            <Layout>
              <ShopListPage />
            </Layout>
          }
        />
        <Route
          path="/map"
          element={
            <Layout>
              <MapViewPage />
            </Layout>
          }
        />
        <Route
          path="/settings"
          element={
            <Layout>
              <SettingsPage />
            </Layout>
          }
        />
        <Route
          path="/permissions"
          element={
            <Layout>
              <PermissionsPage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
```

## 4. Customize Colors

### Dark Mode Toggle

Add a theme toggle to your app:

```typescript
// src/components/ThemeToggle.tsx
import { useEffect } from 'react';

export function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage('theme', 'light');

  useEffect(() => {
    const html = document.documentElement;
    if (theme === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
  }, [theme]);

  return (
    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
```

### Customize Color Palette

Edit `src/globals.css` to change colors:

```css
:root {
  /* Change primary color */
  --primary: #0066CC; /* was #FF8400 */

  /* Change secondary color */
  --secondary: #FF6600; /* was #E7E8E5 */

  /* Change success color */
  --bh-success: #00AA00; /* was #4CAF50 */
}
```

## 5. Connect Data

### Pass data to components

```typescript
<Dashboard
  stats={{
    red: { title: 'Pending', value: '12' },
    blue: { title: 'In Progress', value: '8' },
    yellow: { title: 'Complete', value: '34' },
    black: { title: 'Total', value: '54' },
  }}
  recentShops={[
    { id: '1', name: 'Central Plaza', status: 'Active' },
    { id: '2', name: 'Victoria Park', status: 'Pending' },
  ]}
  stockTakes={[
    {
      id: '1',
      shop: 'Central Plaza',
      date: 'Mar 15, 2024',
      time: '09:00 - 12:00',
      status: 'In Progress',
    },
  ]}
  onBannerClose={() => console.log('Banner closed')}
/>
```

### Connect to API

```typescript
import { useEffect, useState } from 'react';
import { Dashboard } from '@/components';

function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from your API
    fetchDashboardData().then(data => {
      setData(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div>Loading...</div>;

  return <Dashboard {...data} />;
}
```

## 6. Available Components

### Desktop Pages (use with Layout)

- `Dashboard` - Main dashboard with metrics
- `CalendarPage` - Calendar view
- `GeneratorPage` - Schedule generator
- `ShopListPage` - Shop management
- `MapViewPage` - Map visualization
- `SettingsPage` - Settings
- `PermissionsPage` - Permission management
- `LoginPage` - Authentication (standalone)

### Mobile Components

- `MobileDashboard` - Mobile dashboard
- `MobileMapView` - Mobile map
- `MobileShopDetail` - Shop detail view

### Layout Components

- `Layout` - Main layout wrapper
- `Sidebar` - Left sidebar
- `PageHeader` - Page header

## 7. Hook Reference

### Responsive Design Hooks

```typescript
import {
  useIsMobile,     // true if width <= 480px
  useIsTablet,     // true if width 480-768px
  useIsDesktop,    // true if width > 768px
  useViewport,     // returns { width, height }
  useIsPortrait,   // true if height > width
} from '@/hooks/useResponsive';

// Use in components
function MyComponent() {
  const isMobile = useIsMobile();

  return isMobile ? <MobileView /> : <DesktopView />;
}
```

## 8. Styling Examples

### Using Tailwind Classes

```typescript
<div className="bg-[var(--primary)] text-[var(--primary-foreground)] p-6 rounded-lg">
  Content with primary color
</div>
```

### Using Design Variables

```typescript
<div className="bg-[var(--bh-blue)] text-[var(--bh-white)]">
  Blue background with white text
</div>
```

### Responsive Classes

```typescript
<div className="w-full md:w-1/2 lg:w-1/3 flex flex-col gap-4">
  Responsive width and layout
</div>
```

## 9. Common Patterns

### Form Handling

```typescript
const [formData, setFormData] = useState({});

const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  console.log('Form submitted:', formData);
};

<form onSubmit={handleSubmit}>
  <input
    type="email"
    value={formData.email}
    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  />
  <button type="submit">Submit</button>
</form>
```

### Table Data

```typescript
const [shops, setShops] = useState([]);

// In component
{shops.map((shop) => (
  <div key={shop.id} className="px-6 py-4 border-b">
    <div>{shop.name}</div>
    <div className="text-sm text-gray-500">{shop.location}</div>
  </div>
))}
```

### Conditional Rendering

```typescript
const [isLoading, setIsLoading] = useState(true);

{isLoading ? (
  <div>Loading...</div>
) : (
  <Dashboard {...data} />
)}
```

## 10. TypeScript Types

All components have full TypeScript support:

```typescript
import type { DashboardProps, ShopListPageProps } from '@/components';

const dashboardProps: DashboardProps = {
  stats: { /* ... */ },
  recentShops: [ /* ... */ ],
};

const shopListProps: ShopListPageProps = {
  shops: [ /* ... */ ],
  onShopSelect: (shopId) => console.log(shopId),
};
```

## Troubleshooting

### Components not showing styles

1. Ensure `globals.css` is imported in your main entry
2. Check that Tailwind CSS is properly configured
3. Verify `tailwind.config.ts` is in project root

### Colors not working

1. Check that CSS variables are defined in `globals.css`
2. Use `className="bg-[var(--primary)]"` syntax
3. Inspect computed styles in browser DevTools

### Responsive not working

1. Verify viewport meta tag in HTML: `<meta name="viewport" content="width=device-width, initial-scale=1">`
2. Check that hooks are used inside React components
3. Test with browser's responsive device mode

## Next Steps

1. ✅ Integrate with your routing solution
2. ✅ Connect to your API/data sources
3. ✅ Customize colors and branding
4. ✅ Add form validation
5. ✅ Implement authentication
6. ✅ Add animations with Framer Motion
7. ✅ Setup state management (Redux/Zustand)
8. ✅ Add unit tests with Jest

## Resources

- **Component Guide:** `COMPONENT_GUIDE.md`
- **Full Summary:** `GENERATED_COMPONENTS_SUMMARY.md`
- **Tailwind Docs:** https://tailwindcss.com
- **React Docs:** https://react.dev
- **Lucide Icons:** https://lucide.dev

## Support

For detailed component documentation, see `COMPONENT_GUIDE.md`.

For TypeScript types, check `src/components/types.ts`.

For CSS variables, see `src/globals.css`.

---

**Last Updated:** February 7, 2026
