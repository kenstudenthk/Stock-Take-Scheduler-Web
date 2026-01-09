import React, { useState } from 'react';
import dayjs from 'dayjs';
import { Tag, Tooltip, Button, Space } from 'antd'; // ✅ 修正匯入
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { Shop } from '../types';

export const Calendar = ({ shops }: { shops: Shop[] }) => {
  const [viewDate, setViewDate] = useState(dayjs('2026-01-01'));
  const firstDay = viewDate.startOf('month').day();
  const daysInMonth = viewDate.daysInMonth();

  return (
    <div style={{ padding: 20, background: '#fff', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2>{viewDate.format('MMMM YYYY')}</h2>
        <Space>
          <Button icon={<LeftOutlined />} onClick={() => setViewDate(viewDate.subtract(1, 'month'))} />
          <Button onClick={() => setViewDate(dayjs())}>Today</Button>
          <Button icon={<RightOutlined />} onClick={() => setViewDate(viewDate.add(1, 'month'))} />
        </Space>
      </div>
      {/* ✅ 修正：移除固定高度限制，使用 min-height 確保顯示完整月份 */}
      <div className="grid grid-cols-7 border">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="p-2 border text-center font-bold bg-gray-50">{d}</div>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={i} className="h-32 border bg-gray-50" />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dateStr = viewDate.date(i + 1).format('YYYY-MM-DD');
          const dayShops = shops.filter(s => s.scheduledDate === dateStr);
          return (
            <div key={i} className="h-32 border p-1 overflow-y-auto">
              <div style={{ textAlign: 'right', color: '#ccc' }}>{i + 1}</div>
              {dayShops.map(s => (
                <Tooltip key={s.id} title={s.name}>
                  <div style={{ fontSize: 10, marginBottom: 2, background: '#e6f7ff', borderLeft: '2px solid #1890ff', padding: '0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {s.name}
                  </div>
                </Tooltip>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};