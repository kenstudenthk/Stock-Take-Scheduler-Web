import React from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft } from '../PageHeader';

export const SettingsPage: React.FC = () => {
  return (
    <div className="flex w-full h-screen bg-[var(--bh-bg)]">
      {/* Sidebar */}
      <Sidebar>
        <SidebarTop>
          <SidebarLogo>
            <div className="w-full h-full rounded-full bg-[var(--bh-red)]" />
          </SidebarLogo>
          <SidebarNavItems>
            {/* Nav items */}
          </SidebarNavItems>
        </SidebarTop>
        <SidebarBottom>
          <SidebarAvatar>
            <div className="w-full h-full rounded-[20px] bg-[var(--bh-blue)]" />
          </SidebarAvatar>
        </SidebarBottom>
      </Sidebar>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Page Header */}
        <div className="px-12 pt-8">
          <PageHeader>
            <HeaderLeft>
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Settings</h1>
            </HeaderLeft>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12">
          <div className="grid grid-cols-[1fr_400px] gap-8 h-full">
            {/* Left Column */}
            <div className="space-y-8 flex flex-col">
              {/* Settings sections */}
              <div className="border-2 border-[var(--bh-black)] p-6 rounded-lg bg-white">
                <h3 className="font-bold text-lg text-[var(--bh-black)] mb-4">General Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Setting 1</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--bh-border)] rounded"
                      placeholder="Enter value"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--bh-black)] mb-2">Setting 2</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-[var(--bh-border)] rounded"
                      placeholder="Enter value"
                    />
                  </div>
                </div>
              </div>

              <div className="border-2 border-[var(--bh-black)] p-6 rounded-lg bg-white">
                <h3 className="font-bold text-lg text-[var(--bh-black)] mb-4">Preferences</h3>
                <div className="space-y-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="w-4 h-4" />
                    <span className="text-[var(--bh-black)]">Preference 1</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4" />
                    <span className="text-[var(--bh-black)]">Preference 2</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              <div className="border-2 border-[var(--bh-black)] p-6 rounded-lg bg-white">
                <h3 className="font-bold text-lg text-[var(--bh-black)] mb-4">Account</h3>
                <div className="space-y-4">
                  <button className="w-full px-4 py-2 bg-[var(--bh-black)] text-white rounded font-medium hover:bg-opacity-90">
                    Change Password
                  </button>
                  <button className="w-full px-4 py-2 border-2 border-[var(--bh-black)] text-[var(--bh-black)] rounded font-medium hover:bg-[var(--bh-bg)]">
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
