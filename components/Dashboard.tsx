import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Progress, Empty, 
  DatePicker, Typography, Radio, Modal, Badge, message, Tooltip 
} from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  EnvironmentOutlined, CalendarOutlined, CloseCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text } = Typography;
const { confirm } = Modal;

interface DashboardProps {
  shops: Shop[];
  onNavigate?: (view: View) => void;
  onUpdateShop?: (shop: Shop, updates: any) => void; // ✅ 新增更新回調
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [rescheduleShop, setRescheduleShop] = useState<Shop | null>(null);

  // --- 過濾邏輯 ---
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      return shopDate === selectedDate && (groupFilter === 'all' || shop.groupId === groupFilter);
    });
  }, [shops, selectedDate, groupFilter]);

  // --- 💡 Close 功能：更新狀態為 "Closed" 並移除 Group ---
  const handleClose = (shop: Shop) => {
    confirm({
      title: 'Confirm to Close Shop?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Marking "${shop.name}" as Closed. This will remove its Group assignment.`,
      okText: 'Confirm Close',
      okType: 'danger',
      onOk() {
        onUpdateShop?.(shop, { 
          scheduleStatus: 'Closed', 
          clearGroup: true // ✅ 提示 API 移除 Group
        });
      }
    });
  };

  const getGroupStyle = (groupId: number, isClosed: boolean) => {
    if (isClosed) return { name: 'Closed', color: '#f1f5f9', textColor: '#94a3b8' };
    const groupName = `Group ${String.fromCharCode(64 + groupId)}`;
    switch (groupId) {
      case 1: return { name: groupName, color: '#e0f2fe', textColor: '#0369a1' }; 
      case 2: return { name: groupName, color: '#f3e8ff', textColor: '#7e22ce' }; 
      case 3: return { name: groupName, color: '#ffedd5', textColor: '#c2410c' }; 
      default: return { name: groupName, color: '#f1f5f9', textColor: '#475569' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* 歡迎區與統計 (略) */}

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        {/* ✅ ✅ ✅ 找回來的 Date Filter 與 Group Tabs ✅ ✅ ✅ */}
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Schedule Date</Text>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <CalendarOutlined className="text-teal-600" />
              <DatePicker 
                variant="borderless" 
                value={dayjs(selectedDate)}
                onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || '')}
                allowClear={false}
                className="font-bold p-0"
              />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Filter Group</Text>
            <Radio.Group value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} buttonStyle="solid">
              <Radio.Button value="all">ALL</Radio.Button>
              <Radio.Button value={1}>GROUP A</Radio.Button>
              <Radio.Button value={2}>GROUP B</Radio.Button>
              <Radio.Button value={3}>GROUP C</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {/* 門市清單 */}
        <div className="flex flex-col gap-4">
          {scheduledShops.map(shop => {
            const isClosed = shop.status === 'Closed' || shop.scheduleStatus === 'Closed';
            const style = getGroupStyle(shop.groupId, isClosed);
            
            return (
              <div key={shop.id} className={`p-6 rounded-3xl flex items-center justify-between transition-all border ${
                isClosed ? 'bg-slate-100 opacity-60 grayscale' : 'bg-slate-50/50 border-slate-100 hover:bg-white hover:shadow-md'
              }`}>
                <div className="flex items-center gap-8 flex-1">
                  {/* Brand Logo & Name */}
                  <div className="flex flex-col items-center gap-2 min-w-[100px]">
                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-50 p-2">
                      <img src={shop.brandIcon} className="h-full w-full object-contain" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase text-center">{shop.brand}</span>
                  </div>
                  
                  <div>
                    {/* ✅ 店名紅色刪除線效果 */}
                    <h4 className={`font-bold m-0 text-lg mb-1 ${
                      isClosed ? 'line-through decoration-red-500 decoration-2 text-slate-400' : 'text-slate-900'
                    }`}>
                      {shop.name}
                    </h4>
                    <Text type="secondary" className="text-xs block font-medium">
                      <EnvironmentOutlined className="text-teal-500 mr-1" /> {shop.address}
                    </Text>
                  </div>
                </div>
                
                <div className="flex items-center gap-8 text-right" style={{ flex: 2, justifyContent: 'flex-end' }}>
                  <div className="flex flex-col w-32 text-left">
                    <span className="text-[9px] text-slate-400 font-bold uppercase mb-1">District / Area</span>
                    <span className="font-bold text-slate-700 text-xs">{shop.district}</span>
                    <span className="text-[10px] text-slate-400">{shop.area}</span>
                  </div>
                  
                  <div className="px-4 py-2 rounded-xl text-center min-w-[90px]" style={{ backgroundColor: style.color }}>
                    <span className="font-black text-xs block" style={{ color: style.textColor }}>{style.name}</span>
                  </div>

                  <Tag color={isClosed ? 'default' : 'blue'} className="rounded-full border-none font-bold text-[10px] px-4 py-1">
                    {isClosed ? 'CLOSED' : 'PLANNED'}
                  </Tag>

                  <Space size="middle">
                    <Button 
                      size="middle" 
                      disabled={isClosed}
                      className="text-xs font-bold rounded-xl border-slate-200 hover:text-teal-600"
                      onClick={() => setRescheduleShop(shop)}
                    >
                      Re-Schedule
                    </Button>
                    <Button 
                      size="middle" 
                      danger 
                      disabled={isClosed}
                      icon={<CloseCircleOutlined />} 
                      className="rounded-xl border-none bg-red-50"
                      onClick={() => handleClose(shop)}
                    />
                  </Space>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* --- Re-Schedule Modal 內部的更新邏輯 --- */}
      <Modal
        title="Assign New Schedule"
        open={!!rescheduleShop}
        onCancel={() => setRescheduleShop(null)}
        footer={null}
        width={550}
      >
        {/* ... 前方建議清單代碼 ... */}
        {/* 在建議清單點擊時呼叫： */}
        {/* onClick={() => onUpdateShop?.(rescheduleShop, { scheduledDate: date, groupId: info.suggestedGroup.id, scheduleStatus: 'Rescheduled' })} */}
      </Modal>
    </div>
  );
};
