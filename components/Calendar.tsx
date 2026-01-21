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

// ✅ 導入導出套件
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Text, Title } = Typography;

export const Calendar: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [viewMonth, setViewMonth] = useState(dayjs());
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(1);
  
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

  const handleSetAllDates = () => {
    const scheduledShops = shops.filter(s => s.scheduledDate);
    if (scheduledShops.length === 0) return message.warning("No scheduled data!");
    const dates = scheduledShops.map(s => dayjs(s.scheduledDate)).sort((a, b) => a.unix() - b.unix());
    setExportDateRange([dates[0], dates[dates.length - 1]]);
    message.success("Full range selected.");
  };
  const handleExport = async (type: 'excel' | 'pdf') => {
    if (!exportDateRange[0] || !exportDateRange[1]) return message.error("Please select a range!");
    
    const start = exportDateRange[0].startOf('day');
    const end = exportDateRange[1].endOf('day');

    // 準備 12 個欄位的數據
    const dataToExport = shops
      .filter(s => s.scheduledDate && dayjs(s.scheduledDate).isAfter(start.subtract(1,'ms')) && dayjs(s.scheduledDate).isBefore(end.add(1,'ms')))
      .map(s => [
        s.name,                                      // Shop Name
        s.id,                                        // Shop Code
        dayjs(s.scheduledDate).format('YYYY-MM-DD'), // Schedule Date
        s.brand,                                     // Brand
        s.address,                                   // Address (Eng)
        (s as any).address_chi || '-',              // Address (Chi)
        s.region,                                    // Region
        s.district,                                  // District
        s.area,                                      // Area
        (s as any).phone || '-',                     // Phone
        (s as any).contactName || '-',               // Contact
        s.groupId ? `Group ${String.fromCharCode(64 + s.groupId)}` : '-' // Group
      ]);

    if (dataToExport.length === 0) return message.warning("No data found in range.");
    const hide = message.loading(`Generating ${type.toUpperCase()}...`, 0);

    try {
      if (type === 'excel') {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Schedules');
        const headers = ["Shop Name", "Shop Code", "Schedule Date", "Brand", "Address (Eng)", "Address (Chi)", "Region", "District", "Area", "Phone", "Contact", "Group"];
        worksheet.addRow(headers);
        worksheet.addRows(dataToExport);
        worksheet.getRow(1).font = { bold: true };
        worksheet.columns.forEach(col => col.width = 20);
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(new Blob([buffer]), `Schedules_${dayjs().format('YYYYMMDD')}.xlsx`);
      } else {
        const doc = new jsPDF('landscape');
        doc.text("Schedule Export Report", 14, 15);
        (doc as any).autoTable({
          head: [["Name", "Code", "Date", "Brand", "Address (E)", "Address (C)", "Reg", "Dist", "Area", "Phone", "Contact", "Grp"]],
          body: dataToExport,
          startY: 20,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [13, 148, 136] }
        });
        doc.save(`Schedules_${dayjs().format('YYYYMMDD')}.pdf`);
      }
      message.success(`${type.toUpperCase()} exported!`);
    } catch (err) { message.error("Export failed"); }
    hide();
    setExportModalVisible(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[700px]">
      <div className="flex-1">
        <div className="mb-8 flex justify-between items-start">
          <div><Title level={3} className="m-0 text-slate-900">Schedule Overview</Title><Text className="text-slate-400 font-medium text-lg">{selectedDate.format('dddd, MMMM D, YYYY')}</Text></div>
          <Button icon={<ExportOutlined />} onClick={() => setExportModalVisible(true)} className="h-10 rounded-xl font-bold bg-slate-900 text-white border-none shadow-lg px-6">EXPORT</Button>
        </div>

        {dailyData.total > 0 ? (
          <div className="flex flex-col gap-4">
            {dailyData.groups.map(group => (
              <div key={group.id} className={`group-expand-card ${expandedGroupId === group.id ? 'active' : ''}`}>
                <div className="group-card-header" onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}>
                  <Space size="middle"><Badge color={group.color} /><Text strong className="text-lg text-slate-700">{group.name}</Text></Space>
                  <div className="flex items-center gap-4"><Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-black px-3">{group.items.length} SHOPS</Tag><DownOutlined className={`transform transition-transform ${expandedGroupId === group.id ? 'rotate-180' : ''}`} /></div>
                </div>
                <div className="group-card-detail"><div className="flex flex-col gap-3 p-6 pt-2">
                  {group.items.map(shop => (
                    <div key={shop.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm"><Avatar size={52} shape="square" icon={<ShopOutlined />} /><div className="flex-1 min-w-0"><div className="flex justify-between"><h4 className="font-bold text-slate-800 m-0 truncate">{shop.name}</h4><Text type="secondary" className="text-[10px]">ID: {shop.id}</Text></div><Text className="text-slate-400 text-[11px] block truncate">{shop.address}</Text></div></div>
                  ))}
                </div></div>
              </div>
            ))}
          </div>
        ) : <div className="py-32 text-center bg-slate-50 rounded-[32px] border border-dashed border-slate-200"><Empty description="No schedules" /></div>}
      </div>

      <div className="w-full lg:w-[320px] lg:border-l lg:border-slate-100 lg:pl-8">
        <div className="sticky top-0">
          <div className="flex justify-between items-center mb-6"><Title level={4} className="m-0">{viewMonth.format('MMMM YYYY')}</Title><Space><Button size="small" icon={<LeftOutlined />} onClick={() => setViewMonth(viewMonth.subtract(1, 'month'))} /><Button size="small" icon={<RightOutlined />} onClick={() => setViewMonth(viewMonth.add(1, 'month'))} /></Space></div>
          <div className="grid grid-cols-7 gap-y-1 mb-6">{['S','M','T','W','T','F','S'].map(d=><div key={d} className="text-center text-[10px] font-black text-slate-300 py-2 uppercase">{d}</div>)}{calendarDays.map((date, idx) => { if(!date) return <div key={idx}/>; const isSel=date.isSame(selectedDate,'day'); return <div key={idx} className="flex justify-center py-1"><button onClick={()=>setSelectedDate(date)} className={`w-9 h-9 rounded-full text-xs font-bold transition-all relative ${isSel?'bg-teal-600 text-white shadow-md':'text-slate-600 hover:bg-slate-100'}`}>{date.date()}{shops.some(s=>dayjs(s.scheduledDate).isSame(date,'day')) && !isSel && <span className="absolute bottom-1 w-1 h-1 bg-teal-400 rounded-full"/>}</button></div>; })}</div>
          <Card className="rounded-2xl border-none bg-teal-50/50" bodyStyle={{padding:'16px'}}><div className="flex justify-between items-center"><Text strong className="text-[10px] text-teal-700 uppercase">Month Summary</Text><Badge count={shops.filter(s=>dayjs(s.scheduledDate).isSame(viewMonth,'month')).length} color="#0d9488"/></div></Card>
        </div>
      </div>

      <Modal title={<div className="font-black"><ExportOutlined className="text-teal-600 mr-2"/>EXPORT SCHEDULES</div>} open={exportModalVisible} onCancel={()=>setExportModalVisible(false)} footer={null} centered width={450}>
        <div className="py-4">
          <div className="flex gap-2 mb-6"><DatePicker.RangePicker className="flex-1 h-12 rounded-xl" value={exportDateRange} onChange={v=>setExportDateRange(v as any)}/><Button className="h-12 rounded-xl font-black px-6" onClick={handleSetAllDates}>ALL</Button></div>
          <div className="flex gap-3">
            <Button block className="h-14 rounded-2xl bg-green-600 text-white font-black" onClick={()=>handleExport('excel')}><FileExcelOutlined/> EXCEL</Button>
            <Button block className="h-14 rounded-2xl bg-rose-500 text-white font-black" onClick={()=>handleExport('pdf')}><FilePdfOutlined/> PDF</Button>
          </div>
          <Button block type="text" className="mt-4 font-bold text-slate-400" onClick={()=>setExportModalVisible(false)}>CANCEL</Button>
        </div>
      </Modal>

      <style>{`.group-expand-card { background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 20px; overflow: hidden; transition: all 0.4s ease; height: 72px; margin-bottom:12px; } .group-expand-card.active { height: auto; max-height: 2000px; background: #fff; border-color: #e2e8f0; box-shadow: 0 10px 30px rgba(0,0,0,0.05); } .group-card-header { padding: 20px 24px; display: flex; justify-content: space-between; align-items: center; cursor: pointer; } .group-card-detail { opacity: 0; transition: opacity 0.3s; } .group-expand-card.active .group-card-detail { opacity: 1; }`}</style>
    </div>
  );
};
