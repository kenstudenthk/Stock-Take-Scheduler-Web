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

// ... 匯入保持不變

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate, onUpdateShop }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  const [rescheduleShop, setRescheduleShop] = useState<Shop | null>(null);

  // --- 1. 計算頂部統計數據 ---
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
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

  // --- 3. 智慧建議邏輯 ---
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

  // handleClose 與 getGroupStyle 保持不變

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* --- ✅ 找回來的 Header 與 Generate Report --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitoring {selectedDate} operations.</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>
          Generate Report
        </Button>
      </div>

      {/* --- ✅ 找回來的 4 Summary Boxes --- */}
      <Row gutter={24}>
        <Col span={6}><StatisticCard label="Total" value={stats.total} icon={<ShopOutlined />} color="teal" /></Col>
        <Col span={6}><StatisticCard label="Done" value={stats.completed} icon={<CheckCircleOutlined />} color="emerald" /></Col>
        <Col span={6}><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Col>
        <Col span={6}><StatisticCard label="Remain" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Col>
      </Row>

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        {/* Date Filter & Group Tabs 保持不變 */}

        {/* 門市清單與紅線邏輯保持不變 */}
      </div>

      {/* --- ✅ 修復後的 Re-Schedule Modal --- */}
      <Modal
        title={<div className="text-xl font-black">Assign New Schedule</div>}
        open={!!rescheduleShop}
        onCancel={() => setRescheduleShop(null)}
        footer={null}
        width={550}
        centered
      >
        {rescheduleShop && (
          <div className="flex flex-col gap-5 py-4">
             <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2 px-1">Suggested Dates (Max 9)</Text>
             {[1, 2, 3, 4, 5, 6, 7].map(offset => {
               const date = dayjs().add(offset, 'day').format('YYYY-MM-DD');
               const info = getDailyInfo(date);
               if (info.isFull) return null;

               return (
                 <div key={date} className="flex justify-between items-center p-4 border rounded-2xl cursor-pointer hover:border-teal-500 bg-white hover:shadow-md transition-all"
                   onClick={() => {
                     onUpdateShop?.(rescheduleShop, { 
                       scheduleStatus: 'Rescheduled', 
                       scheduledDate: date, 
                       groupId: info.suggestedGroup.id 
                     });
                     setRescheduleShop(null);
                   }}>
                   <div className="flex flex-col">
                     <span className="font-bold">{date}</span>
                     <span className="text-[10px] text-slate-400 font-medium">{info.totalCount}/9 Shops Allocated</span>
                   </div>
                   <Tag color="teal" className="font-black rounded-lg">GROUP {String.fromCharCode(64 + info.suggestedGroup.id)}</Tag>
                 </div>
               );
             })}
             <div className="pt-4 border-t">
               <Text strong className="text-[10px] text-slate-400 uppercase block mb-3">Manual Date Picker</Text>
               <DatePicker className="w-full h-12 rounded-xl bg-slate-50 border-none px-4"
                disabledDate={(current) => {
                  const dateStr = current.format('YYYY-MM-DD');
                  return getDailyInfo(dateStr).isFull || current < dayjs().startOf('day');
                }} />
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// 輔助組件
const StatisticCard = ({ label, value, icon, color }: any) => (
  <Card className="rounded-2xl border-none shadow-sm h-full">
    <div className="flex justify-between items-start">
      <div>
        <Text strong className="text-[10px] text-slate-400 uppercase block mb-1">{label}</Text>
        <div className="text-2xl font-black">{value}</div>
      </div>
      <div className={`text-${color}-600 bg-${color}-50 p-2 rounded-lg text-xl`}>{icon}</div>
    </div>
  </Card>
);
