import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Progress, Empty, 
  DatePicker, Typography, Radio, Modal, Badge, message, Tooltip 
} from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  EnvironmentOutlined, CalendarOutlined, CloseCircleOutlined,
  CheckCircleOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs'; // ✅ 修正：確保匯入 dayjs
import { Shop, View } from '../types';

const { Text } = Typography;

interface DashboardProps {
  shops: Shop[];
  onNavigate?: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  
  // 重新排程狀態
  const [rescheduleShop, setRescheduleShop] = useState<Shop | null>(null);

  // --- 1. 頂部數據統計 ---
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, closed, pending, percent };
  }, [shops]);

  // --- 2. 獲取篩選後的清單 ---
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      const matchDate = shopDate === selectedDate;
      const matchGroup = groupFilter === 'all' || shop.groupId === groupFilter;
      return matchDate && matchGroup;
    });
  }, [shops, selectedDate, groupFilter]);

  // --- 3. 核心功能：計算日期的排程建議與可用性 ---
  const getDailyInfo = (dateStr: string) => {
    const dayShops = shops.filter(s => dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    const totalCount = dayShops.length;
    const isFull = totalCount >= 9;

    const groups = [1, 2, 3].map(id => ({
      id,
      count: dayShops.filter(s => s.groupId === id).length,
      hasMtr: dayShops.some(s => s.groupId === id && s.is_mtr) // 檢查該組當天是否有 MTR
    }));

    // 尋找建議組別
    // 規則 A: 該組當天有 MTR 任務 (優先)
    let suggestedGroup = groups.find(g => g.hasMtr);
    
    // 規則 B: 如果沒有 MTR 任務，選店數最少的組別
    if (!suggestedGroup) {
      suggestedGroup = [...groups].sort((a, b) => a.count - b.count)[0];
    }

    return { totalCount, isFull, suggestedGroup, groups };
  };

  const getGroupStyle = (groupId: number) => {
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
      {/* 歡迎區與統計卡片 (略，維持原樣) */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Daily operations for {selectedDate}</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>Generate Report</Button>
      </div>

      <Row gutter={24}>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Total" value={stats.total} icon={<ShopOutlined />} color="teal" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Done" value={stats.completed} icon={<CheckCircleOutlined />} color="emerald" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Remain" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Card></Col>
      </Row>

      {/* 清單區塊 */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        {/* 過濾器 (略，維持原樣) */}
        
        {scheduledShops.length === 0 ? (
          <Empty description={`No shops found for ${selectedDate}`} className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const style = getGroupStyle(shop.groupId);
              return (
                <div key={shop.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-8 flex-1">
                    {/* ✅ Logo 區域：放大且名稱在下方 */}
                    <div className="flex flex-col items-center gap-2 min-w-[100px]">
                      <div className="h-20 w-20 bg-white rounded-2xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-50 p-2">
                        {shop.brandIcon ? (
                          <img src={shop.brandIcon} alt={shop.brand} className="h-full w-full object-contain" />
                        ) : (
                          <ShopOutlined className="text-slate-200 text-3xl" />
                        )}
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{shop.brand}</span>
                    </div>
                    
                    <div style={{ maxWidth: '300px' }}>
                      <h4 className="font-bold text-slate-900 m-0 text-lg mb-1">{shop.name}</h4>
                      <Text type="secondary" className="text-xs truncate block"><EnvironmentOutlined /> {shop.address}</Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8 text-right" style={{ flex: 2, justifyContent: 'flex-end' }}>
                    <div className="flex flex-col w-32 text-left">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">District / Area</span>
                      <span className="font-bold text-slate-700 text-xs truncate">{shop.district}</span>
                      <span className="text-[10px] text-slate-400 truncate">{shop.area}</span>
                    </div>
                    <div className="px-4 py-2 rounded-xl text-center min-w-[90px]" style={{ backgroundColor: style.color }}>
                      <span className="font-black text-xs block" style={{ color: style.textColor }}>{style.name}</span>
                    </div>
                    <Space size="middle">
                      <Button 
                        size="middle" 
                        className="text-xs font-bold rounded-xl border-slate-200 hover:text-teal-600"
                        onClick={() => setRescheduleShop(shop)}
                      >
                        Re-Schedule
                      </Button>
                      <Button size="middle" danger icon={<CloseCircleOutlined />} className="rounded-xl border-none bg-red-50" />
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- ✅ 智慧重新排程 Modal --- */}
      <Modal
        title={<div className="text-xl font-black text-slate-800">Assign New Schedule</div>}
        open={!!rescheduleShop}
        onCancel={() => setRescheduleShop(null)}
        footer={null}
        width={550}
        centered
        className="rounded-3xl overflow-hidden"
      >
        {rescheduleShop && (
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-center gap-4">
               <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                  <img src={rescheduleShop.brandIcon} className="h-8 w-8 object-contain" />
               </div>
               <div>
                  <Text type="secondary" className="text-[10px] font-bold uppercase block tracking-widest">Now Rescheduling</Text>
                  <div className="font-bold text-lg text-slate-800">{rescheduleShop.name}</div>
                  <Tag color="blue" className="mt-1 rounded-full border-none px-3 font-bold text-[10px]">CURRENT: {dayjs(rescheduleShop.scheduledDate).format('YYYY-MM-DD')}</Tag>
               </div>
            </div>

            <div>
              <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-3 px-1">Suggested Next Available Dates</Text>
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5, 6, 7].map(offset => {
                  const date = dayjs().add(offset, 'day').format('YYYY-MM-DD');
                  const info = getDailyInfo(date);
                  
                  if (info.isFull) return null; // 規則：滿 9 間則不建議

                  return (
                    <div 
                      key={date}
                      className="flex justify-between items-center p-4 border border-slate-100 rounded-2xl hover:border-teal-500 cursor-pointer transition-all bg-white hover:shadow-md"
                      onClick={() => {
                        message.loading(`Updating ${rescheduleShop.name} to Group ${String.fromCharCode(64 + (info.suggestedGroup?.id || 1))} on ${date}...`);
                        setRescheduleShop(null);
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <CalendarOutlined className="text-teal-600" />
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">{date}</span>
                          <span className="text-[10px] text-slate-400 font-medium">Total: {info.totalCount}/9 Shops</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {info.suggestedGroup?.hasMtr && (
                          <Badge count="MTR" style={{ backgroundColor: '#f59e0b', fontSize: '9px', fontWeight: 'bold' }} />
                        )}
                        <Tag color="teal" className="m-0 border-none font-black rounded-lg text-[10px] px-3">
                          SUGGEST: GROUP {String.fromCharCode(64 + (info.suggestedGroup?.id || 1))}
                        </Tag>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-3">
                 <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block px-1">Manual Date Selection</Text>
                 <Tooltip title="Dates with 9+ shops are disabled"><InfoCircleOutlined className="text-slate-300" /></Tooltip>
              </div>
              <DatePicker 
                className="w-full h-12 rounded-xl bg-slate-50 border-none px-4 font-bold"
                placeholder="Pick another date..."
                disabledDate={(current) => {
                  const dateStr = current.format('YYYY-MM-DD');
                  // 規則：禁用已滿 9 間的日期，以及過去的日期
                  return getDailyInfo(dateStr).isFull || current < dayjs().startOf('day');
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const StatisticCard = ({ label, value, icon, color }: any) => (
  <div className="flex justify-between items-start">
    <div><Text strong className="text-[10px] text-slate-400 uppercase block mb-1">{label}</Text><div className="text-2xl font-black">{value}</div></div>
    <div className={`text-${color}-600 bg-${color}-50 p-2 rounded-lg text-xl`}>{icon}</div>
  </div>
);
