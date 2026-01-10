import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Typography, Avatar, Tooltip } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  EnvironmentOutlined, 
  MoreOutlined,
  CalendarOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { Shop } from '../types';

const { Text, Title } = Typography;

export const Calendar = ({ shops }: { shops: Shop[] }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMonth, setViewMonth] = useState(dayjs());

  // --- 1. 計算小型月曆邏輯 ---
  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfMonth = viewMonth.startOf('month').day();
  const days = useMemo(() => {
    const arr = [];
    // 填充前一個月的空白
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    // 填充本月日期
    for (let i = 1; i <= daysInMonth; i++) arr.push(viewMonth.date(i));
    return arr;
  }, [viewMonth]);

  // --- 2. 獲取所選日期的門市清單 ---
  const selectedDayShops = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    return shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
  }, [shops, selectedDate]);

  const getGroupColor = (groupId: number) => {
    switch (groupId) {
      case 1: return '#0369a1'; // Blue
      case 2: return '#7e22ce'; // Purple
      case 3: return '#c2410c'; // Orange
      default: return '#64748b';
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 min-h-[600px] bg-slate-900 rounded-[32px] p-8 shadow-2xl border border-slate-800">
      
      {/* --- 左側：門市排程清單 (Meeting List Style) --- */}
      <div className="flex-1">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Title level={3} className="m-0 text-white">Upcoming Shops</Title>
            <Text className="text-slate-400 font-medium">
              {selectedDate.format('MMMM D, YYYY')} — {selectedDayShops.length} stores scheduled
            </Text>
          </div>
          <Button type="text" icon={<MoreOutlined className="text-slate-400" />} />
        </div>

        <div className="flex flex-col gap-6">
          {selectedDayShops.length > 0 ? (
            selectedDayShops.map((shop) => (
              <div key={shop.id} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-slate-800/50 transition-all group">
                <Avatar 
                  src={shop.brandIcon} 
                  size={56} 
                  icon={<ShopOutlined />} 
                  className="bg-white p-1 flex-shrink-0 shadow-lg border border-slate-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-white font-bold m-0 text-lg group-hover:text-teal-400 transition-colors">{shop.name}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <Text className="text-slate-400 text-xs flex items-center">
                          <CalendarOutlined className="mr-1" /> {dayjs(shop.scheduledDate).format('h:mm A')}
                        </Text>
                        <Text className="text-slate-400 text-xs flex items-center">
                          <EnvironmentOutlined className="mr-1" /> {shop.district}
                        </Text>
                      </div>
                    </div>
                    <div 
                      className="h-2 w-2 rounded-full mt-2" 
                      style={{ backgroundColor: getGroupColor(shop.groupId) }} 
                    />
                  </div>
                  <Text className="text-slate-500 text-xs block mt-2 truncate italic">{shop.address}</Text>
                </div>
                <Button ghost className="opacity-0 group-hover:opacity-100 transition-opacity border-slate-700 text-xs rounded-lg">Details</Button>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700">
              <CalendarOutlined className="text-4xl text-slate-700 mb-4 block" />
              <Text className="text-slate-500">No shops scheduled for this date.</Text>
            </div>
          )}
        </div>
      </div>

      {/* --- 右側：小型月曆選擇器 (Small Calendar) --- */}
      <div className="w-full lg:w-[320px] bg-slate-800/30 p-6 rounded-3xl border border-slate-800/50 self-start">
        <div className="flex justify-between items-center mb-6">
          <Text className="text-white font-bold">{viewMonth.format('MMMM YYYY')}</Text>
          <Space>
            <Button size="small" type="text" icon={<LeftOutlined className="text-slate-400 text-xs" />} onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} />
            <Button size="small" type="text" icon={<RightOutlined className="text-slate-400 text-xs" />} onClick={() => setViewMonth(viewMonth.add(1, 'month'))} />
          </Space>
        </div>

        <div className="grid grid-cols-7 text-center gap-y-2">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-[10px] font-bold text-slate-500 mb-2">{d}</div>
          ))}
          
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} />;
            
            const isSelected = date.isSame(selectedDate, 'day');
            const isToday = date.isSame(dayjs(), 'day');
            const hasData = shops.some(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(date, 'day'));

            return (
              <div key={i} className="relative flex justify-center py-1">
                <button
                  onClick={() => setSelectedDate(date)}
                  className={`
                    w-8 h-8 rounded-full text-xs font-semibold transition-all flex items-center justify-center
                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-slate-400 hover:bg-slate-700'}
                    ${isToday && !isSelected ? 'text-indigo-400 border border-indigo-400/30' : ''}
                  `}
                >
                  {date.date()}
                </button>
                {hasData && !isSelected && (
                  <div className="absolute bottom-0 w-1 h-1 bg-slate-500 rounded-full" />
                )}
              </div>
            );
          })}
        </div>
        
        <Button 
          type="primary" 
          block 
          className="mt-8 bg-indigo-600 border-none h-10 rounded-xl font-bold"
          onClick={() => setSelectedDate(dayjs())}
        >
          Go to Today
        </Button>
      </div>
    </div>
  );
};
