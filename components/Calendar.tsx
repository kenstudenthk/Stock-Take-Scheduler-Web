import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Tag, Tooltip, Button, Space, Typography, Popover, List, Badge } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined, ShopOutlined } from '@ant-design/icons';
import { Shop } from '../types';

const { Text } = Typography;

export const Calendar = ({ shops }: { shops: Shop[] }) => {
  const [viewDate, setViewDate] = useState(dayjs());
  
  const firstDay = viewDate.startOf('month').day();
  const daysInMonth = viewDate.daysInMonth();

  // 定義 Group 樣式
  const getGroupConfig = (groupId: number) => {
    switch (groupId) {
      case 1: return { color: 'blue', label: 'Group A', bg: '#e0f2fe', text: '#0369a1' };
      case 2: return { color: 'purple', label: 'Group B', bg: '#f3e8ff', text: '#7e22ce' };
      case 3: return { color: 'orange', label: 'Group C', bg: '#ffedd5', text: '#c2410c' };
      default: return { color: 'default', label: 'N/A', bg: '#f1f5f9', text: '#475569' };
    }
  };

  // 渲染分組門市清單的彈窗內容
  const renderGroupPopover = (groupShops: Shop[], groupId: number, dateStr: string) => {
    const config = getGroupConfig(groupId);
    return (
      <div style={{ width: 240 }}>
        <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-100">
          <Text strong className="text-slate-800">{config.label} List</Text>
          <Text type="secondary" className="text-xs">{dateStr}</Text>
        </div>
        <List
          size="small"
          dataSource={groupShops}
          renderItem={item => (
            <List.Item className="px-0 border-none py-1">
              <Space align="start">
                <ShopOutlined className="mt-1 text-slate-300" />
                <div className="flex flex-col">
                  <Text className="text-xs font-bold leading-tight">{item.name}</Text>
                  <Text type="secondary" className="text-[10px] uppercase">{item.district}</Text>
                </div>
              </Space>
            </List.Item>
          )}
        />
      </div>
    );
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden">
      {/* 自定義 Header */}
      <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-white">
        <Space size="middle">
          <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
            <CalendarOutlined style={{ fontSize: '24px' }} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 m-0">{viewDate.format('MMMM YYYY')}</h2>
            <Text type="secondary" className="text-xs uppercase font-bold tracking-widest">Master Schedule View</Text>
          </div>
        </Space>

        <Space className="bg-slate-50 p-2 rounded-2xl">
          <Button type="text" icon={<LeftOutlined />} onClick={() => setViewDate(viewDate.subtract(1, 'month'))} className="hover:bg-white rounded-xl" />
          <Button className="border-none shadow-sm rounded-xl font-bold px-6 h-9" onClick={() => setViewDate(dayjs())}>Today</Button>
          <Button type="text" icon={<RightOutlined />} onClick={() => setViewDate(viewDate.add(1, 'month'))} className="hover:bg-white rounded-xl" />
        </Space>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="p-3 text-center font-black text-[10px] uppercase text-slate-400 bg-slate-50 tracking-tighter">{d}</div>
          ))}

          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-40 bg-slate-50/50 p-2" />
          ))}

          {Array.from({ length: daysInMonth }).map((_, i) => {
            const currentDay = viewDate.date(i + 1);
            const dateStr = currentDay.format('YYYY-MM-DD');
            const isToday = dateStr === dayjs().format('YYYY-MM-DD');

            // ✅ 第一層過濾：該日期的所有門市
            const dayShops = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);

            return (
              <div key={i} className="h-40 bg-white p-2 border-slate-100 flex flex-col transition-all hover:bg-teal-50/10">
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-xs font-black ${isToday ? 'bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-300'}`}>
                    {i + 1}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1.5 overflow-hidden">
                  {/* ✅ 第二層過濾：將門市按 Group A/B/C 分類顯示 */}
                  {[1, 2, 3].map(gid => {
                    const groupShops = dayShops.filter(s => s.groupId === gid);
                    if (groupShops.length === 0) return null;

                    const config = getGroupConfig(gid);
                    return (
                      <Popover 
                        key={gid} 
                        content={() => renderGroupPopover(groupShops, gid, dateStr)} 
                        trigger="click" 
                        placement="right"
                        overlayClassName="custom-popover"
                      >
                        <div 
                          className="px-2 py-1 rounded-md cursor-pointer transition-all hover:brightness-95 flex justify-between items-center"
                          style={{ background: config.bg, borderLeft: `3px solid ${config.text}`, color: config.text }}
                        >
                          <span className="text-[10px] font-black uppercase tracking-tighter">{config.label}</span>
                          <span className="text-[10px] font-bold bg-white/50 px-1.5 rounded-full">{groupShops.length}</span>
                        </div>
                      </Popover>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
