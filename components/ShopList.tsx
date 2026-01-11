import React, { useState, useMemo } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Input, Button, Space, Tag, Typography, Badge, DatePicker, Divider, Avatar } from 'antd';
import { 
  SearchOutlined, 
  FileExcelOutlined, 
  FilterOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  StopOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';

const { Text, Title } = Typography;

export const ShopList: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  // --- 1. State Management ---
  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  
  // ✅ Track which row is selected for the "Edit" button to appear
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  // --- 2. Row Styling Logic ---
  const getGroupRowStyle = (groupId: number, isSelected: boolean) => {
    let baseStyle: React.CSSProperties = {};
    switch (groupId) {
      case 1: baseStyle = { backgroundColor: '#f0f9ff' }; break; // Group A (Blue)
      case 2: baseStyle = { backgroundColor: '#faf5ff' }; break; // Group B (Purple)
      case 3: baseStyle = { backgroundColor: '#fff7ed' }; break; // Group C (Orange)
      default: baseStyle = {};
    }

    // Apply a border if the row is selected
    if (isSelected) {
      return { ...baseStyle, border: '2px solid #23c483', cursor: 'pointer' };
    }
    return { ...baseStyle, cursor: 'pointer' };
  };

  // --- 3. Filtering Logic ---
  const filteredData = useMemo(() => {
    return shops.filter(shop => {
      const search = searchText.toLowerCase();
      const name = (shop.name || '').toLowerCase();
      const code = (shop.id || '').toLowerCase();
      
      const matchSearch = name.includes(search) || code.includes(search);
      const matchRegion = filterRegion === 'all' || shop.region === filterRegion;
      const matchStatus = filterStatus === 'all' || shop.status === filterStatus;
      const matchGroup = filterGroup === 'all' || shop.groupId === filterGroup;
      const matchDate = !filterDate || (shop.scheduledDate && dayjs(shop.scheduledDate).format('YYYY-MM-DD') === filterDate);

      return matchSearch && matchRegion && matchStatus && matchGroup && matchDate;
    });
  }, [shops, searchText, filterRegion, filterStatus, filterGroup, filterDate]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    completed: filteredData.filter(s => s.status === 'completed').length,
    pending: filteredData.filter(s => s.status === 'pending').length,
    closed: filteredData.filter(s => s.status === 'closed').length,
  }), [filteredData]);

  // --- 4. Table Columns ---
  const columns = [
    { 
      title: '', 
      dataIndex: 'brandIcon', 
      width: 60, 
      render: (src: string) => <Avatar src={src} shape="square" className="border border-slate-100 bg-white" /> 
    },
    { 
      title: 'Shop Name', 
      dataIndex: 'name', 
      className: 'font-bold text-slate-800' 
    },
    { 
      title: 'Area', 
      dataIndex: 'area', 
      render: (t: string) => <Text className="text-xs font-semibold">{t || 'N/A'}</Text>
    },
    { 
      title: 'Location', 
      render: (_: any, r: Shop) => (
        <div className="flex flex-col gap-0.5">
          <Text strong style={{ fontSize: '11px' }} className="text-slate-500">{r.district}</Text>
          <Text type="secondary" style={{ fontSize: '9px' }} className="uppercase tracking-widest">{r.region}</Text>
        </div>
      )
    },
    { 
      title: 'Schedule Date', 
      dataIndex: 'scheduledDate', 
      render: (d: string) => d ? <span className="font-mono text-blue-600 font-bold">{dayjs(d).format('YYYY-MM-DD')}</span> : <Text type="secondary">Not Set</Text> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      render: (s: string) => (
        <Tag color={s === 'completed' ? 'green' : s === 'closed' ? 'red' : 'blue'} className="rounded-full px-4 border-none font-bold uppercase text-[9px]">
          {s || 'PENDING'}
        </Tag>
      )
    },
    { 
      title: 'Group', 
      dataIndex: 'groupId', 
      width: 100,
      render: (g: number) => {
        const labels: Record<number, string> = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
        return g > 0 ? <Badge status="processing" color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'} text={labels[g]} /> : '-';
      }
    },
    {
      title: '',
      key: 'actions',
      width: 130,
      align: 'right' as const,
      render: (_: any, record: Shop) => (
        <div style={{ minHeight: '40px', display: 'flex', justifyContent: 'flex-end', paddingRight: '10px' }}>
          {/* ✅ Edit button only visible when row is selected */}
          {selectedRowId === record.id && (
            <button className="edit-button" onClick={(e) => { e.stopPropagation(); console.log('Edit:', record.id); }}>
              <svg className="edit-svgIcon" viewBox="0 0 512 512">
                <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
              </svg>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* --- Header Section --- */}
      <div className="flex justify-between items-end">
        <div>
          <Title level={2} className="m-0 text-slate-900">Shop Master List</Title>
          <p className="text-slate-500 font-medium mb-6">Manage across {shops.length} stores with advanced filters.</p>
          
          {/* ✅ New Shop Button */}
          <button className="new-shop-btn" onClick={() => console.log('Add New Shop Clicked')}>
            <PlusOutlined /> New Shop
          </button>
        </div>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-8 rounded-2xl font-bold shadow-lg"
        >
          Export to Excel
        </Button>
      </div>

      {/* --- Statistics Cards --- */}
      <Row gutter={20}>
        <Col span={6}>
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic title="Result" value={stats.total} prefix={<ShopOutlined className="text-teal-600 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic title="Pending" value={stats.pending} prefix={<ClockCircleOutlined className="text-blue-500 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl border-none shadow-sm">
            <Statistic title="Closed" value={stats.closed} prefix={<StopOutlined className="text-slate-300 mr-2" />} />
          </Card>
        </Col>
      </Row>

      {/* --- Filter Toolbar --- */}
      <Card className="rounded-2xl shadow-sm border-none bg-white" bodyStyle={{ padding: '24px' }}>
        <Space wrap size="large">
          <Input 
            placeholder="Search Name/ID..." 
            prefix={<SearchOutlined />} 
            style={{ width: 220 }} 
            onChange={e => setSearchText(e.target.value)}
            className="rounded-xl bg-slate-50 border-none h-11"
          />
          <Space>
            <Select placeholder="Group" style={{ width: 120 }} onChange={setFilterGroup} value={filterGroup}>
              <Select.Option value="all">All Groups</Select.Option>
              <Select.Option value={1}>Group A</Select.Option>
              <Select.Option value={2}>Group B</Select.Option>
              <Select.Option value={3}>Group C</Select.Option>
            </Select>
            <DatePicker 
              placeholder="Filter Date" 
              className="h-11 rounded-xl bg-slate-50 border-none w-40"
              onChange={(date) => setFilterDate(date ? date.format('YYYY-MM-DD') : null)}
            />
            <Divider type="vertical" />
            <Select placeholder="Status" style={{ width: 130 }} onChange={setFilterStatus} value={filterStatus}>
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="closed">Closed</Select.Option>
            </Select>
            <Button onClick={() => { setSearchText(''); setFilterGroup('all'); setFilterDate(null); setSelectedRowId(null); }} icon={<FilterOutlined />}>Reset</Button>
          </Space>
        </Space>
      </Card>

      {/* --- Main Table --- */}
      <Card className="rounded-[32px] shadow-sm border-none overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          className="st-master-table"
          pagination={{ pageSize: 15, showSizeChanger: true, className: 'px-6 py-4' }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            // ✅ Click to select the row
            onClick: () => setSelectedRowId(record.id),
            style: getGroupRowStyle(record.groupId, selectedRowId === record.id),
          })}
        />
      </Card>
    </div>
  );
};
