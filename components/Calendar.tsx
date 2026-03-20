// Calendar.tsx - Click-to-Reschedule Redesign (DnD removed)

import React, { useState, useMemo, useRef } from "react";
import dayjs from "dayjs";
import {
  Button,
  Space,
  Typography,
  Avatar,
  Tag,
  Empty,
  Badge,
  Card,
  Modal,
  DatePicker,
  Divider,
  message,
  Radio,
  Spin,
} from "antd";
import {
  ShopOutlined,
  DownOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  LockOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { Shop } from "../types";
import SharePointService from "../services/SharePointService";
import { HK_HOLIDAYS, isHoliday } from "../constants/holidays";

// FullCalendar imports (interactionPlugin kept for dateClick only — DnD removed)
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  DayCellContentArg,
  EventInput,
} from "@fullcalendar/core";

const { Text, Title } = Typography;

// Group colors - matching design system
const GROUP_COLORS: Record<
  number,
  { bg: string; text: string; border: string }
> = {
  1: { bg: "#e0f2fe", text: "#0369a1", border: "#7dd3fc" }, // Group A - Blue
  2: { bg: "#f3e8ff", text: "#7e22ce", border: "#d8b4fe" }, // Group B - Purple
  3: { bg: "#ffedd5", text: "#c2410c", border: "#fdba74" }, // Group C - Orange
};

// Holiday names for tooltips
const HOLIDAY_NAMES: Record<string, string> = {
  "2025-01-01": "New Year's Day",
  "2025-01-29": "Lunar New Year",
  "2025-01-30": "Lunar New Year (2nd)",
  "2025-01-31": "Lunar New Year (3rd)",
  "2025-04-04": "Ching Ming Festival",
  "2025-04-18": "Good Friday",
  "2025-04-19": "Day after Good Friday",
  "2025-04-21": "Easter Monday",
  "2025-05-01": "Labour Day",
  "2025-05-05": "Buddha's Birthday",
  "2025-05-31": "Tuen Ng Festival",
  "2025-07-01": "HKSAR Day",
  "2025-10-01": "National Day",
  "2025-10-07": "Day after Mid-Autumn",
  "2025-10-29": "Chung Yeung Festival",
  "2025-12-25": "Christmas Day",
  "2025-12-26": "Boxing Day",
};

interface CalendarProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
}

interface RescheduleTarget {
  shopId: string;
  sharePointItemId: string;
  shopName: string;
  brandIcon?: string;
  currentDate: string;
  currentGroupId: number;
}

export const Calendar: React.FC<CalendarProps> = ({
  shops,
  graphToken,
  onRefresh,
}) => {
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(1);
  const [isUpdating, setIsUpdating] = useState(false);

  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);

  // Reschedule modal state (replaces selectedGroupRef + Modal.confirm)
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<RescheduleTarget | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<dayjs.Dayjs | null>(
    null,
  );
  const [rescheduleGroupId, setRescheduleGroupId] = useState<number>(1);

  const calendarRef = useRef<FullCalendar>(null);

  // Helper: check if a date can be edited
  const isDateEditable = (date: dayjs.Dayjs | Date | string): boolean => {
    const today = dayjs().startOf("day");
    const targetDate = dayjs(date).startOf("day");

    if (targetDate.isBefore(today) || targetDate.isSame(today, "day"))
      return false;

    const currentWeekEnd = today.endOf("week");
    const nextWeekEnd = currentWeekEnd.add(1, "day").endOf("week");
    if (
      targetDate.isAfter(currentWeekEnd) &&
      targetDate.isBefore(nextWeekEnd.add(1, "day"))
    )
      return false;

    return true;
  };

  // Helper: disabled dates for the reschedule DatePicker
  const disabledDateFn = (current: dayjs.Dayjs): boolean => {
    const today = dayjs().startOf("day");
    if (current.isBefore(today) || current.isSame(today, "day")) return true;
    const currentWeekEnd = today.endOf("week");
    const nextWeekEnd = currentWeekEnd.add(1, "day").endOf("week");
    if (
      current.isAfter(currentWeekEnd) &&
      current.isBefore(nextWeekEnd.add(1, "day"))
    )
      return true;
    if (isHoliday(current.format("YYYY-MM-DD"))) return true;
    return false;
  };

  // Helper: open reschedule modal (used by both chip click and sidebar card click)
  const openRescheduleModal = (params: {
    shopId: string;
    sharePointItemId: string;
    shopName: string;
    brandIcon?: string;
    scheduledDate: string;
    groupId: number;
  }) => {
    if (!params.sharePointItemId) {
      message.error("Cannot update: Missing SharePoint ID");
      return;
    }
    if (!isDateEditable(params.scheduledDate)) {
      message.info(
        "This shop is locked — past dates and next week cannot be edited",
      );
      return;
    }
    setRescheduleTarget({
      shopId: params.shopId,
      sharePointItemId: params.sharePointItemId,
      shopName: params.shopName,
      brandIcon: params.brandIcon,
      currentDate: params.scheduledDate,
      currentGroupId: params.groupId,
    });
    setRescheduleDate(dayjs(params.scheduledDate));
    setRescheduleGroupId(params.groupId);
    setRescheduleModalOpen(true);
  };

  // Save reschedule changes
  const handleRescheduleConfirm = async () => {
    if (!rescheduleTarget || !rescheduleDate) return;
    const newDate = rescheduleDate.format("YYYY-MM-DD");
    const isUnchanged =
      newDate === dayjs(rescheduleTarget.currentDate).format("YYYY-MM-DD") &&
      rescheduleGroupId === rescheduleTarget.currentGroupId;
    if (isUnchanged) {
      setRescheduleModalOpen(false);
      return;
    }
    try {
      setIsUpdating(true);
      const service = new SharePointService(graphToken);
      await service.updateShopScheduleStatus(
        rescheduleTarget.sharePointItemId,
        "Planned",
        newDate,
        rescheduleGroupId,
      );
      message.success(`Updated ${rescheduleTarget.shopName}`);
      onRefresh();
      setRescheduleModalOpen(false);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "Update failed");
    } finally {
      setIsUpdating(false);
    }
  };

  // Convert shops to FullCalendar events (no DnD editable flag)
  const shopEvents = useMemo(() => {
    return shops
      .filter((shop) => shop.scheduledDate)
      .map((shop) => {
        const editable = isDateEditable(shop.scheduledDate!);
        const groupColor = GROUP_COLORS[shop.groupId];
        const groupName =
          shop.groupId === 1
            ? "Group A"
            : shop.groupId === 2
              ? "Group B"
              : "Group C";

        return {
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
            isEditable: editable,
            groupName: groupName,
            tooltip: `${shop.name}\n${shop.id}\nBrand: ${shop.brand}\nGroup: ${groupName}\nAddress: ${shop.address}`,
          },
          backgroundColor: groupColor?.bg || "#e2e8f0",
          borderColor: groupColor?.border || "#cbd5e1",
          textColor: groupColor?.text || "#475569",
          classNames: editable ? [] : ["fc-event-locked"],
        };
      });
  }, [shops]);

  // Holiday background events
  const holidayEvents = useMemo((): EventInput[] => {
    const years = [2025, 2026, 2027, 2028];
    const holidays: EventInput[] = [];
    years.forEach((year) => {
      (HK_HOLIDAYS[year] || []).forEach((date) => {
        holidays.push({
          start: date,
          display: "background",
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          classNames: ["fc-holiday"],
        });
      });
    });
    return holidays;
  }, []);

  const allEvents = useMemo(
    () => [...shopEvents, ...holidayEvents],
    [shopEvents, holidayEvents],
  );

  // Daily data for sidebar
  const dailyData = useMemo(() => {
    const dateStr = selectedDate.format("YYYY-MM-DD");
    const dayShops = shops.filter(
      (s) =>
        s.scheduledDate &&
        dayjs(s.scheduledDate).format("YYYY-MM-DD") === dateStr,
    );
    return {
      groups: [
        {
          id: 1,
          name: "Group A",
          color: "#0369a1",
          items: dayShops.filter((s) => s.groupId === 1),
        },
        {
          id: 2,
          name: "Group B",
          color: "#7e22ce",
          items: dayShops.filter((s) => s.groupId === 2),
        },
        {
          id: 3,
          name: "Group C",
          color: "#c2410c",
          items: dayShops.filter((s) => s.groupId === 3),
        },
      ],
      total: dayShops.length,
      isHoliday: isHoliday(dateStr),
    };
  }, [shops, selectedDate]);

  // Handle calendar chip click → open reschedule modal
  const handleEventClick = (info: EventClickArg) => {
    const props = info.event.extendedProps;
    openRescheduleModal({
      shopId: props.shopId,
      sharePointItemId: props.sharePointItemId,
      shopName: info.event.title,
      brandIcon: props.brandIcon,
      scheduledDate: info.event.startStr,
      groupId: props.groupId,
    });
  };

  // Handle date cell click → update sidebar date
  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(dayjs(arg.date));
  };

  // Render event chip: left border, brand icon, name, edit/lock icon
  const renderEventContent = (eventInfo: {
    event: { title: string; extendedProps: Record<string, any> };
  }) => {
    const { event } = eventInfo;
    const isLocked = !event.extendedProps.isEditable;
    const groupBorder =
      GROUP_COLORS[event.extendedProps.groupId]?.border || "#cbd5e1";

    return (
      <div
        className={`fc-event-content flex items-center gap-1 px-1 py-0.5 overflow-hidden w-full ${isLocked ? "opacity-60" : ""}`}
        style={{ borderLeft: `3px solid ${groupBorder}`, paddingLeft: "5px" }}
      >
        {event.extendedProps.brandIcon && (
          <Avatar
            size={14}
            src={event.extendedProps.brandIcon}
            className="flex-shrink-0 bg-white"
          />
        )}
        <span className="truncate font-semibold text-xs flex-1">
          {event.title}
        </span>
        {isLocked ? (
          <LockOutlined style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }} />
        ) : (
          <EditOutlined
            className="edit-hint"
            style={{ fontSize: 10, flexShrink: 0 }}
          />
        )}
      </div>
    );
  };

  // Render day cell with holiday badge
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
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

  // Export functions — dynamic imports for bundle size
  const handleSetAllDates = () => {
    const scheduledShops = shops.filter((s) => s.scheduledDate);
    if (scheduledShops.length === 0)
      return message.warning("No scheduled data!");
    const dates = scheduledShops
      .map((s) => dayjs(s.scheduledDate))
      .sort((a, b) => a.unix() - b.unix());
    setExportDateRange([dates[0], dates[dates.length - 1]]);
    message.success("Full range selected.");
  };

  const handleExport = async (type: "excel" | "pdf") => {
    if (!exportDateRange[0] || !exportDateRange[1])
      return message.error("Please select a range!");

    const start = exportDateRange[0].startOf("day");
    const end = exportDateRange[1].endOf("day");

    const dataToExport = shops
      .filter(
        (s) =>
          s.scheduledDate &&
          dayjs(s.scheduledDate).isAfter(start.subtract(1, "ms")) &&
          dayjs(s.scheduledDate).isBefore(end.add(1, "ms")),
      )
      .map((s) => [
        s.name,
        s.id,
        dayjs(s.scheduledDate).format("YYYY-MM-DD"),
        s.brand,
        s.address,
        (s as any).address_chi || "-",
        s.region,
        s.district,
        s.area,
        (s as any).phone || "-",
        (s as any).contactName || "-",
        s.groupId ? `Group ${String.fromCharCode(64 + s.groupId)}` : "-",
      ]);

    if (dataToExport.length === 0)
      return message.warning("No data found in range.");
    const hide = message.loading(`Generating ${type.toUpperCase()}...`, 0);

    try {
      if (type === "excel") {
        const [{ default: ExcelJS }, { saveAs }] = await Promise.all([
          import("exceljs"),
          import("file-saver"),
        ]);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Schedules");
        const headers = [
          "Shop Name",
          "Shop Code",
          "Schedule Date",
          "Brand",
          "Address (Eng)",
          "Address (Chi)",
          "Region",
          "District",
          "Area",
          "Phone",
          "Contact",
          "Group",
        ];
        worksheet.addRow(headers);
        worksheet.addRows(dataToExport);
        worksheet.getRow(1).font = { bold: true };
        worksheet.columns.forEach((col) => (col.width = 20));
        const buffer = await workbook.xlsx.writeBuffer();
        saveAs(
          new Blob([buffer]),
          `Schedules_${dayjs().format("YYYYMMDD")}.xlsx`,
        );
      } else {
        const { default: jsPDF } = await import("jspdf");
        await import("jspdf-autotable");
        const doc = new jsPDF("landscape");
        doc.text("Schedule Export Report", 14, 15);
        (doc as any).autoTable({
          head: [
            [
              "Name",
              "Code",
              "Date",
              "Brand",
              "Address (E)",
              "Address (C)",
              "Reg",
              "Dist",
              "Area",
              "Phone",
              "Contact",
              "Grp",
            ],
          ],
          body: dataToExport,
          startY: 20,
          styles: { fontSize: 7 },
          headStyles: { fillColor: [13, 148, 136] },
        });
        doc.save(`Schedules_${dayjs().format("YYYYMMDD")}.pdf`);
      }
      message.success(`${type.toUpperCase()} exported!`);
    } catch (err) {
      message.error("Export failed");
    }
    hide();
    setExportModalVisible(false);
  };

  // Compute whether Save is disabled (no changes made)
  const isSaveDisabled = (() => {
    if (!rescheduleTarget || !rescheduleDate) return true;
    const newDate = rescheduleDate.format("YYYY-MM-DD");
    return (
      newDate === dayjs(rescheduleTarget.currentDate).format("YYYY-MM-DD") &&
      rescheduleGroupId === rescheduleTarget.currentGroupId
    );
  })();

  return (
    <Spin spinning={isUpdating} tip="Updating...">
      <div className="flex flex-col lg:flex-row gap-8 bg-white rounded-[32px] p-8 shadow-sm border border-slate-100 min-h-[700px] dark:bg-slate-900 dark:border-slate-700">
        {/* Main Calendar Area */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="mb-6 flex justify-between items-start">
            <div>
              <Title level={3} className="m-0 text-slate-900 dark:text-white">
                Schedule Overview
              </Title>
              <Text className="text-slate-400 font-medium text-lg">
                {selectedDate.format("dddd, MMMM D, YYYY")}
              </Text>
              {dailyData.isHoliday && (
                <Tag color="red" className="ml-2 font-bold">
                  PUBLIC HOLIDAY
                </Tag>
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
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,dayGridWeek",
              }}
              buttonText={{
                today: "Today",
                month: "Month",
                week: "Week",
              }}
              events={allEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventContent={renderEventContent}
              dayCellContent={renderDayCellContent}
              dayCellClassNames={(arg) =>
                isDateEditable(arg.date) ? [] : ["fc-day-locked"]
              }
              eventDidMount={(info) => {
                if (info.event.extendedProps.tooltip) {
                  info.el.setAttribute(
                    "title",
                    info.event.extendedProps.tooltip,
                  );
                }
              }}
              height="auto"
              aspectRatio={1.8}
              locale="en"
              firstDay={0}
              dayMaxEvents={3}
              moreLinkText={(num) => `+${num} more`}
              eventDisplay="block"
              nowIndicator={true}
            />
          </div>
        </div>

        {/* Sidebar - Selected Date Details */}
        <div className="w-full lg:w-[320px] lg:border-l lg:border-slate-100 lg:pl-8 dark:lg:border-slate-700">
          <div className="sticky top-0">
            {/* Date Header */}
            <div className="mb-6">
              <Title level={4} className="m-0 dark:text-white">
                {selectedDate.format("MMMM D, YYYY")}
              </Title>
              <Text className="text-slate-400">
                {selectedDate.format("dddd")}
              </Text>
              {dailyData.isHoliday && (
                <div className="mt-2">
                  <Tag color="red" className="font-bold text-xs">
                    {HOLIDAY_NAMES[selectedDate.format("YYYY-MM-DD")] ||
                      "Public Holiday"}
                  </Tag>
                </div>
              )}
            </div>

            {/* Group Cards */}
            {dailyData.total > 0 ? (
              <div className="flex flex-col gap-4">
                {dailyData.groups.map((group) => (
                  <div
                    key={group.id}
                    className={`group-expand-card ${expandedGroupId === group.id ? "active" : ""}`}
                  >
                    <div
                      className="group-card-header"
                      onClick={() =>
                        setExpandedGroupId(
                          expandedGroupId === group.id ? null : group.id,
                        )
                      }
                    >
                      <Space size="middle">
                        <Badge color={group.color} />
                        <Text
                          strong
                          className="text-lg text-slate-700 dark:text-slate-200"
                        >
                          {group.name}
                        </Text>
                      </Space>
                      <div className="flex items-center gap-4">
                        <Tag className="rounded-full border-none bg-slate-100 text-slate-500 font-black px-3 dark:bg-slate-700 dark:text-slate-300">
                          {group.items.length} SHOPS
                        </Tag>
                        <DownOutlined
                          className={`transform transition-transform text-slate-400 ${expandedGroupId === group.id ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>
                    <div className="group-card-detail">
                      <div className="flex flex-col gap-3 p-6 pt-2">
                        {group.items.map((shop) => {
                          const shopLocked = !isDateEditable(
                            shop.scheduledDate!,
                          );
                          return (
                            <div
                              key={shop.id}
                              className={`flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-100 shadow-sm dark:bg-slate-800 dark:border-slate-600 transition-colors ${shopLocked ? "cursor-default opacity-70" : "cursor-pointer hover:border-teal-200 hover:bg-teal-50/30 dark:hover:border-teal-700 dark:hover:bg-teal-900/10"}`}
                              onClick={() =>
                                openRescheduleModal({
                                  shopId: shop.id,
                                  sharePointItemId: shop.sharePointItemId || "",
                                  shopName: shop.name,
                                  brandIcon: shop.brandIcon,
                                  scheduledDate: shop.scheduledDate!,
                                  groupId: shop.groupId,
                                })
                              }
                            >
                              <Avatar
                                size={32}
                                shape="square"
                                src={shop.brandIcon}
                                icon={<ShopOutlined />}
                                className="bg-white border border-slate-100 flex-shrink-0 dark:bg-slate-700 dark:border-slate-600"
                                style={{ objectFit: "contain" }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-slate-800 m-0 text-sm leading-tight dark:text-white">
                                    {shop.name}
                                  </h4>
                                  {shopLocked && (
                                    <Tag
                                      icon={<LockOutlined />}
                                      color="default"
                                      className="text-[10px] m-0"
                                    >
                                      Locked
                                    </Tag>
                                  )}
                                </div>
                                <Text
                                  type="secondary"
                                  className="text-[10px] block mt-0.5"
                                >
                                  {shop.id}
                                </Text>
                                <Text className="text-slate-400 text-[10px] block mt-1 leading-tight">
                                  {shop.address}
                                </Text>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center bg-slate-50 rounded-[24px] border border-dashed border-slate-200 dark:bg-slate-800 dark:border-slate-600">
                <Empty
                  description={
                    <span className="text-slate-400">
                      No schedules for this day
                    </span>
                  }
                />
              </div>
            )}

            {/* Month Summary */}
            <Card
              className="rounded-2xl border-none bg-teal-50/50 mt-6 dark:bg-teal-900/20"
              bodyStyle={{ padding: "16px" }}
            >
              <div className="flex justify-between items-center">
                <Text
                  strong
                  className="text-[10px] text-teal-700 uppercase dark:text-teal-300"
                >
                  Month Summary
                </Text>
                <Badge
                  count={
                    shops.filter((s) =>
                      dayjs(s.scheduledDate).isSame(selectedDate, "month"),
                    ).length
                  }
                  color="#0d9488"
                />
              </div>
            </Card>
          </div>
        </div>

        {/* Reschedule Modal */}
        <Modal
          title={
            <div className="font-bold text-slate-800 dark:text-white">
              Edit Schedule
            </div>
          }
          open={rescheduleModalOpen}
          onCancel={() => {
            setRescheduleModalOpen(false);
            setRescheduleDate(null);
          }}
          onOk={handleRescheduleConfirm}
          okText="Save Changes"
          okButtonProps={{
            disabled: isSaveDisabled,
            loading: isUpdating,
            style: { background: "#0d9488", borderColor: "#0d9488" },
          }}
          cancelText="Cancel"
          width={480}
          centered
          destroyOnClose
        >
          {rescheduleTarget && (
            <>
              {/* Shop identity */}
              <div className="flex items-center gap-3 py-2">
                <Avatar
                  size={36}
                  shape="square"
                  src={rescheduleTarget.brandIcon}
                  icon={<ShopOutlined />}
                  className="bg-white border border-slate-200 flex-shrink-0"
                />
                <div>
                  <Text strong className="block text-sm">
                    {rescheduleTarget.shopName}
                  </Text>
                  <Text type="secondary" className="text-xs">
                    {rescheduleTarget.shopId}
                  </Text>
                </div>
              </div>
              <Divider className="my-4" />

              {/* Date picker */}
              <div className="mb-5">
                <Text className="block text-xs text-slate-500 uppercase font-semibold mb-2 tracking-wide">
                  Scheduled Date
                </Text>
                <DatePicker
                  className="w-full"
                  value={rescheduleDate}
                  onChange={(date) => setRescheduleDate(date)}
                  disabledDate={disabledDateFn}
                  format="YYYY-MM-DD"
                  placeholder="Select new date"
                />
              </div>

              {/* Group picker */}
              <div>
                <Text className="block text-xs text-slate-500 uppercase font-semibold mb-3 tracking-wide">
                  Group Assignment
                </Text>
                <Radio.Group
                  value={rescheduleGroupId}
                  onChange={(e) => setRescheduleGroupId(e.target.value)}
                  className="flex gap-4"
                >
                  <Radio value={1}>
                    <Tag color="#0369a1" className="font-bold">
                      Group A
                    </Tag>
                  </Radio>
                  <Radio value={2}>
                    <Tag color="#7e22ce" className="font-bold">
                      Group B
                    </Tag>
                  </Radio>
                  <Radio value={3}>
                    <Tag color="#c2410c" className="font-bold">
                      Group C
                    </Tag>
                  </Radio>
                </Radio.Group>
              </div>
            </>
          )}
        </Modal>

        {/* Export Modal */}
        <Modal
          title={
            <div className="font-black">
              <ExportOutlined className="text-teal-600 mr-2" />
              EXPORT SCHEDULES
            </div>
          }
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
                onChange={(v) => setExportDateRange(v as any)}
              />
              <Button
                className="h-12 rounded-xl font-black px-6"
                onClick={handleSetAllDates}
              >
                ALL
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                block
                className="h-14 rounded-2xl bg-green-600 text-white font-black hover:bg-green-700"
                onClick={() => handleExport("excel")}
              >
                <FileExcelOutlined /> EXCEL
              </Button>
              <Button
                block
                className="h-14 rounded-2xl bg-rose-500 text-white font-black hover:bg-rose-600"
                onClick={() => handleExport("pdf")}
              >
                <FilePdfOutlined /> PDF
              </Button>
            </div>
            <Button
              block
              type="text"
              className="mt-4 font-bold text-slate-400"
              onClick={() => setExportModalVisible(false)}
            >
              CANCEL
            </Button>
          </div>
        </Modal>
      </div>

      <style>{`
        /* Editable events: pointer cursor, hover reveals edit icon */
        .fc-event:not(.fc-event-locked) {
          cursor: pointer !important;
        }
        .edit-hint {
          opacity: 0;
          transition: opacity 150ms ease;
        }
        .fc-event:not(.fc-event-locked):hover .edit-hint {
          opacity: 0.6;
        }

        /* Locked events: default cursor */
        .fc-event-locked {
          cursor: default !important;
          opacity: 0.7;
        }
        .fc-event-locked .fc-event-main {
          cursor: default !important;
        }

        /* Locked day cells: subtle grey wash */
        .fc-day-locked {
          background: rgba(148, 163, 184, 0.06) !important;
        }

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
