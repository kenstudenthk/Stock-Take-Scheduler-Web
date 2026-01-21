// Calendar.tsx - Part 1

import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Typography, Avatar, Tag, Empty, Badge, Card, Modal, DatePicker, Divider, message } from 'antd';
import { 
  LeftOutlined, RightOutlined, EnvironmentOutlined, 
  GlobalOutlined, ShopOutlined, DownOutlined,
  ExportOutlined, FileExcelOutlined, FilePdfOutlined, CalendarOutlined
} from '@ant-design/icons';
import { Shop } from '../types';

const { Text, Title } = Typography;

export const Calendar: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMonth, setViewMonth] = useState(dayjs());
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(1);
  
  // --- ✅ Export 導出相關狀態 ---
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  const daysInMonth = viewMonth.daysInMonth();
  const firstDayOfMonth = viewMonth.startOf('month').day();
  const calendarDays = useMemo(() => {
    const arr = [];
    for (let i = 0; i < firstDayOfMonth; i++) arr.push(null);
    for (let i = 1; i <= daysInMonth; i++) arr.push(viewMonth.date(i));
    return arr;
  }, [viewMonth, daysInMonth, firstDayOfMonth]);

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

  // ✅ "All" 按鈕邏輯：自動計算所有排期的日期範圍
  const handleSetAllDates = () => {
    const scheduledShops = shops.filter(s => s.scheduledDate);
    if (scheduledShops.length === 0) return message.warning("No scheduled data found!");
    
    const dates = scheduledShops.map(s => dayjs(s.scheduledDate)).sort((a, b) => a.unix() - b.unix());
    setExportDateRange([dates[0], dates[dates.length - 1]]);
    message.success("Range set to cover all schedules.");
  };

  const handleExport = (type: 'excel' | 'pdf') => {
    if (!exportDateRange[0] || !exportDateRange[1]) return message.error("Please select a date range first!");
    message.loading(`Generating ${type.toUpperCase()} file...`, 1.5).then(() => {
      message.success(`${type.toUpperCase()} report generated (Mock).`);
      setExportModalVisible(false);
    });
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[700px]">
      <div className="flex-1">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <Title level={3} className="m-0 text-slate-900">Schedule Overview</Title>
            <Text className="text-slate-400 font-medium text-lg">{selectedDate.format('dddd, MMMM D, YYYY')}</Text>
          </div>
          
          {/* ✅ 右上角導出按鈕 (Red Line Location) */}
          <Button 
            icon={<ExportOutlined />} 
            onClick={() => setExportModalVisible(true)}
            className="h-10 rounded-xl font-bold bg-slate-900 text-white border-none shadow-lg hover:bg-slate-700 transition-all px-6"
          >
            EXPORT
          </Button>
        </div>

        {dailyData.total > 0 ? (
          <div className="flex flex-col gap-4">
            {dailyData.groups.map(group => {
              const isExpanded = expandedGroupId === group.id;
              return (
                <div key={group.id} className={`group-expand-card ${isExpanded ? 'active' : ''}`}>
                  <div className="group-card-header" onClick={() => setExpandedGroupId(isExpanded ? null : group.id)}>
                    <Space size="middle"><Badge color={group.color} /><Text strong className="text-lg text-slate-700">{group.name}</Text></Space>
                    <div className="flex items-center gap-4"><Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-black px-3">{group.items.length} SHOPS</Tag><DownOutlined className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} /></div>
                  </div>
                  <div className="group-card-detail">
                    <div className="flex flex-col gap-3 p-6 pt-2">
                      {group.items.length > 0 ? group.items.map(shop => (
                        <div key={shop.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm hover:border-teal-400 transition-all group">
                          <Avatar size={52} shape="square" className="bg-slate-50 p-1 border border-slate-100 flex-shrink-0" icon={<ShopOutlined />} />
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between"><h4 className="font-bold text-slate-800 m-0 truncate text-base">{shop.name}</h4><Text type="secondary" className="text-[10px] font-bold opacity-50">ID: {shop.id}</Text></div>
                            <div className="flex items-center gap-3 mt-1"><Text type="secondary" className="text-[11px] font-medium uppercase"><EnvironmentOutlined className="text-teal-500 mr-1" /> {shop.district}</Text><Text type="secondary" className="text-[11px] font-medium uppercase"><GlobalOutlined className="mr-1" /> {shop.brand}</Text></div>
                            <Text className="text-slate-400 text-[11px] block mt-1 truncate italic">{shop.address}</Text>
                          </div>
                        </div>
                      )) : <div className="py-6 text-center"><Text type="secondary" className="italic text-xs">No shops scheduled</Text></div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <div className="py-32 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200"><Empty description="No shops scheduled" /></div>}
      </div>
      <div className="w-full lg:w-[320px] lg:border-l lg:border-slate-100 lg:pl-8">
        <div className="sticky top-0">
          <div className="flex justify-between items-center mb-6"><Title level={4} className="m-0 text-slate-800">{viewMonth.format('MMMM YYYY')}</Title><Space><Button size="small" type="text" icon={<LeftOutlined />} onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} /><Button size="small" type="text" icon={<RightOutlined />} onClick={() => setViewMonth(viewMonth.add(1, 'month'))} /></Space></div>
          <div className="grid grid-cols-7 gap-y-1 mb-6">{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => <div key={day} className="text-center text-[10px] font-black text-slate-300 py-2 uppercase">{day}</div>)}{calendarDays.map((date, idx) => { if (!date) return <div key={`empty-${idx}`} />; const isSelected = date.isSame(selectedDate, 'day'); const isToday = date.isSame(dayjs(), 'day'); const hasData = shops.some(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(date, 'day')); return (<div key={idx} className="flex justify-center items-center py-1"><button onClick={() => setSelectedDate(date)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all relative flex items-center justify-center ${isSelected ? 'bg-teal-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'} ${isToday && !isSelected ? 'text-teal-600 border border-teal-200' : ''}`}>{date.date()}{hasData && !isSelected && <span className="absolute bottom-1 w-1 h-1 bg-teal-400 rounded-full" />}</button></div>); })}</div>
          <Button block className="h-10 rounded-xl font-bold border-slate-200 text-slate-500 mb-3" onClick={() => { setSelectedDate(dayjs()); setViewMonth(dayjs()); }}>Back to Today</Button>
          <Card className="rounded-2xl border-none bg-teal-50/50" bodyStyle={{ padding: '16px' }}><div className="flex justify-between items-center"><Text strong className="text-[10px] uppercase text-teal-700 tracking-wider">Month Summary</Text><Badge count={shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).isSame(viewMonth, 'month')).length} color="#0d9488" /></div></Card>
        </div>
      </div>

      {/* ✅ EXPORT MODAL 設計 */}
      <Modal
        title={<div className="font-black text-slate-800"><ExportOutlined className="mr-2 text-teal-600" /> EXPORT RANGE DATA</div>}
        open={exportModalVisible}
        onCancel={() => setExportModalVisible(false)}
        footer={null}
        width={450}
        centered
      >
        <div className="py-4">
          <Text type="secondary" className="block mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Select Export Range</Text>
          <div className="flex gap-2 mb-8">
            <DatePicker.RangePicker 
              className="flex-1 h-12 rounded-xl border-slate-200" 
              value={exportDateRange}
              onChange={(val) => setExportDateRange(val as any)}
            />
            <Button className="h-12 rounded-xl font-black bg-slate-100 border-none hover:bg-slate-200 px-6" onClick={handleSetAllDates}>ALL</Button>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-2xl mb-8 border border-slate-100 flex items-center gap-3">
             <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center text-teal-600"><CalendarOutlined /></div>
             <Text className="text-[11px] font-bold text-slate-500">12 columns will be included in the report (Address, Group, District, etc.)</Text>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <Button block className="h-14 rounded-2xl bg-green-600 text-white font-black border-none hover:bg-green-700 shadow-md flex flex-col items-center justify-center gap-0" onClick={() => handleExport('excel')}>
                <FileExcelOutlined style={{fontSize: '18px'}} />
                <span className="text-[10px]">EXCEL FORMAT</span>
              </Button>
              <Button block className="h-14 rounded-2xl bg-rose-500 text-white font-black border-none hover:bg-rose-600 shadow-md flex flex-col items-center justify-center gap-0" onClick={() => handleExport('pdf')}>
                <FilePdfOutlined style={{fontSize: '18px'}} />
                <span className="text-[10px]">PDF DOCUMENT</span>
              </Button>
            </div>
            <Button block type="text" className="font-bold text-slate-400 mt-2" onClick={() => setExportModalVisible(false)}>CANCEL</Button>
          </div>
        </div>
      </Modal>

      <style>{`
        .group-expand-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; transition: all 0.4s ease; height: 72px; } 
        .group-expand-card.active { height: auto; max-height: 2000px; background: #ffffff; border-color: #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); } 
        .group-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; } 
        .group-card-detail { opacity: 0; transition: opacity 0.3s ease; } 
        .group-expand-card.active .group-card-detail { opacity: 1; }
      `}</style>
    </div>
  );
};
