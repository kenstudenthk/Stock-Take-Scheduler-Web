/**
 * Generator.tsx - 智能排程生成器
 *
 * 設計系統準則遵循: design-system/stock-take-scheduler/pages/generator.md
 *
 * 三步驟流程:
 * - Step 1 (紅色/Problem): Configure - 設定篩選器和參數
 * - Step 2 (橙色/Process): Generate - 創建排程
 * - Step 3 (綠色/Solution): Sync - 儲存到 SharePoint
 */

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Card,
  Row,
  Col,
  Space,
  Button,
  Typography,
  Switch,
  Select,
  InputNumber,
  Table,
  Tag,
  message,
  Modal,
  DatePicker,
  Progress,
  Tooltip,
} from "antd";
import {
  ControlOutlined,
  CheckCircleOutlined,
  SaveOutlined,
  ShopOutlined,
  HourglassOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SyncOutlined,
  HistoryOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  ArrowRightOutlined,
  RocketOutlined,
  WarningOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Shop, User, hasPermission } from "../types";
import { SP_FIELDS } from "../constants";
import { isHoliday, getAllHolidays } from "../constants/holidays";
import { GENERATOR_DEFAULTS, BATCH_CONFIG } from "../constants/config";
import {
  executeBatch,
  BatchResult,
  formatBatchResult,
} from "../utils/batchOperations";

dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ========================================
// DESIGN SYSTEM COLORS (Step-based)
// ========================================
const DESIGN_COLORS = {
  step1: "#EF4444", // Red - Problem/Configure
  step2: "#F97316", // Orange - Process/Generate
  step3: "#22C55E", // Green - Solution/Sync
  cta: "#0D9488", // Teal - Brand CTA
  neutral: "#64748B", // Slate - Supporting
  bg: "#F8FAFC", // Light background
  border: "#E2E8F0", // Border
};

// ========================================
// WIZARD STEP CONFIGURATION
// ========================================
type WizardStep = "configure" | "generate" | "sync" | "complete";

interface StepConfig {
  key: WizardStep;
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const WIZARD_STEPS: StepConfig[] = [
  {
    key: "configure",
    number: 1,
    title: "Configure",
    description: "Set filters & parameters",
    icon: <SettingOutlined />,
    color: DESIGN_COLORS.step1,
  },
  {
    key: "generate",
    number: 2,
    title: "Generate",
    description: "Create schedule",
    icon: <ThunderboltOutlined />,
    color: DESIGN_COLORS.step2,
  },
  {
    key: "sync",
    number: 3,
    title: "Sync",
    description: "Save to SharePoint",
    icon: <CloudUploadOutlined />,
    color: DESIGN_COLORS.step3,
  },
];

// ========================================
// REGION CONFIGURATION
// ========================================
const REGION_DISPLAY_CONFIG: Record<
  string,
  { label: string; social: string; svg: React.ReactNode }
> = {
  HK: {
    label: "HK Island",
    social: "hk",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  KN: {
    label: "Kowloon",
    social: "kn",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <rect
          x="6"
          y="6"
          width="12"
          height="12"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  NT: {
    label: "N.T.",
    social: "nt",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <path
          d="M2 20L9 4L14 14L18 8L22 20H2Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
  },
  Islands: {
    label: "Lantau",
    social: "islands",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M12 10V3" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  MO: {
    label: "Macau",
    social: "mo",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <path
          d="M12 3L4 9V21H20V9L12 3Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
};

// ========================================
// ANIMATED LOADERS
// ========================================
const ResetChaseLoader = () => (
  <div className="chase-overlay">
    <div className="chase-scene">
      <div className="ghost-chaser">
        <div
          style={{
            background: "#ef4444",
            width: "140px",
            height: "140px",
            borderRadius: "70px 70px 0 0",
            position: "relative",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "20px",
              paddingTop: "40px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "30px",
                height: "35px",
                background: "white",
                borderRadius: "50%",
              }}
            />
            <div
              style={{
                width: "30px",
                height: "35px",
                background: "white",
                borderRadius: "50%",
              }}
            />
          </div>
        </div>
      </div>
      <div className="pacman-runner"></div>
      <div className="dots-trail">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="dot-node" />
        ))}
      </div>
    </div>
    <Title level={4} style={{ color: "white", marginTop: "40px" }}>
      Resetting Schedules...
    </Title>
  </div>
);

const SyncGeometricLoader = ({
  text = "Syncing to SharePoint...",
  progress,
}: {
  text?: string;
  progress?: number;
}) => (
  <div className="geometric-loader-overlay">
    <div className="geometric-loader">
      <div className="cube">
        <div className="face front"></div>
        <div className="face back"></div>
        <div className="face left"></div>
        <div className="face right"></div>
        <div className="face top"></div>
        <div className="face bottom"></div>
      </div>
    </div>
    <Title level={4} style={{ color: "white", marginTop: "40px" }}>
      {text}
    </Title>
    {progress !== undefined && (
      <Progress
        percent={progress}
        strokeColor={{ "0%": DESIGN_COLORS.step2, "100%": DESIGN_COLORS.step3 }}
        trailColor="rgba(255,255,255,0.2)"
        style={{ width: "300px", marginTop: "20px" }}
      />
    )}
  </div>
);

// ========================================
// SUMMARY CARD COMPONENT
// ========================================
interface SummaryCardProps {
  label: string;
  value: number;
  subtext: string;
  bgColor: string;
  icon: React.ReactNode;
  isPulsing?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  subtext,
  bgColor,
  icon,
  isPulsing = false,
}) => (
  <div
    className={`summary-card-item ${isPulsing ? "status-pulse status-pulse--danger" : ""}`}
    style={{ borderLeft: `4px solid ${bgColor}` }}
  >
    <div
      className="summary-card-icon-area"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
    </div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

// ========================================
// WIZARD PROGRESS BAR COMPONENT (Vertical Version)
// ========================================
interface WizardProgressBarVerticalProps {
  currentStep: WizardStep;
}

const WizardProgressBarVertical: React.FC<WizardProgressBarVerticalProps> = ({
  currentStep,
}) => {
  const currentStepIndex = WIZARD_STEPS.findIndex((s) => s.key === currentStep);

  return (
    <div className="wizard-progress-vertical-container">
      <div className="wizard-steps-vertical-track">
        {WIZARD_STEPS.map((step, index) => {
          const isActive = step.key === currentStep;
          const isCompleted = index < currentStepIndex;
          const isPending = index > currentStepIndex;

          return (
            <React.Fragment key={step.key}>
              {/* Step Item */}
              <div
                className={`wizard-step-vertical ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isPending ? "pending" : ""}`}
                style={
                  {
                    "--step-color": isCompleted
                      ? DESIGN_COLORS.step3
                      : step.color,
                  } as React.CSSProperties
                }
              >
                <div className="wizard-step-vertical-circle">
                  {isCompleted ? (
                    <CheckCircleFilled
                      style={{ fontSize: 24, color: DESIGN_COLORS.step3 }}
                    />
                  ) : (
                    <div
                      className="wizard-step-vertical-icon"
                      style={{
                        color: isActive ? step.color : DESIGN_COLORS.neutral,
                      }}
                    >
                      {step.icon}
                    </div>
                  )}
                </div>
                <div className="wizard-step-vertical-content">
                  <div className="wizard-step-vertical-number">
                    Step {step.number}
                  </div>
                  <div className="wizard-step-vertical-title">{step.title}</div>
                  <div className="wizard-step-vertical-description">
                    {step.description}
                  </div>
                </div>
              </div>

              {/* Vertical Connector */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className="wizard-connector-vertical">
                  <div className="wizard-connector-vertical-track"></div>
                  <div
                    className="wizard-connector-vertical-fill"
                    style={{
                      height: isCompleted ? "100%" : isActive ? "50%" : "0%",
                      backgroundColor: isCompleted
                        ? DESIGN_COLORS.step3
                        : DESIGN_COLORS.step2,
                    }}
                  ></div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// ========================================
// MAIN COMPONENT
// ========================================
export const Generator: React.FC<{
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser: User | null;
}> = ({ shops, graphToken, onRefresh, currentUser }) => {
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  const [startDate, setStartDate] = useState<string>(
    dayjs().format("YYYY-MM-DD"),
  );
  const [shopsPerDay, setShopsPerDay] = useState<number>(
    GENERATOR_DEFAULTS.shopsPerDay,
  );
  const [groupsPerDay, setGroupsPerDay] = useState<number>(
    GENERATOR_DEFAULTS.groupsPerDay,
  );
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);

  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingType, setLoadingType] = useState<"reset" | "sync">("sync");

  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetRange, setResetRange] = useState<any>(null);

  const [saveProgress, setSaveProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [lastBatchResult, setLastBatchResult] =
    useState<BatchResult<any> | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);

  const [wizardStep, setWizardStep] = useState<WizardStep>("configure");
  const [syncCompleted, setSyncCompleted] = useState(false);

  // Get all holidays for validation
  const ALL_HOLIDAYS = getAllHolidays();

  // ========================================
  // COMPUTED DATA
  // ========================================
  const activePool = useMemo(
    () =>
      shops.filter((s) => s.masterStatus !== "Closed" && s.status !== "Closed"),
    [shops],
  );

  const stats = useMemo(
    () => ({
      total: activePool.length,
      completed: activePool.filter((s) => s.status === "Done").length,
      unplanned: activePool.filter((s) => s.status === "Unplanned").length,
    }),
    [activePool],
  );

  const regionRemainStats = useMemo(() => {
    const unplannedPool = activePool.filter((s) => s.status === "Unplanned");
    const counts: Record<string, number> = {
      HK: 0,
      KN: 0,
      NT: 0,
      Islands: 0,
      MO: 0,
    };
    unplannedPool.forEach((s) => {
      if (counts.hasOwnProperty(s.region)) counts[s.region]++;
    });

    return Object.keys(counts).map((key) => {
      const config = REGION_DISPLAY_CONFIG[key] || {
        label: key,
        social: key.toLowerCase(),
        svg: null,
      };
      return {
        key,
        count: counts[key],
        displayName: config.label,
        socialKey: config.social,
        icon: config.svg,
      };
    });
  }, [activePool]);
  const regionOptions = useMemo(
    () =>
      Array.from(new Set(activePool.map((s) => s.region)))
        .filter(Boolean)
        .sort(),
    [activePool],
  );

  const availableDistricts = useMemo(() => {
    const filtered =
      selectedRegions.length > 0
        ? activePool.filter((s) => selectedRegions.includes(s.region))
        : activePool;
    return Array.from(new Set(filtered.map((s) => s.district)))
      .filter(Boolean)
      .sort();
  }, [activePool, selectedRegions]);

  const reschedulePool = useMemo(
    () =>
      shops.filter(
        (s) =>
          s.masterStatus !== "Closed" &&
          s.status === "Rescheduled" &&
          !s.scheduledDate,
      ),
    [shops],
  );

  // ========================================
  // WIZARD STEP AUTO-UPDATE
  // ========================================
  useEffect(() => {
    if (syncCompleted) {
      setWizardStep("complete");
    } else if (isSaving) {
      setWizardStep("sync");
    } else if (generatedResult.length > 0) {
      setWizardStep("generate");
    } else {
      setWizardStep("configure");
    }
  }, [isSaving, generatedResult.length, syncCompleted]);

  useEffect(() => {
    if (generatedResult.length === 0 && !isSaving) {
      setSyncCompleted(false);
    }
  }, [generatedResult.length, isSaving]);

  // ========================================
  // DATE VALIDATION
  // ========================================
  const disabledDate = useCallback(
    (current: dayjs.Dayjs) => {
      if (!current) return false;
      const dateStr = current.format("YYYY-MM-DD");
      const dayOfWeek = current.day();

      // Disable weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) return true;

      // Disable public holidays
      if (ALL_HOLIDAYS.includes(dateStr)) return true;

      // Disable past dates
      if (current.isBefore(dayjs(), "day")) return true;

      return false;
    },
    [ALL_HOLIDAYS],
  );

  // ========================================
  // HANDLERS
  // ========================================
  const handleGenerate = useCallback(() => {
    setIsCalculating(true);
    setWizardStep("generate");

    try {
      // Helper: Check if date is a working day
      const isWorkingDay = (date: dayjs.Dayjs) => {
        const day = date.day();
        const isWeekend = day === 0 || day === 6;
        const dateStr = date.format("YYYY-MM-DD");
        const isPublicHoliday = isHoliday(dateStr);
        return !isWeekend && !isPublicHoliday;
      };

      // Helper: Get next working day
      const getNextWorkingDay = (date: dayjs.Dayjs) => {
        let next = date;
        while (!isWorkingDay(next)) {
          next = next.add(1, "day");
        }
        return next;
      };

      // Filter pool based on user selections
      let pool = activePool.filter((s) => {
        const matchRegion =
          selectedRegions.length === 0 || selectedRegions.includes(s.region);
        const matchDistrict =
          selectedDistricts.length === 0 ||
          selectedDistricts.includes(s.district);
        const matchMTR = includeMTR ? true : !s.is_mtr;
        return (
          s.status === "Unplanned" && matchRegion && matchDistrict && matchMTR
        );
      });

      if (pool.length === 0) {
        message.warning("No shops match the selected filters!");
        setIsCalculating(false);
        setWizardStep("configure");
        return;
      }

      // Generate schedule
      const scheduled: any[] = [];
      let currentDate = dayjs(startDate);
      let shopIndex = 0;

      while (shopIndex < pool.length) {
        currentDate = getNextWorkingDay(currentDate);

        const shopsForDay = pool.slice(shopIndex, shopIndex + shopsPerDay);

        shopsForDay.forEach((shop, idx) => {
          const groupId = (idx % groupsPerDay) + 1;
          scheduled.push({
            ...shop,
            scheduledDate: currentDate.format("YYYY-MM-DD"),
            groupId: groupId,
          });
        });

        shopIndex += shopsPerDay;
        currentDate = currentDate.add(1, "day");
      }

      setGeneratedResult(scheduled);

      const totalDays = [...new Set(scheduled.map((s) => s.scheduledDate))]
        .length;
      message.success(
        `✅ ${scheduled.length} shops scheduled across ${totalDays} days!`,
      );

      // Add haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Generation error:", error);
      message.error("Failed to generate schedule. Please try again.");
      setWizardStep("configure");
    } finally {
      setIsCalculating(false);
    }
  }, [
    activePool,
    includeMTR,
    selectedRegions,
    selectedDistricts,
    startDate,
    shopsPerDay,
    groupsPerDay,
  ]);

  const handleGeneratePool = useCallback(() => {
    if (reschedulePool.length === 0) {
      message.warning("Reschedule pool is empty — no shops to schedule.");
      return;
    }

    setIsCalculating(true);
    setWizardStep("generate");

    try {
      const isWorkingDay = (date: dayjs.Dayjs) => {
        const day = date.day();
        const isWeekend = day === 0 || day === 6;
        const dateStr = date.format("YYYY-MM-DD");
        const isPublicHoliday = isHoliday(dateStr);
        return !isWeekend && !isPublicHoliday;
      };

      const getNextWorkingDay = (date: dayjs.Dayjs) => {
        let next = date;
        while (!isWorkingDay(next)) {
          next = next.add(1, "day");
        }
        return next;
      };

      const scheduled: any[] = [];
      let currentDate = dayjs(startDate);
      let shopIndex = 0;

      while (shopIndex < reschedulePool.length) {
        currentDate = getNextWorkingDay(currentDate);

        const shopsForDay = reschedulePool.slice(
          shopIndex,
          shopIndex + shopsPerDay,
        );

        shopsForDay.forEach((shop, idx) => {
          const groupId = (idx % groupsPerDay) + 1;
          scheduled.push({
            ...shop,
            scheduledDate: currentDate.format("YYYY-MM-DD"),
            groupId: groupId,
          });
        });

        shopIndex += shopsPerDay;
        currentDate = currentDate.add(1, "day");
      }

      setGeneratedResult(scheduled);

      const totalDays = [...new Set(scheduled.map((s) => s.scheduledDate))]
        .length;
      message.success(
        `✅ ${scheduled.length} pool shops scheduled across ${totalDays} days!`,
      );

      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    } catch (error) {
      console.error("Pool generation error:", error);
      message.error("Failed to generate pool schedule. Please try again.");
      setWizardStep("configure");
    } finally {
      setIsCalculating(false);
    }
  }, [reschedulePool, startDate, shopsPerDay, groupsPerDay]);

  const saveToSharePoint = useCallback(async () => {
    if (generatedResult.length === 0) {
      message.warning("No schedule to save!");
      return;
    }

    setIsSaving(true);
    setWizardStep("sync");
    setSaveProgress({ current: 0, total: generatedResult.length });

    try {
      const result = await executeBatch(
        generatedResult,
        async (shop) => {
          const response = await fetch(
            `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${graphToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                [SP_FIELDS.STATUS]: "Planned",
                [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate,
                [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(),
              }),
            },
          );

          if (!response.ok) {
            throw new Error(`Failed to save ${shop.name}`);
          }
        },
        {
          onProgress: (current, total) => setSaveProgress({ current, total }),
          getItemName: (shop) => shop.name,
        },
      );

      setLastBatchResult(result);

      if (result.successCount === result.totalProcessed) {
        message.success(
          `✅ All ${result.successCount} shops synced successfully!`,
        );
        setSyncCompleted(true);
        setWizardStep("complete");

        // Haptic feedback for success
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }

        setTimeout(() => {
          onRefresh();
          setGeneratedResult([]);
        }, 2000);
      } else if (result.successCount > 0) {
        message.warning(
          `⚠️ ${result.successCount} synced, ${result.failureCount} failed.`,
        );
        setShowRetryModal(true);
      } else {
        message.error(`❌ Failed to sync all ${result.failureCount} shops.`);
        setShowRetryModal(true);
      }
    } catch (error) {
      console.error("Sync error:", error);
      message.error("Sync failed. Please try again.");
      setWizardStep("generate");
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  }, [generatedResult, graphToken, onRefresh]);

  const handleRetryFailed = useCallback(async () => {
    if (!lastBatchResult || lastBatchResult.failureCount === 0) return;

    const failedShops = lastBatchResult.failed.map((f) => f.item);
    setGeneratedResult(failedShops);
    setShowRetryModal(false);

    setTimeout(() => saveToSharePoint(), 100);
  }, [lastBatchResult, saveToSharePoint]);

  const handleResetAll = useCallback(() => {
    confirm({
      title: "Reset All Schedules?",
      icon: <WarningOutlined style={{ color: DESIGN_COLORS.step1 }} />,
      content:
        'This will reset ALL planned schedules back to "Unplanned" status.',
      okText: "Yes, Reset All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoadingType("reset");
        setIsSaving(true);

        const plannedShops = shops.filter((s) => s.status === "Planned");

        if (plannedShops.length === 0) {
          message.warning("No planned schedules to reset.");
          setIsSaving(false);
          return;
        }

        setSaveProgress({ current: 0, total: plannedShops.length });

        try {
          const result = await executeBatch(
            plannedShops,
            async (shop) => {
              const response = await fetch(
                `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${graphToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    [SP_FIELDS.STATUS]: "Unplanned",
                    [SP_FIELDS.SCHEDULE_DATE]: null,
                    [SP_FIELDS.SCHEDULE_GROUP]: null,
                  }),
                },
              );

              if (!response.ok) {
                throw new Error(`Failed to reset ${shop.name}`);
              }
            },
            {
              onProgress: (current, total) =>
                setSaveProgress({ current, total }),
              getItemName: (shop) => shop.name,
            },
          );

          if (result.successCount === result.totalProcessed) {
            message.success(
              `✅ All ${result.successCount} schedules reset successfully!`,
            );
          } else if (result.successCount > 0) {
            message.warning(
              `⚠️ ${result.successCount} reset, ${result.failureCount} failed.`,
            );
          } else {
            message.error(
              `❌ Failed to reset all ${result.failureCount} schedules.`,
            );
          }

          onRefresh();
        } catch (error) {
          console.error("Reset error:", error);
          message.error("Reset failed. Please try again.");
        } finally {
          setIsSaving(false);
          setSaveProgress(null);
        }
      },
    });
  }, [shops, graphToken, onRefresh]);

  const handleResetByPeriod = useCallback(async () => {
    if (!resetRange) {
      message.error("Please select a date range!");
      return;
    }

    const [start, end] = resetRange;
    const targets = shops.filter(
      (s) =>
        s.scheduledDate &&
        dayjs(s.scheduledDate).isBetween(start, end, "day", "[]"),
    );

    if (targets.length === 0) {
      message.warning("No schedules found in this period.");
      return;
    }

    confirm({
      title: `Reset ${targets.length} schedules?`,
      icon: <WarningOutlined style={{ color: DESIGN_COLORS.step2 }} />,
      content: `This will reset schedules from ${start.format("YYYY-MM-DD")} to ${end.format("YYYY-MM-DD")}.`,
      okText: "Confirm Reset",
      okType: "danger",
      onOk: async () => {
        setLoadingType("reset");
        setIsSaving(true);
        setSaveProgress({ current: 0, total: targets.length });

        try {
          const result = await executeBatch(
            targets,
            async (shop) => {
              const response = await fetch(
                `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
                {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${graphToken}`,
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    [SP_FIELDS.STATUS]: "Unplanned",
                    [SP_FIELDS.SCHEDULE_DATE]: null,
                    [SP_FIELDS.SCHEDULE_GROUP]: null,
                  }),
                },
              );

              if (!response.ok) {
                throw new Error(`Failed to reset ${shop.name}`);
              }
            },
            {
              onProgress: (current, total) =>
                setSaveProgress({ current, total }),
              getItemName: (shop) => shop.name,
            },
          );

          if (result.successCount === result.totalProcessed) {
            message.success(
              `✅ ${result.successCount} schedules reset successfully!`,
            );
          } else if (result.successCount > 0) {
            message.warning(
              `⚠️ ${result.successCount} reset, ${result.failureCount} failed.`,
            );
          } else {
            message.error(
              `❌ Failed to reset all ${result.failureCount} schedules.`,
            );
          }

          setResetModalVisible(false);
          setResetRange(null);
          onRefresh();
        } catch (error) {
          console.error("Reset error:", error);
          message.error("Reset failed. Please try again.");
        } finally {
          setIsSaving(false);
          setSaveProgress(null);
        }
      },
    });
  }, [resetRange, shops, graphToken, onRefresh]);
  return (
    <div className="generator-container">
      {/* Loading Overlays */}
      {isSaving &&
        (loadingType === "reset" ? (
          <ResetChaseLoader />
        ) : (
          <SyncGeometricLoader
            text="Syncing to SharePoint..."
            progress={
              saveProgress
                ? Math.round((saveProgress.current / saveProgress.total) * 100)
                : 0
            }
          />
        ))}

      {/* Retry Failed Modal */}
      <Modal
        title={
          <Space>
            <WarningOutlined style={{ color: DESIGN_COLORS.step2 }} /> Sync
            Partially Failed
          </Space>
        }
        open={showRetryModal}
        onCancel={() => setShowRetryModal(false)}
        footer={[
          <Button key="close" onClick={() => setShowRetryModal(false)}>
            Close
          </Button>,
          <Button
            key="retry"
            type="primary"
            onClick={handleRetryFailed}
            style={{ backgroundColor: DESIGN_COLORS.step2 }}
          >
            Retry Failed Items
          </Button>,
        ]}
        centered
      >
        {lastBatchResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {lastBatchResult.successCount}
                </div>
                <div className="text-sm text-green-700">Successful</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {lastBatchResult.failureCount}
                </div>
                <div className="text-sm text-red-700">Failed</div>
              </div>
            </div>

            {lastBatchResult.failureCount > 0 && (
              <div>
                <Text strong className="block mb-2">
                  Failed Items:
                </Text>
                <ul className="max-h-60 overflow-auto space-y-1">
                  {lastBatchResult.failed.slice(0, 10).map((f, i) => (
                    <li key={i} className="text-sm text-red-600">
                      {f.item.name}: {f.error}
                    </li>
                  ))}
                  {lastBatchResult.failed.length > 10 && (
                    <li className="text-sm text-gray-500">
                      ... and {lastBatchResult.failed.length - 10} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Reset Period Modal */}
      <Modal
        title={
          <Space>
            <CalendarOutlined /> Reset Range
          </Space>
        }
        open={resetModalVisible}
        onCancel={() => setResetModalVisible(false)}
        onOk={handleResetByPeriod}
        okText="Confirm Reset"
        okButtonProps={{ danger: true }}
        centered
      >
        <div className="py-6 text-center">
          <Text className="block mb-6 text-slate-500">
            Reset schedules within this period to 'Unplanned'.
          </Text>
          <RangePicker
            className="w-full h-12 rounded-xl"
            onChange={(dates) => setResetRange(dates)}
          />
        </div>
      </Modal>

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <Title
          level={2}
          className="m-0"
          style={{ color: DESIGN_COLORS.neutral }}
        >
          <ThunderboltOutlined
            style={{ color: DESIGN_COLORS.step2, marginRight: 8 }}
          />
          Schedule Generator
        </Title>

        {hasPermission(currentUser, "reset_schedule") && (
          <Space>
            <Button
              icon={<HistoryOutlined />}
              onClick={() => setResetModalVisible(true)}
              className="rounded-lg border-red-200 text-red-500 font-bold hover:bg-red-50"
            >
              Reset by Period
            </Button>
            <Button
              danger
              type="primary"
              icon={<DeleteOutlined />}
              onClick={handleResetAll}
              className="rounded-lg font-bold"
            >
              Reset All
            </Button>
          </Space>
        )}
      </div>

      {/* Summary Stats */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col span={8}>
          <SummaryCard
            label="Active Shops"
            value={stats.total}
            subtext="Operational units"
            bgColor="hsl(195, 74%, 62%)"
            icon={
              <ShopOutlined
                style={{ fontSize: 60, color: "white", opacity: 0.5 }}
              />
            }
          />
        </Col>
        <Col span={8}>
          <SummaryCard
            label="Completed"
            value={stats.completed}
            subtext="Done this year"
            bgColor={DESIGN_COLORS.step3}
            icon={
              <CheckCircleOutlined
                style={{ fontSize: 60, color: "white", opacity: 0.5 }}
              />
            }
          />
        </Col>
        <Col span={8}>
          <SummaryCard
            label="Remaining"
            value={stats.unplanned}
            subtext="Pending schedule"
            bgColor={DESIGN_COLORS.step2}
            icon={
              <HourglassOutlined
                style={{ fontSize: 60, color: "white", opacity: 0.5 }}
              />
            }
            isPulsing={stats.unplanned > 0}
          />
        </Col>
      </Row>

      {/* Main Content: Step 1 (Configure) */}
      <Row gutter={[24, 24]}>
        {/* Left: Main Content Area (20 cols) */}
        <Col span={20}>
          <Row gutter={[24, 24]}>
            {/* Unplanned Pool */}
            <Col span={9}>
              <div
                className="bg-white p-8 rounded-[40px] shadow-sm h-full flex flex-col"
                style={{
                  border: `2px solid ${DESIGN_COLORS.border}`,
                  borderLeft: `6px solid ${DESIGN_COLORS.step1}`,
                }}
              >
                <div className="flex items-center gap-2 mb-8">
                  <div
                    className="w-3 h-3 rounded-full animate-pulse"
                    style={{ backgroundColor: DESIGN_COLORS.step1 }}
                  ></div>
                  <Text
                    strong
                    className="text-[14px] text-slate-400 uppercase tracking-widest"
                  >
                    Step 1: Unplanned Pool
                  </Text>
                </div>

                <ul className="example-2 unplanned-pool-layout w-full list-none p-0 m-0">
                  {regionRemainStats.map((reg) => (
                    <li
                      key={reg.key}
                      className="icon-content flex justify-center w-full"
                    >
                      <a
                        href="#"
                        data-social={reg.socialKey}
                        style={{
                          width: "100%",
                          height: "100px",
                          borderRadius: "20px",
                          flexDirection: "column",
                          gap: "4px",
                          margin: "0 auto",
                        }}
                      >
                        <div className="filled"></div>
                        <div style={{ position: "relative", zIndex: 10 }}>
                          {reg.icon}
                        </div>
                        <span
                          style={{
                            position: "relative",
                            zIndex: 10,
                            fontSize: "10px",
                            fontWeight: 900,
                            textAlign: "center",
                            textTransform: "uppercase",
                          }}
                        >
                          {reg.displayName}
                        </span>
                        <div
                          className="font-black text-lg"
                          style={{ position: "relative", zIndex: 10 }}
                        >
                          {reg.count}
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </Col>

            {/* Right: Generation Settings (Step 2 Preview) */}
            <Col span={15}>
              <div
                className="bg-white rounded-[40px] p-8 shadow-sm h-full"
                style={{
                  border: `2px solid ${DESIGN_COLORS.border}`,
                  borderLeft: `6px solid ${DESIGN_COLORS.step2}`,
                }}
              >
                <div className="flex justify-between items-center mb-10">
                  <Space className="text-[18px] font-bold uppercase text-slate-800">
                    <ControlOutlined style={{ color: DESIGN_COLORS.step2 }} />
                    Step 2: Settings
                  </Space>

                  <Tooltip
                    title={
                      includeMTR ? "MTR shops included" : "MTR shops excluded"
                    }
                  >
                    <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                      <Switch
                        checked={includeMTR}
                        onChange={setIncludeMTR}
                        size="small"
                      />
                      <Text className="text-[11px] font-black uppercase text-slate-500">
                        Include MTR
                      </Text>
                    </div>
                  </Tooltip>
                </div>

                <Row gutter={[16, 24]}>
                  <Col span={12}>
                    <Text
                      strong
                      className="text-slate-400 block mb-2 uppercase text-[10px] ml-1"
                    >
                      Filter Regions
                    </Text>
                    <Select
                      mode="multiple"
                      className="w-full h-11 custom-select"
                      placeholder="All Regions"
                      value={selectedRegions}
                      onChange={setSelectedRegions}
                      allowClear
                      maxTagCount="responsive"
                    >
                      {regionOptions.map((r) => (
                        <Option key={r} value={r}>
                          {r}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col span={12}>
                    <Text
                      strong
                      className="text-slate-400 block mb-2 uppercase text-[10px] ml-1"
                    >
                      Filter Districts
                    </Text>
                    <Select
                      mode="multiple"
                      className="w-full h-11 custom-select"
                      placeholder="All Districts"
                      value={selectedDistricts}
                      onChange={setSelectedDistricts}
                      allowClear
                      maxTagCount="responsive"
                    >
                      {availableDistricts.map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col span={8}>
                    <Text
                      strong
                      className="text-slate-400 block mb-2 uppercase text-xs ml-1"
                    >
                      Start Date
                    </Text>
                    <DatePicker
                      value={startDate ? dayjs(startDate) : null}
                      onChange={(date) =>
                        setStartDate(date ? date.format("YYYY-MM-DD") : "")
                      }
                      disabledDate={disabledDate}
                      format="YYYY/MM/DD"
                      placeholder="Select Start Date"
                      className="bg-slate-50 border border-slate-200 h-11 rounded-xl w-full px-4 font-bold text-slate-700"
                      allowClear={false}
                    />
                  </Col>

                  <Col span={8}>
                    <Text
                      strong
                      className="text-slate-400 block mb-2 uppercase text-xs ml-1"
                    >
                      Shops Per Day
                    </Text>
                    <InputNumber
                      value={shopsPerDay}
                      onChange={(v) =>
                        setShopsPerDay(v || GENERATOR_DEFAULTS.shopsPerDay)
                      }
                      min={1}
                      className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl font-bold flex items-center"
                    />
                  </Col>

                  <Col span={8}>
                    <Text
                      strong
                      className="text-slate-400 block mb-2 uppercase text-xs ml-1"
                    >
                      Groups Per Day
                    </Text>
                    <InputNumber
                      value={groupsPerDay}
                      onChange={(v) =>
                        setGroupsPerDay(v || GENERATOR_DEFAULTS.groupsPerDay)
                      }
                      min={1}
                      className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl font-bold flex items-center"
                    />
                  </Col>
                </Row>

                {/* CTA: Generate Button */}
                <div className="flex justify-end mt-10">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerate}
                    loading={isCalculating}
                    disabled={isCalculating}
                    className="h-12 px-16 rounded-xl font-black shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${DESIGN_COLORS.step2} 0%, ${DESIGN_COLORS.step1} 100%)`,
                      border: "none",
                    }}
                  >
                    {isCalculating ? "Generating..." : "GENERATE SCHEDULE"}
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </Col>

        {/* Right: Vertical Progress Bar (4 cols) */}
        <Col span={4}>
          <div className="vertical-wizard-progress">
            <WizardProgressBarVertical currentStep={wizardStep} />
          </div>
        </Col>
      </Row>

      {/* Reschedule Pool Section */}
      {reschedulePool.length > 0 && (
        <Card
          className="mt-8 rounded-[40px] border-none shadow-sm overflow-hidden"
          style={{ borderLeft: `6px solid ${DESIGN_COLORS.step2}` }}
          title={
            <Space className="text-slate-700 font-bold">
              <ReloadOutlined style={{ color: DESIGN_COLORS.step2 }} />
              Reschedule Pool ({reschedulePool.length} shops awaiting
              rescheduling)
            </Space>
          }
          extra={
            hasPermission(currentUser, "generate_schedule") && (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                onClick={handleGeneratePool}
                loading={isCalculating}
                disabled={isCalculating}
                style={{
                  backgroundColor: DESIGN_COLORS.step2,
                  borderColor: DESIGN_COLORS.step2,
                }}
                className="rounded-xl font-black"
              >
                Generate Pool Schedule
              </Button>
            )
          }
        >
          <Table
            dataSource={reschedulePool}
            pagination={{ pageSize: 10, showSizeChanger: false }}
            rowKey="id"
            columns={[
              {
                title: "Shop Name",
                dataIndex: "name",
                key: "name",
                render: (n, r: any) => (
                  <Space>
                    <img
                      src={r.brandIcon}
                      className="w-6 h-6 object-contain"
                      alt={r.brand}
                    />
                    <span>{n}</span>
                  </Space>
                ),
              },
              {
                title: "Region",
                dataIndex: "region",
                key: "region",
              },
              {
                title: "District",
                dataIndex: "district",
                key: "district",
              },
              {
                title: "MTR",
                dataIndex: "is_mtr",
                key: "is_mtr",
                render: (v: boolean) =>
                  v ? (
                    <Tag color="purple" className="border-none font-bold">
                      MTR
                    </Tag>
                  ) : null,
              },
            ]}
          />
        </Card>
      )}
      {/* Preview Table (Step 3 Preview) */}
      {generatedResult.length > 0 && (
        <Card
          className="mt-8 rounded-[40px] border-none shadow-sm overflow-hidden"
          style={{ borderLeft: `6px solid ${DESIGN_COLORS.step3}` }}
          title={
            <Space className="text-slate-700 font-bold">
              <ClockCircleOutlined
                spin={!syncCompleted}
                style={{ color: DESIGN_COLORS.step3 }}
              />
              Step 3: Schedule Preview ({generatedResult.length} shops)
            </Space>
          }
        >
          <Table
            dataSource={generatedResult}
            pagination={{ pageSize: 15, showSizeChanger: false }}
            rowKey="id"
            columns={[
              {
                title: "Date",
                dataIndex: "scheduledDate",
                key: "date",
                render: (d) => (
                  <b className="text-slate-700">
                    {dayjs(d).format("YYYY-MM-DD (ddd)")}
                  </b>
                ),
              },
              {
                title: "Group",
                dataIndex: "groupId",
                key: "group",
                render: (g) => (
                  <Tag
                    className={`font-black px-3 rounded-md border-none tag-group-${g}`}
                    color={g === 1 ? "blue" : g === 2 ? "purple" : "orange"}
                  >
                    {`Group ${String.fromCharCode(64 + g)}`}
                  </Tag>
                ),
              },
              {
                title: "Shop Name",
                dataIndex: "name",
                key: "name",
                render: (n, r) => (
                  <Space>
                    <img
                      src={r.brandIcon}
                      className="w-6 h-6 object-contain"
                      alt={r.brand}
                    />
                    <span>{n}</span>
                  </Space>
                ),
              },
              {
                title: "District",
                dataIndex: "district",
                key: "district",
              },
            ]}
          />

          {/* Final CTA: Confirm & Sync */}
          {hasPermission(currentUser, "generate_schedule") &&
            !syncCompleted && (
              <div className="flex justify-end p-8 border-t bg-slate-50">
                <Button
                  type="primary"
                  size="large"
                  icon={
                    syncCompleted ? <CheckCircleFilled /> : <SaveOutlined />
                  }
                  onClick={saveToSharePoint}
                  loading={isSaving}
                  disabled={isSaving || syncCompleted}
                  className="h-12 px-16 rounded-xl font-black shadow-lg"
                  style={{
                    backgroundColor: syncCompleted
                      ? DESIGN_COLORS.step3
                      : DESIGN_COLORS.cta,
                    borderColor: syncCompleted
                      ? DESIGN_COLORS.step3
                      : DESIGN_COLORS.cta,
                  }}
                >
                  {syncCompleted ? "SYNCED ✓" : "CONFIRM & SYNC TO SHAREPOINT"}
                </Button>
              </div>
            )}

          {syncCompleted && (
            <div className="p-8 text-center border-t bg-green-50">
              <Space direction="vertical" size="small">
                <CheckCircleFilled
                  style={{ fontSize: 48, color: DESIGN_COLORS.step3 }}
                />
                <Title
                  level={4}
                  style={{ color: DESIGN_COLORS.step3, margin: 0 }}
                >
                  Schedule Synced Successfully!
                </Title>
                <Text type="secondary">
                  All {generatedResult.length} shops have been saved to
                  SharePoint.
                </Text>
              </Space>
            </div>
          )}
        </Card>
      )}

      {/* Custom Styles */}
      <style>{`
        .generator-container {
          width: 100%;
          padding-bottom: 80px;
        }

        /* Custom Select Styling */
        .custom-select .ant-select-selector {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
        }

        /* Wizard Progress Styles */
        
        /* Vertical Progress Bar Styles */
        .wizard-progress-vertical-container {
          background: white;
          padding: 24px 16px;
          border-radius: 24px;
          border: 2px solid ${DESIGN_COLORS.border};
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          height: 100%;
          position: sticky;
          top: 20px;
        }

        .wizard-steps-vertical-track {
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .wizard-step-vertical {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          transition: all 0.3s ease;
        }

        .wizard-step-vertical.pending {
          opacity: 0.5;
        }

        .wizard-step-vertical-circle {
          width: 48px;
          height: 48px;
          min-width: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          border: 3px solid #e2e8f0;
          transition: all 0.3s ease;
        }

        .wizard-step-vertical.active .wizard-step-vertical-circle {
          border-color: var(--step-color);
          box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
          transform: scale(1.1);
        }

        .wizard-step-vertical.completed .wizard-step-vertical-circle {
          border-color: ${DESIGN_COLORS.step3};
          background: ${DESIGN_COLORS.step3};
        }

        .wizard-step-vertical-icon {
          font-size: 22px;
        }

        .wizard-step-vertical-content {
          flex: 1;
          padding-top: 4px;
        }

        .wizard-step-vertical-number {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
          margin-bottom: 2px;
        }

        .wizard-step-vertical.active .wizard-step-vertical-number,
        .wizard-step-vertical.completed .wizard-step-vertical-number {
          color: var(--step-color);
        }

        .wizard-step-vertical-title {
          font-size: 13px;
          font-weight: 700;
          color: #334155;
          margin-bottom: 2px;
        }

        .wizard-step-vertical.pending .wizard-step-vertical-title {
          color: #94a3b8;
        }

        .wizard-step-vertical-description {
          font-size: 10px;
          color: #64748b;
          line-height: 1.4;
        }

        .wizard-step-vertical.pending .wizard-step-vertical-description {
          color: #cbd5e1;
        }

        .wizard-connector-vertical {
          width: 48px;
          height: 40px;
          position: relative;
          display: flex;
          justify-content: center;
        }

        .wizard-connector-vertical-track {
          position: absolute;
          width: 4px;
          height: 100%;
          background: #e2e8f0;
          border-radius: 2px;
          left: 50%;
          transform: translateX(-50%);
        }

        .wizard-connector-vertical-fill {
          position: absolute;
          width: 4px;
          border-radius: 2px;
          transition: height 0.5s ease;
          left: 50%;
          transform: translateX(-50%);
          top: 0;
        }

        /* Unplanned Pool Layout - 2 rows (3 top, 2 bottom) */
        .unplanned-pool-layout {
          display: grid !important;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 12px;
          width: 100%;
        }

        .unplanned-pool-layout li:nth-child(1),
        .unplanned-pool-layout li:nth-child(2),
        .unplanned-pool-layout li:nth-child(3) {
          grid-row: 1;
        }

        .unplanned-pool-layout li:nth-child(4) {
          grid-row: 2;
          grid-column: 1 / 2;
        }

        .unplanned-pool-layout li:nth-child(5) {
          grid-row: 2;
          grid-column: 3 / 4;
        }

        /* Loading Overlays */
        .chase-overlay,
        .geometric-loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 9999;
        }

        .chase-scene {
          display: flex;
          align-items: center;
          gap: 50px;
        }

        .ghost-chaser {
          animation: float 2s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }

        .pacman-runner {
          width: 0;
          height: 0;
          border-top: 30px solid transparent;
          border-bottom: 30px solid transparent;
          border-left: 40px solid #fbbf24;
          animation: run 1s linear infinite;
        }

        @keyframes run {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(-10px); }
        }

        .dots-trail {
          display: flex;
          gap: 15px;
        }

        .dot-node {
          width: 12px;
          height: 12px;
          background: white;
          border-radius: 50%;
          animation: fade 1.5s ease-in-out infinite;
        }

        .dot-node:nth-child(2) { animation-delay: 0.2s; }
        .dot-node:nth-child(3) { animation-delay: 0.4s; }
        .dot-node:nth-child(4) { animation-delay: 0.6s; }

        @keyframes fade {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* Geometric Loader */
        .geometric-loader {
          perspective: 1000px;
        }

        .cube {
          width: 100px;
          height: 100px;
          position: relative;
          transform-style: preserve-3d;
          animation: rotate-cube 3s infinite linear;
        }

        @keyframes rotate-cube {
          from { transform: rotateX(0deg) rotateY(0deg); }
          to { transform: rotateX(360deg) rotateY(360deg); }
        }

        .face {
          position: absolute;
          width: 100px;
          height: 100px;
          background: ${DESIGN_COLORS.step2};
          border: 2px solid ${DESIGN_COLORS.step3};
          opacity: 0.8;
        }

        .front { transform: rotateY(0deg) translateZ(50px); }
        .back { transform: rotateY(180deg) translateZ(50px); }
        .left { transform: rotateY(-90deg) translateZ(50px); }
        .right { transform: rotateY(90deg) translateZ(50px); }
        .top { transform: rotateX(90deg) translateZ(50px); }
        .bottom { transform: rotateX(-90deg) translateZ(50px); }

        /* Summary Card Pulse Animation */
        .status-pulse {
          animation: pulse-border 2s ease-in-out infinite;
        }

        .status-pulse--danger {
          animation: pulse-border-danger 2s ease-in-out infinite;
        }

        @keyframes pulse-border-danger {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(239, 68, 68, 0);
          }
        }
      `}</style>
    </div>
  );
};

// Memoize component to prevent unnecessary re-renders
export const MemoizedGenerator = React.memo(Generator);
