# User RunBook — Stock Take Scheduler Web

> Audience: End users (Admins, App Owners, Field Engineers, Regular Users)  
> Last updated: 2026-07-09

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Login & Account](#2-login--account)
3. [Dashboard](#3-dashboard)
4. [Schedule Generator](#4-schedule-generator)
5. [Calendar](#5-calendar)
6. [Shops (Master List & Map)](#6-shops-master-list--map)
7. [Inventory](#7-inventory)
8. [Time Card](#8-time-card)
9. [Reports](#9-reports)
10. [Permission Management](#10-permission-management)
11. [Settings & Token Management](#11-settings--token-management)
12. [Mobile Map Navigation (Field Engineers)](#12-mobile-map-navigation-field-engineers)
13. [Error Reporting](#13-error-reporting)
14. [FAQ & Troubleshooting](#14-faq--troubleshooting)

---

## 1. Getting Started

### What is this app?

Stock Take Scheduler Web helps you plan and manage inventory stock takes across all HKT/PCCW retail shops in Hong Kong and Macau. You can:

- Generate optimized schedules that avoid weekends and public holidays
- Track which shops are planned, completed, or need rescheduling
- View shops on a map with route navigation
- Track inventory assets per shop
- Export schedules to Excel or PDF

### How to Access

1. Open the app URL in your browser (Chrome or Edge recommended)
2. If you're not using the installed app yet, you'll see a **full-screen Install Guide** with tabs for iPhone/iPad, Android, and Desktop — each with numbered steps for your device. Click **"Continue in Browser →"** to skip installing and use the app in your browser instead. This guide only appears again if you clear your browser data — once dismissed, it's remembered on that device.
3. You'll land on the **Login** page

### User Roles

| Role | What you can do |
|------|----------------|
| **Admin** | Everything — generate schedules, manage shops, manage users, manage inventory |
| **App Owner** | Same as Admin |
| **User** | View dashboard only |

---

## 2. Login & Account

### Logging In

1. Enter your **Alias Email** (company email)
2. Enter your **Password**
3. Click **Login**

### First-Time Setup

If you don't have an account:

1. Click the **Register** tab
2. Fill in your Name, Company Email, Alias Email, and Password
3. Click **Register**
4. Your account will be created with "User" role. Ask an Admin to upgrade your role if needed.

### Changing Your Password

1. On the Login page, use the **Change Password** option
2. Enter your Alias Email, old password, and new password
3. Click **Confirm**

### Connection Issues at Login

If you see a red connection indicator:
- The SharePoint token may be expired
- Click **"Go to Settings"** to update the token (see [Section 11](#11-settings--token-management))

---

## 3. Dashboard

The Dashboard is your home page — a bird's-eye view of all stock take operations.

### Statistics Cards

At the top you'll see summary cards showing:
- **Total Active Shops** — all shops excluding "Closed"
- **Completed** — shops marked as "Done" this year
- **Remaining** — unplanned shops still needing scheduling
- **By Status** — breakdown of Planned / Unplanned / Done

### Shop Cards

Below the stats, you'll see shop cards organized by scheduled date. Each card shows:
- Shop name and brand
- Region and district
- Schedule status (color-coded)
- Group assignment (A/B/C) shown as a colored left border

### Shop Actions (Admin/App Owner only)

Click on a shop card to see available actions:

| Action | What it does |
|--------|-------------|
| **Reschedule** | Opens the Smart Reschedule modal — pick a new date and group |
| **Move to Pool** | Removes the schedule date and puts the shop in the Reschedule Pool for later scheduling |
| **Close** | Marks the shop as "Closed" (removed from active scheduling) |
| **Resume** | Re-activates a closed shop, setting status back to "Pending" |

### Reschedule Pool Badge

If there are shops waiting in the Reschedule Pool, you'll see an orange spinning badge in the header showing the count.

### Refreshing Data

Click the **Refresh Data** button (top-left) to reload all data from SharePoint. Data does not auto-refresh — you must click this button to see changes made by other users.

---

## 4. Schedule Generator

> **Required permission:** `generate_schedule` (Admin/App Owner)

The Generator creates optimized stock take schedules using a 3-step wizard.

### Step 1: Configure

1. **Select Regions** — choose which regions to schedule (HK Island, Kowloon, N.T., Lantau, Macau). Leave empty for all.
2. **Select Districts** — optionally narrow down to specific districts
3. **Include MTR Shops** — toggle whether to include MTR-located shops
4. **Start Date** — when scheduling should begin
5. **Shops Per Day** — how many shops to visit per day (default: 9)
6. **Groups Per Day** — how many groups to split into (default: 3, labeled A/B/C)

The stats banner at the top shows how many unplanned shops match your filters.

### Step 2: Preview

After clicking **Generate**, you'll see a preview table with:
- Date assigned to each shop
- Group assignment (A, B, or C)
- Shop name, brand, and district

The algorithm:
- Automatically skips weekends (Saturday and Sunday)
- Automatically skips Hong Kong public holidays
- Groups shops geographically so each group covers nearby shops

Review the schedule carefully before proceeding.

### Step 3: Sync to SharePoint

Click **Confirm & Sync** to save the schedule to SharePoint. You'll see:
- A progress bar showing how many shops have been updated
- A success/failure summary
- Option to retry any failed items

### Reschedule Pool Tab

Switch to the **Reschedule Pool** tab to generate schedules specifically for shops that were previously moved to the pool. The process is the same 3-step wizard.

### Reset Functions

> **Required permission:** `reset_schedule` (Admin/App Owner)

- **Reset by Date Range** — clear schedules within a specific date range
- **Reset All** — clear all planned schedules (requires confirmation)

---

## 5. Calendar

The Calendar page shows all scheduled stock takes in a monthly calendar view.

### Viewing Schedules

- Each day shows colored chips representing scheduled shops
- **Colors** indicate the group: Blue (A), Purple (B), Orange (C)
- Click a date to see detailed information about all shops scheduled that day
- Public holidays are marked with a badge

### Navigation

- Use **< >** arrows to move between months
- Click **Today** to jump to the current month

### Exporting

> Export buttons are in the top-right area

| Format | What you get |
|--------|-------------|
| **Excel (.xlsx)** | Full schedule data with shop details, dates, groups |
| **PDF** | Formatted table suitable for printing |

Both exports let you select a custom date range.

---

## 6. Shops (Master List & Map)

The Shops page combines two views — toggle between them using the **Table / Map** switch at the top.

### Table View (Master List)

A filterable, searchable table of all shops.

#### Filtering (9 filter options)

| Filter | How to use |
|--------|-----------|
| Region | Select HK, KN, NT, Islands, or MO |
| District | Select specific districts (50+ options) |
| Brand | Filter by CSL, 1O1O, SUN Mobile, etc. |
| MTR Status | MTR shops only or non-MTR only |
| Schedule Status | Planned, Unplanned, Done, Rescheduled |
| Master Status | Active or Closed |
| Shop Name | Text search |
| Shop Code | Text search |
| Address | Text search |

#### Inline Editing (Admin/App Owner)

You can edit directly in the table:
- **Phone number** — click the phone cell, edit, it auto-saves
- **Contact name** — click the contact cell, edit, it auto-saves

#### Call Logging

Each shop row has a call tracking button showing:
- **Log Call** (grey) — no calls made yet
- **Called** (green) — contact was reached
- **No Answer** (orange) — call attempted but no answer

Click the button to log a call attempt with timestamp.

### Map View (Locations)

An interactive AMap showing all shop locations.

- **Color-coded markers** by region
- **Click any marker** to see shop details (name, code, address, contact, status)
- **Filter markers** by region, brand, or status using the filter panel
- **Zoom/Pan** freely — map starts fitted to show all shops

---

## 7. Inventory

> **Required permission:** `manage_inventory` (Admin/App Owner)

Track and manage inventory assets across all shops.

### Viewing Inventory

- Filter by **Shop** to see all assets in a specific shop
- Filter by **Product Type**, **Status**, or **Brand**
- Each row shows: Asset Item ID, Brand, Product Name, Serial Number, CMDB, IP Address, Status

### Asset Details

Click any row to view/edit:
- In-Use Status
- Product Status
- Stock Take 2026 Status
- App Sync Status
- Remarks
- Photos (upload or view existing)

### Navigating from Dashboard

The Dashboard lets you click a shop and navigate directly to its inventory — the Inventory page will pre-filter to that shop.

---

## 8. Time Card

View field engineer (FE) check-in and check-out records.

### What it shows

- **FE Name** — who checked in/out
- **Action** — Check In or Check Out
- **Shop Name** — which shop
- **Action Time** — when it happened
- **Role** — Main FE or Assistant

### Filters

- Filter by FE Name, Shop Name, Action type, Role
- Filter by date range

### Stats Cards

At the top: Total entries, Unique FEs, Check Ins count, Check Outs count.

---

## 9. Reports

Strategic analytics for management.

### Available Reports

- **Schedule Progress** — how many shops are planned vs. completed vs. remaining
- **Business Unit Breakdown** — stats by business unit
- **Regional Stats** — completion rates by region

---

## 10. Permission Management

> **Required role:** Admin only

Manage user roles and account status.

### Viewing Members

The Permission page shows all registered users with:
- Name
- Email
- Current Role (Admin / App Owner / User)
- Account Status (Active / Inactive)

### Changing a User's Role

1. Find the user in the list
2. Click the role dropdown
3. Select the new role
4. The change saves immediately to SharePoint

### Activating/Deactivating Accounts

- Toggle a user's status between Active and Inactive
- Inactive users cannot log in

### Role Permissions Reference

| Permission | Admin | App Owner | User |
|-----------|-------|-----------|------|
| View Dashboard | Yes | Yes | Yes |
| Reschedule Shops | Yes | Yes | No |
| Close/Resume Shops | Yes | Yes | No |
| Edit Shop Details | Yes | Yes | No |
| Generate Schedules | Yes | Yes | No |
| Reset Schedules | Yes | Yes | No |
| Manage Inventory | Yes | Yes | No |
| Manage Users | Yes | Yes | No |
| View Settings | Yes | Yes | No |

---

## 11. Settings & Token Management

### Why Tokens?

The app connects to SharePoint through Microsoft's Graph API. This requires an **access token** that expires approximately every 60 minutes. When the token expires, you'll see:

- A red **animated truck banner** at the top of the page saying "TOKEN EXPIRED: UPDATE IN SETTINGS"
- Data stops loading
- Any save/sync operations will fail

### How to Refresh the Token

1. Go to **[Microsoft Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer)**
2. **Sign in** with your Microsoft account (must have SharePoint access)
3. Make sure you have the permission **Sites.ReadWrite.All**
4. Click the **Access Token** tab
5. **Copy** the entire token
6. Open the app's **Settings** page
7. **Paste** the token in the token field
8. Click **Save**

The token will:
- Save to your browser
- **Automatically sync** to all other users via cloud (Cloudflare)
- All sessions will pick up the new token within 5 minutes

### Token Auto-Sync

When someone updates the token, all other open sessions will automatically receive the new token within 5 minutes. You don't need to update it yourself if another team member already did.

### Connection Status

The Settings page shows a connection status indicator:
- **Green** — connected successfully to SharePoint
- **Red** — token expired or connection failed

---

## 12. Mobile Map Navigation (Field Engineers)

On mobile devices (screen width ≤640px), after login you're automatically taken to the **Mobile Map** view. This is designed for field engineers navigating between shops during stock takes.

### Features

1. **Date Picker** — tap the date field at the top to view shops scheduled for any date, not just today. Defaults to today on open.
2. **Group Selector** — dropdown at the top to switch between Group A, B, or C
3. **Shop List** — sorted by distance from your location, filtered to the selected date + group
4. **GPS Location** — tap the location button to get your position (on-demand to save battery). Your position shows as a blue pulsing dot.
5. **Distance** — see how far each shop is from you (straight-line distance)

### Route Navigation

Tap a shop, then tap the floating **Route** button (or the Navigate action in the shop list) to get directions:

- **Walking Route** — shown if the shop is within 1km
  - Turn-by-turn walking directions
  - Estimated walking time

- **Transit Route** — bus/MTR directions
  - Route numbers and line names
  - Via stops and transfer points
  - MTR entrance/exit information

- If no walking or transit route can be found, the panel shows a **"Route unavailable"** message instead of staying blank — try again once you have a GPS fix.

### Tips

- Tap any route segment header to zoom the map to that segment
- The bottom sheet is collapsible — drag the handle to expand or minimize
- GPS only activates when you press the button — it doesn't track you continuously
- Use the date picker to check tomorrow's (or any day's) route before you head out

---

## 13. Error Reporting

If you encounter a bug or issue:

1. Click the **Report Bug** button (available in the sidebar)
2. Select a **Category**: UI/Display, Data Sync, Feature Request, or Other
3. Write a **Description** of what happened
4. Click **Submit**

Your report is saved to SharePoint with your user info and timestamp. The development team reviews these reports regularly.

---

## 14. FAQ & Troubleshooting

### Q: The app shows "TOKEN EXPIRED" — what do I do?

Go to Settings and paste a fresh token from [Graph Explorer](https://developer.microsoft.com/en-us/graph/graph-explorer). Or wait — if another team member updates the token, your app will auto-sync within 5 minutes.

### Q: I see no data after logging in

1. Check the connection status in Settings
2. If red, update the token
3. Click "Refresh Data" after updating

### Q: The map isn't showing

The map requires an AMap API key. If you see a blank map area, contact your Admin to verify the AMap configuration.

### Q: I generated a schedule but don't see it in the Calendar

Click **Refresh Data** — the Calendar reads from the same data source. If you just synced, it should appear after refresh.

### Q: A shop was scheduled on a public holiday

Check if the holiday is in the system's holiday list (covers 2025–2028). If it's a newly announced holiday, contact the development team to add it.

### Q: I accidentally closed a shop

An Admin or App Owner can **Resume** the shop from the Dashboard. Click the shop card → Resume action.

### Q: I can't see certain menu items

Menu items are role-based. If you have "User" role, you can only see the Dashboard. Ask an Admin to upgrade your role if you need more access.

### Q: The schedule generation seems wrong

Check your filter settings:
- Are you filtering the right regions/districts?
- Is "Include MTR Shops" set correctly?
- Is your start date correct?

### Q: How do I export the schedule?

Go to **Calendar** → use the **Export to Excel** or **Export to PDF** buttons. You can select a date range for the export.

### Q: The app feels slow

- Make sure you're on a stable network
- Try clicking **Refresh Data** — cached data might be stale
- For the map view, only keep the browser tab active when needed (map rendering can be intensive)

### Q: I submitted a bug report but nothing happened

Bug reports are saved to SharePoint. The development team reviews them periodically. For urgent issues, contact your Admin directly.

### Q: Can I use this app on my phone?

Yes! The app is a PWA (Progressive Web App). If you haven't installed it yet, you'll see a full-screen install guide with device-specific steps (iPhone/iPad, Android, Desktop) — or tap "Continue in Browser →" to skip it. Once installed, it works like a native app. On mobile, you'll get the special **Mobile Map** view optimized for field work, including a date picker so you can check any day's route in advance.

### Q: Multiple people updated the same shop — whose change wins?

The last write wins. There's no conflict detection. If two people change the same shop at the same time, the most recent save overwrites the previous one. Coordinate with your team to avoid conflicts.
