import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Empty, DatePicker, Typography, Modal, message } from 'antd';
import { 
  ShopOutlined, HourglassOutlined, CheckCircleOutlined, 
  PrinterOutlined, EnvironmentOutlined, CalendarOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Text, Title } = Typography;
const { confirm } = Modal;

// 2026 香港公眾假期清單
const HK_HOLIDAYS_2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19", 
  "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07",
  "2026-05-01", "2026-05-24", "2026-05-25", "2026-06-19", 
  "2026-07-01", "2026-09-26", "2026-10-01", "2026-10-19", 
  "2026-12-25", "2026-12-26"
];

// --- 統計卡片組件 ---
const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="card-item">
    <div className="img-section" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
    <div className="card-desc">
      <div className="card-header">
        <div className="card-title">{label}</div>
        <div className="card-menu">
          <div className="dot"></div><div className="dot"></div><div className="dot"></div>
        </div>
      </div>
      <div className="card-time">{value}</div>
      <p className="recent-text">{subtext}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<{
  shops: Shop[], 
  onUpdateShop: any, 
  graphToken: string, 
  onRefresh: () => void 
}> = ({ shops, onUpdateShop, graphToken, onRefresh }) => {
  
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  
  const [isReschedOpen, setIsReschedOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);
  const [reschedDate, setReschedDate] = useState<dayjs.Dayjs | null>(null);

  // ✅ 篩選活躍門市：排除去年已關閉的店 (Master Closed)
  const activeShops = useMemo(() => {
    return shops.filter(s => s.masterStatus !== 'Closed');
  }, [shops]);

  // --- 統計邏輯 ---
  const stats = useMemo(() => {
    const total = activeShops.length;
    const completed = activeShops.filter(s => s.status === 'Done' || s.status === 'Re-Open').length;
    const closedThisYear = activeShops.filter(s => s.status === 'Closed').length;
    
    return { 
      total, 
      completed, 
      closed: closedThisYear, 
      remain: total - completed - closedThisYear  
    };
  }, [activeShops]);

  // --- 🔴 關鍵修復：智能校驗函數 ---
  const checkDateAvailability = (date: dayjs.Dayjs, shop: Shop) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayOfWeek = date.day();

    // 1. 基礎限制：跳過週日與公眾假期
    if (dayOfWeek === 0) return { valid: false, reason: "Sunday" };
    if (HK_HOLIDAYS_2026.includes(dateStr)) return { valid: false, reason: "Holiday" };

    // 2. 獲取該日已有的活躍門市
    const shopsOnDay = activeShops.filter(s => s.scheduledDate === dateStr);

    // 3. 每日上限：不能超過 9 間店
    if (shopsOnDay.length >= 9) return { valid: false, reason: "Full" };

    // 4. 僅在日期非空時執行 MTR 和 區域檢查
    if (shopsOnDay.length > 0) {
      const isDayMtrOnly = shopsOnDay.some(s => s.is_mtr);
      
      // ✅ C. MTR 邏輯修復：類型必須一致
      if (shop.is_mtr !== isDayMtrOnly) {
        return { valid: false, reason: isDayMtrOnly ? "MTR Day Only" : "Street Shops Only" };
      }

      // ✅ D. 區域限制修復：必須同區域
      if (!shopsOnDay.some(s => s.region === shop.region)) {
        return { valid: false, reason: "Different Region" };
      }
    }

    return { valid: true };
  };

  const fastestDate = useMemo(() => {
    if (!targetShop) return null;
    let current = dayjs().add(1, 'day');
    for (let i = 0; i < 60; i++) {
      if (checkDateAvailability(current, targetShop).valid) return current;
      current = current.add(1, 'day');
    }
    return null;
  }, [targetShop, activeShops]);

  const handleConfirmReschedule = async () => {
    if (!targetShop || !reschedDate) return;
    const formattedDate = reschedDate.format('YYYY-MM-DD');
    const shopsOnNewDay = activeShops.filter(s => s.scheduledDate === formattedDate);
    const newGroupId = shopsOnNewDay.length > 0 ? shopsOnNewDay[0].groupId : targetShop.groupId;

    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${targetShop.sharePointItemId}/fields`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [SP_FIELDS.STATUS]: 'Reschedule',
            [SP_FIELDS.SCHEDULE_DATE]: formattedDate,
            [SP_FIELDS.SCHEDULE_GROUP]: newGroupId.toString()
          })
        }
      );
      if (res.ok) {
        message.success(`${targetShop.name} moved to ${formattedDate}`);
        setIsReschedOpen(false);
        onRefresh();
      }
    } catch (err) { message.error("Sync Error"); }
  };

  const handleCloseShop = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined />,
      content: `Mark "${shop.name}" as CLOSED?`,
      okText: 'Yes, Close',
      okType: 'danger',
      onOk: async () => {
        try {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.STATUS]: 'Closed' })
          });
          message.success("Shop marked as Closed.");
          onRefresh();
        } catch (err) { message.error("Update failed"); }
      },
    });
  };

  const filteredShops = useMemo(() => {
    return activeShops.filter(s => 
      dayjs(s.scheduledDate).format('YYYY-MM-DD') === selectedDate && 
      (groupFilter === 'all' || s.groupId === groupFilter)
    );
  }, [activeShops, selectedDate, groupFilter]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Hello Admin,</Title>
          <Text className="text-slate-400 font-medium">Daily schedule for Active Shops only.</Text>
        </div>
        <Button icon={<PrinterOutlined />} className="rounded-xl font-bold h-11 bg-slate-900 text-white border-none px-6" onClick={() => window.print()}>Generate Report</Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={stats.total} subtext="Active Master" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5 }} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} subtext="Done this year" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5 }} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} subtext="Closed this year" bgColor="#ff4545" icon={<CloseCircleOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5 }} />} /></Col>
        <Col span={6}><SummaryCard label="Remain" value={stats.remain} subtext="Pending action" bgColor="#f1c40f" icon={<HourglassOutlined style={{ fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5 }} />} /></Col>
      </Row>

      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <div className="p-8"><DatePicker value={dayjs(selectedDate)} onChange={d => setSelectedDate(d?.format('YYYY-MM-DD') || '')} className="h-12 w-64 rounded-xl font-bold" /></div>
        <div className="p-4 flex flex-col gap-2">
          {filteredShops.length === 0 ? <Empty className="py-20" /> : filteredShops.map(shop => {
            const isClosed = shop.status?.toLowerCase() === 'closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex items-center transition-all ${isClosed ? 'opacity-40 bg-slate-50' : 'bg-white hover:bg-slate-50/80 shadow-sm'}`}>
                <div className="flex items-center gap-4" style={{ flex: 1 }}>
                  <img src={shop.brandIcon} alt={shop.brand} className="h-10 w-10 object-contain rounded-lg border border-slate-100 p-1 bg-white" />
                  <div className="flex flex-col">
                    <h4 className={`m-0 font-bold ${isClosed ? 'line-through decoration-red-500' : ''}`}>{shop.name}</h4>
                    <Text className="text-[10px] font-bold text-slate-400 uppercase">{shop.brand} {shop.is_mtr ? '(MTR)' : ''}</Text>
                  </div>
                </div>
                <div style={{ width: 300 }}><Text className="text-xs text-slate-500 italic truncate block">{shop.address}</Text></div>
                <div style={{ width: 120 }} className="text-center"><Tag className="m-0 border-none font-black text-[10px] px-3 rounded-md bg-indigo-50 text-indigo-600">GROUP {String.fromCharCode(64+shop.groupId)}</Tag></div>
                <div style={{ width: 180 }} className="flex justify-end gap-3">
                   <Button size="small" disabled={isClosed} className="rounded-lg font-bold text-[10px]" onClick={() => { setTargetShop(shop); setReschedDate(null); setIsReschedOpen(true); }}>Re-Schedule</Button>
                   <button className="bin-button" disabled={isClosed} onClick={() => handleCloseShop(shop)}>
                     <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal title={<Space><CalendarOutlined className="text-indigo-600" /><span>Smart Reschedule</span></Space>} open={isReschedOpen} onOk={handleConfirmReschedule} onCancel={() => setIsReschedOpen(false)} okText="Confirm New Date" width={450} centered>
        <div className="py-4">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Text type="secondary" className="text-xs uppercase font-bold block mb-1">Target Shop</Text><Text strong className="text-lg text-indigo-900">{targetShop?.name}</Text></div>
          <DatePicker className="w-full h-12 rounded-xl" disabledDate={d => (d && d < dayjs().startOf('day')) || !checkDateAvailability(d, targetShop!).valid} value={reschedDate} onChange={val => setReschedDate(val)} />
          {fastestDate && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
              <div><Text className="text-green-700 text-xs block">Fastest Suggest Reschedule Date</Text><Text className="text-green-800 font-bold">{fastestDate.format('YYYY-MM-DD (dddd)')}</Text></div>
              <Button type="link" size="small" onClick={() => setReschedDate(fastestDate)}>Use This</Button>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .card-item { --primary-clr: #1C204B; --dot-clr: #BBC0FF; width: 100%; height: 160px; border-radius: 15px; color: #fff; display: grid; cursor: pointer; grid-template-rows: 40px 1fr; overflow: hidden; transition: all 0.3s ease; }
        .card-item:hover { transform: translateY(-5px); }
        .img-section { transition: 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); border-top-left-radius: 15px; border-top-right-radius: 15px; display: flex; justify-content: flex-end; padding-right: 20px; }
        .card-desc { border-radius: 15px; padding: 15px 20px; position: relative; top: -10px; display: grid; background: var(--primary-clr); z-index: 2; }
        .card-time { font-size: 2em; font-weight: 700; line-height: 1; }
        .card-title { flex: 1; font-size: 0.85em; font-weight: 500; color: var(--dot-clr); text-transform: uppercase; letter-spacing: 1px; }
        .card-header { display: flex; align-items: center; width: 100%; margin-bottom: 5px; }
        .card-menu { display: flex; gap: 3px; }
        .card-menu .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--dot-clr); }
        .recent-text { font-size: 0.75em; color: var(--dot-clr); opacity: 0.7; }
        .bin-button { width: 36px; height: 36px; border-radius: 50%; background-color: #fee2e2; border: none; cursor: pointer; transition-duration: .3s; overflow: hidden; position: relative; display: flex; align-items: center; justify-content: center; }
        .bin-svgIcon { width: 14px; transition-duration: .3s; }
        .bin-svgIcon path { fill: #ef4444; }
        .bin-button:hover { width: 100px; border-radius: 50px; background-color: #ef4444; }
        .bin-button:hover .bin-svgIcon { width: 40px; transform: translateY(60%); }
        .bin-button:hover .bin-svgIcon path { fill: white; }
        .bin-button::before { position: absolute; top: -20px; content: "CLOSE"; color: white; transition-duration: .3s; font-size: 2px; }
        .bin-button:hover::before { font-size: 11px; opacity: 1; transform: translateY(32px); }
      `}</style>
    </div>
  );
};
