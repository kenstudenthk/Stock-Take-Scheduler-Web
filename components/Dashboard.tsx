import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Progress, Empty, 
  DatePicker, Typography, Radio, Modal, message 
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
  // 假設你有一個更新資料的 function，若無則先以此範例模擬更新效果
  onUpdateStatus?: (shopId: string, newStatus: 'completed' | 'closed' | 'pending' | 'scheduled') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate, onUpdateStatus }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // --- 1. 數據統計 ---
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, closed, pending, percent };
  }, [shops]);

  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      const matchDate = shopDate === selectedDate;
      const matchGroup = groupFilter === 'all' || shop.groupId === groupFilter;
      return matchDate && matchGroup;
    });
  }, [shops, selectedDate, groupFilter]);

  // --- 2. 處理關閉按鈕邏輯 ---
  const handleCloseShop = (shop: Shop) => {
    confirm({
      title: 'Confirm to Close Shop?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `This will mark "${shop.name}" as closed for today. This action cannot be undone easily.`,
      okText: 'Yes, Close it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk() {
        if (onUpdateStatus) {
          onUpdateStatus(shop.id, 'closed');
          message.warning(`${shop.name} has been closed.`);
        } else {
          message.error("Data update function not found.");
        }
      },
    });
  };

  const getGroupStyle = (groupId: number, isClosed: boolean) => {
    if (isClosed) return { name: `Group ${String.fromCharCode(64 + groupId)}`, color: '#f1f5f9', textColor: '#94a3b8' };
    
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
      {/* 標題與統計區塊 (保持不變) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Daily operations for {selectedDate}</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>
          Generate Report
        </Button>
      </div>

      <Row gutter={24}>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-none bg-white"><StatisticCard label="Total" value={stats.total} icon={<ShopOutlined />} color="teal" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-none bg-white"><StatisticCard label="Done" value={stats.completed} icon={<CheckCircleOutlined />} color="emerald" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-none bg-white"><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-none bg-white"><StatisticCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Card></Col>
      </Row>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        {/* 過濾器 (保持不變) */}
        
        {scheduledShops.length === 0 ? (
          <Empty description={`No shops found for ${selectedDate}`} className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const isClosed = shop.status === 'closed';
              const style = getGroupStyle(shop.groupId, isClosed);
              
              return (
                <div 
                  key={shop.id} 
                  className={`border p-6 rounded-3xl flex items-center justify-between transition-all shadow-sm ${
                    isClosed 
                    ? 'bg-slate-100/50 border-slate-200 grayscale opacity-60' // ✅ 變灰與透明
                    : 'bg-slate-50/50 border-slate-100 hover:bg-white'
                  }`}
                >
                  <div className="flex items-center gap-8 flex-1">
                    {/* Logo 區域 */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-50 p-2">
                        {shop.brandIcon ? (
                          <img 
                            src={shop.brandIcon} 
                            className="h-full w-full object-contain"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/606/606201.png'; }}
                          />
                        ) : (
                          <ShopOutlined className="text-slate-200 text-3xl" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center leading-tight">
                        {shop.brand}
                      </span>
                    </div>
                    
                    {/* 門市資訊 */}
                    <div style={{ maxWidth: '300px' }}>
                      <h4 className={`font-bold m-0 text-lg truncate mb-1 ${
                        isClosed ? 'line-through decoration-red-500 decoration-2 text-slate-400' : 'text-slate-900' // ✅ 紅色刪除線
                      }`}>
                        {shop.name}
                      </h4>
                      <Text type="secondary" className="text-xs truncate block font-medium">
                        <EnvironmentOutlined className="mr-1 text-teal-500" /> {shop.address}
                      </Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 text-right" style={{ flex: 2, justifyContent: 'flex-end' }}>
                    <div className="flex flex-col w-32 text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">District / Area</span>
                      <span className="font-bold text-slate-700 text-xs truncate">{shop.district || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 truncate">{shop.area || '-'}</span>
                    </div>
                    
                    <div className="px-4 py-2 rounded-xl text-center min-w-[90px]" style={{ backgroundColor: style.color }}>
                      <span className="font-black text-xs block" style={{ color: style.textColor }}>{style.name}</span>
                    </div>

                    <Tag color={isClosed ? 'default' : shop.status === 'completed' ? 'green' : 'blue'} className="rounded-full border-none font-bold text-[10px] px-4 py-1 m-0">
                      {shop.status.toUpperCase()}
                    </Tag>

                    <Space size="middle">
                      <Button 
                        size="middle" 
                        disabled={isClosed} // ✅ 關閉後禁止點擊
                        className="text-xs font-bold rounded-xl border-slate-200 hover:text-teal-600"
                      >
                        Re-Schedule
                      </Button>
                      <Button 
                        size="middle" 
                        danger 
                        disabled={isClosed} // ✅ 關閉後禁止點擊
                        icon={<CloseCircleOutlined />} 
                        className={`rounded-xl border-none ${isClosed ? 'bg-slate-200' : 'bg-red-50'}`} 
                        onClick={() => handleCloseShop(shop)}
                      />
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// 輔助元件保持不變
const StatisticCard = ({ label, value, icon, color }: any) => (
  <div className="flex justify-between items-start">
    <div><Text strong className="text-[10px] text-slate-400 uppercase block mb-1">{label}</Text><div className="text-2xl font-black">{value}</div></div>
    <div className={`text-${color}-600 bg-${color}-50 p-2 rounded-lg text-xl`}>{icon}</div>
  </div>
);
