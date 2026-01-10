import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Tag, Tooltip, Button, Space, Typography } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import { Shop } from '../types';

const { Text } = Typography;

export const Calendar = ({ shops }: { shops: Shop[] }) => {
  // 預設顯示當前月份
  const [viewDate, setViewDate] = useState(dayjs());
  
  const firstDay = viewDate.startOf('month').day();
  const daysInMonth = viewDate.daysInMonth();

  // 定義 Group 顏色樣式 (與 Dashboard 一致)
  const getGroupStyle = (groupId: number) => {
    switch (groupId) {
      case 1: return { bg: '#e0f2fe', border: '#0369a1', text: '#0369a1', label: 'A' }; // Blue
      case 2: return { bg: '#f3e8ff', border: '#7e22ce', text: '#7e22ce', label: 'B' }; // Purple
      case 3: return { bg: '#ffedd5', border: '#c2410c', text: '#c2410c', label: 'C' }; // Orange
      default: return { bg: '#f1f5f9', border: '#475569', text: '#475569', label: '-' };
    }
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-slate-50 overflow-hidden">
      {/* --- 自定義 Header --- */}
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
          <Button 
            type="text" 
            icon={<LeftOutlined />} 
            onClick={() => setViewDate(viewDate.subtract(1, 'month'))}
            className="hover:bg-white rounded-xl"
          />
          <Button 
            className="border-none shadow-sm rounded-xl font-bold px-6 h-9" 
            onClick={() => setViewDate(dayjs())}
          >
            Today
          </Button>
          <Button 
            type="text" 
            icon={<RightOutlined />} 
            onClick={() => setViewDate(viewDate.add(1, 'month'))}
            className="hover:bg-white rounded-xl"
          />
        </Space>
      </div>

      {/* --- 月曆主體 --- */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
          {/* 星期標頭 */}
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
            <div key={d} className="p-3 text-center font-black text-[10px] uppercase text-slate-400 bg-slate-50 tracking-tighter">
              {d}
            </div>
          ))}

          {/* 填充上個月的空白 */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-32 bg-slate-50/50 p-2" />
          ))}

          {/* 本月日期 */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const currentDay = viewDate.date(i + 1);
            const dateStr = currentDay.format('YYYY-MM-DD');
            const isToday = dateStr === dayjs().format('YYYY-MM-DD');

            // ✅ 修復比對邏輯：強制轉換格式再過濾
            const dayShops = shops.filter(s => {
              if (!s.scheduledDate) return false;
              return dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr;
            });

            return (
              <div key={i} className={`h-40 bg-white p-2 border-slate-100 flex flex-col transition-all hover:bg-teal-50/20`}>
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-black ${isToday ? 'bg-teal-600 text-white w-6 h-6 rounded-full flex items-center justify-center' : 'text-slate-300'}`}>
                    {i + 1}
                  </span>
                  {dayShops.length > 0 && (
                    <span className="text-[9px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md">
                      {dayShops.length} Shops
                    </span>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-1">
                  {dayShops.map(s => {
                    const style = getGroupStyle(s.groupId);
                    return (
                      <Tooltip key={s.id} title={`${s.name} (${s.district})`}>
                        <div 
                          style={{ 
                            fontSize: '9px', 
                            background: style.bg, 
                            borderLeft: `3px solid ${style.border}`, 
                            color: style.text,
                            padding: '2px 6px',
                            borderRadius: '4px'
                          }}
                          className="font-bold truncate cursor-pointer hover:brightness-95"
                        >
                          <span className="opacity-60 mr-1">[{style.label}]</span> {s.name}
                        </div>
                      </Tooltip>
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
