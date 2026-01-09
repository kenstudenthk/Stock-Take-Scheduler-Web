import React, { useState, useMemo } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Input, Button, Space, Tag, Typography, Badge } from 'antd';
import { 
  SearchOutlined, 
  FileExcelOutlined, 
  FilterOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  StopOutlined 
} from '@ant-design/icons';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Shop } from '../types';

const { Text, Title } = Typography;

export const ShopList: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  // --- 篩選器狀態 ---
  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterBrand, setFilterBrand] = useState('all');

  // --- 1. 多維度過濾邏輯 ---
  const filteredData = useMemo(() => {
    return shops.filter(shop => {
      const sName = (shop.name || '').toLowerCase();
      const sId = (shop.id || '').toLowerCase();
      const search = searchText.toLowerCase();

      const matchSearch = sName.includes(search) || sId.includes(search);
      const matchRegion = filterRegion === 'all' || shop.region === filterRegion;
      const matchDistrict = filterDistrict === 'all' || shop.district === filterDistrict;
      const matchStatus = filterStatus === 'all' || shop.status === filterStatus;
      const matchBrand = filterBrand === 'all' || shop.brand === filterBrand;

      return matchSearch && matchRegion && matchDistrict && matchStatus && matchBrand;
    });
  }, [shops, searchText, filterRegion, filterDistrict, filterStatus, filterBrand]);

  // --- 2. 數據統計 ---
  const stats = useMemo(() => ({
    total: filteredData.length,
    completed: filteredData.filter(s => s.status === 'completed').length,
    pending: filteredData.filter(s => s.status === 'pending').length,
    closed: filteredData.filter(s => s.status === 'closed').length,
  }), [filteredData]);

  // --- 3. ExcelJS 安全匯出 ---
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Shop Master List');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 12 },
      { header: 'Brand', key: 'brand', width: 15 },
      { header: 'Shop Name', key: 'name', width: 30 },
      { header: 'Region', key: 'region', width: 15 },
      { header: 'District', key: 'district', width: 20 },
      { header: 'Area', key: 'area', width: 20 },
      { header: 'Schedule Date', key: 'scheduledDate', width: 15 },
      { header: 'Group', key: 'group', width: 10 },
      { header: 'Status', key: 'status', width: 12 },
    ];

    filteredData.forEach(s => {
      worksheet.addRow({
        id: s.id,
        brand: s.brand,
        name: s.name,
        region: s.region,
        district: s.district,
        area: s.area,
        scheduledDate: s.scheduledDate || 'TBC',
        group: s.groupId ? `Group ${String.fromCharCode(64 + s.groupId)}` : 'N/A',
        status: s.status.toUpperCase()
      });
    });

    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `Shop_Master_List_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

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
          {/* ✅ 修正：移除 size="small"，改用 type="secondary" 或 style */}
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
      render: (d: string) => d ? <span className="font-mono text-blue-600">{d}</span> : <Text type="secondary">Not Set</Text> 
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
      width: 100,
      render: (g: number) => g > 0 ? <Badge status="processing" text={`Group ${String.fromCharCode(64 + g)}`} /> : '-' 
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-900">Shop Master List</Title>
          <p className="text-slate-500 font-medium">Manage and monitor inventory progress across {shops.length} stores.</p>
        </div>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          onClick={exportToExcel}
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-8 rounded-2xl font-bold shadow-lg shadow-emerald-100"
        >
          Export to Excel
        </Button>
      </div>

      {/* --- 統計卡片 --- */}
      <Row gutter={20}>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Pooled</span>} value={stats.total} prefix={<ShopOutlined className="text-teal-600 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed</span>} value={stats.completed} prefix={<CheckCircleOutlined className="text-emerald-500 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending</span>} value={stats.pending} prefix={<ClockCircleOutlined className="text-blue-500 mr-2" />} />
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <Statistic title={<span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Closed</span>} value={stats.closed} prefix={<StopOutlined className="text-slate-300 mr-2" />} />
          </Card>
        </Col>
      </Row>

      {/* --- 篩選列 --- */}
      <Card className="rounded-2xl shadow-sm border-none bg-white" bodyStyle={{ padding: '20px 24px' }}>
        <Space wrap size="large">
          <Input 
            placeholder="Search Shop ID, Name..." 
            prefix={<SearchOutlined className="text-slate-400" />} 
            style={{ width: 300 }} 
            onChange={e => setSearchText(e.target.value)}
            className="rounded-xl bg-slate-50 border-none h-11"
          />
          <Space>
            <FilterOutlined className="text-slate-400 mr-2" />
            <Select placeholder="Region" style={{ width: 140 }} onChange={setFilterRegion} value={filterRegion}>
              <Select.Option value="all">All Regions</Select.Option>
              {Array.from(new Set(shops.map(s => s.region))).filter(Boolean).map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
            </Select>
            <Select placeholder="District" style={{ width: 160 }} onChange={setFilterDistrict} value={filterDistrict}>
              <Select.Option value="all">All Districts</Select.Option>
              {Array.from(new Set(shops.map(s => s.district))).filter(Boolean).map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
            </Select>
            <Select placeholder="Status" style={{ width: 130 }} onChange={setFilterStatus} value={filterStatus}>
              <Select.Option value="all">All Status</Select.Option>
              <Select.Option value="completed">Completed</Select.Option>
              <Select.Option value="pending">Pending</Select.Option>
              <Select.Option value="closed">Closed</Select.Option>
            </Select>
          </Space>
        </Space>
      </Card>

      {/* --- 表格 --- */}
      <Card className="rounded-[32px] shadow-sm border-none overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          pagination={{ 
            pageSize: 15, 
            showSizeChanger: true,
            className: 'px-6 py-4'
          }}
          scroll={{ x: 1000 }}
        />
      </Card>
    </div>
  );
};