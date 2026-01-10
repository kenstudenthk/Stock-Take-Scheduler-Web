import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Progress, Empty, 
  DatePicker, Typography, Radio, Modal, Badge, message 
} from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  EnvironmentOutlined, CalendarOutlined, CloseCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text } = Typography;
const { confirm } = Modal;

interface DashboardProps {
  shops: Shop[];
  onNavigate?: (view: View) => void;
  onUpdateShop?: (shop: Shop, updates: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [rescheduleShop, setRescheduleShop] = useState<Shop | null>(null);

  // --- 1. 計算頂部 4 個統計數據 ---
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'Closed' || s.status === 'closed').length;
    const pending = total - completed - closed;
    return { total, completed, closed, pending };
  }, [shops]);

  // --- 2. 核心過濾邏輯 ---
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      return shopDate === selectedDate && (groupFilter === 'all' || shop.groupId === groupFilter);
    });
  }, [shops, selectedDate, groupFilter]);

  // --- 3. 智慧排程建議 (Max 9 規則) ---
  const getDailyInfo = (dateStr: string) => {
    const dayShops = shops.filter(s => dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    const totalCount = dayShops.length;
    const isFull = totalCount >= 9;
    const groups = [1, 2, 3].map(id => ({
      id,
      count: dayShops.filter(s => s.groupId === id).length,
      hasMtr: dayShops.some(s => s.groupId === id && s.is_mtr)
    }));
    let suggestedGroup = groups.find(g => g.hasMtr) || [...groups].sort((a, b) => a.count - b.count)[0];
    return { totalCount, isFull, suggestedGroup };
  };

  const handleClose = (shop: Shop) => {
    confirm({
      title: 'Confirm to Close Shop?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Mark "${shop.name}" as Closed? This will update SharePoint and clear Group.`,
      okText: 'Yes, Close', okType: 'danger',
      onOk() { onUpdateShop?.(shop, { scheduleStatus: 'Closed' }); }
    });
  };

  const getGroupStyle = (groupId: number, status: string) => {
    if (status === 'Closed' || status === 'closed') return { name: 'CLOSED', color: '#f1f5f9', textColor: '#94a3b8' };
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitoring {selectedDate} schedule.</p>
        </div>
        <Button icon={<PrinterOutlined />} className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>Generate Report</Button>
      </div>

      <Row gutter={24}>
        <Col span={6}><StatisticCard label="Total Shop" value={stats.total} icon={<ShopOutlined />} color="teal" /></Col>
        <Col span={6}><StatisticCard label="Completed" value={stats.completed} icon={<CheckCircleOutlined />} color="emerald" /></Col>
        <Col span={6}><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Col>
        <Col span={6}><StatisticCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Col>
      </Row>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        <div className="flex justify-between items-end mb-8 px-2">
          <div>
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Schedule Date</Text>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <CalendarOutlined className="text-teal-600" />
              <DatePicker variant="borderless" value={dayjs(selectedDate)} allowClear={false} className="font-bold p-0" onChange={(d) => setSelectedDate(d?.format('YYYY-MM-DD') || '')} />
            </div>
          </div>
          <div className="flex flex-col items-end">
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Group Selection</Text>
            <Radio.Group value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} buttonStyle="solid">
              <Radio.Button value="all">ALL</Radio.Button>
              <Radio.Button value={1}>GROUP A</Radio.Button>
              <Radio.Button value={2}>GROUP B</Radio.Button>
              <Radio.Button value={3}>GROUP C</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {scheduledShops.length === 0 ? <Empty className="py-20" /> : scheduledShops.map(shop => {
            const isClosed = shop.status === 'Closed' || shop.status === 'closed';
            const style = getGroupStyle(shop.groupId, shop.status);
            return (
              <div key={shop.id} className={`p-6 rounded-3xl flex items-center justify-between border transition-all ${isClosed ? 'bg-slate-100 opacity-60 grayscale' : 'bg-slate-50/50 border-slate-100 hover:bg-white shadow-sm'}`}>
                <div className="flex items-center gap-8 flex-1">
                  <div className="flex flex-col items-center gap-2 min-w-[100px]">
                    <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-50 p-2 overflow-hidden">
                      <img src={shop.brandIcon} className="h-full w-full object-contain" onError={(e) => (e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/606/606201.png")} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{shop.brand}</span>
                  </div>
                  <div>
                    <h4 className={`font-bold m-0 text-lg mb-1 ${isClosed ? 'line-through decoration-red-500 decoration-2 text-slate-400' : 'text-slate-900'}`}>{shop.name}</h4>
                    <Text type="secondary" className="text-xs font-medium block"><EnvironmentOutlined className="text-teal-500 mr-1" /> {shop.address}</Text>
                  </div>
                </div>
                <div className="flex items-center gap-8" style={{ flex: 2, justifyContent: 'flex-end' }}>
                  <div className="flex flex-col w-32 text-left">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mb-1">District / Area</span>
                    <span className="font-bold text-slate-700 text-xs truncate">{shop.district}</span>
                    <span className="text-[10px] text-slate-400 truncate">{shop.area}</span>
                  </div>
                  <div className="px-4 py-2 rounded-xl text-center min-w-[90px]" style={{ backgroundColor: style.color }}>
                    <span className="font-black text-xs block" style={{ color: style.textColor }}>{style.name}</span>
                  </div>
                  <Tag color={isClosed ? 'default' : 'blue'} className="rounded-full border-none font-bold text-[10px] px-4 py-1">{shop.status.toUpperCase()}</Tag>
                  <Space size="middle">
                    <Button size="middle" disabled={isClosed} className="rounded-xl font-bold" onClick={() => setRescheduleShop(shop)}>Re-Schedule</Button>
                    <Button size="middle" danger disabled={isClosed} icon={<CloseCircleOutlined />} className="rounded-xl border-none bg-red-50" onClick={() => handleClose(shop)} />
                  </Space>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Modal title={<div className="text-xl font-black">Assign New Schedule</div>} open={!!rescheduleShop} onCancel={() => setRescheduleShop(null)} footer={null} width={550} centered>
        {rescheduleShop && (
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="h-14 w-14 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <img src={rescheduleShop.brandIcon} className="h-10 w-10 object-contain" />
               </div>
               <div>
                  <div className="font-bold text-lg text-slate-800">{rescheduleShop.name}</div>
                  <Tag color="blue" className="mt-1 rounded-full border-none px-3 font-bold text-[10px]">CURRENT: {dayjs(rescheduleShop.scheduledDate).format('YYYY-MM-DD')}</Tag>
               </div>
            </div>
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 px-1">Suggested Slots (Max 9)</Text>
            <div className="flex flex-col gap-3">
              {[1, 2, 3, 4, 5, 6, 7].map(offset => {
                const date = dayjs().add(offset, 'day').format('YYYY-MM-DD');
                const info = getDailyInfo(date);
                if (info.isFull) return null;
                return (
                  <div key={date} className="flex justify-between items-center p-4 border rounded-2xl cursor-pointer hover:border-teal-500 bg-white"
                    onClick={() => { onUpdateShop?.(rescheduleShop, { scheduleStatus: 'Rescheduled', scheduledDate: date, groupId: info.suggestedGroup.id }); setRescheduleShop(null); }}>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-800">{date}</span>
                      <span className="text-[10px] text-slate-400">{info.totalCount}/9 Allocated</span>
                    </div>
                    <Tag color="teal" className="m-0 border-none font-black rounded-lg text-[10px] px-3">USE GROUP {String.fromCharCode(64 + info.suggestedGroup.id)}</Tag>
                  </div>
                );
              })}
            </div>
            <div className="pt-4 border-t">
               <Text strong className="text-[10px] text-slate-400 uppercase block mb-3 px-1">Manual Selection</Text>
               <DatePicker className="w-full h-12 rounded-xl bg-slate-50 border-none font-bold" disabledDate={(curr) => getDailyInfo(curr.format('YYYY-MM-DD')).isFull || curr < dayjs().startOf('day')} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const StatisticCard = ({ label, value, icon, color }: any) => (
  <Card className="rounded-2xl border-none shadow-sm h-full" bodyStyle={{ padding: '24px' }}>
    <div className="flex justify-between items-start">
      <div>
        <Text strong className="text-[10px] text-slate-400 uppercase block mb-1 tracking-widest">{label}</Text>
        <div className="text-3xl font-black text-slate-800">{value}</div>
      </div>
      <div className={`text-${color}-600 bg-${color}-50 p-2.5 rounded-xl text-xl`}>{icon}</div>
    </div>
  </Card>
);
