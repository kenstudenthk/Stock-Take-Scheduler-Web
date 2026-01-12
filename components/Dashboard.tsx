import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Empty, DatePicker, Typography, Modal, message, Badge } from 'antd';
import { 
  CalendarOutlined, ExclamationCircleOutlined, CheckCircleOutlined, 
  PrinterOutlined, EnvironmentOutlined, ShopOutlined, HourglassOutlined, CloseCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Text, Title } = Typography;
const { confirm } = Modal;

// --- 統計卡片組件 ---
const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="card-item">
    <div className="img-section" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="card-desc">
      <div className="card-header"><div className="card-title">{label}</div></div>
      <div className="card-time">{value}</div>
      <p className="recent-text">{subtext}</p>
    </div>
  </div>
);

interface Props {
  shops: Shop[];
  onUpdateShop: any;
  graphToken: string;
  onRefresh: () => void;
}

export const Dashboard: React.FC<Props> = ({ shops, onUpdateShop, graphToken, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  
  // --- Reschedule State ---
  const [isReschedOpen, setIsReschedOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);
  const [reschedDate, setReschedDate] = useState<dayjs.Dayjs | null>(null);

  // --- 智能排程邏輯 (Smart Validation) ---
  const checkDateAvailability = (date: dayjs.Dayjs, shop: Shop) => {
    const dateStr = date.format('YYYY-MM-DD');
    const shopsOnThatDay = shops.filter(s => s.scheduledDate === dateStr);

    // 1. 每日上限 9 間店
    if (shopsOnThatDay.length >= 9) return { valid: false, reason: "Date Full (9 shops)" };

    // 2. MTR 邏輯: 如果是 MTR 店，該日必須也有 MTR 店或者該日為空
    if (shop.is_mtr) {
      const hasMTR = shopsOnThatDay.some(s => s.is_mtr);
      if (shopsOnThatDay.length > 0 && !hasMTR) return { valid: false, reason: "MTR Grouping Only" };
    }

    // 3. 距離邏輯: 檢查是否在同一區域 (Region)
    if (shopsOnThatDay.length > 0) {
      const isSameRegion = shopsOnThatDay.some(s => s.region === shop.region);
      if (!isSameRegion) return { valid: false, reason: "Too Far (Region mismatch)" };
    }

    return { valid: true };
  };

  // --- 尋找最早可用日期 ---
  const fastestDate = useMemo(() => {
    if (!targetShop) return null;
    let current = dayjs().add(1, 'day');
    for (let i = 0; i < 30; i++) {
      if (checkDateAvailability(current, targetShop).valid) return current;
      current = current.add(1, 'day');
    }
    return null;
  }, [targetShop, shops]);

  const disabledDate = (current: dayjs.Dayjs) => {
    if (!targetShop) return false;
    // 禁用過去的日期
    if (current && current < dayjs().startOf('day')) return true;
    // 使用智能邏輯檢查
    return !checkDateAvailability(current, targetShop).valid;
  };

  const handleConfirmReschedule = async () => {
    if (!targetShop || !reschedDate) return;

    const formattedDate = reschedDate.format('YYYY-MM-DD');
    
    // 計算新的 Group ID (根據該日已有的店，或者沿用)
    const shopsOnNewDay = shops.filter(s => s.scheduledDate === formattedDate);
    const newGroupId = shopsOnNewDay.length > 0 ? shopsOnNewDay[0].groupId : targetShop.groupId;

    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${targetShop.sharePointItemId}/fields`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [SP_FIELDS.STATUS]: 'Rescheduled',
            [SP_FIELDS.SCHEDULE_DATE]: formattedDate,
            [SP_FIELDS.SCHEDULE_GROUP]: newGroupId.toString()
          })
        }
      );

      if (res.ok) {
        Modal.success({
          title: 'Reschedule Successful',
          content: `${targetShop.name} has been moved to ${formattedDate}. Status: Rescheduled.`,
          onOk: () => {
            setIsReschedOpen(false);
            onRefresh();
          }
        });
      }
    } catch (err) {
      message.error("Sync Error");
    }
  };

  // --- 統計與過濾邏輯 ---
  const stats = useMemo(() => {
    const closed = shops.filter(s => s.status?.toLowerCase() === 'closed').length;
    const completed = shops.filter(s => s.status?.toLowerCase() === 'completed' || s.status === 'Done').length;
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
      {/* 1. Header & 2. Summary Boxes (代碼省略，保持您原有的) */}
      <div className="flex justify-between items-center">
        <Title level={2}>Hello Admin,</Title>
        <Button icon={<PrinterOutlined />} onClick={() => window.print()}>Generate Report</Button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total" value={stats.total} bgColor="#3498db" icon={<ShopOutlined />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#2ecc71" icon={<CheckCircleOutlined />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#e74c3c" icon={<CloseCircleOutlined />} /></Col>
        <Col span={6}><SummaryCard label="Pending" value={stats.pending} bgColor="#f1c40f" icon={<HourglassOutlined />} /></Col>
      </Row>

      {/* 3. 資料列表 */}
      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        <div className="p-8">
          <DatePicker value={dayjs(selectedDate)} onChange={d => setSelectedDate(d?.format('YYYY-MM-DD') || '')} className="h-12 w-64 rounded-xl font-bold" />
        </div>

        <div className="p-4 flex flex-col gap-2">
          {filteredShops.length === 0 ? <Empty className="py-20" /> : filteredShops.map(shop => {
            const isClosed = shop.status?.toLowerCase() === 'closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex items-center transition-all ${isClosed ? 'opacity-40 grayscale bg-slate-50' : 'bg-white hover:bg-slate-50/80'}`}>
                <div className="flex items-center gap-4" style={{ flex: 1 }}>
                  <div className="h-10 w-10 flex items-center justify-center bg-slate-100 rounded-lg font-bold text-slate-400">{shop.brand[0]}</div>
                  <div className="flex flex-col">
                    <h4 className={`m-0 font-bold ${isClosed ? 'line-through decoration-red-500' : ''}`}>{shop.name}</h4>
                    <Text className="text-[10px] text-slate-400 font-bold uppercase">{shop.brand} {shop.is_mtr ? '(MTR)' : ''}</Text>
                  </div>
                </div>
                <div style={{ width: 300 }}><Text className="text-xs text-slate-500">{shop.address}</Text></div>
                <div style={{ width: 120 }} className="text-center">
                  <Tag className="bg-indigo-50 text-indigo-600 border-none font-black text-[10px]">GROUP {String.fromCharCode(64+shop.groupId)}</Tag>
                </div>
                <div style={{ width: 180 }} className="flex justify-end gap-3">
                  <Button 
                    size="small" 
                    className="rounded-lg font-bold text-[10px]"
                    disabled={isClosed}
                    onClick={() => {
                      setTargetShop(shop);
                      setReschedDate(null);
                      setIsReschedOpen(true);
                    }}
                  >
                    Re-Schedule
                  </Button>
                  <button className="bin-button" disabled={isClosed} onClick={() => {}}>
                     <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* --- Smart Reschedule Modal --- */}
      <Modal
        title={<Space><CalendarOutlined className="text-indigo-600" /><span>Smart Reschedule</span></Space>}
        open={isReschedOpen}
        onOk={handleConfirmReschedule}
        onCancel={() => setIsReschedOpen(false)}
        okText="Confirm Reschedule"
        width={450}
        centered
      >
        <div className="py-4">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <Text type="secondary" className="text-xs uppercase font-bold block mb-1">Target Shop</Text>
            <Text strong className="text-lg text-indigo-900">{targetShop?.name}</Text>
            <div className="mt-2 flex gap-2">
              <Tag color="cyan">{targetShop?.region}</Tag>
              {targetShop?.is_mtr && <Tag color="orange">MTR Shop</Tag>}
            </div>
          </div>

          <div className="mb-4">
            <Text strong className="block mb-2">Select New Date</Text>
            <DatePicker 
              className="w-full h-12 rounded-xl" 
              disabledDate={disabledDate}
              value={reschedDate}
              onChange={val => setReschedDate(val)}
              placeholder="Select available date..."
            />
          </div>

          {fastestDate && (
            <div className="p-3 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
              <div>
                <Text className="text-green-700 text-xs block">Fastest Suggest Reschedule Date</Text>
                <Text className="text-green-800 font-bold">{fastestDate.format('YYYY-MM-DD (dddd)')}</Text>
              </div>
              <Button type="link" size="small" onClick={() => setReschedDate(fastestDate)}>Use This</Button>
            </div>
          )}
        </div>
      </Modal>

      <style>{`
        .card-item { width: 100%; height: 160px; border-radius: 20px; color: #fff; display: grid; grid-template-rows: 45px 1fr; overflow: hidden; background: #1a1c3d; }
        .img-section { display: flex; justify-content: flex-end; padding-right: 20px; align-items: center; opacity: 0.8; }
        .card-desc { padding: 15px 20px; background: #1C204B; border-radius: 20px; position: relative; top: -5px; }
        .card-time { font-size: 2.2em; font-weight: 800; }
        .card-title { font-size: 0.8em; color: #BBC0FF; text-transform: uppercase; letter-spacing: 1px; }
        .recent-text { font-size: 0.7em; color: #BBC0FF; opacity: 0.6; }
        .bin-button { width: 36px; height: 36px; border-radius: 50%; background-color: #fee2e2; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.3s; }
        .bin-button:hover { background-color: #ef4444; transform: scale(1.1); }
        .bin-button:hover .bin-svgIcon path { fill: white; }
        .bin-svgIcon { width: 14px; fill: #ef4444; transition: all 0.3s; }
      `}</style>
    </div>
  );
};
