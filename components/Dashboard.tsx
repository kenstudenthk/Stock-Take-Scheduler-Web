import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Empty, DatePicker, Typography, Radio, Modal, Badge } from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, EnvironmentOutlined, 
  CalendarOutlined, CloseCircleOutlined, CheckCircleOutlined, PrinterOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text, Title } = Typography;
const { confirm } = Modal;

export const Dashboard: React.FC<{shops: Shop[], onUpdateShop: any}> = ({ shops, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  const stats = useMemo(() => {
    const closed = shops.filter(s => s.status === 'Closed').length;
    const completed = shops.filter(s => s.status === 'completed').length;
    return { total: shops.length, completed, closed, pending: shops.length - completed - closed };
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter(s => dayjs(s.scheduledDate).format('YYYY-MM-DD') === selectedDate && (groupFilter === 'all' || s.groupId === groupFilter));
  }, [shops, selectedDate, groupFilter]);

  const handleCloseAction = (shop: Shop) => {
    confirm({
      title: 'Confirm Close Shop',
      content: `Are you sure you want to mark ${shop.name} as Closed?`,
      okText: 'Yes, Close',
      onOk: () => onUpdateShop?.(shop, { scheduleStatus: 'Closed' })
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 1. Greeting */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0">Hello Admin,</Title>
          <Text className="text-slate-400">Manage your daily stock take schedule below.</Text>
        </div>
        <Button icon={<PrinterOutlined />} className="bg-indigo-600 text-white rounded-xl h-11 border-none px-6" onClick={() => window.print()}>Generate Report</Button>
      </div>

      {/* 2. 4 Summary Boxes (Value Left, Logo Right) */}
      <Row gutter={[24, 24]}>
        <Col span={6}><StatCard label="Total Shop" value={stats.total} icon={<ShopOutlined />} color="text-teal-500" /></Col>
        <Col span={6}><StatCard label="Completed" value={stats.completed} icon={<CheckCircleOutlined />} color="text-emerald-500" /></Col>
        <Col span={6}><StatCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="text-slate-300" /></Col>
        <Col span={6}><StatCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} color="text-orange-500" /></Col>
      </Row>

      {/* 3. Main Data Area */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0 }}>
        {/* Group Tabs */}
        <div className="px-8 pt-6 border-b border-slate-50">
          <Radio.Group value={groupFilter} onChange={e => setGroupFilter(e.target.value)} className="custom-tabs pb-4">
            <Radio.Button value="all">ALL GROUPS</Radio.Button>
            <Radio.Button value={1}>GROUP A</Radio.Button>
            <Radio.Button value={2}>GROUP B</Radio.Button>
            <Radio.Button value={3}>GROUP C</Radio.Button>
          </Radio.Group>
        </div>

        {/* Date Filter Bar */}
        <div className="px-8 py-5 bg-slate-50/50 flex items-center justify-between">
          <Space direction="vertical" size={0}>
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Selected Date</Text>
            <DatePicker value={dayjs(selectedDate)} onChange={d => setSelectedDate(d?.format('YYYY-MM-DD') || '')} className="h-10 rounded-lg font-bold" allowClear={false} />
          </Space>
        </div>

        {/* Column Titles */}
        <div className="px-8 py-3 flex text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
          <div style={{ flex: 1 }}>Shop & Brand</div>
          <div style={{ width: 250 }}>Location</div>
          <div style={{ width: 120 }} className="text-center">Group</div>
          <div style={{ width: 150 }} className="text-right pr-4">Actions</div>
        </div>

        {/* Data Rows */}
        <div className="p-4 flex flex-col gap-2">
          {filteredShops.map(shop => {
            const isClosed = shop.status === 'Closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex items-center transition-all ${isClosed ? 'opacity-50 grayscale bg-slate-50' : 'bg-white hover:bg-slate-50'}`}>
                <div className="flex items-center gap-4" style={{ flex: 1 }}>
                  <img src={shop.brandIcon} className="h-10 w-10 object-contain rounded-lg border border-slate-100 p-1 bg-white" />
                  <div>
                    <h4 className={`m-0 font-bold ${isClosed ? 'line-through decoration-red-500 decoration-2' : ''}`}>{shop.name}</h4>
                    <Text className="text-[10px] text-slate-400">{shop.brand}</Text>
                  </div>
                </div>
                <div style={{ width: 250 }}><Text className="text-xs text-slate-500 truncate block">{shop.address}</Text></div>
                <div style={{ width: 120 }} className="text-center"><Tag color={isClosed ? 'default' : 'blue'} className="m-0 border-none font-bold text-[10px]">GROUP {String.fromCharCode(64+shop.groupId)}</Tag></div>
                <div style={{ width: 150 }} className="flex justify-end gap-3 pr-2">
                   <Button size="small" disabled={isClosed} className="rounded-lg font-bold text-[10px]">Re-Schedule</Button>
                   <button className="bin-button" disabled={isClosed} onClick={() => handleCloseAction(shop)}>
                     <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <style>{`
        .custom-tabs .ant-radio-button-wrapper { border: none !important; background: transparent !important; color: #94a3b8; font-weight: 800; font-size: 13px; }
        .custom-tabs .ant-radio-button-wrapper-checked { color: #4f46e5 !important; }
        .custom-tabs .ant-radio-button-wrapper-checked::after { content: ""; position: absolute; bottom: -12px; left: 16px; right: 16px; height: 3px; background: #4f46e5; border-radius: 10px; }
        
        .bin-button { width: 36px; height: 36px; border-radius: 50%; background-color: #fee2e2; border: none; cursor: pointer; transition-duration: .3s; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .bin-svgIcon { width: 12px; transition-duration: .3s; }
        .bin-svgIcon path { fill: #ef4444; }
        .bin-button:hover { width: 100px; border-radius: 50px; background-color: #ef4444; }
        .bin-button:hover .bin-svgIcon { width: 40px; transform: translateY(60%); }
        .bin-button:hover .bin-svgIcon path { fill: white; }
        .bin-button::before { position: absolute; top: -20px; content: "CLOSE"; color: white; transition-duration: .3s; font-size: 2px; }
        .bin-button:hover::before { font-size: 10px; opacity: 1; transform: translateY(30px); }
        .bin-button:disabled { cursor: not-allowed; opacity: 0.3; }
      `}</style>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <Card className="rounded-3xl border-none shadow-sm relative overflow-hidden h-full" bodyStyle={{ padding: '24px' }}>
    <div className="relative z-10">
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</Text>
      <Title level={1} className="m-0 font-black">{value}</Title>
    </div>
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-10 ${color}`}>{icon}</div>
  </Card>
);
