import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Empty, DatePicker, Typography, Modal, Badge } from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  CalendarOutlined, CloseCircleOutlined, CheckCircleOutlined, PrinterOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';

const { Text, Title } = Typography;
const { confirm } = Modal;

export const Dashboard: React.FC<{shops: Shop[], onUpdateShop: any}> = ({ shops, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // --- 統計與過濾邏輯 ---
  const stats = useMemo(() => {
    const closed = shops.filter(s => s.status === 'Closed').length;
    const completed = shops.filter(s => s.status === 'completed').length;
    return { total: shops.length, completed, closed, pending: shops.length - completed - closed };
  }, [shops]);

  const filteredShops = useMemo(() => {
    return shops.filter(s => 
      dayjs(s.scheduledDate).format('YYYY-MM-DD') === selectedDate && 
      (groupFilter === 'all' || s.groupId === groupFilter)
    );
  }, [shops, selectedDate, groupFilter]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 1. Greeting & Report Button */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Hello Admin,</Title>
          <Text className="text-slate-400 font-medium">Manage your daily stock take schedule below.</Text>
        </div>
        <Button 
          icon={<PrinterOutlined />} 
          className="rounded-xl font-bold h-11 bg-slate-900 text-white border-none px-6"
          onClick={() => window.print()}
        >
          Generate Report
        </Button>
      </div>

      {/* 2. 4 Summary Boxes (參考之前設計) */}
      <Row gutter={[24, 24]}>
        <Col span={6}><StatCard label="Total Shop" value={stats.total} icon={<ShopOutlined />} color="text-teal-500" /></Col>
        <Col span={6}><StatCard label="Completed" value={stats.completed} icon={<CheckCircleOutlined />} color="text-emerald-500" /></Col>
        <Col span={6}><StatCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="text-slate-300" /></Col>
        <Col span={6}><StatCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} color="text-orange-500" /></Col>
      </Row>

      {/* 3. Main Content Card */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        
        {/* ✅ ✅ ✅ 新的自定義 Group Tabs (Uiverse 樣式) ✅ ✅ ✅ */}
        <div className="px-8 pt-8 pb-4">
          <div className="wrapper">
            <label className="option">
              <input className="input" type="radio" name="btn" checked={groupFilter === 'all'} onChange={() => setGroupFilter('all')} />
              <div className="btn"><span className="span">ALL</span></div>
            </label>
            <label className="option">
              <input className="input" type="radio" name="btn" checked={groupFilter === 1} onChange={() => setGroupFilter(1)} />
              <div className="btn"><span className="span">GROUP A</span></div>
            </label>
            <label className="option">
              <input className="input" type="radio" name="btn" checked={groupFilter === 2} onChange={() => setGroupFilter(2)} />
              <div className="btn"><span className="span">GROUP B</span></div>
            </label>
            <label className="option">
              <input className="input" type="radio" name="btn" checked={groupFilter === 3} onChange={() => setGroupFilter(3)} />
              <div className="btn"><span className="span">GROUP C</span></div>
            </label>
          </div>
        </div>

        {/* 4. Date Filter */}
        <div className="px-8 py-5 bg-slate-50/50 flex items-center">
          <div className="flex flex-col">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule Date</Text>
            <DatePicker 
              value={dayjs(selectedDate)} 
              onChange={d => setSelectedDate(d?.format('YYYY-MM-DD') || '')} 
              className="h-10 rounded-xl font-bold border-slate-200" 
              allowClear={false} 
            />
          </div>
        </div>

        {/* 5. Column Titles */}
        <div className="px-8 py-4 flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
          <div style={{ flex: 1 }}>Shop & Brand</div>
          <div style={{ width: 300 }}>Location Detail</div>
          <div style={{ width: 120 }} className="text-center">Group</div>
          <div style={{ width: 150 }} className="text-right pr-4">Actions</div>
        </div>

        {/* 6. Data Rows */}
        <div className="p-4 flex flex-col gap-2">
          {filteredShops.length === 0 ? <Empty className="py-20" /> : filteredShops.map(shop => {
            const isClosed = shop.status === 'Closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex items-center transition-all ${isClosed ? 'opacity-40 grayscale bg-slate-50' : 'bg-white hover:bg-slate-50/80 border border-transparent hover:border-slate-100'}`}>
                <div className="flex items-center gap-4" style={{ flex: 1 }}>
                  <img src={shop.brandIcon} className="h-10 w-10 object-contain rounded-lg border border-slate-100 p-1 bg-white" />
                  <div className="flex flex-col">
                    <h4 className={`m-0 font-bold text-slate-800 ${isClosed ? 'line-through decoration-red-500 decoration-2' : ''}`}>{shop.name}</h4>
                    <Text className="text-[10px] font-bold text-slate-400">{shop.brand}</Text>
                  </div>
                </div>
                <div style={{ width: 300 }}><Text className="text-xs text-slate-500 italic">{shop.address}</Text></div>
                <div style={{ width: 120 }} className="text-center">
                  <Tag className={`m-0 border-none font-black text-[10px] px-3 rounded-md ${isClosed ? 'bg-slate-200' : 'bg-indigo-50 text-indigo-600'}`}>
                    GROUP {String.fromCharCode(64+shop.groupId)}
                  </Tag>
                </div>
                <div style={{ width: 150 }} className="flex justify-end gap-3 pr-2">
                   <Button size="small" disabled={isClosed} className="rounded-lg font-bold text-[10px]">Re-Schedule</Button>
                   <button className="bin-button" disabled={isClosed} onClick={() => onUpdateShop?.(shop, { scheduleStatus: 'Closed' })}>
                     <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => (
  <Card className="rounded-[24px] border-none shadow-sm relative overflow-hidden h-full bg-white" bodyStyle={{ padding: '24px' }}>
    <div className="relative z-10">
      <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">{label}</Text>
      <Title level={1} className="m-0 font-black text-slate-800 tracking-tight">{value}</Title>
    </div>
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-10 ${color}`}>{icon}</div>
  </Card>
);
