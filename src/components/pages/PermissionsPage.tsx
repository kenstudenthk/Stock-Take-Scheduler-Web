import React from 'react';
import { Sidebar, SidebarTop, SidebarBottom, SidebarLogo, SidebarNavItems, SidebarAvatar } from '../Sidebar';
import { PageHeader, HeaderLeft, HeaderRight } from '../PageHeader';

interface PermissionCheckboxProps {
  label: string;
}

const PermissionCheckbox: React.FC<PermissionCheckboxProps> = ({ label }) => {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" className="w-4 h-4" />
      <span className="text-sm text-[var(--bh-black)]">{label}</span>
    </label>
  );
};

interface RoleCardProps {
  title: string;
  permissions: string[];
}

const RoleCard: React.FC<RoleCardProps> = ({ title, permissions }) => {
  return (
    <div className="border-2 border-[var(--bh-black)] p-6 rounded-lg bg-white">
      <h3 className="font-bold text-lg text-[var(--bh-black)] mb-4">{title}</h3>
      <div className="space-y-3">
        {permissions.map((perm) => (
          <PermissionCheckbox key={perm} label={perm} />
        ))}
      </div>
    </div>
  );
};

export const PermissionsPage: React.FC = () => {
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
              <h1 className="text-2xl font-bold text-[var(--bh-black)]">Permissions</h1>
            </HeaderLeft>
            <HeaderRight>
              {/* Header actions */}
            </HeaderRight>
          </PageHeader>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-12 flex flex-col gap-12">
          {/* Roles Row */}
          <div className="grid grid-cols-3 gap-6">
            <RoleCard
              title="Admin"
              permissions={[
                'View all shops',
                'Create schedules',
                'Manage users',
                'System settings',
                'View reports',
              ]}
            />
            <RoleCard
              title="Manager"
              permissions={[
                'View assigned shops',
                'Create schedules',
                'View reports',
                'Update schedules',
              ]}
            />
            <RoleCard
              title="Viewer"
              permissions={['View assigned shops', 'View reports']}
            />
          </div>

          {/* User Permissions Table */}
          <div className="space-y-6 flex-1">
            <h2 className="text-4xl font-bold tracking-wide text-[var(--bh-black)]">USER PERMISSIONS</h2>

            <div className="border-2 border-[var(--bh-black)] rounded-lg overflow-hidden flex flex-col bg-white h-full">
              {/* Table Header */}
              <div className="flex bg-[var(--bh-black)] text-white h-14 font-bold px-6">
                {['User', 'Email', 'Role', 'Status', 'Action'].map((col) => (
                  <div key={col} className="flex-1 flex items-center">
                    {col}
                  </div>
                ))}
              </div>

              {/* Table Rows */}
              <div className="flex-1 overflow-y-auto divide-y-2 divide-[var(--bh-black)]">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center h-16 px-6 bg-white hover:bg-[var(--bh-bg)]">
                    <div className="flex-1 text-[var(--bh-black)]">User {i}</div>
                    <div className="flex-1 text-[var(--bh-gray-700)]">user{i}@example.com</div>
                    <div className="flex-1">
                      <select className="px-2 py-1 border border-[var(--bh-border)] rounded text-sm">
                        <option>Admin</option>
                        <option>Manager</option>
                        <option>Viewer</option>
                      </select>
                    </div>
                    <div className="flex-1 text-[var(--bh-black)]">Active</div>
                    <div className="flex-1">
                      <button className="px-3 py-1 text-sm bg-[var(--bh-blue)] text-white rounded hover:opacity-90">
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PermissionsPage;
