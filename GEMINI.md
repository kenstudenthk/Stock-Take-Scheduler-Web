# Stock Take Scheduler Web - Developer Context

## Project Overview

**Stock Take Scheduler Web** is a modern React application designed to manage and schedule inventory stock takes across multiple retail locations. It integrates directly with Microsoft SharePoint via the Graph API for data storage and management.

Key functionalities include:
*   **Authentication:** User login with role-based access control (Admin, App Owner, User).
*   **Dashboard:** Real-time statistics and overview of stock take operations.
*   **Scheduling:** Intelligent schedule generation with automatic optimization (holidays, clustering).
*   **Shop Management:** Master list of shops with filtering, searching, and editing capabilities.
*   **Map Visualization:** Interactive map using AMap API.
*   **Inventory Management:** Detailed asset tracking.
*   **Token Synchronization:** Automatic synchronization of the Microsoft Graph API token across users via Cloudflare Workers.

## Technology Stack

*   **Frontend Framework:** React 18
*   **Language:** TypeScript 5.7
*   **Build Tool:** Vite 6
*   **UI Library:** Ant Design 5
*   **Styling:** Tailwind CSS 3
*   **State Management:** React Context / Local State (Standard React Hooks)
*   **Backend/Data:** Microsoft Graph API (SharePoint Online)
*   **Token Sync:** Cloudflare Workers + KV Store
*   **Maps:** AMap JS API
*   **Utilities:** `dayjs` (dates), `axios` (requests), `jspdf`/`exceljs` (exports)

## Getting Started

### Prerequisites
*   Node.js 18+
*   npm

### Installation & Running

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Development Server:**
    ```bash
    npm run dev
    ```
    The app runs at `http://localhost:3000`.

3.  **Build for Production:**
    ```bash
    npm run build
    ```
    Artifacts will be in the `dist/` directory.

4.  **Preview Production Build:**
    ```bash
    npm run preview
    ```

## Project Structure

The project follows a flat structure typical of some Vite templates, with source files in the root and organized subdirectories:

*   **`App.tsx`**: Main application component handling routing, global state, and token auto-sync.
*   **`main.tsx`**: Entry point rendering the React app.
*   **`types.ts`**: Global TypeScript interfaces (`Shop`, `User`, `InventoryItem`) and enums.
*   **`components/`**: Reusable UI components and feature-specific views.
    *   `Dashboard.tsx`, `Calendar.tsx`, `ShopList.tsx`, `Generator.tsx`, etc.
    *   `Layout.tsx`: Main application layout wrapper.
    *   `Settings.tsx`: Token management interface (Global Graph Token).
*   **`services/`**: API integration logic.
    *   `SharePointService.ts`: Encapsulates Microsoft Graph API calls.
    *   `TokenService.ts`: Handles fetching and broadcasting tokens to the Cloudflare Worker.
*   **`utils/`**: Helper functions.
    *   `kmeans.ts`: Clustering algorithm for scheduling.
    *   `coordTransform.ts`: Map coordinate conversion.
*   **`constants/`**: Static data and configuration.
    *   `config.ts`: Environment variables, API endpoints, and Cloudflare configuration.
    *   `holidays.ts`: Hardcoded holiday dates for the scheduler.
*   **`design-system/`**: Documentation for UI/UX patterns.

## Development Conventions

*   **State Management:** The app uses a simple state-based routing mechanism (`selectedMenuKey` in `App.tsx`) instead of a library like `react-router-dom`.
*   **Styling:** A mix of Tailwind CSS utility classes and global CSS (`index.css`). Ant Design components are customized via `ConfigProvider`.
*   **API Integration:** Direct calls to Microsoft Graph API. Tokens are managed in `App.tsx` and stored in `localStorage`.
    *   **Note:** The app expects `SharePointService` to handle data fetching.
*   **Token Sync:** Uses `TokenService` to communicate with a Cloudflare Worker defined in `constants/config.ts`.
*   **Type Safety:** Strict TypeScript usage is encouraged. All data entities should be defined in `types.ts`.

## Configuration

The application uses `vite-plugin-pwa` for PWA capabilities and loads configuration from environment variables (via `import.meta.env` or `constants/config.ts`).

**Key Environment Variables:**
*   `VITE_SHAREPOINT_SITE_ID`: SharePoint Site ID.
*   `VITE_SHOP_LIST_ID`: SharePoint List ID for Shops.
*   `VITE_AMAP_API_KEY`: API Key for AMap integration.
*   `VITE_TOKEN_SYNC_URL`: (Optional) URL for the Cloudflare Token Sync Worker. Defaults to the configured worker in `constants/config.ts`.

*Note: The application has fallback values in `constants/config.ts` for development without a `.env` file.*