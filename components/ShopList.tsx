import React, { useState, useMemo } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Input, Button, Space, Tag, Typography, Badge, DatePicker } from 'antd';
import { 
  SearchOutlined, 
  FileExcelOutlined, 
  FilterOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  StopOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import dayjs from 'dayjs'; // ✅ 用於格式化日期
import { Shop } from '../types';

const { Text, Title } = Typography;

export const ShopList: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  // --- 篩選器狀態 ---
  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all'); // ✅ 新增 Group 狀態
  const [filterDate, setFilterDate] = useState<string | null>(null);   // ✅ 新增 Date 狀態

  // --- 1. 多維度過濾邏輯 ---
  const filteredData = useMemo(() => {
    return shops.filter(shop => {
      const search = searchText.toLowerCase();
      const matchSearch = (shop.name || '').toLowerCase().includes(search) || (shop.id || '').toLowerCase().includes(search);
      const matchRegion = filterRegion === 'all' || shop.region === filterRegion;
      const matchDistrict = filterDistrict === 'all' || shop.district === filterDistrict;
      const matchStatus = filterStatus === 'all' || shop.status === filterStatus;
      
      // ✅ 新增 Group 過濾
      const matchGroup = filterGroup === 'all' || shop.groupId === filterGroup;
      
      // ✅ 新增日期過濾 (比對 YYYY-MM-DD)
      const matchDate = !filterDate || (shop.scheduledDate && dayjs(shop.scheduledDate).format('YYYY-MM-DD') === filterDate);

      return matchSearch && matchRegion && matchDistrict && matchStatus && matchGroup && matchDate;
    });
  }, [shops, searchText, filterRegion, filterDistrict, filterStatus, filterGroup, filterDate]);

  // --- 2. 數據統計 ---
  const stats = useMemo(() => ({
    total: filteredData.length,
    completed: filteredData.filter(s => s.status === 'completed').length,
    pending: filteredData.filter(s => s.status === 'pending').length,
    closed: filteredData.filter(s => s.status === 'closed').length,
  }), [filteredData]);

  // --- 3. 表格欄位定義 ---
  const columns = [
    { 
      title: 'ID', 
      dataIndex: 'id', 
      width: 100, 
      className: 'font-mono text-slate-400 text-xs' 
    },
    { 
      title: 'Brand', 
      dataIndex: 'brand', 
      width: 100,
      render: (t: string) => <span className="font-semibold text-slate-600">{t}</span>
    },
    { 
      title: 'Shop Name', 
      dataIndex: 'name', 
      className: 'font-bold text-slate-800' 
    },
    { 
      title: 'Location Details', 
      render: (_: any, r: Shop) => (
        <div className="flex flex-col gap-0.5">
          <Text strong style={{ fontSize: '13px' }} className="text-slate-700">{r.district}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }} className="uppercase tracking-tighter">
            {r.area} | {r.region}
          </Text>
        </div>
      )
    },
    { 
      title: 'Schedule Date', 
      dataIndex: 'scheduledDate', 
      // ✅ 修正：格式化日期為 YYYY-MM-DD，移除時間部分
      render: (d: string) => d ? <span className="font-mono text-blue-600 font-bold">{dayjs(d).format('YYYY-MM-DD')}</span> : <Text type="secondary">Not Set</Text> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      render: (s: string) => (
        <Tag color={s === 'completed' ? 'green' : s === 'closed' ? 'red' : 'blue'} className="rounded-full px-4 border-none font-bold uppercase text-[9px]">
          {s}
        </Tag>
      )
    },
    { 
      title: 'Group', 
      dataIndex: 'groupId', 
      width: 120,
      render: (g: number) => {
        const labels: Record<number, string> = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
        return g > 0 ? <Badge status="processing" color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'} text={labels[g]} /> : '-';
      }
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-900">Shop Master List</Title>
          <p className="text-slate-500 font-medium">Manage across {shops.length} stores with advanced filters.</p>
        </div>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-8 rounded-2xl font-bold shadow-lg"
        >
          Export to Excel
        </Button>
      </div>

      {/* --- 統計卡片 --- */}
      <Row gutter={20}>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Filtered Result</span>} value={stats.total} prefix={<ShopOutlined className="text-teal-600 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>} value={stats.completed} prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>} value={stats.pending} prefix={<ClockCircleOutlined className="text-blue-500 mr-2" />} /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closed</span>} value={stats.closed} prefix={<StopOutlined className="text-slate-300 mr-2" />} /></Card></Col>
      </Row>

      {/* --- 篩選列 (新增 Date & Group) --- */}
      <Card className="rounded-2xl shadow-sm border-none bg-white" bodyStyle={{ padding: '24px' }}>
        <Space wrap size="large">
          <Input 
            placeholder="Search Name/ID..." 
            prefix={<SearchOutlined className="text-slate-400" />} 
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
            <Select placeholder="Region" style={{ width: 140 }} onChange={setFilterRegion} value={filterRegion}>
              <Select.Option value="all">All Regions</Select.Option>
              {Array.from(new Set(shops.map(s => s.region))).filter(Boolean).map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
            </Select>
            <Select placeholder="Status" style={{ width: 130 }} onChange={setFilterStatus} value={filterStatus}>
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="closed">Closed</Select.Option>
            </Select>
            <Button onClick={() => { setSearchText(''); setFilterGroup('all'); setFilterDate(null); }} icon={<FilterOutlined />}>Reset</Button>
          </Space>
        </Space>
      </Card>

      {/* --- 表格 (自定義標頭顏色) --- */}
      <Card className="rounded-[32px] shadow-sm border-none overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <style>{`
          /* ✅ 自定義表格標頭樣式 */
          .st-master-table .ant-table-thead > tr > th {
            background-color: #0d9488 !important; /* Teal 600 */
            color: white !important;
            font-weight: 800 !important;
            text-transform: uppercase;
            font-size: 11px;
            letter-spacing: 0.05em;
            padding: 16px !important;
          }
          .st-master-table .ant-table-row:hover > td {
            background-color: #f0fdfa !important; /* Teal 50 */
          }
        `}</style>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          className="st-master-table"
          pagination={{ pageSize: 15, showSizeChanger: true, className: 'px-6 py-4' }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};
