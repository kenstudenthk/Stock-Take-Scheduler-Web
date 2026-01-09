import React, { useState, useEffect, useRef } from 'react';
import { Table, Card, Row, Col, Space, Select, Input, Badge, Button } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Shop } from '../types';

if (typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: 'e8fbca88770fac2110a951fab66651ab' };
}

export const Locations: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    AMapLoader.load({
      key: "a444f584e377f930c102c6b0b2cb118e",
      version: "2.0",
      plugins: ['AMap.Marker'],
    }).then((AMap) => {
      if (!mapRef.current) return;
      mapInstance.current = new AMap.Map(mapRef.current, { zoom: 11, center: [114.177, 22.3] });
      shops.forEach(s => {
        if (s.latitude && s.longitude) {
          const color = s.groupId === 1 ? '#fa8c16' : s.groupId === 2 ? '#1890ff' : '#52c41a';
          const marker = new AMap.Marker({
             position: [s.longitude, s.latitude],
             content: `<div style="background:${color}; width:10px; height:10px; border-radius:50%; border:2px solid white; box-shadow:0 0 5px rgba(0,0,0,0.2)"></div>`
          });
          mapInstance.current.add(marker);
        }
      });
    });
  }, [shops]);

  return (
    <Space direction="vertical" size={20} className="w-full">
      <Card bodyStyle={{ padding: '12px 24px' }} className="border-none shadow-sm">
        <Space size="large">
          <Select defaultValue="all" className="w-48" suffixIcon={<FilterOutlined />}>
            <Select.Option value="all">All Regions</Select.Option>
          </Select>
          <Select defaultValue="all" className="w-48">
            <Select.Option value="all">All Districts</Select.Option>
          </Select>
          <Button className="font-bold">Reset</Button>
          <Button type="primary" className="bg-teal-600 font-bold px-6">Apply Filters</Button>
        </Space>
      </Card>

      <Row gutter={20}>
        <Col span={6}><Card size="small" title={<span className="text-[10px] uppercase text-slate-400">Total Visible Shops</span>}><div className="text-2xl font-bold">146 <span className="text-xs text-emerald-500 ml-2">+12% vs last month</span></div></Card></Col>
        <Col span={6}><Card size="small" title={<span className="text-[10px] uppercase text-slate-400">Pending Action</span>}><div className="text-2xl font-bold text-red-500">15</div></Card></Col>
        <Col span={6}><Card size="small" title={<span className="text-[10px] uppercase text-slate-400">Scheduled</span>}><div className="text-2xl font-bold text-orange-500">42</div></Card></Col>
        <Col span={6}><Card size="small" title={<span className="text-[10px] uppercase text-slate-400">Completed</span>}><div className="text-2xl font-bold text-emerald-500">89</div></Card></Col>
      </Row>

      <Row gutter={20}>
        <Col span={15}>
          <div ref={mapRef} style={{ height: '550px', borderRadius: '16px', background: '#e2e8f0', position: 'relative' }}>
             <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button icon={<EnvironmentOutlined />} className="shadow-md" />
             </div>
          </div>
        </Col>
        <Col span={9}>
          <Card title="Shop List" extra={<Space><FilterOutlined /><DownloadOutlined /></Space>} className="border-none shadow-sm h-[550px] overflow-hidden flex flex-col">
             <Table 
                dataSource={shops.slice(0, 5)} 
                pagination={false}
                size="small"
                columns={[
                   { title: 'ST', dataIndex: 'status', width: 40, render: (s) => <Badge color={s === 'completed' ? 'green' : 'orange'} /> },
                   { title: 'ID', dataIndex: 'id', width: 60, render: (t) => <span className="text-xs font-bold text-slate-400">KLN {t.slice(-3)}</span> },
                   { title: 'SHOP NAME', dataIndex: 'name', render: (t) => <span className="text-xs font-bold text-slate-700">{t}</span> },
                   { title: 'DISTRICT', dataIndex: 'area', render: (t) => <span className="text-xs font-medium text-slate-400">{t}</span> }
                ]}
             />
             <div className="mt-auto pt-4 flex justify-between items-center text-xs text-slate-400 font-bold">
                <span>Total 948 shops</span>
                <Space><span>1</span> <span>2</span> <span>3</span> <span>...</span> <span>95</span></Space>
             </div>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};