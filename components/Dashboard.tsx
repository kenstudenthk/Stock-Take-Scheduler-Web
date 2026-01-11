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

// --- 統計卡片組件 (Uiverse 樣式) ---
const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="card-item">
    <div className="img-section" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
    <div className="card-desc">
      <div className="card-header">
        <div className="card-title">{label}</div>
        <div className="card-menu">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <div className="card-time">{value}</div>
      <p className="recent-text">{subtext}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<{shops: Shop[], onUpdateShop: any}> = ({ shops, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // --- 統計邏輯 ---
  const stats = useMemo(() => {
    const closed = shops.filter(s => s.status === 'Closed' || s.status === 'closed').length;
    const completed = shops.filter(s => s.status === 'completed' || s.status === 'Done').length;
    return { total: shops.length, completed, closed, pending: shops.length - completed - closed };
  }, [shops]);

  // --- 過濾邏輯 ---
  const filteredShops = useMemo(() => {
    return shops.filter(s => 
      dayjs(s.scheduledDate).format('YYYY-MM-DD') === selectedDate && 
      (groupFilter === 'all' || s.groupId === groupFilter)
    );
  }, [shops, selectedDate, groupFilter]);

  const handleCloseAction = (shop: Shop) => {
    confirm({
      title: 'Confirm Close Shop',
      content: `Mark "${shop.name}" as Closed? This will sync back to SharePoint.`,
      okText: 'Yes, Close',
      onOk: () => onUpdateShop?.(shop, { scheduleStatus: 'Closed' })
    });
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 1. Header 部分 */}
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

      {/* 2. 4 Summary Boxes (Uiverse 風格) */}
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <SummaryCard 
            label="Total Shop" 
            value={stats.total} 
            subtext="Overall target list"
            bgColor="hsl(195, 74%, 62%)" 
            icon={<ShopOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }} />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard 
            label="Completed" 
            value={stats.completed} 
            subtext="Sync success"
            bgColor="hsl(145, 58%, 55%)"
            icon={<CheckCircleOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }} />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard 
            label="Closed" 
            value={stats.closed} 
            subtext="Exceptions handled"
            bgColor="#ff4545" 
            icon={
              <svg viewBox="0 0 48 48" fill="white" style={{ width: '45px', height: '45px', marginTop: '8px' }}>
                <g id="Health_Icons">
                  <path d="M45.8,16.4v-.3L40.8,5.2A2,2,0,0,0,39,4H11.5c-.4,0-.6.5-.3.9L14.3,8H37.7L42,17.6a2.1,2.1,0,0,1-.4,1.5,2.1,2.1,0,0,1-1.8.9h-1a2.1,2.1,0,0,1-2.2-2.1,2.1,2.1,0,0,0-1.7-2,2,2,0,0,0-2.3,2A2.1,2.1,0,0,1,30.4,20H28.2A2.1,2.1,0,0,1,26,17.9a2,2,0,0,0-2-2,2.1,2.1,0,0,0-1.3.5L30.3,24h.1a6.3,6.3,0,0,0,4.2-1.6A5.9,5.9,0,0,0,38,23.9v7.8l3.1,3.1c.4.3.9.1.9-.3V23.6a6.9,6.9,0,0,0,2.8-2A6,6,0,0,0,45.8,16.4Z"></path>
                  <path d="M5.4,4.6a1.9,1.9,0,0,0-2.8,0,1.9,1.9,0,0,0,0,2.8L5.1,9.9,2.3,16.1v.3a6,6,0,0,0,1,5.2,6.9,6.9,0,0,0,2.8,2V41a3,3,0,0,0,3,3H39.2l1.4,1.4a1.9,1.9,0,0,0,2.8,0,1.9,1.9,0,0,0,0-2.8Zm6.4,12.1a2.1,2.1,0,0,0-.4,1.2A2.1,2.1,0,0,1,9.2,20h-1a2.1,2.1,0,0,1-1.8-.9A2.1,2.1,0,0,1,6,17.6l2.1-4.7ZM10,40V23.9a5.9,5.9,0,0,0,3.4-1.5A6.3,6.3,0,0,0,17.6,24h1.6l3,3H13V37H24V28.8l4,4V40Z"></path>
                </g>
              </svg>
            }
          />
        </Col>
        <Col span={6}>
          <SummaryCard 
            label="Remaining" 
            value={stats.pending} 
            subtext="Pending action"
            bgColor="#f1c40f" 
            icon={<HourglassOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.7)', marginTop: '5px' }} />}
          />
        </Col>
      </Row>

      {/* 3. 資料卡片 */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        
        {/* Group Tabs (Uiverse 樣式) */}
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

        {/* Date Filter */}
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

        {/* Column Titles */}
        <div className="px-8 py-4 flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50">
          <div style={{ flex: 1 }}>Shop & Brand</div>
          <div style={{ width: 300 }}>Location Detail</div>
          <div style={{ width: 120 }} className="text-center">Group</div>
          <div style={{ width: 150 }} className="text-right pr-4">Actions</div>
        </div>

        {/* 門市數據行 */}
        <div className="p-4 flex flex-col gap-2">
          {filteredShops.length === 0 ? <Empty className="py-20" /> : filteredShops.map(shop => {
            const isClosed = shop.status === 'Closed' || shop.status === 'closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex items-center transition-all ${isClosed ? 'opacity-40 grayscale bg-slate-50' : 'bg-white hover:bg-slate-50/80'}`}>
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
                   <button className="bin-button" disabled={isClosed} onClick={() => handleCloseAction(shop)}>
                     <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 全局 CSS (包含新統計卡片與按鈕動畫) */}
      <style>{`
        /* 統計卡片 CSS */
        .card-item {
          --primary-clr: #1C204B;
          --dot-clr: #BBC0FF;
          width: 100%;
          height: 160px;
          border-radius: 15px;
          color: #fff;
          display: grid;
          cursor: pointer;
          grid-template-rows: 40px 1fr;
          overflow: hidden;
          transition: all 0.3s ease;
        }
        .card-item:hover { transform: translateY(-5px); }
        .img-section {
          transition: 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94);
          border-top-left-radius: 15px;
          border-top-right-radius: 15px;
          display: flex;
          justify-content: flex-end;
          padding-right: 20px;
        }
        .card-desc {
          border-radius: 15px;
          padding: 15px 20px;
          position: relative;
          top: -10px;
          display: grid;
          background: var(--primary-clr);
          z-index: 2;
        }
        .card-time { font-size: 2em; font-weight: 700; line-height: 1; }
        .card-title { flex: 1; font-size: 0.85em; font-weight: 500; color: var(--dot-clr); text-transform: uppercase; letter-spacing: 1px; }
        .card-header { display: flex; align-items: center; width: 100%; margin-bottom: 5px; }
        .card-menu { display: flex; gap: 3px; }
        .card-menu .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--dot-clr); }
        .recent-text { font-size: 0.75em; color: var(--dot-clr); opacity: 0.7; }

        /* Bin Button CSS */
        .bin-button { width: 36px; height: 36px; border-radius: 50%; background-color: #fee2e2; border: none; cursor: pointer; transition-duration: .3s; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .bin-svgIcon { width: 14px; transition-duration: .3s; }
        .bin-svgIcon path { fill: #ef4444; }
        .bin-button:hover { width: 100px; border-radius: 50px; background-color: #ef4444; align-items: center; }
        .bin-button:hover .bin-svgIcon { width: 40px; transform: translateY(60%); }
        .bin-button:hover .bin-svgIcon path { fill: white; }
        .bin-button::before { position: absolute; top: -20px; content: "CLOSE"; color: white; transition-duration: .3s; font-size: 2px; }
        .bin-button:hover::before { font-size: 11px; opacity: 1; transform: translateY(32px); transition-duration: .3s; }
        .bin-button:disabled { cursor: not-allowed; opacity: 0.3; }
      `}</style>
    </div>
  );
};
