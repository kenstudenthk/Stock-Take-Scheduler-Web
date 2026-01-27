# Stock Take Scheduler Web

A modern web application for managing and scheduling inventory stock takes across multiple retail shop locations. Built with React, TypeScript, and integrated with Microsoft SharePoint via Graph API.

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
  - Shops by schedule status (Planned, Unplanned, Done)

- **Quick Filters:**
  - Filter shops by status (All, Planned, Unplanned, Completed)
  - View shops requiring attention

- **Quick Actions:**
  - Reschedule overdue shops
  - Navigate to other pages

---

### 3. Schedule Generator

Intelligent scheduling system with automatic optimization.

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
  - Auto-skip Hong Kong public holidays (2025-2028)
  - Geographic grouping using K-means clustering
  - Shops sorted by location proximity

- **Preview & Sync:**
  - Preview generated schedule in table format
  - View date, group, shop name, and district
  - Batch sync to SharePoint with progress indicator
  - Retry failed items with one click

- **Reset Functions:**
  - Reset by date period (select date range)
  - Reset all planned schedules

- **Visual Statistics:**
  - Active shops count by region
  - Completed vs remaining breakdown

---

### 4. Calendar View

Visual calendar interface for schedule management.

**Features:**
- **Monthly Calendar:**
  - View all scheduled stock takes by date
  - Color-coded by group (Group A, B, C)
  - Click date to view shops scheduled

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

### 5. Shop Management (Master List)

Comprehensive shop database with advanced filtering and editing.

**Features:**
- **Advanced Filtering (9 Filter Options):**
  - Filter by Region (HK, KN, NT, Islands, MO)
  - Filter by District (50+ districts)
  - Filter by Brand (CSL, 1O1O, SUN Mobile, etc.)
  - Filter by MTR Status (MTR shops / Non-MTR)
  - Filter by Schedule Status (Planned, Unplanned, Done, Rescheduled)
  - Filter by Master Status (Active, Closed)
  - Search by Shop Name
  - Search by Shop Code
  - Search by Address

- **Data Display:**
  - Shop Code and Name
  - Brand with logo icon
  - Region and District
  - Address (English)
  - Phone number
  - Contact person name
  - Schedule status with color tag
  - Scheduled date
  - Group assignment

- **Inline Editing:**
  - Edit contact phone number
  - Edit contact person name
  - Auto-save to SharePoint

- **Call Logging:**
  - Log call attempts with timestamp
  - Track contact history

- **Bulk Operations:**
  - Select multiple shops
  - Batch status update

---

### 6. Map Visualization (Locations)

Interactive map showing all shop locations.

**Features:**
- **AMap Integration:**
  - Full Hong Kong map coverage
  - Zoom and pan controls
  - Satellite/Standard view toggle

- **Shop Markers:**
  - Color-coded markers by region
  - Click marker to view shop details
  - Clustered markers for dense areas

- **Filtering:**
  - Filter markers by region
  - Filter markers by brand
  - Filter markers by status

- **Shop Details Popup:**
  - Shop name and code
  - Full address
  - Contact information
  - Current schedule status
  - Quick link to edit shop

- **Coordinate System:**
  - WGS-84 to GCJ-02 conversion
  - Accurate positioning for China maps

---

### 7. Inventory Management

Asset tracking and inventory item management.

**Features:**
- **Asset List:**
  - View all inventory items
  - Filter by shop
  - Filter by product type
  - Filter by status

- **Asset Details:**
  - Asset Item ID
  - Brand and Product Name
  - Serial Number
  - CMDB Reference
  - IP Address
  - In-Use Status
  - Product Status

- **Status Tracking:**
  - Stock Take 2026 Status
  - App Sync Status
  - Product condition

- **Data Management:**
  - Edit asset details
  - Update status
  - Add remarks
  - Upload photos

---

### 8. Settings

Application configuration and token management.

**Features:**
- **SharePoint Token Management:**
  - Paste and save Graph API token
  - Separate tokens for Shop List and Inventory
  - Token validation check
  - Connection status indicator

- **Token Expiry Warning:**
  - Automatic warning after 45 minutes
  - Guide to refresh token
  - Link to Microsoft Graph Explorer

- **API Information:**
  - Display current Site ID
  - Display List IDs
  - API endpoint reference

- **Authentication Guide:**
  - Step-by-step token retrieval
  - Required permissions list
  - Troubleshooting tips

---

### 9. Error Report

Built-in bug reporting system.

**Features:**
- **Report Categories:**
  - UI/Display Issues
  - Data Sync Problems
  - Feature Requests
  - Other Issues

- **Report Details:**
  - Description text area
  - Automatic user info capture
  - Timestamp recording

- **Submission:**
  - Direct submission to SharePoint
  - Confirmation message
  - Track submitted reports

---

## Additional Features

### Theme Support
- Light mode (default)
- Dark mode toggle
- Persistent preference storage

### Responsive Design
- Desktop optimized layout
- Sidebar navigation
- Collapsible menu

### Data Security
- Password hashing with bcrypt
- Input sanitization for API queries
- Token-based authentication

### Error Handling
- Error boundary for crash recovery
- User-friendly error messages
- Retry options for failed operations

---

## Tech Stack

| Category | Technologies |
|----------|--------------|
| **Framework** | React 18, TypeScript 5.7 |
| **Build Tool** | Vite 6 |
| **UI Components** | Ant Design 5 |
| **Styling** | Tailwind CSS 3 |
| **Maps** | AMap JS API |
| **Backend** | Microsoft Graph API (SharePoint Online) |
| **Export** | ExcelJS, jsPDF |
| **Auth** | bcryptjs |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
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

### Build for Production

```bash
npm run build      # Build for production
npm run preview    # Preview production build
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

# Map Configuration
VITE_AMAP_API_KEY=your-amap-key

# Token Settings
VITE_TOKEN_WARNING_MINUTES=45
```

> **Note:** The app works without a `.env` file using built-in fallback values.

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
├── App.tsx                     # Main application & routing
├── main.tsx                    # React entry point
├── types.ts                    # TypeScript interfaces
│
├── components/
│   ├── Dashboard.tsx           # Statistics & overview
│   ├── Calendar.tsx            # Schedule calendar & export
│   ├── Generator.tsx           # Schedule generation
│   ├── ShopList.tsx            # Shop management & filtering
│   ├── Locations.tsx           # Map visualization
│   ├── Inventory.tsx           # Asset tracking
│   ├── Login.tsx               # Authentication
│   ├── Settings.tsx            # Token configuration
│   └── ErrorBoundary.tsx       # Error handling
│
├── services/
│   └── SharePointService.ts    # Graph API integration
│
├── constants/
│   ├── config.ts               # Centralized configuration
│   └── holidays.ts             # HK public holidays (2025-2028)
│
├── utils/
│   ├── batchOperations.ts      # Batch API utilities
│   ├── coordTransform.ts       # Map coordinate conversion
│   └── kmeans.ts               # Clustering algorithm
│
└── index.css                   # Global styles & animations
```

---

## License

Private - All rights reserved.

## Support

For issues and feature requests, please contact the development team.
