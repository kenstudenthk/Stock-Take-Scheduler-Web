import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Typography, Avatar, Collapse, Tag, Empty, Badge, Card } from 'antd';
import { 
  LeftOutlined, 
  RightOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined,
  GlobalOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { Shop } from '../types';

const { Text, Title } = Typography;
const { Panel } = Collapse;

export const Calendar: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMonth, setViewMonth] = useState(dayjs());

  // --- 1. 小型月曆邏輯 ---
  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfMonth = viewMonth.startOf('month').day();
  const calendarDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(viewMonth.date(i));
    return arr;
  }, [viewMonth, daysInMonth, firstDayOfMonth]);

  // --- 2. 獲取所選日期的數據並按 Group 分類 ---
  const dailyData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayShops = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    
    return {
      groups: [
        { id: 1, name: 'Group A', color: '#0369a1', items: dayShops.filter(s => s.groupId === 1) },
        { id: 2, name: 'Group B', color: '#7e22ce', items: dayShops.filter(s => s.groupId === 2) },
        { id: 3, name: 'Group C', color: '#c2410c', items: dayShops.filter(s => s.groupId === 3) }
      ],
      total: dayShops.length
    };
  }, [shops, selectedDate]);

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[700px]">
      
      {/* --- 左側：3 Group Accordion --- */}
      <div className="flex-1">
        <div className="mb-8">
          <Title level={3} className="m-0 text-slate-900">Schedule Overview</Title>
          <Text className="text-slate-400 font-medium text-lg">
            {selectedDate.format('dddd, MMMM D, YYYY')}
          </Text>
        </div>

        {dailyData.total > 0 ? (
          <Collapse 
            ghost 
            defaultActiveKey={['1', '2', '3']} 
            expandIconPosition="end"
            className="site-calendar-collapse"
          >
            {dailyData.groups.map(group => (
              <Panel 
                key={group.id} 
                header={
                  <div className="flex justify-between items-center w-full pr-4">
                    <Space size="middle">
                      <Badge color={group.color} />
                      <Text strong className="text-lg text-slate-700">{group.name}</Text>
                    </Space>
                    <Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-black px-3">
                      {group.items.length} SHOPS
                    </Tag>
                  </div>
                }
                className="mb-4 bg-slate-50/40 rounded-2xl border border-slate-100 overflow-hidden"
              >
                <div className="flex flex-col gap-3 py-2">
                  {group.items.length > 0 ? (
                    group.items.map(shop => (
                      <div key={shop.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-teal-400 transition-all group">
                        <Avatar 
                          src={shop.brandIcon} 
                          size={52} 
                          shape="square" 
                          className="bg-slate-50 p-1 border border-slate-100 flex-shrink-0"
                          icon={<ShopOutlined />}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between">
                            <h4 className="font-bold text-slate-800 m-0 truncate text-base">{shop.name}</h4>
                            <Text type="secondary" className="text-[10px] font-bold opacity-50">ID: {shop.id}</Text>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Text type="secondary" className="text-[11px] font-medium uppercase">
                              <EnvironmentOutlined className="text-teal-500 mr-1" /> {shop.district}
                            </Text>
                            <Text type="secondary" className="text-[11px] font-medium uppercase">
                              <GlobalOutlined className="mr-1" /> {shop.brand}
                            </Text>
                          </div>
                          <Text className="text-slate-400 text-[11px] block mt-1 truncate italic">
                            {shop.address}
                          </Text>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-6 text-center">
                      <Text type="secondary" className="italic text-xs">No shops scheduled for {group.name}</Text>
                    </div>
                  )}
                </div>
              </Panel>
            ))}
          </Collapse>
        ) : (
          <div className="py-32 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200">
            <Empty description={<Text type="secondary">No shops scheduled for this date</Text>} />
          </div>
        )}
      </div>

      {/* --- 右側：小型月曆 --- */}
      <div className="w-full lg:w-[320px] lg:border-l lg:border-slate-100 lg:pl-8">
        <div className="sticky top-0">
          <div className="flex justify-between items-center mb-6">
            <Title level={4} className="m-0 text-slate-800">{viewMonth.format('MMMM YYYY')}</Title>
            <Space>
              <Button size="small" type="text" icon={<LeftOutlined />} onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} />
              <Button size="small" type="text" icon={<RightOutlined />} onClick={() => setViewMonth(viewMonth.add(1, 'month'))} />
            </Space>
          </div>

          <div className="grid grid-cols-7 gap-y-1 mb-6">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <div key={day} className="text-center text-[10px] font-black text-slate-300 py-2 uppercase">{day}</div>
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
                      w-9 h-9 rounded-full text-xs font-bold transition-all relative flex items-center justify-center
                      ${isSelected ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}
                      ${isToday && !isSelected ? 'text-teal-600 border border-teal-200' : ''}
                    `}
                  >
                    {date.date()}
                    {hasData && !isSelected && (
                      <span className="absolute bottom-1 w-1 h-1 bg-teal-400 rounded-full" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              block 
              className="h-10 rounded-xl font-bold border-slate-200 text-slate-500 hover:text-teal-600"
              onClick={() => {
                setSelectedDate(dayjs());
                setViewMonth(dayjs());
              }}
            >
              Back to Today
            </Button>
            
            <Card className="rounded-2xl border-none bg-teal-50/50" bodyStyle={{ padding: '16px' }}>
              <div className="flex justify-between items-center">
                <Text strong className="text-[10px] uppercase text-teal-700 tracking-wider">Month Summary</Text>
                <Badge count={shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(viewMonth, 'month')).length} color="#0d9488" />
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 隱藏的樣式修正 */}
      <style>{`
        .site-calendar-collapse .ant-collapse-header {
          padding: 16px 24px !important;
          align-items: center !important;
        }
        .site-calendar-collapse .ant-collapse-content-box {
          padding: 0 24px 16px 24px !important;
        }
      `}</style>
    </div>
  );
};
