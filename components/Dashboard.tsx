import React, { useMemo, useState } from 'react';
import { 
  Card, Tag, Space, Button, Row, Col, Progress, Empty, 
  DatePicker, Typography, Radio, Modal, List, Badge, message 
} from 'antd';
// ... 其他匯入保持不變

const { Text } = Typography;

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  
  // ✅ 用於控制重新排程視窗的狀態
  const [rescheduleShop, setRescheduleShop] = useState<Shop | null>(null);

  // --- 計算日期可用性與建議的邏輯 ---
  const getAvailabilityForDate = (dateStr: string) => {
    const dayShops = shops.filter(s => dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    const totalCount = dayShops.length;
    
    // 計算各組店數
    const groupCounts = {
      1: dayShops.filter(s => s.groupId === 1).length,
      2: dayShops.filter(s => s.groupId === 2).length,
      3: dayShops.filter(s => s.groupId === 3).length,
    };

    // 檢查是否有 MTR 門市
    const groupHasMtr = {
      1: dayShops.some(s => s.groupId === 1 && s.is_mtr),
      2: dayShops.some(s => s.groupId === 2 && s.is_mtr),
      3: dayShops.some(s => s.groupId === 3 && s.is_mtr),
    };

    const isFull = totalCount >= 9;
    
    // 找出店數最少的組別
    const minShops = Math.min(groupCounts[1], groupCounts[2], groupCounts[3]);
    const lightestGroup = Number(Object.keys(groupCounts).find(key => groupCounts[Number(key)] === minShops));

    return { totalCount, isFull, groupCounts, groupHasMtr, lightestGroup };
  };

  // ... 統計數據與過濾邏輯保持不變

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* ... 歡迎與統計卡片 ... */}

      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        {/* ... 過濾器部分 ... */}

        {scheduledShops.length === 0 ? (
          <Empty description={`No shops found for ${selectedDate}`} className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const style = getGroupStyle(shop.groupId);
              return (
                <div key={shop.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-3xl flex items-center justify-between hover:bg-white transition-all shadow-sm">
                  {/* ... Logo 與 店名資訊 ... */}
                  
                  <div className="flex items-center gap-8 text-right" style={{ flex: 2, justifyContent: 'flex-end' }}>
                    {/* ... District/Area, Group, Status ... */}

                    <Space size="middle">
                      <Button 
                        size="middle" 
                        className="text-xs font-bold rounded-xl border-slate-200 hover:text-teal-600"
                        onClick={() => setRescheduleShop(shop)} // ✅ 點擊觸發 Modal
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

      {/* --- ✅ 重新排程功能視窗 --- */}
      <Modal
        title={<div className="text-lg font-black text-slate-800">Assign New Schedule</div>}
        open={!!rescheduleShop}
        onCancel={() => setRescheduleShop(null)}
        footer={null}
        width={500}
        className="rounded-3xl overflow-hidden"
      >
        {rescheduleShop && (
          <div className="flex flex-col gap-6 py-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Text type="secondary" className="text-[10px] font-bold uppercase block">Now Rescheduling</Text>
              <div className="font-bold text-lg text-slate-800">{rescheduleShop.name}</div>
              <Tag color="orange" className="mt-2 rounded-full border-none px-3 font-bold">CURRENT: {rescheduleShop.scheduledDate}</Tag>
            </div>

            <div>
              <Text strong className="text-xs text-slate-400 uppercase tracking-widest block mb-3">Suggested Dates (Total &lt; 9)</Text>
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map(offset => {
                  const date = dayjs().add(offset, 'day').format('YYYY-MM-DD');
                  const info = getAvailabilityForDate(date);
                  
                  if (info.isFull) return null;

                  return (
                    <div 
                      key={date}
                      className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:border-teal-500 cursor-pointer transition-all bg-white"
                      onClick={() => {
                        message.success(`Assigned ${rescheduleShop.name} to Group ${String.fromCharCode(64 + info.lightestGroup)} on ${date}`);
                        setRescheduleShop(null);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{date}</span>
                        <span className="text-[10px] text-slate-400">Current Load: {info.totalCount}/9 Shops</span>
                      </div>
                      <Space>
                        {/* 如果該日該組有 MTR，顯示特別標記 */}
                        {Object.values(info.groupHasMtr).some(v => v) && (
                          <Badge status="warning" text={<span className="text-[10px] font-bold text-orange-500">MTR Priority</span>} />
                        )}
                        <Tag color="teal" className="m-0 border-none font-bold rounded-lg">
                          Suggest Group {String.fromCharCode(64 + info.lightestGroup)}
                        </Tag>
                      </Space>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <Text strong className="text-xs text-slate-400 uppercase block mb-3">Or Pick a Custom Date</Text>
              <DatePicker 
                className="w-full h-12 rounded-xl bg-slate-50 border-none"
                disabledDate={(current) => {
                  const dateStr = current.format('YYYY-MM-DD');
                  return getAvailabilityForDate(dateStr).isFull || current < dayjs().startOf('day');
                }}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
