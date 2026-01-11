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
import { ShopFormModal } from './ShopFormModal';

const { Text, Title } = Typography;

export const ShopList: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  // --- 1. State ---
  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);edit
  const [formVisible, setFormVisible] = useState(false);
  const [editingShop, setEditingShop] = useState<Shop | null>(null);
  // 在元件頂部加入 state
const [formOpen, setFormOpen] = useState(false);
const [targetShop, setTargetShop] = useState<Shop | null>(null);

  const openNewForm = () => {
    setEditingShop(null); // 確保是空的
    setFormVisible(true);
  };

  const openEditForm = (shop: Shop) => {
    setEditingShop(shop);
    setFormVisible(true);
  };

  // --- 2. Row Styling ---
  const getGroupRowStyle = (groupId: number, isSelected: boolean) => {
    let baseStyle: React.CSSProperties = {};
    switch (groupId) {
      case 1: baseStyle = { backgroundColor: '#f0f9ff' }; break; // Group A
      case 2: baseStyle = { backgroundColor: '#faf5ff' }; break; // Group B
      case 3: baseStyle = { backgroundColor: '#fff7ed' }; break; // Group C
      default: baseStyle = {};
    }
    if (isSelected) {
      return { ...baseStyle, border: '2px solid #23c483', cursor: 'pointer' };
    }
    return { ...baseStyle, cursor: 'pointer' };
  };

  // --- 3. Filter Logic ---
  const filteredData = useMemo(() => {
    return shops.filter(shop => {
      const search = searchText.toLowerCase();
      const matchSearch = (shop.name || '').toLowerCase().includes(search) || (shop.id || '').toLowerCase().includes(search);
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
    { title: 'Shop Name', dataIndex: 'name', className: 'font-bold text-slate-800' },
    { title: 'Area', dataIndex: 'area', render: (t: string) => <Text className="text-xs font-semibold">{t || 'N/A'}</Text> },
    { 
      title: 'Location', 
      render: (_: any, r: Shop) => (
        <div className="flex flex-col">
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
      {selectedRowId === record.id && (
        <button 
          className="edit-button" 
          onClick={(e) => { 
            e.stopPropagation(); 
            setTargetShop(record); // ✅ 設定要編輯的 shop
            setFormOpen(true);     // ✅ 開啟彈窗
          }}
        >
          {/* SVG ICON */}
        </button>
      )}
    </div>
  ),
}

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-end">
        <div>
          <Title level={2} className="m-0 text-slate-900">Shop Master List</Title>
          <p className="text-slate-500 font-medium mb-6">Manage across {shops.length} stores with advanced filters.</p>
          <button className="new-shop-btn" onClick={() => { setTargetShop(null); setFormOpen(true); }}>
  <PlusOutlined /> New Shop
</button>
            <PlusOutlined /> New Shop
          </button>
        </div>
        <Button type="primary" icon={<FileExcelOutlined />} className="bg-emerald-600 border-none h-12 px-8 rounded-2xl font-bold shadow-lg">Export Excel</Button>
      </div>

      <Row gutter={20}>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title="Total" value={stats.total} prefix={<ShopOutlined className="text-teal-600 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title="Completed" value={stats.completed} prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title="Pending" value={stats.pending} prefix={<ClockCircleOutlined className="text-blue-500 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title="Closed" value={stats.closed} prefix={<StopOutlined className="text-slate-300 mr-2" />} /></Card></Col>
      </Row>

      <Card className="rounded-2xl shadow-sm border-none bg-white" bodyStyle={{ padding: '24px' }}>
        <Space wrap size="large">
          <Input placeholder="Search Name..." prefix={<SearchOutlined />} style={{ width: 220 }} onChange={e => setSearchText(e.target.value)} className="rounded-xl bg-slate-50 border-none h-11" />
          <Space>
            <Select placeholder="Group" style={{ width: 120 }} onChange={setFilterGroup} value={filterGroup}>
              <Select.Option value="all">All Groups</Select.Option>
              <Select.Option value={1}>Group A</Select.Option>
              <Select.Option value={2}>Group B</Select.Option>
              <Select.Option value={3}>Group C</Select.Option>
            </Select>
            <DatePicker placeholder="Filter Date" className="h-11 rounded-xl bg-slate-50 border-none w-40" onChange={(date) => setFilterDate(date ? date.format('YYYY-MM-DD') : null)} />
            <Button onClick={() => { setSearchText(''); setFilterGroup('all'); setFilterDate(null); setSelectedRowId(null); }} icon={<FilterOutlined />}>Reset</Button>
          </Space>
        </Space>
      </Card>

      <Card className="rounded-[32px] shadow-sm border-none overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          className="st-master-table"
          pagination={{ pageSize: 15 }}
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => setSelectedRowId(record.id),
            style: getGroupRowStyle(record.groupId, selectedRowId === record.id),
          })}
        />
      </Card>
          <ShopFormModal 
      visible={formOpen}
      shop={targetShop}
      onCancel={() => setFormOpen(false)}
      onSuccess={() => {
        setFormOpen(false);
        onRefresh(); // 重新抓取 SharePoint 資料
      }}
      graphToken={graphToken}
    />
    </div>
  );
};
