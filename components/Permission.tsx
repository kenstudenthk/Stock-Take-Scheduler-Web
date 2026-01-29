import React, { useState, useEffect, useMemo } from 'react';
import { Table, Card, Typography, Space, Tag, message, Select, Switch, Input, Row, Col, Avatar, Badge, Tooltip } from 'antd';
import {
  TeamOutlined, SearchOutlined, UserOutlined, MailOutlined,
  CrownOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
  CloseCircleOutlined, CalendarOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { User, UserRole } from '../types';
import SharePointService from '../services/SharePointService';

const { Title, Text } = Typography;
const { Option } = Select;

// Role Permission Descriptions
const rolePermissions = {
  Admin: {
    title: "Administrator",
    description: "Full system access with all privileges",
    can: [
      "Manage all users and permissions",
      "Create, edit, and delete all content",
      "Access and modify system settings",
      "View all reports and analytics",
      "Configure security settings",
      "Manage billing and subscriptions"
    ],
    cannot: [
      "Cannot be deleted if only admin exists",
      "All actions are logged for audit"
    ],
    color: "#ef4444"
  },
  "App Owner": {
    title: "App Owner",
    description: "Application management with elevated permissions",
    can: [
      "Manage application content",
      "Configure app settings",
      "View analytics and reports",
      "Manage user roles (except Admin)",
      "Access app-specific features",
      "Upload and manage media"
    ],
    cannot: [
      "Cannot modify system settings",
      "Cannot create or delete Admin users",
      "Cannot access billing information",
      "Cannot configure security settings"
    ],
    color: "#a855f7"
  },
  User: {
    title: "User",
    description: "Standard access for regular users",
    can: [
      "View assigned content",
      "Edit own profile",
      "Comment on posts",
      "Download available resources",
      "Submit requests"
    ],
    cannot: [
      "Cannot create or delete users",
      "Cannot modify any settings",
      "Cannot access admin areas",
      "Cannot change permissions",
      "Cannot view other users' data",
      "Cannot access analytics"
    ],
    color: "#3b82f6"
  }
};

// Tooltip Component for Role Permissions
const RolePermissionTooltip = ({ role }: { role: UserRole }) => {
  const info = rolePermissions[role];
  
  return (
    <div style={{ maxWidth: '320px', fontFamily: "'Fira Sans', sans-serif" }}>
      <div style={{
        borderLeft: `4px solid ${info.color}`,
        paddingLeft: '12px',
        marginBottom: '12px'
      }}>
        <div style={{ 
          fontWeight: 700, 
          fontSize: '14px', 
          color: '#1e293b',
          marginBottom: '4px'
        }}>
          {info.title}
        </div>
        <div style={{ 
          fontSize: '12px', 
          color: '#64748b',
          lineHeight: '1.4'
        }}>
          {info.description}
        </div>
      </div>
      
      <div style={{ marginBottom: '12px' }}>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#16a34a',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CheckCircleOutlined /> CAN DO
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '11px',
          color: '#475569',
          lineHeight: '1.6'
        }}>
          {info.can.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
      
      <div>
        <div style={{
          fontSize: '11px',
          fontWeight: 700,
          color: '#dc2626',
          marginBottom: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <CloseCircleOutlined /> CANNOT DO
        </div>
        <ul style={{
          margin: 0,
          paddingLeft: '20px',
          fontSize: '11px',
          color: '#475569',
          lineHeight: '1.6'
        }}>
          {info.cannot.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

// Bento Card Component for Statistics (matching ShopList style)
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
        m.id === member.id ? { ...m, UserRole: newRole } : m
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
      width: '28%',
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
              <Tooltip 
                title={<RolePermissionTooltip role={record.UserRole || 'User'} />}
                placement="right"
                overlayClassName="role-tooltip"
              >
                <Tag color={getRoleColor(record.UserRole)} className="m-0 text-[10px] font-bold border-none cursor-help">
                  {getRoleIcon(record.UserRole)} {record.UserRole} <InfoCircleOutlined style={{ fontSize: '10px', marginLeft: '2px' }} />
                </Tag>
              </Tooltip>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Email',
      key: 'email',
      width: '25%',
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
      title: () => (
        <Space>
          Role
          <Tooltip 
            title={
              <div style={{ fontFamily: "'Fira Sans', sans-serif", fontSize: '12px' }}>
                <div style={{ fontWeight: 700, marginBottom: '8px' }}>Role Permissions Guide</div>
                <div style={{ marginBottom: '6px' }}>Hover over any role tag to see detailed permissions.</div>
                <div style={{ color: '#94a3b8', fontSize: '11px' }}>You cannot change your own role.</div>
              </div>
            }
          >
            <InfoCircleOutlined style={{ color: '#94a3b8', cursor: 'help' }} />
          </Tooltip>
        </Space>
      ),
      key: 'role',
      width: '18%',
      render: (record: User) => (
        <Select
          value={record.UserRole}
          onChange={(value) => handleRoleChange(record, value as UserRole)}
          className="w-full role-select"
          loading={updatingId === record.id}
          disabled={updatingId === record.id || record.id === currentUser?.id}
        >
          <Option value="Admin">
            <Tooltip 
              title={<RolePermissionTooltip role="Admin" />}
              placement="right"
              overlayClassName="role-tooltip"
            >
              <Space>
                <CrownOutlined className="text-red-500" /> Admin
                <InfoCircleOutlined style={{ fontSize: '11px', color: '#94a3b8' }} />
              </Space>
            </Tooltip>
          </Option>
          <Option value="App Owner">
            <Tooltip 
              title={<RolePermissionTooltip role="App Owner" />}
              placement="right"
              overlayClassName="role-tooltip"
            >
              <Space>
                <SafetyCertificateOutlined className="text-purple-500" /> App Owner
                <InfoCircleOutlined style={{ fontSize: '11px', color: '#94a3b8' }} />
              </Space>
            </Tooltip>
          </Option>
          <Option value="User">
            <Tooltip 
              title={<RolePermissionTooltip role="User" />}
              placement="right"
              overlayClassName="role-tooltip"
            >
              <Space>
                <UserOutlined className="text-blue-500" /> User
                <InfoCircleOutlined style={{ fontSize: '11px', color: '#94a3b8' }} />
              </Space>
            </Tooltip>
          </Option>
        </Select>
      ),
    },
    {
      title: 'Status',
      key: 'status',
      width: '12%',
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
      title: 'Created',
      key: 'created',
      width: '17%',
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
            Manage user roles and access control
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
          title="Users"
          value={stats.users}
          icon={<UserOutlined />}
          color="#3b82f6"
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
          height: 36px !important;
          font-weight: 600 !important;
        }

        .role-select .ant-select-selection-item {
          line-height: 34px !important;
        }

        /* Custom Tooltip Styles */
        .role-tooltip .ant-tooltip-inner {
          background: white !important;
          color: #1e293b !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          padding: 12px !important;
          border-radius: 8px !important;
          border: 1px solid #e2e8f0 !important;
        }

        .role-tooltip .ant-tooltip-arrow-content {
          background: white !important;
          border: 1px solid #e2e8f0 !important;
        }
      `}</style>
    </div>
  );
};