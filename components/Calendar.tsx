// Calendar.tsx - Command-Center Redesign

import React, { useState, useMemo, useRef, useEffect } from "react";
import dayjs from "dayjs";
import {
  Avatar,
  Tag,
  Modal,
  DatePicker,
  Divider,
  message,
  Radio,
  Spin,
  Typography,
  Button,
} from "antd";
import {
  ShopOutlined,
  ExportOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Shop } from "../types";
import SharePointService from "../services/SharePointService";
import { HK_HOLIDAYS, isHoliday } from "../constants/holidays";

// FullCalendar (interactionPlugin kept for dateClick — DnD removed)
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import type {
  EventClickArg,
  DayCellContentArg,
  EventInput,
} from "@fullcalendar/core";

const { Text } = Typography;

// Group color tokens
const GROUP_COLORS: Record<number, { border: string; text: string }> = {
  1: { border: "#0ea5e9", text: "#7dd3fc" }, // Group A – Sky
  2: { border: "#7c3aed", text: "#c4b5fd" }, // Group B – Violet
  3: { border: "#ea580c", text: "#fb923c" }, // Group C – Orange
};

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
  const [panelOpen, setPanelOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentView, setCurrentView] = useState<
    "dayGridMonth" | "dayGridWeek"
  >("dayGridMonth");
  const [currentMonthStr, setCurrentMonthStr] = useState(() =>
    dayjs().format("MMMM YYYY").toUpperCase(),
  );

  // Export modal state
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);

  // Reschedule modal state
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<RescheduleTarget | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<dayjs.Dayjs | null>(
    null,
  );
  const [rescheduleGroupId, setRescheduleGroupId] = useState<number>(1);

  const calendarRef = useRef<FullCalendar>(null);

  // ESC closes the floating panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Stats for header bar
  const stats = useMemo(() => {
    const active = shops.filter((s) => s.masterStatus !== "Closed");
    return {
      total: active.length,
      completed: active.filter((s) => s.status === "Completed").length,
      pool: active.filter((s) => s.status === "Rescheduled" && !s.scheduledDate)
        .length,
      today: active.filter(
        (s) => s.scheduledDate && dayjs(s.scheduledDate).isSame(dayjs(), "day"),
      ).length,
    };
  }, [shops]);

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

  // Helper: disabled dates for DatePicker
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

  // Helper: open reschedule modal
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

  // Save reschedule
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

  // FullCalendar events
  const shopEvents = useMemo(() => {
    return shops
      .filter((shop) => shop.scheduledDate)
      .map((shop) => {
        const editable = isDateEditable(shop.scheduledDate!);
        const groupColor = GROUP_COLORS[shop.groupId];
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
            tooltip: `${shop.name}\n${shop.id}\nGroup: ${shop.groupId === 1 ? "A" : shop.groupId === 2 ? "B" : "C"}\n${shop.address}`,
          },
          backgroundColor: "transparent",
          borderColor: "transparent",
          textColor: groupColor?.text || "#94a3b8",
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
          backgroundColor: "rgba(239,68,68,0.1)",
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

  // Daily data for floating panel
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
          name: "GROUP A",
          color: "#0ea5e9",
          items: dayShops.filter((s) => s.groupId === 1),
        },
        {
          id: 2,
          name: "GROUP B",
          color: "#7c3aed",
          items: dayShops.filter((s) => s.groupId === 2),
        },
        {
          id: 3,
          name: "GROUP C",
          color: "#ea580c",
          items: dayShops.filter((s) => s.groupId === 3),
        },
      ],
      total: dayShops.length,
      isHoliday: isHoliday(dateStr),
    };
  }, [shops, selectedDate]);

  // Calendar event chip click → reschedule modal
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

  // Date cell click → update selected date + open floating panel
  const handleDateClick = (arg: { date: Date }) => {
    setSelectedDate(dayjs(arg.date));
    setPanelOpen(true);
  };

  // Custom toolbar nav handlers
  const handlePrev = () => calendarRef.current?.getApi().prev();
  const handleNext = () => calendarRef.current?.getApi().next();
  const handleToday = () => calendarRef.current?.getApi().today();
  const handleMonthView = () => {
    calendarRef.current?.getApi().changeView("dayGridMonth");
    setCurrentView("dayGridMonth");
  };
  const handleWeekView = () => {
    calendarRef.current?.getApi().changeView("dayGridWeek");
    setCurrentView("dayGridWeek");
  };

  // Render ultra-dense monospace chip
  const renderEventContent = (eventInfo: {
    event: { title: string; extendedProps: Record<string, any> };
  }) => {
    const { event } = eventInfo;
    const isLocked = !event.extendedProps.isEditable;
    const groupColor = GROUP_COLORS[event.extendedProps.groupId];
    const id: string = event.extendedProps.shopId || "";
    const prefix = id.slice(0, 2).toUpperCase();
    const code = id.slice(2);

    return (
      <div
        className={`cc-chip grp-${event.extendedProps.groupId}${isLocked ? " locked" : ""}`}
        title={event.extendedProps.tooltip}
        style={{ borderLeftColor: groupColor?.border || "#475569" }}
      >
        <span className="cc-chip-prefix">{prefix}·</span>
        <span className="cc-chip-code">{code || id}</span>
        <span className="cc-chip-name">{event.title}</span>
        {isLocked && (
          <LockOutlined style={{ fontSize: 8, opacity: 0.5, flexShrink: 0 }} />
        )}
      </div>
    );
  };

  // Render day cell (holiday badge)
  const renderDayCellContent = (arg: DayCellContentArg) => {
    const dateStr = dayjs(arg.date).format("YYYY-MM-DD");
    const holiday = isHoliday(dateStr);
    const holidayName = HOLIDAY_NAMES[dateStr];
    return (
      <div className="cc-day-top">
        <span className="cc-day-num">{arg.dayNumberText}</span>
        {holiday && (
          <span className="cc-ph-badge" title={holidayName}>
            PH
          </span>
        )}
      </div>
    );
  };

  // Export helpers
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
    } catch {
      message.error("Export failed");
    }
    hide();
    setExportModalVisible(false);
  };

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
      {/* ── COMMAND CENTER WRAPPER ── */}
      <div className="cc-page">
        {/* ── HEADER / STATS BAR ── */}
        <div className="cc-header">
          <div className="cc-header-top">
            <div>
              <div className="cc-title">
                SCHEDULE OVERVIEW —{" "}
                <span className="cc-month-cursor">{currentMonthStr}</span>
              </div>
              <div className="cc-sub">
                {selectedDate.format("ddd").toUpperCase()} ·{" "}
                {selectedDate.format("DD")} · {selectedDate.format("YYYY")} · WK{" "}
                {selectedDate.week()}
              </div>
            </div>
            <button
              className="cc-export-btn"
              onClick={() => setExportModalVisible(true)}
            >
              ⚡ EXPORT DATA
            </button>
          </div>

          <div className="cc-stats-row">
            <div className="cc-stat-card cc-stat-1">
              <div className="cc-stat-label">TOTAL SHOPS</div>
              <div className="cc-stat-value">{stats.total}</div>
            </div>
            <div className="cc-stat-card cc-stat-2">
              <div className="cc-stat-label">COMPLETED</div>
              <div className="cc-stat-value">{stats.completed}</div>
            </div>
            <div className="cc-stat-card cc-stat-3">
              <div className="cc-stat-label">POOL</div>
              <div className="cc-stat-value">{stats.pool}</div>
            </div>
            <div className="cc-stat-card cc-stat-4">
              <div className="cc-stat-label">TODAY</div>
              <div className="cc-stat-value">{stats.today}</div>
            </div>
          </div>
        </div>

        {/* ── TOOLBAR ── */}
        <div className="cc-toolbar">
          <div className="cc-nav-btns">
            <button className="cc-nav-btn" onClick={handlePrev}>
              ◀ PREV
            </button>
            <button className="cc-nav-btn cc-nav-active" onClick={handleToday}>
              TODAY
            </button>
            <button className="cc-nav-btn" onClick={handleNext}>
              NEXT ▶
            </button>
          </div>
          <div className="cc-legend">
            <span className="cc-legend-item">
              <span
                className="cc-legend-dot"
                style={{ background: "#0ea5e9" }}
              />
              GROUP A
            </span>
            <span className="cc-legend-item">
              <span
                className="cc-legend-dot"
                style={{ background: "#7c3aed" }}
              />
              GROUP B
            </span>
            <span className="cc-legend-item">
              <span
                className="cc-legend-dot"
                style={{ background: "#ea580c" }}
              />
              GROUP C
            </span>
            <span className="cc-legend-item cc-legend-ph">▪ PH = HOLIDAY</span>
          </div>
          <div className="cc-nav-btns">
            <button
              className={`cc-nav-btn ${currentView === "dayGridMonth" ? "cc-nav-active" : ""}`}
              onClick={handleMonthView}
            >
              MONTH
            </button>
            <button
              className={`cc-nav-btn ${currentView === "dayGridWeek" ? "cc-nav-active" : ""}`}
              onClick={handleWeekView}
            >
              WEEK
            </button>
          </div>
        </div>

        {/* ── CALENDAR BODY ── */}
        <div className="cc-body">
          <div className="cc-fc-wrapper">
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={allEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              eventContent={renderEventContent}
              dayCellContent={renderDayCellContent}
              dayCellClassNames={(arg) => {
                const classes: string[] = [];
                if (!isDateEditable(arg.date)) classes.push("cc-day-locked");
                if (dayjs(arg.date).isSame(dayjs(), "day"))
                  classes.push("cc-day-today");
                if (isHoliday(dayjs(arg.date).format("YYYY-MM-DD")))
                  classes.push("cc-day-holiday");
                return classes;
              }}
              eventDidMount={(info) => {
                if (info.event.extendedProps.tooltip) {
                  info.el.setAttribute(
                    "title",
                    info.event.extendedProps.tooltip,
                  );
                }
              }}
              datesSet={(dateInfo) => {
                setCurrentMonthStr(
                  dayjs(dateInfo.start)
                    .add(15, "day")
                    .format("MMMM YYYY")
                    .toUpperCase(),
                );
              }}
              height="auto"
              locale="en"
              firstDay={0}
              dayMaxEvents={4}
              moreLinkText={(num) => `+${num} more`}
              eventDisplay="block"
              nowIndicator={true}
            />
          </div>

          {/* ── FLOATING DATE PANEL ── */}
          {panelOpen && (
            <div className="cc-float-panel">
              <div className="cc-fp-header">
                <div className="cc-fp-date">
                  {selectedDate.format("ddd").toUpperCase()} ·{" "}
                  {selectedDate.format("DD MMM YYYY").toUpperCase()}
                </div>
                <div className="cc-fp-count">
                  {dailyData.total > 0
                    ? `${dailyData.total} SHOPS · ${dailyData.groups.filter((g) => g.items.length > 0).length} GROUPS`
                    : "NO SHOPS SCHEDULED"}
                  {dailyData.isHoliday && (
                    <span className="cc-fp-ph">
                      {" "}
                      ·{" "}
                      {HOLIDAY_NAMES[selectedDate.format("YYYY-MM-DD")] ||
                        "PUBLIC HOLIDAY"}
                    </span>
                  )}
                </div>
              </div>

              {dailyData.total > 0 ? (
                <div className="cc-fp-groups">
                  {dailyData.groups.map((group) =>
                    group.items.length === 0 ? null : (
                      <div key={group.id} className="cc-fp-group">
                        <div
                          className="cc-fp-group-header"
                          style={{ borderLeftColor: group.color }}
                        >
                          <span
                            className="cc-fp-group-label"
                            style={{ color: group.color }}
                          >
                            {group.name}
                          </span>
                          <span className="cc-fp-group-count">
                            {group.items.length} SHOPS
                          </span>
                        </div>
                        <div className="cc-fp-shops">
                          {group.items.map((shop) => {
                            const shopLocked = !isDateEditable(
                              shop.scheduledDate!,
                            );
                            return (
                              <div
                                key={shop.id}
                                className={`cc-fp-shop${shopLocked ? " locked" : ""}`}
                                onClick={() =>
                                  openRescheduleModal({
                                    shopId: shop.id,
                                    sharePointItemId:
                                      shop.sharePointItemId || "",
                                    shopName: shop.name,
                                    brandIcon: shop.brandIcon,
                                    scheduledDate: shop.scheduledDate!,
                                    groupId: shop.groupId,
                                  })
                                }
                              >
                                <span
                                  className="cc-fp-dot"
                                  style={{ background: group.color }}
                                />
                                <span className="cc-fp-shop-name">
                                  {shop.name}
                                </span>
                                <span className="cc-fp-shop-id">{shop.id}</span>
                                {shopLocked && (
                                  <LockOutlined
                                    style={{ fontSize: 8, opacity: 0.4 }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="cc-fp-empty">NO SHOPS SCHEDULED</div>
              )}

              <div className="cc-fp-footer">
                CLICK SHOP TO RESCHEDULE · ESC TO CLOSE
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RESCHEDULE MODAL (unchanged) ── */}
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

      {/* ── EXPORT MODAL (unchanged) ── */}
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

      {/* ── STYLES ── */}
      <style>{`
        /* ── KEYFRAMES ── */
        @keyframes cc-shimmer {
          0%   { transform: translateX(-150%); }
          100% { transform: translateX(400%); }
        }
        @keyframes cc-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
        @keyframes cc-pulse-glow {
          0%, 100% { box-shadow: 0 0 0 0 rgba(14,165,233,0.4); }
          50%       { box-shadow: 0 0 0 8px rgba(14,165,233,0); }
        }
        @keyframes cc-float-in {
          from { opacity: 0; transform: translateY(10px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        @keyframes cc-chip-in {
          from { opacity: 0; transform: translateX(-4px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes cc-count-up {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0);   }
        }

        /* ══════════════════════════════
           DARK MODE  (body.dark — default)
           ══════════════════════════════ */

        /* Page wrapper */
        .cc-page {
          background: #0f172a;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid #1e293b;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4);
        }

        /* Header */
        .cc-header {
          position: relative;
          background: linear-gradient(180deg, #0f172a 0%, #0c1526 100%);
          border-bottom: 1px solid #1e293b;
          padding: 18px 24px 16px;
          overflow: hidden;
        }
        .cc-header::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            0deg,
            transparent, transparent 3px,
            rgba(14,165,233,0.025) 3px, rgba(14,165,233,0.025) 6px
          );
          pointer-events: none;
        }
        .cc-header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
          position: relative;
          z-index: 1;
        }
        .cc-title {
          font-size: 17px;
          font-weight: 900;
          color: #f1f5f9;
          letter-spacing: -0.3px;
          font-family: monospace;
        }
        .cc-month-cursor::after {
          content: '|';
          color: #0ea5e9;
          animation: cc-blink 1s step-end infinite;
          margin-left: 2px;
          font-weight: 300;
        }
        .cc-sub {
          color: #475569;
          font-size: 10px;
          margin-top: 3px;
          font-family: monospace;
          letter-spacing: 1.5px;
          text-transform: uppercase;
        }
        .cc-export-btn {
          position: relative;
          background: rgba(220,38,38,0.12);
          border: 1px solid rgba(220,38,38,0.35);
          color: #f87171;
          font-size: 11px;
          font-weight: 700;
          padding: 7px 16px;
          border-radius: 6px;
          cursor: pointer;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: monospace;
          transition: all 0.2s;
          z-index: 1;
        }
        .cc-export-btn:hover {
          background: rgba(220,38,38,0.22);
          border-color: rgba(220,38,38,0.6);
        }

        /* Stats cards */
        .cc-stats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          position: relative;
          z-index: 1;
        }
        .cc-stat-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px 14px;
          position: relative;
          overflow: hidden;
          animation: cc-count-up 0.5s ease both;
        }
        .cc-stat-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 35%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
          animation: cc-shimmer 2.8s ease-in-out infinite;
        }
        .cc-stat-1 { border-top: 2px solid #0ea5e9; animation-delay: 0.05s; }
        .cc-stat-2 { border-top: 2px solid #10b981; animation-delay: 0.15s; }
        .cc-stat-3 { border-top: 2px solid #f59e0b; animation-delay: 0.25s; }
        .cc-stat-4 { border-top: 2px solid #818cf8; animation-delay: 0.35s; }
        .cc-stat-card::after { animation-delay: calc(var(--i, 0) * 0.3s); }
        .cc-stat-1::after { --i: 0; }
        .cc-stat-2::after { --i: 1; }
        .cc-stat-3::after { --i: 2; }
        .cc-stat-4::after { --i: 3; }
        .cc-stat-label {
          color: #475569;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          font-family: monospace;
        }
        .cc-stat-value {
          font-size: 24px;
          font-weight: 900;
          font-family: monospace;
          margin-top: 2px;
        }
        .cc-stat-1 .cc-stat-value { color: #7dd3fc; }
        .cc-stat-2 .cc-stat-value { color: #34d399; }
        .cc-stat-3 .cc-stat-value { color: #fbbf24; }
        .cc-stat-4 .cc-stat-value { color: #a5b4fc; }

        /* Toolbar */
        .cc-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 24px;
          background: #0c1526;
          border-bottom: 1px solid #1e293b;
          flex-wrap: wrap;
          gap: 8px;
        }
        .cc-nav-btns { display: flex; gap: 4px; }
        .cc-nav-btn {
          background: #1e293b;
          border: 1px solid #334155;
          color: #64748b;
          font-size: 10px;
          font-weight: 700;
          padding: 5px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-family: monospace;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          transition: all 0.15s;
        }
        .cc-nav-btn:hover { background: #0ea5e915; border-color: #0ea5e940; color: #7dd3fc; }
        .cc-nav-active { background: #0ea5e920 !important; border-color: #0ea5e950 !important; color: #7dd3fc !important; }
        .cc-legend { display: flex; gap: 14px; align-items: center; }
        .cc-legend-item {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          color: #475569;
          font-family: monospace;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .cc-legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
        .cc-legend-ph { color: #ef4444 !important; }

        /* Calendar body */
        .cc-body {
          padding: 16px 24px 24px;
          background: #0f172a;
          position: relative;
        }
        .cc-fc-wrapper .fc-theme-standard td,
        .cc-fc-wrapper .fc-theme-standard th {
          border-color: #1e293b;
        }
        .cc-fc-wrapper .fc-col-header-cell-cushion {
          color: #475569;
          font-size: 11px;
          font-weight: 700;
          font-family: monospace;
          letter-spacing: 1px;
          text-transform: uppercase;
        }
        .cc-fc-wrapper .fc-daygrid-day {
          background: transparent;
        }
        .cc-fc-wrapper .fc-daygrid-day:hover {
          background: rgba(30,41,59,0.6);
        }
        .cc-fc-wrapper .fc-day-other { opacity: 0.3; }
        .cc-fc-wrapper .fc-day-today {
          background: rgba(14,165,233,0.06) !important;
          animation: cc-pulse-glow 2s ease-in-out infinite;
        }
        .cc-fc-wrapper .fc-day-today .fc-daygrid-day-frame { border-top: 2px solid #0ea5e9; }
        .cc-fc-wrapper .cc-day-holiday { background: rgba(239,68,68,0.06) !important; }
        .cc-fc-wrapper .cc-day-locked { opacity: 0.55; }
        .cc-fc-wrapper .fc-daygrid-more-link {
          color: #334155;
          font-size: 9px;
          font-family: monospace;
        }
        .cc-fc-wrapper .fc-daygrid-more-link:hover { color: #0ea5e9; }

        /* Day number custom */
        .cc-day-top {
          display: block;
          text-align: right;
          padding: 2px 4px 0;
        }
        .cc-day-num {
          display: block;
          font-family: monospace;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          line-height: 1.2;
        }
        .fc-day-today .cc-day-num { color: #0ea5e9; font-weight: 900; }
        .cc-ph-badge {
          display: block;
          font-size: 7px;
          font-weight: 700;
          color: #ef4444;
          font-family: monospace;
          letter-spacing: 0.5px;
          line-height: 1;
        }

        /* Event chips — dense monospace */
        .cc-chip {
          display: flex;
          align-items: center;
          gap: 3px;
          background: #0a111f;
          border-left: 3px solid #475569;
          border-radius: 3px;
          padding: 3px 5px;
          margin: 0 2px 2px;
          font-family: monospace;
          font-size: 10px;
          cursor: pointer;
          overflow: hidden;
          animation: cc-chip-in 0.25s ease both;
          transition: background 0.12s;
          line-height: 1.4;
        }
        .cc-chip:hover { background: #142035; }
        .cc-chip.locked { opacity: 0.45; cursor: default; }
        /* prefix */
        .cc-chip-prefix { color: #64748b; flex-shrink: 0; font-size: 9px; }
        /* code — group color (dark mode) */
        .cc-chip-code { font-weight: 800; flex-shrink: 0; }
        .cc-chip.grp-1 .cc-chip-code { color: #38bdf8; }
        .cc-chip.grp-2 .cc-chip-code { color: #a78bfa; }
        .cc-chip.grp-3 .cc-chip-code { color: #fb923c; }
        /* name — readable dark */
        .cc-chip-name {
          color: #cbd5e1;
          font-size: 12px;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          flex: 1;
          margin-left: 1px;
        }

        /* Floating date panel */
        .cc-float-panel {
          position: absolute;
          top: 16px;
          right: 24px;
          width: 230px;
          background: #0a111f;
          border: 1px solid rgba(14,165,233,0.3);
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(14,165,233,0.08);
          animation: cc-float-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          overflow: hidden;
          z-index: 20;
        }
        .cc-fp-header {
          padding: 10px 14px 8px;
          border-bottom: 1px solid #1e293b;
          background: linear-gradient(135deg, #0c2544 0%, #0a111f 100%);
        }
        .cc-fp-date {
          color: #0ea5e9;
          font-size: 11px;
          font-weight: 900;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .cc-fp-count {
          color: #64748b;
          font-size: 10px;
          font-family: monospace;
          margin-top: 2px;
        }
        .cc-fp-ph { color: #ef4444; }
        .cc-fp-groups { padding: 6px 10px; display: flex; flex-direction: column; gap: 4px; }
        .cc-fp-group {
          background: #1e293b;
          border-radius: 6px;
          overflow: hidden;
        }
        .cc-fp-group-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 8px;
          border-left: 3px solid;
        }
        .cc-fp-group-label {
          font-size: 10px;
          font-weight: 800;
          font-family: monospace;
          letter-spacing: 1px;
        }
        .cc-fp-group-count { font-size: 9px; font-family: monospace; color: #64748b; }
        .cc-fp-shops { padding: 0 8px 6px; }
        .cc-fp-shop {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 4px;
          border-radius: 3px;
          cursor: pointer;
          transition: background 0.12s;
          font-family: monospace;
        }
        .cc-fp-shop:hover { background: #0f172a; }
        .cc-fp-shop.locked { opacity: 0.45; cursor: default; }
        .cc-fp-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .cc-fp-shop-name { font-size: 10px; color: #cbd5e1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; flex: 1; }
        .cc-fp-shop-id { font-size: 9px; color: #475569; flex-shrink: 0; }
        .cc-fp-empty { padding: 16px; text-align: center; color: #334155; font-size: 10px; font-family: monospace; letter-spacing: 1px; }
        .cc-fp-footer {
          padding: 6px 14px;
          border-top: 1px solid #1e293b;
          text-align: center;
          font-size: 8px;
          color: #334155;
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        /* ══════════════════════════════
           LIGHT MODE  (body:not(.dark))
           ══════════════════════════════ */
        body:not(.dark) .cc-page {
          background: #fff;
          border-color: #e2e8f0;
          box-shadow: 0 4px 24px rgba(0,0,0,0.08);
        }
        body:not(.dark) .cc-header {
          background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom-color: #e2e8f0;
        }
        body:not(.dark) .cc-header::before {
          background: repeating-linear-gradient(
            0deg,
            transparent, transparent 3px,
            rgba(13,148,136,0.025) 3px, rgba(13,148,136,0.025) 6px
          );
        }
        body:not(.dark) .cc-title { color: #0f172a; }
        body:not(.dark) .cc-month-cursor::after { color: #0d9488; }
        body:not(.dark) .cc-sub { color: #94a3b8; }
        body:not(.dark) .cc-export-btn {
          background: rgba(239,68,68,0.07);
          border-color: rgba(239,68,68,0.25);
          color: #dc2626;
        }
        body:not(.dark) .cc-stat-card {
          background: #fff;
          border-color: #e2e8f0;
        }
        body:not(.dark) .cc-stat-card::after {
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent);
        }
        body:not(.dark) .cc-stat-label { color: #94a3b8; }
        body:not(.dark) .cc-stat-1 .cc-stat-value { color: #0369a1; }
        body:not(.dark) .cc-stat-2 .cc-stat-value { color: #059669; }
        body:not(.dark) .cc-stat-3 .cc-stat-value { color: #d97706; }
        body:not(.dark) .cc-stat-4 .cc-stat-value { color: #4f46e5; }
        body:not(.dark) .cc-toolbar {
          background: #f8fafc;
          border-bottom-color: #e2e8f0;
        }
        body:not(.dark) .cc-nav-btn {
          background: #fff;
          border-color: #e2e8f0;
          color: #64748b;
        }
        body:not(.dark) .cc-nav-btn:hover { background: #f0fdf9; border-color: #0d9488; color: #0d9488; }
        body:not(.dark) .cc-nav-active { background: #f0fdf9 !important; border-color: #0d9488 !important; color: #0d9488 !important; }
        body:not(.dark) .cc-legend-item { color: #94a3b8; }
        body:not(.dark) .cc-body { background: #fff; }
        body:not(.dark) .cc-fc-wrapper .fc-theme-standard td,
        body:not(.dark) .cc-fc-wrapper .fc-theme-standard th { border-color: #f1f5f9; }
        body:not(.dark) .cc-fc-wrapper .fc-col-header-cell-cushion { color: #94a3b8; }
        body:not(.dark) .cc-fc-wrapper .fc-daygrid-day:hover { background: rgba(248,250,252,0.8); }
        body:not(.dark) .cc-fc-wrapper .fc-day-today {
          background: rgba(13,148,136,0.04) !important;
          animation: none;
          box-shadow: none;
        }
        body:not(.dark) .cc-fc-wrapper .fc-day-today .fc-daygrid-day-frame { border-top-color: #0d9488; }
        body:not(.dark) .cc-day-num { color: #374151; }
        body:not(.dark) .fc-day-today .cc-day-num { color: #0d9488; }
        body:not(.dark) .cc-chip {
          background: #f8fafc;
          border-color: #e2e8f0;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
        }
        body:not(.dark) .cc-chip:hover { background: #f1f5f9; }
        body:not(.dark) .cc-chip-prefix { color: #94a3b8; }
        body:not(.dark) .cc-chip-name { color: #374151; font-weight: 500; }
        /* light mode chip code — darker group colors */
        body:not(.dark) .cc-chip.grp-1 .cc-chip-code { color: #0369a1; }
        body:not(.dark) .cc-chip.grp-2 .cc-chip-code { color: #6d28d9; }
        body:not(.dark) .cc-chip.grp-3 .cc-chip-code { color: #c2410c; }
        body:not(.dark) .cc-float-panel {
          background: #fff;
          border-color: #e2e8f0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.12);
        }
        body:not(.dark) .cc-fp-header {
          background: linear-gradient(135deg, #f0fdf9 0%, #fff 100%);
          border-bottom-color: #f1f5f9;
        }
        body:not(.dark) .cc-fp-date { color: #0d9488; }
        body:not(.dark) .cc-fp-count { color: #64748b; }
        body:not(.dark) .cc-fp-group { background: #f8fafc; border: 1px solid #e2e8f0; }
        body:not(.dark) .cc-fp-group-count { color: #64748b; }
        body:not(.dark) .cc-fp-shop:hover { background: #f1f5f9; }
        body:not(.dark) .cc-fp-shop-name { color: #1e293b; font-weight: 500; }
        body:not(.dark) .cc-fp-shop-id { color: #64748b; }
        body:not(.dark) .cc-fp-empty { color: #94a3b8; }
        body:not(.dark) .cc-fp-footer { border-top-color: #e2e8f0; color: #94a3b8; }

        /* FullCalendar overrides — shared */
        .cc-fc-wrapper .fc-event { background: transparent !important; border: none !important; }
        .cc-fc-wrapper .fc-event:focus { box-shadow: none !important; }
        .cc-fc-wrapper .fc-daygrid-event-harness { margin: 0 !important; }
        .cc-fc-wrapper .fc-button { display: none !important; }
        .cc-fc-wrapper .fc-toolbar { display: none !important; }
        .cc-fc-wrapper .fc-scrollgrid { border-radius: 0 !important; }
      `}</style>
    </Spin>
  );
};
