// ShopList.tsx - Bento Grid Design

import React, { useState, useMemo, memo } from 'react';
import { Table, Input, Card, Typography, Space, Tag, DatePicker, message, Modal, Select, Row, Col, Badge, Button, Popover, Collapse } from 'antd';
import {
  SearchOutlined, EnvironmentOutlined, ExclamationCircleOutlined, FilterOutlined,
  PhoneOutlined, UserOutlined, PlusOutlined, ClearOutlined, ShopOutlined,
  CheckCircleOutlined, ClockCircleOutlined, CalendarOutlined, AppstoreOutlined,
  BankOutlined, CompassOutlined, TeamOutlined, ThunderboltOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View, User, hasPermission } from '../types';
import { ShopFormModal } from './ShopFormModal';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { RangePicker } = DatePicker;

// Bento Card Component for Statistics
const BentoStatCard = memo(({
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
));

// Bento Filter Card Component
const BentoFilterCard = memo(({
  label, value, options, onChange, icon
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  icon: React.ReactNode;
}) => (
  <div className="bento-filter-card">
    <div className="bento-filter-header">
      <span className="bento-filter-icon">{icon}</span>
      <span className="bento-filter-label">{label}</span>
    </div>
    <Select
      showSearch
      className="bento-filter-select"
      value={value}
      onChange={onChange}
      popupClassName="bento-filter-dropdown"
    >
      {options.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
    </Select>
  </div>
));

export const ShopList: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void, currentUser: User | null }> = ({ shops, graphToken, onRefresh, currentUser }) => {
  // ... 你的狀態設定 (searchText, filters 等) ...
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[string | null, string | null]>([null, null]);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    brand: 'All', district: 'All', region: 'All', area: 'All', bu: 'All',
    callStatus: 'All', mtr: 'All', group: 'All', status: 'All'
  });

  // 3. ✅ 級聯過濾邏輯 (你寫得很好)
  const options = useMemo(() => {
    const getAvailableValues = (key: keyof Shop, filterKey: string) => {
      const filteredForThisField = shops.filter(s => {
        return Object.entries(filters).every(([k, v]) => {
          if (k === filterKey || v === 'All') return true;
          if (k === 'bu') return (s as any).businessUnit === v;
          if (k === 'mtr') return (v === 'Yes' ? s.is_mtr : !s.is_mtr);
          if (k === 'group') return s.groupId?.toString() === v;
          if (k === 'status') return s.status?.toLowerCase() === v.toLowerCase();
          return (s as any)[k] === v;
        });
      });
      const uniqueValues = Array.from(new Set(filteredForThisField.map(s => 
        (s as any)[key === 'bu' ? 'businessUnit' : key]).filter(Boolean))).sort();
      return ['All', ...uniqueValues];
    };

    return {
      regions: getAvailableValues('region', 'region'),
      districts: getAvailableValues('district', 'district'),
      areas: getAvailableValues('area', 'area'),
      brands: getAvailableValues('brand', 'brand'),
      bus: getAvailableValues('businessUnit' as any, 'bu'),
      statuses: getAvailableValues('status', 'status'),
      callStatuses: ['All', 'Called', 'No One Pick Up', 'No Contact / Wrong No.'],
      mtrs: ['All', 'Yes', 'No'],
      groups: ['All', '1', '2', '3']
    };
  }, [shops, filters]);

  // --- ✅ 增強：核心過濾邏輯 (整合原有搜尋與所有新過濾器) ---
  const filteredData = useMemo(() => {
    return shops.filter(s => {
      // 1. 增強搜尋：搜尋名稱、ID 和地址
      const searchLower = searchText.toLowerCase().trim();
      const matchText = !searchLower || 
                        (s.name || '').toLowerCase().includes(searchLower) || 
                        (s.id || '').toLowerCase().includes(searchLower) ||
                        (s.address || '').toLowerCase().includes(searchLower);
      
      // 2. 日期範圍過濾
      let matchDate = true;
      if (dateRange[0] || dateRange[1]) {
        const scheduledDate = dayjs(s.scheduledDate);
        if (dateRange[0] && dateRange[1]) {
          matchDate = scheduledDate.isSameOrAfter(dayjs(dateRange[0]), 'day') && 
                     scheduledDate.isSameOrBefore(dayjs(dateRange[1]), 'day');
        } else if (dateRange[0]) {
          matchDate = scheduledDate.isSameOrAfter(dayjs(dateRange[0]), 'day');
        } else if (dateRange[1]) {
          matchDate = scheduledDate.isSameOrBefore(dayjs(dateRange[1]), 'day');
        }
      }
      
      // 3. 新增各項分類過濾
      const matchBrand = filters.brand === 'All' || s.brand === filters.brand;
      const matchRegion = filters.region === 'All' || s.region === filters.region;
      const matchDistrict = filters.district === 'All' || s.district === filters.district;
      const matchArea = filters.area === 'All' || s.area === filters.area;
      const matchBU = filters.bu === 'All' || (s as any).businessUnit === filters.bu;
      const matchCall = filters.callStatus === 'All' || (s as any).callStatus === filters.callStatus;
      const matchMTR = filters.mtr === 'All' || (filters.mtr === 'Yes' ? s.is_mtr : !s.is_mtr);
      const matchGroup = filters.group === 'All' || s.groupId?.toString() === filters.group;
      const matchStatus = filters.status === 'All' || s.status?.toLowerCase() === filters.status.toLowerCase();

      return matchText && matchDate && matchBrand && matchRegion && matchDistrict && 
             matchArea && matchBU && matchCall && matchMTR && matchGroup && matchStatus;
    });
  }, [shops, searchText, dateRange, filters]);

  const resetAllFilters = () => {
    setSearchText('');
    setDateRange([null, null]);
    setFilters({
      brand: 'All', district: 'All', region: 'All', area: 'All',
      bu: 'All', callStatus: 'All', mtr: 'All', group: 'All', status: 'All'
    });
    message.info('All filters reset');
  };


  // ✅ 處理狀態、備註並自動設定日期為今天
  const handleCallUpdate = async (shop: Shop, field: 'status' | 'remark', value: string) => {
    // 如果值沒有變動，則不觸發更新
    if (field === 'status' && value === shop.callStatus) return;
    if (field === 'remark' && value === shop.callRemark) return;

    setUpdatingId(shop.id);
    const today = dayjs().format('YYYY-MM-DD');
    
    const updatePayload: any = {
      [SP_FIELDS.CALL_DATE]: today 
    };

    if (field === 'status') updatePayload[SP_FIELDS.CALL_STATUS] = value;
    if (field === 'remark') updatePayload[SP_FIELDS.CALL_REMARK] = value;

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${graphToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        message.success(`Call info for ${shop.name} updated.`);
        onRefresh();
      } else {
        message.error("Failed to update SharePoint.");
      }
    } catch (err) {
      message.error("Network error during update.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCloseAction = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to set ${shop.name} to CLOSED?`,
      onOk: async () => {
        try {
          const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 
              'Authorization': `Bearer ${graphToken}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ [SP_FIELDS.STATUS]: 'CLOSED' })
          });
          if (res.ok) { 
            message.success("Shop status updated successfully."); 
            onRefresh(); 
          }
        } catch (err) { 
          message.error("Update failed"); 
        }
      },
    });
  };

  // Statistics calculations
  const stats = useMemo(() => {
    const active = shops.filter(s => s.masterStatus !== 'Closed');
    return {
      total: active.length,
      planned: active.filter(s => s.status === 'Planned').length,
      unplanned: active.filter(s => s.status === 'Unplanned').length,
      done: active.filter(s => s.status === 'Done').length,
      mtr: active.filter(s => s.is_mtr).length,
      regions: new Set(active.map(s => s.region)).size,
    };
  }, [shops]);

  // Bento Statistics Grid
  const renderBentoStats = () => (
    <div className="bento-stats-grid">
      <BentoStatCard
        title="Total Shops"
        value={stats.total}
        subtitle="Active locations"
        icon={<ShopOutlined />}
        color="#0d9488"
        size="large"
      />
      <BentoStatCard
        title="Planned"
        value={stats.planned}
        icon={<CalendarOutlined />}
        color="#6366f1"
      />
      <BentoStatCard
        title="Unplanned"
        value={stats.unplanned}
        icon={<ClockCircleOutlined />}
        color="#f59e0b"
      />
      <BentoStatCard
        title="Completed"
        value={stats.done}
        icon={<CheckCircleOutlined />}
        color="#22c55e"
      />
      <BentoStatCard
        title="MTR Shops"
        value={stats.mtr}
        icon={<ThunderboltOutlined />}
        color="#8b5cf6"
      />
      <BentoStatCard
        title="Regions"
        value={stats.regions}
        icon={<CompassOutlined />}
        color="#ec4899"
      />
    </div>
  );

  // Bento Filter Grid with Accordion
  const renderBentoFilters = () => {
    const filterContent = (
      <div className="bento-filters-grid">
        <BentoFilterCard
          label="Region"
          value={filters.region}
          options={options.regions}
          onChange={v => setFilters({...filters, region: v})}
          icon={<CompassOutlined />}
        />
        <BentoFilterCard
          label="District"
          value={filters.district}
          options={options.districts}
          onChange={v => setFilters({...filters, district: v})}
          icon={<EnvironmentOutlined />}
        />
        <BentoFilterCard
          label="Area"
          value={filters.area}
          options={options.areas}
          onChange={v => setFilters({...filters, area: v})}
          icon={<AppstoreOutlined />}
        />
        <BentoFilterCard
          label="Brand"
          value={filters.brand}
          options={options.brands}
          onChange={v => setFilters({...filters, brand: v})}
          icon={<BankOutlined />}
        />
        <BentoFilterCard
          label="Business Unit"
          value={filters.bu}
          options={options.bus}
          onChange={v => setFilters({...filters, bu: v})}
          icon={<TeamOutlined />}
        />
        <BentoFilterCard
          label="Status"
          value={filters.status}
          options={options.statuses}
          onChange={v => setFilters({...filters, status: v})}
          icon={<CheckCircleOutlined />}
        />
        <BentoFilterCard
          label="Call Status"
          value={filters.callStatus}
          options={options.callStatuses}
          onChange={v => setFilters({...filters, callStatus: v})}
          icon={<PhoneOutlined />}
        />
        <BentoFilterCard
          label="MTR Shop"
          value={filters.mtr}
          options={options.mtrs}
          onChange={v => setFilters({...filters, mtr: v})}
          icon={<ThunderboltOutlined />}
        />
        <BentoFilterCard
          label="Group"
          value={filters.group}
          options={options.groups.map(g => g === 'All' ? 'All' : `Group ${String.fromCharCode(64 + parseInt(g))}`)}
          onChange={v => {
            const val = v.startsWith('Group') ? v.split(' ')[1].charCodeAt(0) - 64 + '' : 'All';
            setFilters({...filters, group: val});
          }}
          icon={<AppstoreOutlined />}
        />
      </div>
    );

    return (
      <Collapse
        defaultActiveKey={['1']}
        className="custom-accordion"
        items={[
          {
            key: '1',
            label: (
              <div className="flex items-center justify-between w-full pr-4">
                <div className="flex items-center gap-3">
                  <div className="bento-filters-icon-wrapper">
                    <FilterOutlined />
                  </div>
                  <div>
                    <Text strong className="text-lg text-slate-800">Advanced Filters</Text>
                    <Text className="text-xs text-slate-400 ml-3">
                      Showing <span className="text-teal-600 font-bold">{filteredData.length}</span> of {shops.length} shops
                    </Text>
                  </div>
                </div>
                <Button
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    resetAllFilters();
                  }}
                  className="font-bold hover:bg-red-50 rounded-xl px-4"
                >
                  Reset All
                </Button>
              </div>
            ),
            children: filterContent,
          },
        ]}
      />
    );
  };

  const columns = [
  {
    title: 'Shop & Brand',
    key: 'shopInfo',
    width: '31%', // ✅ 再次加寬：給予店名最充足的空間
    render: (record: Shop) => (
      <Space align="center" size={12}>
        {record.brandIcon && (
          <div className="brand-logo-wrapper">
            <img 
              src={record.brandIcon} 
              alt={record.brand} 
              className="compact-brand-logo"
            />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          {/* ✅ 文字變大：使用 text-[14px] 或 15px */}
          <Text strong className={`text-[14px] block truncate ${record.status?.toLowerCase() === 'closed' ? 'line-through opacity-50' : 'text-slate-800'}`}>
            {record.name}
          </Text>
          <div className="flex items-center gap-2 mt-0.5">
            <Tag color="blue" className="m-0 border-none font-bold text-[11px] px-2 leading-5">{record.brand}</Tag>
            <Text type="secondary" className="font-mono text-[11px] opacity-70">#{record.id}</Text>
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Address',
    key: 'address',
    width: '25%', 
    render: (record: Shop) => (
      <div className={`flex items-start gap-1.5 ${record.status?.toLowerCase() === 'closed' ? 'opacity-40' : ''}`}>
        <EnvironmentOutlined className="text-teal-600 mt-1 text-[13px]" />
        <div className="flex flex-col">
          {/* ✅ 區域與地址文字微調大 */}
          <Text strong className="text-[12px] leading-tight">{record.region} · {record.district}</Text>
          <Text type="secondary" className="text-[11px] leading-snug italic line-clamp-1">
            {record.address}
          </Text>
        </div>
      </div>
    ),
  },
  // ShopList.tsx -> 找到 columns 陣列中的 'Contact & Tracking' 部分

// ShopList.tsx -> 找到 columns 陣列中的 'Contact & Tracking' 部分

{
  title: 'Contact & Tracking',
  key: 'contact',
  width: '18%',
  render: (record: Shop) => {
    const trackingContent = (
      <div className="p-2 w-[260px]" onClick={(e) => e.stopPropagation()}>
        <Text strong className="text-[10px] uppercase text-slate-400 block mb-2">Tracking Log</Text>
        <Space direction="vertical" className="w-full" size={8}>
          <Select 
            size="small"
            placeholder="Set Status"
            className="w-full"
            value={record.callStatus || undefined}
            onChange={(val) => handleCallUpdate(record, 'status', val)}
          >
            <Option value="Called">Called</Option>
            <Option value="No One Pick Up">No One Pick Up</Option>
            <Option value="No Contact / Wrong No.">No Contact / Wrong No.</Option>
          </Select>
          <Input.TextArea 
            size="small"
            placeholder="Call remark..."
            rows={2}
            defaultValue={record.callRemark}
            onBlur={(e) => handleCallUpdate(record, 'remark', e.target.value)}
            className="text-[12px] rounded-md"
          />
        </Space>
      </div>
    );

    return (
      <div className="flex items-center justify-between w-full pr-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col min-w-0 flex-1">
          <Text className="text-[12px] font-bold text-slate-700 block truncate">
            <PhoneOutlined className="mr-1 text-teal-500" /> {record.phone || '--'}
          </Text>
          <div className="flex items-center gap-1">
            <Text type="secondary" className="text-[10px] truncate"><UserOutlined /> {record.contactName || 'N/A'}</Text>
            {record.callStatus && (
              <Badge status={record.callStatus === 'Called' ? 'success' : 'warning'} className="scale-75 origin-left" />
            )}
          </div>
        </div>

        {/* ✅ 右側加入您提供的 Uiverse 旋轉按鈕 (紅圈位置) */}
        <Popover content={trackingContent} title={<b className="text-xs">Quick Tracking</b>} trigger="click" placement="topRight">
          <button
            className="tracking-log-btn group cursor-pointer outline-none transition-all duration-300"
            title="Log Call"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 256 256"
              className="group-hover:rotate-180 transition-transform duration-500"
            >
              <g fill="#0d9488" fillRule="nonzero">
                <g transform="scale(4,4)">
                  <path d="M12,4c-2.20703,0 -4,1.79297 -4,4v48c0,2.20703 1.79297,4 4,4h35c1.65234,0 3,-1.34766 3,-3v-3.18359c1.16016,-0.41406 2,-1.51562 2,-2.81641v-6.38281l2.89453,-1.44531c0.67969,-0.33984 1.10547,-1.02734 1.10547,-1.78906v-29.38281c0,-1.10156 -0.89844,-2 -2,-2h-2v-3c0,-1.65234 -1.34766,-3 -3,-3zM12,6h37c0.55078,0 1,0.44922 1,1v44c0,0.55078 -0.44922,1 -1,1h-29v-35c0,-0.55078 -0.44531,-1 -1,-1c-0.55469,0 -1,0.44922 -1,1v35h-6c-0.61719,0 -1.33984,0.22266 -2,0.63281v-44.63281c0,-1.10156 0.89844,-2 2,-2zM13,8c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM19,8c-0.55469,0 -1,0.44922 -1,1v4c0,0.55078 0.44531,1 1,1c0.55469,0 1,-0.44922 1,-1v-4c0,-0.55078 -0.44531,-1 -1,-1zM52,12h2v9.38281l-2,1zM13,13c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM13,18c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM35,18c-2.75781,0 -5,2.24219 -5,5v2c0,0.96094 0.28516,1.85156 0.76172,2.61328c-2.63281,1.01953 -4.71094,3.23828 -5.46484,6.08203c-0.14062,0.53516 0.17969,1.08203 0.71484,1.22266c0.53125,0.14063 1.07813,-0.17969 1.22266,-0.71484c0.66406,-2.51172 2.66406,-4.38281 5.11328,-4.98047c0.76953,0.48438 1.67578,0.77734 2.65234,0.77734c0.97656,0 1.88281,-0.29297 2.65234,-0.78125c2.44922,0.60156 4.45313,2.47266 5.11719,4.98828c0.11719,0.44922 0.52344,0.74609 0.96484,0.74609c0.08594,0 0.17188,-0.01172 0.25391,-0.03516c0.53516,-0.14062 0.85547,-0.6875 0.71484,-1.22266c-0.75391,-2.84766 -2.82812,-5.0625 -5.46094,-6.08203c0.47266,-0.76172 0.75781,-1.65234 0.75781,-2.61328v-2c0,-2.75781 -2.24219,-5 -5,-5zM35,19.83203c1.72266,0 3.125,1.40234 3.125,3.125v2.08594c0,1.72266 -1.40234,3.125 -3.125,3.125c-1.72266,0 -3.125,-1.40234 -3.125,-3.125v-2.08594c0,-1.72266 1.40234,-3.125 3.125,-3.125zM13,23c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM54,23.61719v7.76563l-2,1v-7.76562zM13,28c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM13,33c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM54,33.61719v7.76563l-2,1v-7.76562zM13,38c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM31,38c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h8c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM29,42c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h4c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM37,42c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h4c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM13,43c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM13,48c-0.55469,0 -1,0.44922 -1,1c0,0.55078 0.44531,1 1,1h2c0.55469,0 1,-0.44922 1,-1c0,-0.55078 -0.44531,-1 -1,-1zM12,54h36v3c0,0.55078 -0.44922,1 -1,1h-35c-1.10156,0 -2,-0.89844 -2,-2c0,-1.24609 1.39063,-2 2,-2z" />
                </g>
              </g>
            </svg>
          </button>
        </Popover>
      </div>
    );
  }
},
  {
    title: 'Schedule',
    key: 'schedule',
    width: '7%', // ✅ 變更薄：縮減至 7%
    render: (record: Shop) => (
      <div className="flex flex-col gap-0.5 items-left"> {/* 置中顯示更薄 */}
        <Text strong className="text-[11px] text-indigo-900 whitespace-nowrap">
           {record.scheduledDate ? dayjs(record.scheduledDate).format('DD MMM') : 'TBD'}
        </Text>
        {record.groupId > 0 && (
          <Tag className={`m-0 border-none font-black text-[9px] px-1.5 leading-4 tag-group-${record.groupId}`}>
            {String.fromCharCode(64 + record.groupId)} {/* 只顯示字母以節省空間 */}
          </Tag>
        )}
      </div>
    )
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: '7%', // ✅ 變更薄：縮減至 7%
    align: 'left' as const,
    render: (status: string) => {
      let color = 'blue';
      const s = status?.toLowerCase();
      if (s === 'done') color = 'green';
      if (s === 'closed') color = 'red';
      // ✅ 使用更精簡的 Tag 樣式
      return <Tag color={color} className="font-black text-[9px] uppercase border-none px-1.5 rounded-sm m-0 scale-90">{status}</Tag>
    }
  },
 {
    title: 'Actions',
    key: 'actions',
    align: 'left' as const,
    width: '12%',
    render: (_: any, record: Shop) => (
      /* Only show when row is selected and user has any permission */
      selectedRowId === record.id && (hasPermission(currentUser, 'close_shop') || hasPermission(currentUser, 'edit_shop')) && (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {/* Close button - only visible for Admin/App Owner */}
          {hasPermission(currentUser, 'close_shop') && (
          <button
            className="Btn close-btn-styled scale-75 origin-right"
            disabled={record.status?.toLowerCase() === 'closed'}
            onClick={(e) => { e.stopPropagation(); handleCloseAction(record); }}
          >
            <div className="sign">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="white" d="M 20 10 L 20 12 L 22 12 L 22 10 L 23 10 C 23.328 10.000 23.636 9.839 23.823 9.570 C 24.010 9.300 24.053 8.955 23.937 8.648 L 20.937 0.648 C 20.790 0.258 20.417 -0.000 20 0 L 4 0 C 3.583 -0.000 3.210 0.258 3.063 0.648 L 0.063 8.648 C -0.053 8.955 -0.010 9.300 0.177 9.570 C 0.364 9.839 0.672 10.000 1 10 L 2 10 L 2 12 L 4 12 L 4 10 z M 11 2 L 11 8 L 7.28 8 L 8.78 2 z M 15.22 2 L 16.72 8 L 13 8 L 13 2 z M 21.557 8 L 18.78 8 L 17.28 2 L 19.307 2 z M 4.693 2 L 6.72 2 L 5.22 8 L 2.443 8 z M 2 23 C 2 23.552 2.448 24 3 24 L 21 24 C 21.552 24 22 23.552 22 23 L 22 22 L 2 22 z" /></svg>
            </div>
            <div className="btn-text text-[12px]">Close</div>
          </button>
          )}

          {/* Edit button - only visible for Admin/App Owner */}
          {hasPermission(currentUser, 'edit_shop') && (
          <button
            className="Btn edit-btn-styled scale-75 origin-right"
            disabled={record.status?.toLowerCase() === 'closed'}
            onClick={(e) => { e.stopPropagation(); setTargetShop(record); setFormOpen(true); }}
          >
            <div className="sign">
              <svg viewBox="0 0 512 512" className="w-4 h-4"><path fill="white" d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231z"/></svg>
            </div>
            <div className="btn-text text-[12px]">Edit</div>
          </button>
          )}
        </div>
      )
    ),
  }
];
  return (
    <div className="shop-list-container">
      {/* Header Section */}
      <div className="shop-list-header">
        <div>
          <Title level={2} className="m-0" style={{ fontFamily: "'Fira Code', monospace", color: 'var(--color-text)' }}>Shop Master List</Title>
          <Text style={{ fontFamily: "'Fira Sans', sans-serif", color: '#64748b' }}>Comprehensive store management with advanced filtering</Text>
        </div>
        <div className="flex items-center gap-4">
          <div className="input-group" style={{ position: 'relative' }}>
            <input
              required
              type="text"
              autoComplete="off"
              className="custom-search-input"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
            <label className="user-label">Search by name, code or address...</label>
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  fontSize: '16px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.2s',
                  zIndex: 10
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#ef4444';
                  e.currentTarget.style.background = '#fee2e2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#94a3b8';
                  e.currentTarget.style.background = 'none';
                }}
              >
                <ClearOutlined />
              </button>
            )}
          </div>
          {hasPermission(currentUser, 'edit_shop') && (
          <button className="Btn new-btn-styled" onClick={() => { setTargetShop(null); setFormOpen(true); }}>
            <div className="sign"><PlusOutlined style={{ color: 'white', fontSize: '18px' }} /></div>
            <div className="btn-text">New Shop</div>
          </button>
          )}
        </div>
      </div>

      {/* Bento Statistics Grid */}
      {renderBentoStats()}

      {/* Bento Filters Section */}
      {renderBentoFilters()}

      {/* Date Range Filter & Table */}
      <Card className="rounded-[16px] border border-slate-200 shadow-md overflow-hidden bg-white mt-6" style={{ boxShadow: 'var(--shadow-md)' }}>
        <div className="p-5">
          <div className="flex justify-between items-center mb-6">
            <Text strong className="text-slate-600">
              <CalendarOutlined className="mr-2" />
              Filter by Scheduled Date Range
            </Text>
            <Space>
              <RangePicker
                onChange={(dates) => {
                  if (dates) {
                    setDateRange([
                      dates[0]?.format('YYYY-MM-DD') || null,
                      dates[1]?.format('YYYY-MM-DD') || null
                    ]);
                  } else {
                    setDateRange([null, null]);
                  }
                }}
                value={dateRange[0] && dateRange[1] ? [dayjs(dateRange[0]), dayjs(dateRange[1])] : null}
                className="h-11 rounded-xl font-bold border-slate-200"
                placeholder={['Start Date', 'End Date']}
                format="DD MMM YYYY"
              />
              {(dateRange[0] || dateRange[1]) && (
                <Button
                  type="text"
                  danger
                  icon={<ClearOutlined />}
                  onClick={() => setDateRange([null, null])}
                  className="h-11"
                >
                  Clear
                </Button>
              )}
            </Space>
          </div>

          <div className="st-master-table">
            <div className="table-scroll-wrapper" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <Table
                columns={columns}
                dataSource={filteredData} // ✅ 使用過濾後的數據
                rowKey="id"
                scroll={{ x: 1200 }}
                pagination={{
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total) => `Total ${total} shops`
                }}
                onRow={(record) => ({
                  onClick: () => setSelectedRowId(record.id === selectedRowId ? null : record.id)
                })}
                rowClassName={(record) => record.id === selectedRowId ? 'selected-row cursor-pointer' : 'cursor-pointer'}
              />
            </div>
          </div>
        </div>
      </Card>

      <ShopFormModal
        visible={formOpen}
        shop={targetShop}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); onRefresh(); }}
        graphToken={graphToken}
        shops={shops}
      />

      {/* Floating Sticky CTA - only visible for Admin/App Owner */}
      {hasPermission(currentUser, 'edit_shop') && (
      <div className="floating-cta">
        <button
          className="floating-cta-btn"
          onClick={() => { setTargetShop(null); setFormOpen(true); }}
          aria-label="Add new shop"
        >
          <PlusOutlined style={{ fontSize: '16px' }} />
          <span>Add Shop</span>
        </button>
      </div>
      )}

      {/* Bento Grid Styles */}
<style>{`
/* ============================================
   DESIGN SYSTEM - Fira Code + Fira Sans
   ============================================ */
@import url('https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&family=Fira+Sans:wght@300;400;500;600;700&display=swap');

/* CSS Variables from MASTER.md */
:root {
  --color-primary: #1E40AF;
  --color-secondary: #3B82F6;
  --color-cta: #F59E0B;
  --color-background: #F8FAFC;
  --color-text: #1E3A8A;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
  --shadow-xl: 0 20px 25px rgba(0,0,0,0.15);
}

/* ============================================
   BENTO GRID DESIGN SYSTEM
   ============================================ */

.shop-list-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
  padding-bottom: 40px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: 'Fira Sans', -apple-system, BlinkMacSystemFont, sans-serif;
}

.shop-list-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding-bottom: var(--space-md);
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: var(--space-md);
}

/* Search Input Styling */
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
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.custom-search-input:focus + .user-label,
.custom-search-input:valid + .user-label {
  top: -8px;
  font-size: 11px;
  color: var(--color-primary);
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

/* New Shop Button Styling */
.new-btn-styled {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: 12px 20px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Fira Sans', sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}

.new-btn-styled:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
  opacity: 0.9;
}

.new-btn-styled:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.new-btn-styled .sign {
  display: flex;
  align-items: center;
  justify-content: center;
}

.new-btn-styled .btn-text {
  white-space: nowrap;
}

/* Bento Statistics Grid - 12-column layout with varied spans */
.bento-stats-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-md);
}

.bento-stat-card {
  background: white;
  border-radius: 16px;
  padding: var(--space-lg);
  border: 1px solid #e2e8f0;
  box-shadow: var(--shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
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
  background: var(--accent-color, var(--color-cta));
  opacity: 0;
  transition: opacity 200ms ease;
}

.bento-stat-card:hover {
  transform: scale(1.02);
  box-shadow: var(--shadow-lg);
}

.bento-stat-card:hover::before {
  opacity: 1;
}

.bento-stat-card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.bento-large {
  grid-column: span 3;
}

.bento-stat-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-color, var(--color-primary)) 0%, var(--accent-color, var(--color-secondary)) 100%);
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
  color: var(--color-text);
  line-height: 1;
}

.bento-stat-title {
  font-family: 'Fira Sans', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: var(--space-xs);
}

.bento-stat-subtitle {
  font-family: 'Fira Sans', sans-serif;
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

/* Bento Filters Section */
.bento-filters-section {
  background: white;
  border-radius: 16px;
  padding: var(--space-lg);
  border: 1px solid #e2e8f0;
  box-shadow: var(--shadow-sm);
}

.bento-filters-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  padding-bottom: var(--space-md);
  border-bottom: 1px solid #e2e8f0;
}

.bento-filters-icon-wrapper {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  transition: transform 200ms ease;
}

.bento-filters-icon-wrapper:hover {
  transform: scale(1.05);
}

/* 12-column grid for filters with varied spans */
.bento-filters-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-sm);
}

.bento-filter-card {
  background: var(--color-background);
  border-radius: 12px;
  padding: var(--space-md);
  border: 1px solid #e2e8f0;
  transition: all 200ms ease;
  grid-column: span 4;
}

.bento-filter-card:hover {
  border-color: var(--color-primary);
  background: #eff6ff;
  transform: scale(1.02);
}

.bento-filter-card:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1);
}

.bento-filter-header {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.bento-filter-icon {
  width: 28px;
  height: 28px;
  background: white;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: var(--color-primary);
  border: 1px solid #e2e8f0;
  transition: all 200ms ease;
}

.bento-filter-card:hover .bento-filter-icon {
  background: var(--color-primary);
  color: white;
}

.bento-filter-label {
  font-family: 'Fira Sans', sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bento-filter-select.ant-select {
  width: 100%;
}

.bento-filter-select .ant-select-selector {
  height: 40px !important;
  border-radius: 8px !important;
  border: 1px solid #e2e8f0 !important;
  background: white !important;
  font-family: 'Fira Sans', sans-serif !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  cursor: pointer !important;
  transition: all 200ms ease !important;
}

.bento-filter-select .ant-select-selection-item {
  line-height: 38px !important;
}

.bento-filter-select:hover .ant-select-selector {
  border-color: var(--color-primary) !important;
}

.bento-filter-select.ant-select-focused .ant-select-selector {
  border-color: var(--color-primary) !important;
  box-shadow: 0 0 0 3px rgba(30, 64, 175, 0.1) !important;
}

/* ============================================
   ORIGINAL STYLES (PRESERVED)
   ============================================ */

.brand-logo-wrapper {
    width: 38px;
    height: 38px;
    background: white;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
  }

  .compact-brand-logo {
    width: 90%;
    height: 90%;
    object-fit: contain;
  }

  .st-master-table .ant-table {
    font-size: 13px !important; 
  }

  /* ✅ 修正 2：極致壓縮表格行高 */
  .st-master-table .ant-table-tbody > tr > td {
    padding: 10px 8px !important; /* ❗ 大幅減少 Padding 使表格更緊湊 */
    height: 58px !important;    /* ❗ 固定行高，確保外觀一致 */
    vertical-align: middle !important;
  }

  /* ✅ 修正 3：表頭文字微調 */
  .st-master-table .ant-table-thead > tr > th {
    padding: 12px 8px !important;
    font-size: 12px !important;
    letter-spacing: 0.5px;
  }

/* ✅ 修正紅框空白問題：讓欄位更緊湊 */
.contact-cell-compact {
  padding: 0 !important; /* ❗ 移除外層 Padding */
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

/* 針對新的旋轉按鈕進行微調 */
.tracking-log-btn {
    background: transparent;
    border: none;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px !important;  /* ❗ 強制寬度 */
    height: 32px !important; /* ❗ 強制高度 */
    border-radius: 8px;
    flex-shrink: 0;          /* ❗ 防止被左側文字擠壓消失 */
    cursor: pointer;
    transition: all 0.2s ease;
  }

.tracking-log-btn:hover {
  background: rgba(13, 148, 136, 0.08); /* 輕微背景回饋 */
}


  .tracking-log-btn svg {
    width: 22px !important;
    height: 22px !important;
    display: block;
  }

/* 強化字體與排版，減少垂直佔位 */
.contact-cell-compact .ant-typography {
  margin-bottom: 0 !important;
}

  /* 分組標籤顏色 */
  .tag-group-1 { background-color: #dbeafe !important; color: var(--color-primary) !important; }
  .tag-group-2 { background-color: #fef3c7 !important; color: #92400e !important; }
  .tag-group-3 { background-color: #dcfce7 !important; color: #166534 !important; }

  /* 選取行的背景色 */
  .selected-row {
    background-color: #eff6ff !important;
  }

  /* Action Buttons Styling */
  .close-btn-styled,
  .edit-btn-styled {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    font-family: 'Fira Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 200ms ease;
  }

  .close-btn-styled {
    background: #fee2e2;
    color: #dc2626;
  }

  .close-btn-styled:hover:not(:disabled) {
    background: #fecaca;
    transform: translateY(-1px);
  }

  .edit-btn-styled {
    background: #dbeafe;
    color: var(--color-primary);
  }

  .edit-btn-styled:hover:not(:disabled) {
    background: #bfdbfe;
    transform: translateY(-1px);
  }

  .close-btn-styled:disabled,
  .edit-btn-styled:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .close-btn-styled .sign,
  .edit-btn-styled .sign {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .close-btn-styled .sign svg,
  .edit-btn-styled .sign svg {
    width: 14px;
    height: 14px;
  }

  .close-btn-styled .sign svg path {
    fill: #dc2626;
  }

  .edit-btn-styled .sign svg path {
    fill: var(--color-primary);
  }

  /* --- 1. Accordion (Collapse) 整體容器 --- */
  .custom-accordion {
    background: transparent !important;
    border: none !important;
  }

  /* ✅ 修正 1：移除紅線間隙，並加深 Header 陰影 */
  .custom-accordion > .ant-collapse-item > .ant-collapse-header {
    align-items: center !important;
    padding: 16px 24px !important;
    background: white !important;
    border-radius: 20px !important; /* 初始全圓角 */
    border: 1px solid #f1f5f9 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* ✅ 加深陰影 (Darker Shadow) */
    box-shadow: 0 15px 45px rgba(0, 0, 0, 0.12) !important; 
    margin-bottom: 0px !important; /* ❗ 移除間隙，解決紅線問題 */
    position: relative;
    z-index: 2; /* 確保 Header 蓋在 Content 上方 */
  }

  /* ✅ 修正 2：展開時的處理 (滑出效果) */
  .custom-accordion > .ant-collapse-item-active > .ant-collapse-header {
    /* 展開時，Header 下方圓角變直，使其與內容無縫連接 */
    border-bottom-left-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
    border-bottom: none !important;
  }

  /* 內容方塊樣式 (滑出的方塊) */
  .custom-accordion > .ant-collapse-item > .ant-collapse-content {
    border: 1px solid #f1f5f9 !important;
    border-top: none !important;
    background: white !important;
    /* 給內容加上下方圓角與同樣的深陰影 */
    border-bottom-left-radius: 20px !important;
    border-bottom-right-radius: 20px !important;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.08) !important;
    overflow: hidden;
  }

  .custom-accordion .ant-collapse-content-box {
    padding: 0 !important;
  }

  /* --- 2. Filter Label --- */
  .filter-label {
    display: block;
    font-size: 10px;
    font-weight: 900;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    margin-left: 4px;
  }

  /* --- 3. Select 下拉選單與箭頭修正 --- */
  .custom-list-select.ant-select-single .ant-select-selector {
    height: 44px !important;
    border-radius: 12px !important;
    border: 1.5px solid #f1f5f9 !important;
    display: flex !important;
    align-items: center !important;
    font-weight: 600 !important;
    background-color: #fff !important;
  }

  .custom-list-select.ant-select-single .ant-select-selection-item,
  .custom-list-select.ant-select-single .ant-select-selection-placeholder {
    line-height: 41px !important;
  }

  .custom-list-select .ant-select-arrow {
    top: 50% !important;
    margin-top: 0 !important;
    transform: translateY(-50%) !important;
    right: 12px !important;
  }

  .custom-list-select:hover .ant-select-selector {
    border-color: #0d9488 !important;
  }

  /* 表格選取行樣式 */
  .selected-row {
    background-color: #eff6ff !important;
  }

  /* ============================================
     FLOATING STICKY CTA
     ============================================ */
  .floating-cta {
    position: fixed;
    bottom: var(--space-xl);
    right: var(--space-xl);
    z-index: 1000;
  }

  .floating-cta-btn {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) var(--space-lg);
    background: linear-gradient(135deg, var(--color-cta) 0%, #d97706 100%);
    color: white;
    border: none;
    border-radius: 50px;
    font-family: 'Fira Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-lg), 0 0 20px rgba(245, 158, 11, 0.3);
    transition: all 200ms ease;
  }

  .floating-cta-btn:hover {
    transform: scale(1.05) translateY(-2px);
    box-shadow: var(--shadow-xl), 0 0 30px rgba(245, 158, 11, 0.4);
  }

  .floating-cta-btn:focus-visible {
    outline: 2px solid white;
    outline-offset: 2px;
  }

  /* ============================================
     ACCESSIBILITY & REDUCED MOTION
     ============================================ */
  @media (prefers-reduced-motion: reduce) {
    .bento-stat-card,
    .bento-stat-card::before,
    .bento-stat-icon,
    .bento-filter-card,
    .bento-filter-icon,
    .bento-filters-icon-wrapper,
    .tracking-log-btn,
    .tracking-log-btn svg,
    .floating-cta-btn {
      transition: none !important;
      transform: none !important;
    }

    .bento-stat-card:hover,
    .bento-filter-card:hover,
    .floating-cta-btn:hover {
      transform: none !important;
    }
  }

  /* Focus states for keyboard navigation */
  button:focus-visible,
  .ant-btn:focus-visible,
  .ant-select:focus-visible .ant-select-selector {
    outline: 2px solid var(--color-primary) !important;
    outline-offset: 2px !important;
  }

  /* All clickable elements must have cursor:pointer */
  .ant-table-tbody > tr,
  .bento-stat-card,
  .bento-filter-card,
  button,
  .ant-btn,
  .ant-select-selector,
  .ant-pagination-item,
  .tracking-log-btn {
    cursor: pointer !important;
  }

  /* ============================================
     TABLE DESIGN SYSTEM ALIGNMENT
     ============================================ */
  .st-master-table .ant-table {
    font-family: 'Fira Sans', sans-serif !important;
    border-radius: 16px;
    overflow: hidden;
  }

  .st-master-table .ant-table-thead > tr > th {
    background: var(--color-background) !important;
    font-family: 'Fira Sans', sans-serif !important;
    font-weight: 700 !important;
    color: var(--color-text) !important;
    border-bottom: 2px solid #e2e8f0 !important;
  }

  .st-master-table .ant-table-tbody > tr:hover > td {
    background: #eff6ff !important;
  }

  .st-master-table .ant-pagination-item-active {
    border-color: var(--color-primary) !important;
  }

  .st-master-table .ant-pagination-item-active a {
    color: var(--color-primary) !important;
  }
`}</style>
</div>
  );
};