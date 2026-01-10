import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Empty, 
  DatePicker, Typography, Radio, Modal, Badge, Tooltip 
} from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  EnvironmentOutlined, CalendarOutlined, CloseCircleOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, PrinterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text, Title } = Typography;
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

  // --- 數據統計邏輯 ---
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'Closed' || s.status === 'closed').length;
    const pending = total - completed - closed;
    return { total, completed, closed, pending };
  }, [shops]);

  // --- 過濾邏輯 ---
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      return shopDate === selectedDate && (groupFilter === 'all' || shop.groupId === groupFilter);
    });
  }, [shops, selectedDate, groupFilter]);

  const handleClose = (shop: Shop) => {
    confirm({
      title: 'Confirm to Close Shop?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Mark "${shop.name}" as Closed? This will remove its Group assignment.`,
      okText: 'Yes, Close it',
      okType: 'danger',
      onOk() { onUpdateShop?.(shop, { scheduleStatus: 'Closed' }); }
    });
  };

  const getGroupStyle = (groupId: number, status: string) => {
    if (status === 'Closed' || status === 'closed') return { name: 'Closed', color: '#94a3b8' };
    const groupName = `Group ${String.fromCharCode(64 + groupId)}`;
    switch (groupId) {
      case 1: return { name: groupName, color: '#0369a1' }; 
      case 2: return { name: groupName, color: '#7e22ce' }; 
      case 3: return { name: groupName, color: '#c2410c' }; 
      default: return { name: groupName, color: '#64748b' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* --- 1. Greeting Header & Generate Report --- */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Hello Admin,</Title>
          <Text className="text-slate-400 font-medium text-base">Here are the things happening in your stock take schedule.</Text>
        </div>
        <Button 
          icon={<PrinterOutlined />} 
          className="rounded-xl font-bold h-11 bg-indigo-600 text-white border-none px-6"
          onClick={() => window.print()}
        >
          Generate Report
        </Button>
      </div>

      {/* --- 2. 4 Summary Boxes (參考 image_972eb4.png) --- */}
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <StatCard label="Total Shop" value={stats.total} icon={<ShopOutlined />} iconColor="text-teal-500" />
        </Col>
        <Col span={6}>
          <StatCard label="Completed" value={stats.completed} icon={<CheckCircleOutlined />} iconColor="text-emerald-500" />
        </Col>
        <Col span={6}>
          <StatCard label="Closed" value={stats.closed} icon={<LockOutlined />} iconColor="text-slate-400" />
        </Col>
        <Col span={6}>
          <StatCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} iconColor="text-orange-500" />
        </Col>
      </Row>

      {/* --- 3. Main Content Area (參考 image_972efa.jpg) --- */}
      <Card className="rounded-[24px] shadow-sm border-none bg-white overflow-hidden" bodyStyle={{ padding: 0 }}>
        {/* ✅ Group Tabs (頂層) */}
        <div className="px-8 pt-6 border-b border-slate-50">
          <Radio.Group 
            value={groupFilter} 
            onChange={(e) => setGroupFilter(e.target.value)} 
            className="custom-tabs pb-4"
          >
            <Radio.Button value="all">ALL GROUPS</Radio.Button>
            <Radio.Button value={1}>GROUP A</Radio.Button>
            <Radio.Button value={2}>GROUP B</Radio.Button>
            <Radio.Button value={3}>GROUP C</Radio.Button>
          </Radio.Group>
        </div>

        {/* ✅ Date Filter (中層) */}
        <div className="px-8 py-5 bg-slate-50/30 flex items-center justify-between">
          <Space size="large">
            <div className="flex flex-col">
              <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Schedule Date</Text>
              <DatePicker 
                value={dayjs(selectedDate)}
                onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || '')}
                className="h-10 rounded-lg border-slate-200 w-48 font-bold"
                allowClear={false}
              />
            </div>
            {/* 這裡可以放更多 Filter */}
          </Space>
          <Button icon={<CalendarOutlined />} type="text" className="text-slate-400 font-bold">Reset Filters</Button>
        </div>

        {/* ✅ Column Titles (標題行) */}
        <div className="px-8 py-3 bg-white border-b border-slate-100 flex items-center text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          <div style={{ flex: 1 }}>Shop & Brand</div>
          <div style={{ width: 300 }}>Location Details</div>
          <div style={{ width: 120 }} className="text-center">Assigned Group</div>
          <div style={{ width: 120 }} className="text-center">Status</div>
          <div style={{ width: 150 }} className="text-right">Actions</div>
        </div>

        {/* ✅ Final Data (門市數據) */}
        <div className="p-4 flex flex-col gap-2">
          {scheduledShops.length === 0 ? (
            <Empty className="py-20" description="No schedules found for this filter" />
          ) : (
            scheduledShops.map(shop => {
              const isClosed = shop.status === 'Closed' || shop.status === 'closed';
              const style = getGroupStyle(shop.groupId, shop.status);
              
              return (
                <div 
                  key={shop.id} 
                  className={`px-4 py-4 rounded-xl flex items-center transition-all ${
                    isClosed ? 'opacity-50 grayscale bg-slate-50' : 'hover:bg-slate-50/80 bg-white'
                  }`}
                >
                  {/* Shop & Brand */}
                  <div className="flex items-center gap-4" style={{ flex: 1 }}>
                    <div className="h-12 w-12 rounded-lg bg-white border border-slate-100 flex items-center justify-center p-1 overflow-hidden shadow-sm">
                      <img src={shop.brandIcon} className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <h4 className={`font-bold m-0 text-slate-800 truncate ${isClosed ? 'line-through decoration-red-500' : ''}`}>
                        {shop.name}
                      </h4>
                      <Text type="secondary" className="text-[10px] font-bold uppercase tracking-tighter opacity-60">
                        {shop.brand} | ID: {shop.id}
                      </Text>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div style={{ width: 300 }} className="flex flex-col">
                    <Text strong className="text-xs text-slate-700">{shop.district}</Text>
                    <Text className="text-[11px] text-slate-400 truncate italic">{shop.address}</Text>
                  </div>

                  {/* Group */}
                  <div style={{ width: 120 }} className="text-center">
                    <Tag className="rounded-md border-none px-3 font-black text-[10px] m-0" style={{ background: `${style.color}15`, color: style.color }}>
                      {style.name.toUpperCase()}
                    </Tag>
                  </div>

                  {/* Status */}
                  <div style={{ width: 120 }} className="text-center">
                    <Badge status={isClosed ? 'default' : shop.status === 'completed' ? 'success' : 'processing'} text={
                      <span className="font-bold text-[10px] uppercase text-slate-500">{shop.status}</span>
                    } />
                  </div>

                  {/* Actions */}
                  <div style={{ width: 150 }} className="text-right flex justify-end gap-2">
                    <Button size="small" disabled={isClosed} className="rounded-lg font-bold text-[10px]" onClick={() => setRescheduleShop(shop)}>Re-Schedule</Button>
                    <Button size="small" danger disabled={isClosed} icon={<CloseCircleOutlined />} className="rounded-lg border-none bg-red-50" onClick={() => handleClose(shop)} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </Card>

      {/* --- Re-Schedule Modal --- */}
      <Modal title="Assign New Schedule" open={!!rescheduleShop} onCancel={() => setRescheduleShop(null)} footer={null} width={550}>
        {/* ... 排程邏輯代碼 ... */}
      </Modal>

      <style>{`
        .custom-tabs .ant-radio-button-wrapper {
          border: none !important;
          background: transparent !important;
          font-weight: 800;
          color: #94a3b8;
          font-size: 13px;
          height: auto;
          padding: 0 16px;
        }
        .custom-tabs .ant-radio-button-wrapper-checked {
          color: #4f46e5 !important; /* Indigo 600 */
          box-shadow: none !important;
        }
        .custom-tabs .ant-radio-button-wrapper-checked::after {
          content: "";
          position: absolute;
          bottom: -16px;
          left: 16px;
          right: 16px;
          height: 3px;
          background: #4f46e5;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

// --- 輔助組件：參考 image_972eb4.png 的卡片 ---
const StatCard = ({ label, value, icon, iconColor }: { label: string, value: number, icon: any, iconColor: string }) => (
  <Card className="rounded-2xl shadow-sm border-none bg-white relative overflow-hidden" bodyStyle={{ padding: '24px' }}>
    <div className="flex flex-col relative z-10">
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</Text>
      <Title level={1} className="m-0 font-black text-slate-800">{value}</Title>
    </div>
    <div className={`absolute right-4 top-1/2 -translate-y-1/2 text-5xl opacity-10 ${iconColor}`}>
      {icon}
    </div>
  </Card>
);
