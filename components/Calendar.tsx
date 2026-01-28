// Calendar.tsx - FullCalendar Refactor with DnD and Multi-View

import React, { useState, useMemo, useRef } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Typography, Avatar, Tag, Empty, Badge, Card, Modal, DatePicker, message, Radio, Spin } from 'antd';
import {
  EnvironmentOutlined,
  ShopOutlined, DownOutlined,
  ExportOutlined, FileExcelOutlined, FilePdfOutlined
} from '@ant-design/icons';
import { Shop } from '../types';
import SharePointService from '../services/SharePointService';
import { HK_HOLIDAYS, isHoliday } from '../constants/holidays';

// FullCalendar imports
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { EventDropArg, EventClickArg, DayCellContentArg, EventInput } from '@fullcalendar/core';

// Export packages
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Text, Title } = Typography;

// Group colors - matching design system
const GROUP_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  1: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // Group A - Blue
  2: { bg: '#f3e8ff', text: '#7e22ce', border: '#d8b4fe' }, // Group B - Purple
  3: { bg: '#ffedd5', text: '#c2410c', border: '#fdba74' }, // Group C - Orange
};

// Holiday names for tooltips (optional enhancement)
const HOLIDAY_NAMES: Record<string, string> = {
  '2025-01-01': "New Year's Day",
  '2025-01-29': 'Lunar New Year',
  '2025-01-30': 'Lunar New Year (2nd)',
  '2025-01-31': 'Lunar New Year (3rd)',
  '2025-04-04': 'Ching Ming Festival',
  '2025-04-18': 'Good Friday',
  '2025-04-19': 'Day after Good Friday',
  '2025-04-21': 'Easter Monday',
  '2025-05-01': 'Labour Day',
  '2025-05-05': 'Buddha\'s Birthday',
  '2025-05-31': 'Tuen Ng Festival',
  '2025-07-01': 'HKSAR Day',
  '2025-10-01': 'National Day',
  '2025-10-07': 'Day after Mid-Autumn',
  '2025-10-29': 'Chung Yeung Festival',
  '2025-12-25': 'Christmas Day',
  '2025-12-26': 'Boxing Day',
};

interface CalendarProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
}

export const Calendar: React.FC<CalendarProps> = ({ shops, graphToken, onRefresh }) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null]>([null, null]);

  // Ref for group change modal
  const selectedGroupRef = useRef<number>(0);
  const calendarRef = useRef<FullCalendar>(null);

  // Convert shops to FullCalendar events
  const shopEvents = useMemo(() => {
    return shops
      .filter(shop => shop.scheduledDate)
      .map(shop => ({
        id: shop.sharePointItemId || shop.id,
        title: shop.name,
        start: shop.scheduledDate,
        extendedProps: {
          shopId: shop.id,
          sharePointItemId: shop.sharePointItemId,
          groupId: shop.groupId,
          brand: shop.brand,
          address: shop.address,
          brandIcon: shop.brandIcon,
        },
        backgroundColor: GROUP_COLORS[shop.groupId]?.bg || '#e2e8f0',
        borderColor: GROUP_COLORS[shop.groupId]?.border || '#cbd5e1',
        textColor: GROUP_COLORS[shop.groupId]?.text || '#475569',
      }));
  }, [shops]);

  // Holiday background events
  const holidayEvents = useMemo((): EventInput[] => {
    const years = [2025, 2026, 2027, 2028];
    const holidays: EventInput[] = [];

    years.forEach(year => {
      (HK_HOLIDAYS[year] || []).forEach(date => {
        holidays.push({
          start: date,
          display: 'background',
          backgroundColor: 'rgba(239, 68, 68, 0.12)',
          classNames: ['fc-holiday'],
        });
      });
    });

    return holidays;
  }, []);

  // All events combined
  const allEvents = useMemo(() => [...shopEvents, ...holidayEvents], [shopEvents, holidayEvents]);

  // Daily data for sidebar
  const dailyData = useMemo(() => {
    const dateStr = selectedDate.format('YYYY-MM-DD');
    const dayShops = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateStr);
    return {
      groups: [
        { id: 1, name: 'Group A', color: '#0369a1', items: dayShops.filter(s => s.groupId === 1) },
        { id: 2, name: 'Group B', color: '#7e22ce', items: dayShops.filter(s => s.groupId === 2) },
        { id: 3, name: 'Group C', color: '#c2410c', items: dayShops.filter(s => s.groupId === 3) }
      ],
      total: dayShops.length,
      isHoliday: isHoliday(dateStr),
    };
  }, [shops, selectedDate]);

  // Handle event drag-and-drop (change date)
  const handleEventDrop = async (info: EventDropArg) => {
    const { event, revert } = info;
    const itemId = event.extendedProps.sharePointItemId;
    const newDate = dayjs(event.start).format('YYYY-MM-DD');

    if (!itemId) {
      message.error('Cannot update: Missing SharePoint ID');
      revert();
      return;
    }

    try {
      setIsUpdating(true);
      const service = new SharePointService(graphToken);
      await service.updateShopScheduleStatus(
        itemId,
        'Scheduled',
        newDate,
        event.extendedProps.groupId
      );
      message.success(`Moved to ${newDate}`);
      onRefresh();
    } catch (error) {
      message.error('Update failed');
      revert();
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle event click (change group)
  const handleEventClick = (info: EventClickArg) => {
    const shop = info.event.extendedProps;
    const itemId = shop.sharePointItemId;
    selectedGroupRef.current = shop.groupId;

    if (!itemId) {
      message.error('Cannot update: Missing SharePoint ID');
      return;
    }

    Modal.confirm({
      title: `Change Group for ${info.event.title}`,
      icon: null,
      content: (
        <div className="py-4">
          <Text className="block mb-4 text-slate-500">Select a new group assignment:</Text>
          <Radio.Group
            defaultValue={shop.groupId}
            onChange={(e) => { selectedGroupRef.current = e.target.value; }}
            className="flex flex-col gap-3"
          >
            <Radio value={1}>
              <Tag color="#0369a1" className="text-sm font-bold">Group A</Tag>
            </Radio>
            <Radio value={2}>
              <Tag color="#7e22ce" className="text-sm font-bold">Group B</Tag>
            </Radio>
            <Radio value={3}>
              <Tag color="#c2410c" className="text-sm font-bold">Group C</Tag>
            </Radio>
          </Radio.Group>
        </div>
      ),
      okText: 'Update',
      cancelText: 'Cancel',
      onOk: async () => {
        const newGroupId = selectedGroupRef.current;
        if (newGroupId === shop.groupId) return;

        try {
          setIsUpdating(true);
          const service = new SharePointService(graphToken);
          await service.updateShopScheduleStatus(
            itemId,
            'Scheduled',
            info.event.startStr,
            newGroupId
          );
          message.success(`Changed to Group ${String.fromCharCode(64 + newGroupId)}`);
          onRefresh();
        } catch (error) {
          message.error('Update failed');
        } finally {
          setIsUpdating(false);
        }
      },
    });
  };

  // Handle date click (select date for sidebar)
  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(dayjs(arg.date));
  };

  // Render custom event content
  const renderEventContent = (eventInfo: { event: { title: string; extendedProps: Record<string, any> }; timeText: string }) => {
    const { event } = eventInfo;
    const brandIcon = event.extendedProps.brandIcon;
    const address = event.extendedProps.address;

    return (
      <div className="fc-event-content flex flex-col px-1 py-0.5 overflow-hidden">
        <div className="flex items-center gap-1">
          {brandIcon && (
            <Avatar
              size={16}
              src={brandIcon}
              className="flex-shrink-0 bg-white"
            />
          )}
          <span className="truncate font-semibold text-xs">{event.title}</span>
        </div>
        {address && (
          <span className="truncate text-[10px] opacity-70">{address}</span>
        )}
      </div>
    );
  };

  // Render day cell with holiday badge
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const dateStr = dayjs(arg.date).format('YYYY-MM-DD');
    const holiday = isHoliday(dateStr);
    const holidayName = HOLIDAY_NAMES[dateStr];

    return (
      <div className="fc-daygrid-day-top-custom">
        <span className="fc-daygrid-day-number">{arg.dayNumberText}</span>
        {holiday && (
          <span className="fc-holiday-badge" title={holidayName}>
            PH
          </span>
        )}
      </div>
    );
  };

  // Export functions (preserved from original)
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

    const dataToExport = shops
      .filter(s => s.scheduledDate && dayjs(s.scheduledDate).isAfter(start.subtract(1,'ms')) && dayjs(s.scheduledDate).isBefore(end.add(1,'ms')))
      .map(s => [
        s.name,
        s.id,
        dayjs(s.scheduledDate).format('YYYY-MM-DD'),
        s.brand,
        s.address,
        (s as any).address_chi || '-',
        s.region,
        s.district,
        s.area,
        (s as any).phone || '-',
        (s as any).contactName || '-',
        s.groupId ? `Group ${String.fromCharCode(64 + s.groupId)}` : '-'
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
    <Spin spinning={isUpdating} tip="Updating...">
      <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[700px] dark:bg-slate-900 dark:border-slate-700">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <Title level={3} className="m-0 text-slate-900 dark:text-white">Schedule Overview</Title>
              <Text className="text-slate-400 font-medium text-lg">{selectedDate.format('dddd, MMMM D, YYYY')}</Text>
              {dailyData.isHoliday && (
                <Tag color="red" className="ml-2 font-bold">PUBLIC HOLIDAY</Tag>
              )}
            </div>
            <button
              className="uiverse-export-btn"
              onClick={() => setExportModalVisible(true)}
            >
              <span>EXPORT DATA</span>
            </button>
          </div>

          {/* FullCalendar */}
          <div className="fc-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek'
              }}
              buttonText={{
                today: 'Today',
                month: 'Month',
                week: 'Week'
              }}
              events={allEvents}
              editable={true}
              droppable={true}
              eventDrop={handleEventDrop}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventContent={renderEventContent}
              dayCellContent={renderDayCellContent}
              height="auto"
              aspectRatio={1.8}
              locale="en"
              firstDay={0}
              dayMaxEvents={3}
              moreLinkText={(num) => `+${num} more`}
              eventDisplay="block"
              nowIndicator={true}
              selectable={false}
            />
          </div>
        </div>

        {/* Sidebar - Selected Date Details */}
        <div className="w-full lg:w-[320px] lg:border-l lg:border-slate-100 lg:pl-8 dark:lg:border-slate-700">
          <div className="sticky top-0">
            {/* Date Header */}
            <div className="mb-6">
              <Title level={4} className="m-0 dark:text-white">
                {selectedDate.format('MMMM D, YYYY')}
              </Title>
              <Text className="text-slate-400">{selectedDate.format('dddd')}</Text>
              {dailyData.isHoliday && (
                <div className="mt-2">
                  <Tag color="red" className="font-bold text-xs">
                    {HOLIDAY_NAMES[selectedDate.format('YYYY-MM-DD')] || 'Public Holiday'}
                  </Tag>
                </div>
              )}
            </div>

            {/* Group Cards */}
            {dailyData.total > 0 ? (
              <div className="flex flex-col gap-4">
                {dailyData.groups.map(group => (
                  <div key={group.id} className={`group-expand-card ${expandedGroupId === group.id ? 'active' : ''}`}>
                    <div
                      className="group-card-header"
                      onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                    >
                      <Space size="middle">
                        <Badge color={group.color} />
                        <Text strong className="text-lg text-slate-700 dark:text-slate-200">{group.name}</Text>
                      </Space>
                      <div className="flex items-center gap-4">
                        <Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-black px-3 dark:bg-slate-700 dark:text-slate-300">
                          {group.items.length} SHOPS
                        </Tag>
                        <DownOutlined className={`transform transition-transform text-slate-400 ${expandedGroupId === group.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                    <div className="group-card-detail">
                      <div className="flex flex-col gap-3 p-6 pt-2">
                        {group.items.map(shop => (
                          <div key={shop.id} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-600">
                            <Avatar
                              size={52}
                              shape="square"
                              src={shop.brandIcon}
                              icon={<ShopOutlined />}
                              className="bg-white p-1 border border-slate-50 dark:bg-slate-700 dark:border-slate-600"
                              style={{ objectFit: 'contain' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between">
                                <h4 className="font-bold text-slate-800 m-0 truncate dark:text-white">{shop.name}</h4>
                                <Text type="secondary" className="text-[10px]">ID: {shop.id}</Text>
                              </div>
                              <Text className="text-slate-400 text-[11px] block truncate">{shop.address}</Text>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200 dark:bg-slate-800 dark:border-slate-600">
                <Empty description={<span className="text-slate-400">No schedules for this day</span>} />
              </div>
            )}

            {/* Month Summary */}
            <Card className="rounded-2xl border-none bg-teal-50/50 mt-6 dark:bg-teal-900/20" bodyStyle={{padding:'16px'}}>
              <div className="flex justify-between items-center">
                <Text strong className="text-[10px] text-teal-700 uppercase dark:text-teal-300">Month Summary</Text>
                <Badge
                  count={shops.filter(s => dayjs(s.scheduledDate).isSame(selectedDate, 'month')).length}
                  color="#0d9488"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Export Modal */}
        <Modal
          title={<div className="font-black"><ExportOutlined className="text-teal-600 mr-2"/>EXPORT SCHEDULES</div>}
          open={exportModalVisible}
          onCancel={() => setExportModalVisible(false)}
          footer={null}
          centered
          width={450}
        >
          <div className="py-4">
            <div className="flex gap-2 mb-6">
              <DatePicker.RangePicker
                className="flex-1 h-12 rounded-xl"
                value={exportDateRange}
                onChange={v => setExportDateRange(v as any)}
              />
              <Button className="h-12 rounded-xl font-black px-6" onClick={handleSetAllDates}>ALL</Button>
            </div>
            <div className="flex gap-3">
              <Button block className="h-14 rounded-2xl bg-green-600 text-white font-black hover:bg-green-700" onClick={() => handleExport('excel')}>
                <FileExcelOutlined/> EXCEL
              </Button>
              <Button block className="h-14 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600" onClick={() => handleExport('pdf')}>
                <FilePdfOutlined/> PDF
              </Button>
            </div>
            <Button block type="text" className="mt-4 font-bold text-slate-400" onClick={() => setExportModalVisible(false)}>CANCEL</Button>
          </div>
        </Modal>
      </div>

      <style>{`
        /* Group expand card animations */
        .group-expand-card {
          background: #f8fafc;
          border: 1px solid #f1f5f9;
          border-radius: 20px;
          overflow: hidden;
          transition: all 0.4s ease;
          height: 72px;
          margin-bottom: 12px;
        }
        .group-expand-card.active {
          height: auto;
          max-height: 2000px;
          background: #fff;
          border-color: #e2e8f0;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
        }
        .group-card-header {
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
        }
        .group-card-detail {
          opacity: 0;
          transition: opacity 0.3s;
        }
        .group-expand-card.active .group-card-detail {
          opacity: 1;
        }

        /* Dark mode group cards */
        body.dark .group-expand-card {
          background: #1e293b;
          border-color: #334155;
        }
        body.dark .group-expand-card.active {
          background: #0f172a;
          border-color: #475569;
        }

        /* Export button animation */
        .uiverse-export-btn {
          position: relative;
          margin: 0;
          padding: 0.8em 1.5em;
          outline: none;
          text-decoration: none;
          display: flex;
          justify-content: center;
          align-items: center;
          cursor: pointer;
          border: none;
          text-transform: uppercase;
          background-color: #333;
          border-radius: 10px;
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          font-family: inherit;
          z-index: 0;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.02, 0.01, 0.47, 1);
        }
        .uiverse-export-btn:hover {
          animation: sh0 0.5s ease-in-out both;
        }
        @keyframes sh0 {
          0% { transform: rotate(0deg) translate3d(0, 0, 0); }
          25% { transform: rotate(7deg) translate3d(0, 0, 0); }
          50% { transform: rotate(-7deg) translate3d(0, 0, 0); }
          75% { transform: rotate(1deg) translate3d(0, 0, 0); }
          100% { transform: rotate(0deg) translate3d(0, 0, 0); }
        }
        .uiverse-export-btn:hover span {
          animation: storm 0.7s ease-in-out both;
          animation-delay: 0.06s;
        }
        .uiverse-export-btn::before,
        .uiverse-export-btn::after {
          content: '';
          position: absolute;
          right: 0;
          bottom: 0;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #fff;
          opacity: 0;
          transition: transform 0.15s cubic-bezier(0.02, 0.01, 0.47, 1), opacity 0.15s cubic-bezier(0.02, 0.01, 0.47, 1);
          z-index: -1;
          transform: translate(100%, -25%) translate3d(0, 0, 0);
        }
        .uiverse-export-btn:hover::before,
        .uiverse-export-btn:hover::after {
          opacity: 0.15;
          transition: transform 0.2s cubic-bezier(0.02, 0.01, 0.47, 1), opacity 0.2s cubic-bezier(0.02, 0.01, 0.47, 1);
        }
        .uiverse-export-btn:hover::before {
          transform: translate3d(50%, 0, 0) scale(0.9);
        }
        .uiverse-export-btn:hover::after {
          transform: translate(50%, 0) scale(1.1);
        }
      `}</style>
    </Spin>
  );
};
