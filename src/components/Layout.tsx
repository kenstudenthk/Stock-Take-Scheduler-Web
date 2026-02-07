import React from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from './Sidebar';

interface LayoutProps {
  children?: React.ReactNode;
}

/**
 * Main Layout Component
 *
 * This component provides the standard layout structure with:
 * - Fixed sidebar (88px width)
 * - Flexible main content area
 * - Proper spacing and styling
 *
 * Usage:
 * ```tsx
 * <Layout>
 *   <YourPageContent />
 * </Layout>
 * ```
 */
export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex w-full h-screen bg-[var(--bh-bg)]">
      {/* Sidebar */}
      <Sidebar>
        <SidebarTop>
          <SidebarLogo>
            {/* Logo SVG or Icon */}
          </SidebarLogo>
          <SidebarNavItems>
            {/* Navigation items */}
          </SidebarNavItems>
        </SidebarTop>
        <SidebarBottom>
          <SidebarAvatar>
            {/* User avatar */}
          </SidebarAvatar>
        </SidebarBottom>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
};

export default Layout;
