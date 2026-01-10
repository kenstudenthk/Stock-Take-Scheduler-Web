import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Typography, Avatar, Collapse, Tag, Empty, Badge } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  EnvironmentOutlined, 
  ShopOutlined,
  CalendarOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Shop } from '../types';

const { Text, Title } = Typography;
const { Panel } = Collapse;

export const Calendar: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMonth, setViewMonth] = useState(dayjs());

  // --- 1. 小型月曆邏輯計算 ---
  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfMonth = viewMonth.startOf('month').day();
  const calendarDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(viewMonth.date(i));
    return arr;
  }, [viewMonth, daysInMonth, firstDayOfMonth]);

  // --- 2. 獲取所選日期的分組門市數據 ---
  const dailyGroups = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayShops = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    
    return {
      1: dayShops.filter(s => s.groupId === 1),
      2: dayShops.filter(s => s.groupId === 2),
      3: dayShops.filter(s => s.groupId === 3),
      total: dayShops.length
    };
  }, [shops, selectedDate]);

  const getGroupLabel = (id: number) => `Group ${String.fromCharCode(64 + id)}`;
  const getGroupColor = (id: number) => {
    if (id === 1) return 'blue';
    if (id === 2) return 'purple';
    return 'orange';
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-50 min-h-[700px]">
      
      {/* --- 左側：分組排程摺疊面板 --- */}
      <div className="flex-1">
        <div className="mb-8">
          <Title level={3} className="m-0 text-slate-900">Schedule Details</Title>
          <Text className="text-slate-400 font-medium">
            {selectedDate.format('dddd, MMMM D, YYYY')} — <Text strong className="text-teal-600">{dailyGroups.total} Stores Scheduled</Text>
          </Text>
        </div>

        {dailyGroups.total > 0 ? (
          <Collapse 
            ghost 
            defaultActiveKey={['1', '2', '3']} 
            expandIconPosition="end"
            className="flex flex-col gap-4"
          >
            {[1, 2, 3].map(gid => {
              const groupShops = dailyGroups[gid as 1|2|3];
              const color = getGroupColor(gid);
              
              return (
                <Panel 
                  key={gid} 
                  header={
                    <div className="flex items-center gap-3">
                      <Badge color={color} />
                      <Text strong className="text-lg">{getGroupLabel(gid)}</Text>
                      <Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-bold ml-2">
                        {groupShops.length} Shops
                      </Tag>
                    </div>
                  }
                  className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden"
                >
                  <div className="flex flex-col gap-3 py-2">
                    {groupShops.length > 0 ? (
                      groupShops.map(shop => (
                        <div key={shop.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                          <Avatar 
                            src={shop.brandIcon} 
                            size={48} 
                            shape="square" 
                            className="bg-slate-50 p-1 flex-shrink-0 border border-slate-100"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 m-0 truncate">{shop.name}</h4>
                            <div className="flex items-center gap-3 mt-0.5">
                              <Text type="secondary" className="text-[11px] uppercase tracking-wider">
                                <GlobalOutlined className="mr-1" /> {shop.id}
                              </Text>
                              <Text type="secondary" className="text-[11px] uppercase tracking-wider">
                                <EnvironmentOutlined className="mr-1" /> {shop.district}
                              </Text>
                            </div>
                            <Text className="text-slate-400 text-[11px] block mt-1 italic truncate">{shop.address}</Text>
                          </div>
                          {shop.status === 'completed' && <Tag color="green" className="m-0 border-none font-bold text-[9px]">DONE</Tag>}
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center">
                        <Text type="secondary" className="italic text-xs">No shops assigned to this group</Text>
                      </div>
                    )}
                  </div>
                </Panel>
              );
            })}
          </Collapse>
        ) : (
          <div className="py-24 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <Empty description="No schedules found for this day" />
          </div>
        )}
      </div>

      {/* --- 右側：小型月曆控制面板 --- */}
      <div className="w-full lg:w-[340px] flex-shrink-0 border-l border-slate-50 pl-0 lg:pl-8">
        <div className="sticky top-0">
          <div className="flex justify-between items-center mb-6">
            <Title level={4} className="m-0">{viewMonth.format('MMMM YYYY')}</Title>
            <Space>
              <Button 
                size="small" 
                type="text" 
                icon={<LeftOutlined />} 
                onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} 
              />
              <Button 
                size="small" 
                type="text" 
                icon={<RightOutlined />} 
                onClick={() => setViewMonth(viewMonth.add(1, 'month'))} 
              />
            </Space>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-6">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
              <div key={day} className="text-center text-[11px] font-bold text-slate-400 py-2">{day}</div>
            ))}
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={`empty-${idx}`} />;
              
              const isSelected = date.isSame(selectedDate, 'day');
              const isToday = date.isSame(dayjs(), 'day');
              const hasData = shops.some(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(date, 'day'));

              return (
                <div key={idx} className="flex justify-center items-center py-1">
                  <button
                    onClick={() => setSelectedDate(date)}
                    className={`
                      w-9 h-9 rounded-full text-xs font-bold transition-all relative
                      ${isSelected ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' : 'text-slate-600 hover:bg-slate-100'}
                      ${isToday && !isSelected ? 'text-teal-600 border border-teal-200' : ''}
                    `}
                  >
                    {date.date()}
                    {hasData && !isSelected && (
                      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-teal-400 rounded-full" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            <Button 
              block 
              className="h-11 rounded-xl font-bold border-slate-200 text-slate-600"
              onClick={() => {
                setSelectedDate(dayjs());
                setViewMonth(dayjs());
              }}
            >
              Today
            </Button>
            <Card className="rounded-2xl border-none bg-slate-50" bodyStyle={{ padding: '16px' }}>
              <Space direction="vertical" size={2}>
                <Text strong className="text-[10px] uppercase text-slate-400 tracking-wider">Quick Info</Text>
                <div className="flex justify-between items-center mt-2">
                  <Text className="text-xs text-slate-500">Selected Month Shops:</Text>
                  <Text strong className="text-xs">{shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(viewMonth, 'month')).length}</Text>
                </div>
              </Space>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
