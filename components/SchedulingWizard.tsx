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
  Steps,
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
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  CloudUploadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CloseOutlined,
  FilterOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { Shop } from "../types";
import { SP_FIELDS } from "../constants";
import { isHoliday, getAllHolidays } from "../constants/holidays";
import { API_URLS } from "../constants/config";
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

// Design system colors
const DESIGN_COLORS = {
  primary: "#0D9488",
  secondary: "#2DD4BF",
  cta: "#F97316",
  background: "#F0FDFA",
  text: "#134E4A",
  step1: "#EF4444", // Problem - Red
  step2: "#F97316", // Process - Orange
  step3: "#10B981", // Solution - Green
};

// Step configuration
const WIZARD_STEPS = [
  {
    title: "Configure",
    description: "Set filters & parameters",
    icon: <SettingOutlined />,
    color: DESIGN_COLORS.step1,
  },
  {
    title: "Preview",
    description: "Review generated schedule",
    icon: <EyeOutlined />,
    color: DESIGN_COLORS.step2,
  },
  {
    title: "Sync",
    description: "Save to SharePoint",
    icon: <CloudUploadOutlined />,
    color: DESIGN_COLORS.step3,
  },
];

// Progress bar component with intelligent feedback
const WizardProgressBar: React.FC<{
  currentStep: number;
  progress?: { current: number; total: number } | null;
  status: "idle" | "generating" | "syncing" | "complete" | "error";
}> = ({ currentStep, progress, status }) => {
  const stepPercent = ((currentStep + 1) / WIZARD_STEPS.length) * 100;

  const getStatusColor = () => {
    switch (status) {
      case "generating":
        return DESIGN_COLORS.step2;
      case "syncing":
        return DESIGN_COLORS.primary;
      case "complete":
        return DESIGN_COLORS.step3;
      case "error":
        return DESIGN_COLORS.step1;
      default:
        return DESIGN_COLORS.primary;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "generating":
        return "Generating schedule...";
      case "syncing":
        return progress
          ? `Syncing ${progress.current}/${progress.total}...`
          : "Syncing...";
      case "complete":
        return "Complete!";
      case "error":
        return "Error occurred";
      default:
        return `Step ${currentStep + 1} of ${WIZARD_STEPS.length}`;
    }
  };

  return (
    <div className="wizard-progress-container">
      {/* Step indicators */}
      <div className="flex items-center justify-between mb-4 relative">
        {/* Progress line background */}
        <div
          className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded-full"
          style={{ margin: "0 60px" }}
        />

        {/* Progress line active */}
        <div
          className="absolute top-5 left-0 h-1 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `calc(${(currentStep / (WIZARD_STEPS.length - 1)) * 100}% - ${60 - (currentStep / (WIZARD_STEPS.length - 1)) * 60}px)`,
            marginLeft: "60px",
            backgroundColor: WIZARD_STEPS[currentStep].color,
          }}
        />

        {WIZARD_STEPS.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const stepColor = isCompleted
            ? DESIGN_COLORS.step3
            : isActive
              ? step.color
              : "#E5E7EB";

          return (
            <div
              key={step.title}
              className="flex flex-col items-center z-10"
              style={{ flex: 1 }}
            >
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-lg
                  transition-all duration-300 ease-out cursor-pointer
                  ${isActive ? "ring-4 ring-opacity-30 scale-110" : ""}
                  ${isCompleted || isActive ? "text-white" : "text-gray-400 bg-gray-100"}
                `}
                style={{
                  backgroundColor:
                    isCompleted || isActive ? stepColor : undefined,
                  boxShadow: isActive ? `0 0 20px ${step.color}40` : undefined,
                }}
              >
                {isCompleted ? <CheckCircleOutlined /> : step.icon}
              </div>
              <div className="mt-2 text-center">
                <div
                  className={`text-xs font-bold uppercase tracking-wide ${isActive ? "" : "text-gray-400"}`}
                  style={{ color: isActive ? step.color : undefined }}
                >
                  {step.title}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5 hidden sm:block">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status bar */}
      {status !== "idle" && (
        <div className="mt-6 p-4 rounded-2xl bg-white/50 backdrop-blur border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <Text
              className="text-sm font-medium"
              style={{ color: getStatusColor() }}
            >
              {getStatusText()}
            </Text>
            {progress && (
              <Text className="text-xs text-gray-500">
                {Math.round((progress.current / progress.total) * 100)}%
              </Text>
            )}
          </div>
          {progress && (
            <Progress
              percent={Math.round((progress.current / progress.total) * 100)}
              showInfo={false}
              strokeColor={{
                "0%": DESIGN_COLORS.primary,
                "100%": DESIGN_COLORS.step3,
              }}
              trailColor="#E5E7EB"
              size="small"
            />
          )}
        </div>
      )}
    </div>
  );
};

// Animated sync loader
const SyncLoader: React.FC<{
  progress?: { current: number; total: number } | null;
}> = ({ progress }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: "rgba(13, 148, 136, 0.95)" }}
  >
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"
          style={{ animationDuration: "1s" }}
        />
        <CloudUploadOutlined
          className="absolute inset-0 flex items-center justify-center text-4xl text-white"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      </div>
      <Title level={4} style={{ color: "white", marginBottom: 8 }}>
        Syncing to SharePoint
      </Title>
      {progress && (
        <div className="w-64 mx-auto">
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            strokeColor="#fff"
            trailColor="rgba(255,255,255,0.2)"
            format={() => (
              <span className="text-white font-bold">
                {progress.current}/{progress.total}
              </span>
            )}
          />
        </div>
      )}
    </div>
  </div>
);

// Region display config
const REGION_DISPLAY_CONFIG: Record<
  string,
  { label: string; social: string; svg: React.ReactNode }
> = {
  HK: {
    label: "HK Island",
    social: "hk",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <path d="M3 21H21" stroke="currentColor" strokeWidth="2" />
        <path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  KN: {
    label: "Kowloon",
    social: "kn",
    svg: (
      <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z"
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

interface SchedulingWizardProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  onClose?: () => void;
}

export const SchedulingWizard: React.FC<SchedulingWizardProps> = ({
  shops,
  graphToken,
  onRefresh,
  onClose,
}) => {
  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);
  const [wizardStatus, setWizardStatus] = useState<
    "idle" | "generating" | "syncing" | "complete" | "error"
  >("idle");

  // Configuration state (Step 1)
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

  // Preview state (Step 2)
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);

  // Sync state (Step 3)
  const [saveProgress, setSaveProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [lastBatchResult, setLastBatchResult] =
    useState<BatchResult<any> | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Computed values
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

  const filteredPoolCount = useMemo(() => {
    return activePool.filter((s) => {
      const matchRegion =
        selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict =
        selectedDistricts.length === 0 ||
        selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return (
        s.status === "Unplanned" && matchRegion && matchDistrict && matchMTR
      );
    }).length;
  }, [activePool, selectedRegions, selectedDistricts, includeMTR]);

  // Check if date should be disabled (weekends + public holidays)
  const disabledDate = useCallback((current: dayjs.Dayjs) => {
    if (!current) return false;
    const isWeekend = current.day() === 0 || current.day() === 6;
    const dateStr = current.format("YYYY-MM-DD");
    const isPublicHoliday = isHoliday(dateStr);
    return isWeekend || isPublicHoliday;
  }, []);

  // Generate schedule (Step 1 -> Step 2)
  const handleGenerate = useCallback(() => {
    setWizardStatus("generating");

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
      message.warning("No unplanned shops match filters.");
      setWizardStatus("idle");
      return;
    }

    pool.sort((a, b) => a.latitude + a.longitude - (b.latitude + b.longitude));

    const results: any[] = [];
    let currentDay = getNextWorkingDay(dayjs(startDate));

    pool.forEach((shop, index) => {
      const groupInDay = ((index % shopsPerDay) % groupsPerDay) + 1;
      results.push({
        ...shop,
        scheduledDate: currentDay.format("YYYY-MM-DD"),
        groupId: groupInDay,
      });
      if ((index + 1) % shopsPerDay === 0) {
        currentDay = getNextWorkingDay(currentDay.add(1, "day"));
      }
    });

    const sortedResults = results.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate)
        return dayjs(a.scheduledDate).unix() - dayjs(b.scheduledDate).unix();
      return a.groupId - b.groupId;
    });

    // Simulate brief processing time for UX
    setTimeout(() => {
      setGeneratedResult(sortedResults);
      setWizardStatus("idle");
      setCurrentStep(1);
      message.success(`Generated schedule for ${sortedResults.length} shops!`);
    }, 500);
  }, [
    activePool,
    selectedRegions,
    selectedDistricts,
    includeMTR,
    startDate,
    shopsPerDay,
    groupsPerDay,
  ]);

  // Save to SharePoint (Step 2 -> Step 3)
  const handleSync = async () => {
    setCurrentStep(2);
    setWizardStatus("syncing");
    setIsSyncing(true);
    setSaveProgress({ current: 0, total: generatedResult.length });
    setLastBatchResult(null);

    try {
      const result = await executeBatch(
        generatedResult,
        async (shop) => {
          const response = await fetch(
            `${API_URLS.shopList}/items/${shop.sharePointItemId}/fields`,
            {
              method: "PATCH",
              headers: {
                Authorization: `Bearer ${graphToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate,
                [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(),
                [SP_FIELDS.STATUS]: "Planned",
              }),
            },
          );
          if (!response.ok) {
            throw new Error(`Failed to update shop ${shop.name}`);
          }
        },
        {
          concurrentRequests: BATCH_CONFIG.concurrentRequests,
          onProgress: (processed, total) => {
            setSaveProgress({ current: processed, total });
          },
          getItemName: (shop) => shop.name,
        },
      );

      setLastBatchResult(result);

      if (result.failureCount === 0) {
        setWizardStatus("complete");
        message.success(`Successfully synced ${result.successCount} shops!`);
        setTimeout(() => {
          onRefresh();
          if (onClose) onClose();
        }, 1500);
      } else if (result.successCount > 0) {
        setWizardStatus("error");
        message.warning(
          `Synced ${result.successCount} shops. ${result.failureCount} failed.`,
        );
      } else {
        setWizardStatus("error");
        message.error(`Failed to sync all ${result.failureCount} shops.`);
      }
    } catch (error) {
      setWizardStatus("error");
      message.error("Sync failed. Please try again.");
    } finally {
      setIsSyncing(false);
      setSaveProgress(null);
    }
  };

  // Step navigation
  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (currentStep === 1) {
        setGeneratedResult([]);
      }
    }
  };

  // Calculate preview stats
  const previewStats = useMemo(() => {
    if (generatedResult.length === 0) return null;
    const dates = [...new Set(generatedResult.map((r) => r.scheduledDate))];
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    return {
      totalShops: generatedResult.length,
      totalDays: dates.length,
      firstDate: dayjs(firstDate).format("MMM D"),
      lastDate: dayjs(lastDate).format("MMM D, YYYY"),
    };
  }, [generatedResult]);

  return (
    <div className="scheduling-wizard w-full">
      {/* Sync overlay */}
      {isSyncing && <SyncLoader progress={saveProgress} />}

      {/* Progress bar */}
      <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-6 rounded-3xl mb-8 border border-slate-100">
        <WizardProgressBar
          currentStep={currentStep}
          progress={saveProgress}
          status={wizardStatus}
        />
      </div>

      {/* Step 1: Configuration */}
      {currentStep === 0 && (
        <div className="wizard-step-1 animate-fadeIn">
          <Row gutter={[24, 24]}>
            {/* Left: Unplanned Pool Stats */}
            <Col xs={24} lg={9}>
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${DESIGN_COLORS.step1}20` }}
                  >
                    <FilterOutlined style={{ color: DESIGN_COLORS.step1 }} />
                  </div>
                  <Text
                    strong
                    className="text-sm text-slate-600 uppercase tracking-wide"
                  >
                    Unplanned Pool
                  </Text>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {regionRemainStats.map((reg) => (
                    <div
                      key={reg.key}
                      className={`
                        p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                        ${
                          selectedRegions.includes(reg.key)
                            ? "border-teal-500 bg-teal-50"
                            : "border-transparent bg-slate-50 hover:bg-slate-100"
                        }
                      `}
                      onClick={() => {
                        if (selectedRegions.includes(reg.key)) {
                          setSelectedRegions(
                            selectedRegions.filter((r) => r !== reg.key),
                          );
                        } else {
                          setSelectedRegions([...selectedRegions, reg.key]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-teal-600">{reg.icon}</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                          {reg.displayName}
                        </span>
                      </div>
                      <div className="text-2xl font-black text-slate-800">
                        {reg.count}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium opacity-90">
                      Matched shops
                    </span>
                    <span className="text-2xl font-black">
                      {filteredPoolCount}
                    </span>
                  </div>
                </div>
              </div>
            </Col>

            {/* Right: Configuration Form */}
            <Col xs={24} lg={15}>
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${DESIGN_COLORS.step2}20` }}
                  >
                    <ControlOutlined style={{ color: DESIGN_COLORS.step2 }} />
                  </div>
                  <Text
                    strong
                    className="text-sm text-slate-600 uppercase tracking-wide"
                  >
                    Generation Settings
                  </Text>
                </div>

                <Row gutter={[16, 20]}>
                  <Col span={24}>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                      <div className="flex items-center gap-3">
                        <ScheduleOutlined className="text-lg text-slate-400" />
                        <div>
                          <div className="text-sm font-bold text-slate-700">
                            Include MTR Shops
                          </div>
                          <div className="text-xs text-slate-400">
                            Toggle to include/exclude MTR locations
                          </div>
                        </div>
                      </div>
                      <Switch
                        checked={includeMTR}
                        onChange={setIncludeMTR}
                        className="bg-slate-300"
                      />
                    </div>
                  </Col>

                  <Col span={12}>
                    <Text className="text-slate-400 block mb-2 uppercase text-[10px] font-bold ml-1">
                      Filter Districts
                    </Text>
                    <Select
                      mode="multiple"
                      className="w-full"
                      placeholder="All Districts"
                      value={selectedDistricts}
                      onChange={setSelectedDistricts}
                      allowClear
                      maxTagCount="responsive"
                      style={{ height: 44 }}
                    >
                      {availableDistricts.map((d) => (
                        <Option key={d} value={d}>
                          {d}
                        </Option>
                      ))}
                    </Select>
                  </Col>

                  <Col span={12}>
                    <Text className="text-slate-400 block mb-2 uppercase text-[10px] font-bold ml-1">
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
                      className="w-full"
                      style={{ height: 44 }}
                      allowClear={false}
                    />
                  </Col>

                  <Col span={12}>
                    <Text className="text-slate-400 block mb-2 uppercase text-[10px] font-bold ml-1">
                      Shops Per Day
                    </Text>
                    <InputNumber
                      value={shopsPerDay}
                      onChange={(v) =>
                        setShopsPerDay(v || GENERATOR_DEFAULTS.shopsPerDay)
                      }
                      min={1}
                      className="w-full"
                      style={{ height: 44 }}
                    />
                  </Col>

                  <Col span={12}>
                    <Text className="text-slate-400 block mb-2 uppercase text-[10px] font-bold ml-1">
                      Groups Per Day
                    </Text>
                    <InputNumber
                      value={groupsPerDay}
                      onChange={(v) =>
                        setGroupsPerDay(v || GENERATOR_DEFAULTS.groupsPerDay)
                      }
                      min={1}
                      className="w-full"
                      style={{ height: 44 }}
                    />
                  </Col>
                </Row>

                {/* CTA Button */}
                <div className="flex justify-end mt-8">
                  <Button
                    type="primary"
                    size="large"
                    icon={<ThunderboltOutlined />}
                    onClick={handleGenerate}
                    disabled={
                      filteredPoolCount === 0 || wizardStatus === "generating"
                    }
                    loading={wizardStatus === "generating"}
                    className="h-12 px-8 rounded-xl font-bold shadow-lg"
                    style={{
                      backgroundColor: DESIGN_COLORS.cta,
                      borderColor: DESIGN_COLORS.cta,
                    }}
                  >
                    Generate Schedule
                  </Button>
                </div>
              </div>
            </Col>
          </Row>
        </div>
      )}

      {/* Step 2: Preview */}
      {currentStep === 1 && (
        <div className="wizard-step-2 animate-fadeIn">
          {/* Preview Stats */}
          {previewStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Total Shops
                </div>
                <div className="text-2xl font-black text-teal-600">
                  {previewStats.totalShops}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Working Days
                </div>
                <div className="text-2xl font-black text-orange-500">
                  {previewStats.totalDays}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  Start Date
                </div>
                <div className="text-lg font-bold text-slate-700">
                  {previewStats.firstDate}
                </div>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="text-xs text-slate-400 uppercase font-bold mb-1">
                  End Date
                </div>
                <div className="text-lg font-bold text-slate-700">
                  {previewStats.lastDate}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Table */}
          <Card
            className="rounded-3xl border-none shadow-sm overflow-hidden"
            title={
              <Space className="text-slate-700 font-bold">
                <EyeOutlined className="text-orange-500" />
                Schedule Preview
                <Tag color="orange" className="ml-2">
                  Holidays Excluded
                </Tag>
              </Space>
            }
          >
            <Table
              dataSource={generatedResult}
              pagination={{ pageSize: 10, showSizeChanger: true }}
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
                    >
                      {`Group ${String.fromCharCode(64 + g)}`}
                    </Tag>
                  ),
                },
                {
                  title: "Shop Name",
                  dataIndex: "name",
                  key: "name",
                  render: (n, r: any) => (
                    <Space>
                      {r.brandIcon && (
                        <img
                          src={r.brandIcon}
                          className="w-6 h-6 object-contain"
                          alt=""
                        />
                      )}
                      <span>{n}</span>
                    </Space>
                  ),
                },
                { title: "District", dataIndex: "district", key: "district" },
              ]}
            />
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between items-center mt-6 p-4 bg-white rounded-2xl border border-slate-100">
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={handleBack}
              size="large"
              className="rounded-xl"
            >
              Back to Configure
            </Button>
            <Button
              type="primary"
              size="large"
              icon={<CloudUploadOutlined />}
              onClick={handleSync}
              className="h-12 px-8 rounded-xl font-bold shadow-lg"
              style={{
                backgroundColor: DESIGN_COLORS.step3,
                borderColor: DESIGN_COLORS.step3,
              }}
            >
              Confirm & Sync to SharePoint
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Complete/Error */}
      {currentStep === 2 && !isSyncing && (
        <div className="wizard-step-3 animate-fadeIn text-center py-12">
          {wizardStatus === "complete" ? (
            <div className="max-w-md mx-auto">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${DESIGN_COLORS.step3}20` }}
              >
                <CheckCircleOutlined
                  style={{ fontSize: 48, color: DESIGN_COLORS.step3 }}
                />
              </div>
              <Title level={3} className="text-slate-800 mb-2">
                Sync Complete!
              </Title>
              <Text className="text-slate-500 block mb-6">
                Successfully scheduled{" "}
                {lastBatchResult?.successCount || generatedResult.length} shops
                to SharePoint.
              </Text>
              <Button
                type="primary"
                size="large"
                onClick={() => {
                  onRefresh();
                  if (onClose) onClose();
                }}
                className="rounded-xl"
                style={{ backgroundColor: DESIGN_COLORS.primary }}
              >
                Done
              </Button>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{ backgroundColor: `${DESIGN_COLORS.step1}20` }}
              >
                <CloseOutlined
                  style={{ fontSize: 48, color: DESIGN_COLORS.step1 }}
                />
              </div>
              <Title level={3} className="text-slate-800 mb-2">
                Partial Sync
              </Title>
              {lastBatchResult && (
                <div className="text-left bg-slate-50 p-4 rounded-2xl mb-6">
                  <p className="mb-2">
                    <CheckCircleOutlined className="text-green-500 mr-2" />
                    Succeeded: <strong>{lastBatchResult.successCount}</strong>
                  </p>
                  <p className="text-red-500">
                    <CloseOutlined className="text-red-500 mr-2" />
                    Failed: <strong>{lastBatchResult.failureCount}</strong>
                  </p>
                </div>
              )}
              <Space>
                <Button
                  onClick={() => {
                    setGeneratedResult([]);
                    setCurrentStep(0);
                    setWizardStatus("idle");
                    onRefresh();
                  }}
                  className="rounded-xl"
                >
                  Start Over
                </Button>
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    if (lastBatchResult) {
                      const failedShops = lastBatchResult.failed.map(
                        (f) => f.item,
                      );
                      setGeneratedResult(failedShops);
                      handleSync();
                    }
                  }}
                  className="rounded-xl"
                  style={{ backgroundColor: DESIGN_COLORS.cta }}
                >
                  Retry Failed ({lastBatchResult?.failureCount || 0})
                </Button>
              </Space>
            </div>
          )}
        </div>
      )}

      {/* CSS for animations */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .scheduling-wizard .ant-select-selector {
          border-radius: 12px !important;
          height: 44px !important;
          align-items: center;
        }

        .scheduling-wizard .ant-input-number {
          border-radius: 12px !important;
        }

        .scheduling-wizard .ant-picker {
          border-radius: 12px !important;
        }

        .scheduling-wizard .ant-table {
          border-radius: 16px;
          overflow: hidden;
        }

        .scheduling-wizard .ant-card-head {
          border-bottom: 1px solid #f1f5f9;
        }
      `}</style>
    </div>
  );
};

export default SchedulingWizard;
