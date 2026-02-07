import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Typography, Space, Tag, message, Select, Switch, Input, Row, Col, Avatar, Badge, Tooltip, Modal, Tabs, Divider, Button } from 'antd';
import {
  TeamOutlined, SearchOutlined, UserOutlined, MailOutlined,
  CrownOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  CloseCircleOutlined, CalendarOutlined, InfoCircleOutlined,
  SettingOutlined, LockOutlined, UnlockOutlined, ReloadOutlined,
  DashboardOutlined, ScheduleOutlined, EnvironmentOutlined,
  ShopOutlined, DatabaseOutlined, AppstoreOutlined, ExportOutlined,
  EditOutlined, DeleteOutlined, PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, UserRole, UserPermissions, DEFAULT_PERMISSIONS, getEffectivePermissions } from '../types';
import SharePointService from '../services/SharePointService';

const { Title, Text } = Typography;
const { Option } = Select;

// Permission labels and icons for UI
const PAGE_PERMISSIONS = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardOutlined />, description: 'View dashboard statistics and shop status' },
  { key: 'calendar', label: 'Calendar', icon: <CalendarOutlined />, description: 'View and manage schedule calendar' },
  { key: 'generator', label: 'Generator', icon: <AppstoreOutlined />, description: 'Generate schedules with K-means clustering' },
  { key: 'locations', label: 'Locations', icon: <EnvironmentOutlined />, description: 'View shop locations on map' },
  { key: 'shopList', label: 'Shop List', icon: <ShopOutlined />, description: 'View and manage shop master data' },
  { key: 'inventory', label: 'Inventory', icon: <DatabaseOutlined />, description: 'Manage asset inventory' },
  { key: 'permission', label: 'Permissions', icon: <LockOutlined />, description: 'Manage user permissions' },
  { key: 'settings', label: 'Settings', icon: <SettingOutlined />, description: 'Access system settings' },
] as const;

const ACTION_PERMISSIONS = [
  { key: 'reschedule_shop', label: 'Reschedule Shop', icon: <ScheduleOutlined />, description: 'Change shop scheduled dates' },
  { key: 'close_shop', label: 'Close Shop', icon: <CloseCircleOutlined />, description: 'Mark shops as closed' },
  { key: 'edit_shop', label: 'Edit Shop', icon: <EditOutlined />, description: 'Modify shop details' },
  { key: 'add_shop', label: 'Add Shop', icon: <PlusOutlined />, description: 'Create new shops' },
  { key: 'delete_shop', label: 'Delete Shop', icon: <DeleteOutlined />, description: 'Remove shops from system' },
  { key: 'generate_schedule', label: 'Generate Schedule', icon: <AppstoreOutlined />, description: 'Run schedule generation' },
  { key: 'reset_schedule', label: 'Reset Schedule', icon: <ReloadOutlined />, description: 'Clear and reset schedules' },
  { key: 'export_data', label: 'Export Data', icon: <ExportOutlined />, description: 'Export to Excel/PDF' },
  { key: 'manage_inventory', label: 'Manage Inventory', icon: <DatabaseOutlined />, description: 'Add/edit inventory items' },
  { key: 'manage_users', label: 'Manage Users', icon: <TeamOutlined />, description: 'Modify user accounts and roles' },
] as const;

// Bento Card Component for Statistics
const BentoStatCard = ({
  title, value, subtitle, icon, color, size = 'normal'
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  size?: 'normal' | 'large';
}) => (
  <div className={`bento-stat-card bento-${size}`} style={{ '--accent-color': color } as React.CSSProperties}>
    <div className="bento-stat-icon">{icon}</div>
    <div className="bento-stat-content">
      <span className="bento-stat-value">{value}</span>
      <span className="bento-stat-title">{title}</span>
      {subtitle && <span className="bento-stat-subtitle">{subtitle}</span>}
    </div>
  </div>
);

// Permission Toggle Component
const PermissionToggle = ({
  checked,
  onChange,
  disabled,
  loading,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}) => (
  <Switch
    checked={checked}
    onChange={onChange}
    disabled={disabled}
    loading={loading}
    size="small"
    checkedChildren={<UnlockOutlined />}
    unCheckedChildren={<LockOutlined />}
  />
);

interface PermissionProps {
  graphToken: string;
  currentUser: User | null;
}

export const Permission: React.FC<PermissionProps> = ({ graphToken, currentUser }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<User | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<UserPermissions | null>(null);
  const [savingPermissions, setSavingPermissions] = useState(false);

  const sharePointService = useMemo(() => new SharePointService(graphToken), [graphToken]);

  const fetchMembers = async () => {
    setLoading(true);
    const data = await sharePointService.getAllMembers();
    setMembers(data);
    setLoading(false);
  };

  useEffect(() => {
    if (graphToken) {
      fetchMembers();
    }
  }, [graphToken]);

  // Statistics
  const stats = useMemo(() => {
    const active = members.filter(m => m.AccountStatus === 'Active');
    return {
      total: members.length,
      active: active.length,
      admins: members.filter(m => m.UserRole === 'Admin').length,
      appOwners: members.filter(m => m.UserRole === 'App Owner').length,
      users: members.filter(m => m.UserRole === 'User').length,
      customPerms: members.filter(m => m.Permissions !== undefined).length,
    };
  }, [members]);

  // Filtered data
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchText =
        (m.Name || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (m.UserEmail || '').toLowerCase().includes(searchText.toLowerCase()) ||
        (m.AliasEmail || '').toLowerCase().includes(searchText.toLowerCase());
      const matchRole = roleFilter === 'All' || m.UserRole === roleFilter;
      return matchText && matchRole;
    });
  }, [members, searchText, roleFilter]);

  const handleRoleChange = async (member: User, newRole: UserRole) => {
    if (!member.id) return;
    setUpdatingId(member.id);
    const success = await sharePointService.updateMemberRole(member.id, newRole);
    if (success) {
      message.success(`${member.Name}'s role updated to ${newRole}`);
      setMembers(prev => prev.map(m =>
        m.id === member.id ? { ...m, UserRole: newRole, Permissions: undefined } : m
      ));
    } else {
      message.error('Failed to update role');
    }
    setUpdatingId(null);
  };

  const handleStatusChange = async (member: User, checked: boolean) => {
    if (!member.id) return;
    const newStatus = checked ? 'Active' : 'Inactive';
    setUpdatingId(member.id);
    const success = await sharePointService.updateMemberStatus(member.id, newStatus);
    if (success) {
      message.success(`${member.Name}'s status updated to ${newStatus}`);
      setMembers(prev => prev.map(m =>
        m.id === member.id ? { ...m, AccountStatus: newStatus } : m
      ));
    } else {
      message.error('Failed to update status');
    }
    setUpdatingId(null);
  };

  const openPermissionEditor = (member: User) => {
    setEditingMember(member);
    // Get effective permissions (custom or role-based defaults)
    const effectivePerms = getEffectivePermissions(member);
    setEditingPermissions(JSON.parse(JSON.stringify(effectivePerms))); // Deep clone
    setEditModalVisible(true);
  };

  const handlePagePermissionChange = (page: keyof UserPermissions['pages'], value: boolean) => {
    if (!editingPermissions) return;
    setEditingPermissions({
      ...editingPermissions,
      pages: { ...editingPermissions.pages, [page]: value }
    });
  };

  const handleActionPermissionChange = (action: keyof UserPermissions['actions'], value: boolean) => {
    if (!editingPermissions) return;
    setEditingPermissions({
      ...editingPermissions,
      actions: { ...editingPermissions.actions, [action]: value }
    });
  };

  const handleSavePermissions = async () => {
    if (!editingMember?.id || !editingPermissions) return;
    setSavingPermissions(true);
    const success = await sharePointService.updateMemberPermissions(editingMember.id, editingPermissions);
    if (success) {
      message.success(`Permissions saved for ${editingMember.Name}`);
      setMembers(prev => prev.map(m =>
        m.id === editingMember.id ? { ...m, Permissions: editingPermissions } : m
      ));
      setEditModalVisible(false);
    } else {
      message.error('Failed to save permissions');
    }
    setSavingPermissions(false);
  };

  const handleResetToDefaults = () => {
    if (!editingMember) return;
    const role = editingMember.UserRole || 'User';
    setEditingPermissions(JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS[role])));
    message.info(`Reset to ${role} defaults`);
  };

  const getRoleColor = (role: UserRole | undefined) => {
    switch (role) {
      case 'Admin': return 'red';
      case 'App Owner': return 'purple';
      case 'User': return 'blue';
      default: return 'default';
    }
  };

  const getRoleIcon = (role: UserRole | undefined) => {
    switch (role) {
      case 'Admin': return <CrownOutlined />;
      case 'App Owner': return <SafetyCertificateOutlined />;
      default: return <UserOutlined />;
    }
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      width: '25%',
      render: (record: User) => (
        <Space size={12}>
          <Avatar
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${record.Name}`}
            size={42}
            className="border-2 border-slate-100"
          />
          <div className="flex flex-col">
            <Text strong className="text-[14px] text-slate-800">{record.Name}</Text>
            <div className="flex items-center gap-1">
              <Tag color={getRoleColor(record.UserRole)} className="m-0 text-[10px] font-bold border-none">
                {getRoleIcon(record.UserRole)} {record.UserRole}
              </Tag>
              {record.Permissions && (
                <Tag color="cyan" className="m-0 text-[10px] border-none">
                  <SettingOutlined /> Custom
                </Tag>
              )}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      width: '22%',
      render: (record: User) => (
        <div className="flex flex-col gap-1">
          <Text className="text-[12px] text-slate-700">
            <MailOutlined className="mr-1 text-teal-500" /> {record.UserEmail || '--'}
          </Text>
          <Text type="secondary" className="text-[11px] italic">
            {record.AliasEmail || '--'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Role',
      key: 'role',
      width: '15%',
      render: (record: User) => (
        <Select
          value={record.UserRole}
          onChange={(value) => handleRoleChange(record, value as UserRole)}
          className="w-full role-select"
          loading={updatingId === record.id}
          disabled={updatingId === record.id || record.id === currentUser?.id}
          size="small"
        >
          <Option value="Admin">
            <Space><CrownOutlined className="text-red-500" /> Admin</Space>
          </Option>
          <Option value="App Owner">
            <Space><SafetyCertificateOutlined className="text-purple-500" /> App Owner</Space>
          </Option>
          <Option value="User">
            <Space><UserOutlined className="text-blue-500" /> User</Space>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '10%',
      align: 'center' as const,
      render: (record: User) => (
        <div className="flex items-center justify-center gap-2">
          <Switch
            checked={record.AccountStatus === 'Active'}
            onChange={(checked) => handleStatusChange(record, checked)}
            loading={updatingId === record.id}
            disabled={updatingId === record.id || record.id === currentUser?.id}
            size="small"
          />
          <Badge
            status={record.AccountStatus === 'Active' ? 'success' : 'error'}
            text={<Text className="text-[11px]">{record.AccountStatus}</Text>}
          />
        </div>
      ),
    },
    {
      title: 'Permissions',
      key: 'permissions',
      width: '13%',
      align: 'center' as const,
      render: (record: User) => (
        <Button
          type="primary"
          size="small"
          icon={<SettingOutlined />}
          onClick={() => openPermissionEditor(record)}
          disabled={record.id === currentUser?.id}
          className="permission-edit-btn"
        >
          Configure
        </Button>
      ),
    },
    {
      title: 'Created',
      key: 'created',
      width: '15%',
      render: (record: User) => (
        <Text className="text-[11px] text-slate-500">
          <CalendarOutlined className="mr-1" />
          {record.AccountCreateDate
            ? dayjs(record.AccountCreateDate).format('DD MMM YYYY')
            : '--'}
        </Text>
      ),
    },
  ];

  return (
    <div className="permission-container">
      {/* Header */}
      <div className="permission-header">
        <div>
          <Title level={2} className="m-0" style={{ fontFamily: "'Fira Code', monospace", color: 'var(--color-text)' }}>
            Permission Management
          </Title>
          <Text style={{ fontFamily: "'Fira Sans', sans-serif", color: '#64748b' }}>
            Manage user roles and granular access control
          </Text>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="bento-stats-grid">
        <BentoStatCard
          title="Total Users"
          value={stats.total}
          subtitle="Registered accounts"
          icon={<TeamOutlined />}
          color="#0d9488"
          size="large"
        />
        <BentoStatCard
          title="Active"
          value={stats.active}
          icon={<CheckCircleOutlined />}
          color="#22c55e"
        />
        <BentoStatCard
          title="Admins"
          value={stats.admins}
          icon={<CrownOutlined />}
          color="#ef4444"
        />
        <BentoStatCard
          title="App Owners"
          value={stats.appOwners}
          icon={<SafetyCertificateOutlined />}
          color="#a855f7"
        />
        <BentoStatCard
          title="Custom Perms"
          value={stats.customPerms}
          icon={<SettingOutlined />}
          color="#f59e0b"
        />
      </div>

      {/* Filters */}
      <div className="permission-filters">
        <div className="flex items-center gap-3">
          <div className="permission-filters-icon-wrapper">
            <SearchOutlined />
          </div>
          <div>
            <div className="text-[14px] font-bold text-slate-800" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Filter Users
            </div>
            <div className="text-[11px] text-slate-500" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
              Search and filter by role
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="input-group">
            <input
              required
              type="text"
              autoComplete="off"
              className="custom-search-input"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <label className="user-label">Search by name or email...</label>
          </div>
          <Select
            value={roleFilter}
            onChange={setRoleFilter}
            className="w-40"
            placeholder="Filter by Role"
          >
            <Option value="All">All Roles</Option>
            <Option value="Admin">
              <Space><CrownOutlined className="text-red-500" /> Admin</Space>
            </Option>
            <Option value="App Owner">
              <Space><SafetyCertificateOutlined className="text-purple-500" /> App Owner</Space>
            </Option>
            <Option value="User">
              <Space><UserOutlined className="text-blue-500" /> User</Space>
            </Option>
          </Select>
        </div>
      </div>

      {/* Table */}
      <Card className="rounded-[16px] border border-slate-200 shadow-md overflow-hidden bg-white mt-6">
        <div className="permission-table">
          <Table
            columns={columns}
            dataSource={filteredMembers}
            rowKey="id"
            loading={loading}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'],
              showTotal: (total) => `Total ${total} users`
            }}
          />
        </div>
      </Card>

      {/* Permission Editor Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3">
            <Avatar
              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${editingMember?.Name}`}
              size={40}
            />
            <div>
              <div className="font-bold text-lg">{editingMember?.Name}</div>
              <div className="text-sm text-gray-500">Configure Permissions</div>
            </div>
          </div>
        }
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        width={700}
        footer={[
          <Button key="reset" onClick={handleResetToDefaults} icon={<ReloadOutlined />}>
            Reset to Defaults
          </Button>,
          <Button key="cancel" onClick={() => setEditModalVisible(false)}>
            Cancel
          </Button>,
          <Button
            key="save"
            type="primary"
            onClick={handleSavePermissions}
            loading={savingPermissions}
            icon={<CheckCircleOutlined />}
          >
            Save Permissions
          </Button>,
        ]}
      >
        <Tabs
          defaultActiveKey="pages"
          items={[
            {
              key: 'pages',
              label: (
                <span>
                  <AppstoreOutlined /> Page Access
                </span>
              ),
              children: (
                <div className="permission-grid">
                  {PAGE_PERMISSIONS.map(perm => (
                    <div key={perm.key} className="permission-item">
                      <div className="permission-item-info">
                        <div className="permission-item-icon">{perm.icon}</div>
                        <div>
                          <div className="permission-item-label">{perm.label}</div>
                          <div className="permission-item-desc">{perm.description}</div>
                        </div>
                      </div>
                      <PermissionToggle
                        checked={editingPermissions?.pages[perm.key as keyof UserPermissions['pages']] ?? false}
                        onChange={(v) => handlePagePermissionChange(perm.key as keyof UserPermissions['pages'], v)}
                        disabled={editingMember?.UserRole === 'Admin'}
                      />
                    </div>
                  ))}
                </div>
              ),
            },
            {
              key: 'actions',
              label: (
                <span>
                  <SettingOutlined /> Actions
                </span>
              ),
              children: (
                <div className="permission-grid">
                  {ACTION_PERMISSIONS.map(perm => (
                    <div key={perm.key} className="permission-item">
                      <div className="permission-item-info">
                        <div className="permission-item-icon">{perm.icon}</div>
                        <div>
                          <div className="permission-item-label">{perm.label}</div>
                          <div className="permission-item-desc">{perm.description}</div>
                        </div>
                      </div>
                      <PermissionToggle
                        checked={editingPermissions?.actions[perm.key as keyof UserPermissions['actions']] ?? false}
                        onChange={(v) => handleActionPermissionChange(perm.key as keyof UserPermissions['actions'], v)}
                        disabled={editingMember?.UserRole === 'Admin'}
                      />
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />

        {editingMember?.UserRole === 'Admin' && (
          <div className="admin-notice">
            <InfoCircleOutlined /> Admins have full access to all features. Permissions cannot be modified.
          </div>
        )}
      </Modal>

      <style>{`
        .permission-container {
          display: flex;
          flex-direction: column;
          gap: 24px;
          padding-bottom: 40px;
          max-width: 1400px;
          margin: 0 auto;
          font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .permission-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
          margin-bottom: 16px;
        }

        .bento-stats-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 16px;
        }

        .bento-stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: all 200ms ease;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          grid-column: span 2;
        }

        .bento-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--accent-color);
          opacity: 0;
          transition: opacity 200ms ease;
        }

        .bento-stat-card:hover {
          transform: scale(1.02);
          box-shadow: 0 10px 15px rgba(0,0,0,0.1);
        }

        .bento-stat-card:hover::before {
          opacity: 1;
        }

        .bento-large {
          grid-column: span 4;
        }

        .bento-stat-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: linear-gradient(135deg, var(--accent-color) 0%, var(--accent-color) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
          transition: transform 200ms ease;
        }

        .bento-stat-card:hover .bento-stat-icon {
          transform: scale(1.1);
        }

        .bento-stat-content {
          display: flex;
          flex-direction: column;
        }

        .bento-stat-value {
          font-family: 'Fira Code', monospace;
          font-size: 28px;
          font-weight: 700;
          color: #1E3A8A;
          line-height: 1;
        }

        .bento-stat-title {
          font-family: 'Fira Sans', sans-serif;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }

        .bento-stat-subtitle {
          font-family: 'Fira Sans', sans-serif;
          font-size: 11px;
          color: #94a3b8;
          margin-top: 2px;
        }

        .permission-filters {
          background: white;
          border-radius: 16px;
          padding: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .permission-filters-icon-wrapper {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%);
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          color: white;
        }

        .input-group {
          position: relative;
        }

        .custom-search-input {
          font-family: 'Fira Sans', sans-serif;
          padding: 12px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          width: 280px;
          transition: all 200ms ease;
          background: white;
        }

        .custom-search-input:focus {
          border-color: #1E40AF;
          outline: none;
          box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
        }

        .custom-search-input:focus + .user-label,
        .custom-search-input:valid + .user-label {
          top: -8px;
          font-size: 11px;
          color: #1E40AF;
          background: white;
          padding: 0 4px;
        }

        .user-label {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          font-family: 'Fira Sans', sans-serif;
          font-size: 14px;
          color: #94a3b8;
          pointer-events: none;
          transition: all 200ms ease;
        }

        .permission-table .ant-table {
          font-family: 'Fira Sans', sans-serif !important;
          border-radius: 16px;
          overflow: hidden;
        }

        .permission-table .ant-table-thead > tr > th {
          background: #F8FAFC !important;
          font-family: 'Fira Sans', sans-serif !important;
          font-weight: 700 !important;
          color: #1E3A8A !important;
          border-bottom: 2px solid #e2e8f0 !important;
          padding: 12px 16px !important;
          font-size: 12px !important;
          letter-spacing: 0.5px;
        }

        .permission-table .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          vertical-align: middle !important;
        }

        .permission-table .ant-table-tbody > tr:hover > td {
          background: #eff6ff !important;
        }

        .role-select .ant-select-selector {
          border-radius: 8px !important;
          height: 32px !important;
          font-weight: 600 !important;
        }

        .permission-edit-btn {
          background: linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%) !important;
          border: none !important;
          font-weight: 600 !important;
          font-size: 11px !important;
        }

        .permission-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px 0;
        }

        .permission-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          transition: all 150ms ease;
        }

        .permission-item:hover {
          background: #eff6ff;
          border-color: #3B82F6;
        }

        .permission-item-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .permission-item-icon {
          width: 36px;
          height: 36px;
          background: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #3B82F6;
          border: 1px solid #e2e8f0;
        }

        .permission-item-label {
          font-weight: 600;
          font-size: 13px;
          color: #1e293b;
        }

        .permission-item-desc {
          font-size: 11px;
          color: #64748b;
          max-width: 200px;
        }

        .admin-notice {
          margin-top: 16px;
          padding: 12px 16px;
          background: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 8px;
          color: #92400e;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        @media (max-width: 768px) {
          .permission-grid {
            grid-template-columns: 1fr;
          }
          .bento-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .bento-stat-card {
            grid-column: span 1;
          }
          .bento-large {
            grid-column: span 2;
          }
        }
      `}</style>
    </div>
  );
};
