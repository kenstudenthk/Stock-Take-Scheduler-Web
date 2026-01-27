import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Card, Row, Col, Space, Button, Typography, Switch, Select,
  InputNumber, Table, Tag, message, Modal, DatePicker, Progress
} from 'antd';
import {
  ControlOutlined, CheckCircleOutlined, SaveOutlined,
  ShopOutlined, HourglassOutlined, DeleteOutlined,
  CalendarOutlined, SyncOutlined, HistoryOutlined, ReloadOutlined,
  SettingOutlined, ThunderboltOutlined, CloudUploadOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';
import { isHoliday, getAllHolidays } from '../constants/holidays';
import { API_URLS } from '../constants/config';
import { GENERATOR_DEFAULTS, BATCH_CONFIG } from '../constants/config';
import { executeBatch, BatchResult, formatBatchResult } from '../utils/batchOperations';
import { SchedulingWizardProgressBar, WizardStep } from './SchedulingWizardProgressBar';

dayjs.extend(isBetween);

// --- Wizard Step Types and Configuration ---
type WizardStep = 'configure' | 'generate' | 'sync';

interface StepConfig {
  key: WizardStep;
  number: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  activeColor: string;
  completedColor: string;
}

const WIZARD_STEPS: StepConfig[] = [
  {
    key: 'configure',
    number: 1,
    title: 'Configure',
    description: 'Set filters & parameters',
    icon: <SettingOutlined />,
    color: '#ef4444',       // Red - Problem/Setup
    activeColor: '#dc2626',
    completedColor: '#22c55e'
  },
  {
    key: 'generate',
    number: 2,
    title: 'Generate',
    description: 'Create schedule',
    icon: <ThunderboltOutlined />,
    color: '#f97316',       // Orange - Process
    activeColor: '#ea580c',
    completedColor: '#22c55e'
  },
  {
    key: 'sync',
    number: 3,
    title: 'Sync',
    description: 'Save to SharePoint',
    icon: <CloudUploadOutlined />,
    color: '#22c55e',       // Green - Solution
    activeColor: '#16a34a',
    completedColor: '#22c55e'
  }
];

// --- Wizard Progress Bar Component ---
interface WizardProgressBarProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
  isProcessing?: boolean;
  processProgress?: { current: number; total: number } | null;
}

const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  isProcessing = false,
  processProgress = null
}) => {
  const currentStepIndex = WIZARD_STEPS.findIndex(s => s.key === currentStep);

  const getStepStatus = (step: StepConfig): 'completed' | 'active' | 'pending' => {
    if (completedSteps.includes(step.key)) return 'completed';
    if (step.key === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (step: StepConfig, status: 'completed' | 'active' | 'pending') => {
    if (status === 'completed') return step.completedColor;
    if (status === 'active') return step.activeColor;
    return '#cbd5e1'; // slate-300
  };

  const getConnectorProgress = (stepIndex: number) => {
    if (stepIndex >= currentStepIndex) return 0;
    if (completedSteps.includes(WIZARD_STEPS[stepIndex + 1]?.key)) return 100;
    if (WIZARD_STEPS[stepIndex + 1]?.key === currentStep) {
      if (isProcessing && processProgress) {
        return Math.round((processProgress.current / processProgress.total) * 100);
      }
      return 50;
    }
    return 0;
  };

  return (
    <div className="wizard-progress-container">
      <div className="wizard-progress-bar">
        {WIZARD_STEPS.map((step, index) => {
          const status = getStepStatus(step);
          const stepColor = getStepColor(step, status);
          const isClickable = completedSteps.includes(step.key) || step.key === currentStep;

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <div
                className={`wizard-step ${status} ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && onStepClick?.(step.key)}
                style={{ '--step-color': stepColor } as React.CSSProperties}
              >
                <div className="wizard-step-circle">
                  {status === 'completed' ? (
                    <CheckCircleOutlined className="wizard-step-icon completed-icon" />
                  ) : (
                    <span className="wizard-step-icon">{step.icon}</span>
                  )}
                  {status === 'active' && isProcessing && (
                    <div className="wizard-step-pulse" />
                  )}
                </div>
                <div className="wizard-step-label">
                  <span className="wizard-step-number">Step {step.number}</span>
                  <span className="wizard-step-title">{step.title}</span>
                  <span className="wizard-step-description">{step.description}</span>
                </div>
              </div>

              {/* Connector Line */}
              {index < WIZARD_STEPS.length - 1 && (
                <div className="wizard-connector">
                  <div className="wizard-connector-track" />
                  <div
                    className="wizard-connector-fill"
                    style={{
                      width: `${getConnectorProgress(index)}%`,
                      backgroundColor: status === 'completed' ? '#22c55e' : step.color
                    }}
                  />
                  {status === 'active' && isProcessing && (
                    <ArrowRightOutlined className="wizard-connector-arrow" />
                  )}
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Detail for Active Step */}
      {isProcessing && processProgress && (
        <div className="wizard-progress-detail">
          <Progress
            percent={Math.round((processProgress.current / processProgress.total) * 100)}
            strokeColor={WIZARD_STEPS[currentStepIndex]?.color || '#0d9488'}
            trailColor="#e2e8f0"
            format={() => `${processProgress.current} / ${processProgress.total}`}
            size="small"
          />
        </div>
      )}

      <style>{`
        .wizard-progress-container {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-radius: 24px;
          padding: 24px 32px;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .wizard-progress-bar {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          position: relative;
        }

        .wizard-step {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          transition: all 0.3s ease;
          flex: 0 0 auto;
          min-width: 120px;
        }

        .wizard-step.clickable {
          cursor: pointer;
        }

        .wizard-step.clickable:hover .wizard-step-circle {
          transform: scale(1.1);
          box-shadow: 0 8px 25px -5px var(--step-color);
        }

        .wizard-step-circle {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--step-color);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px -2px var(--step-color);
        }

        .wizard-step.pending .wizard-step-circle {
          background: #e2e8f0;
          box-shadow: none;
        }

        .wizard-step-icon {
          color: white;
          font-size: 22px;
        }

        .wizard-step-icon.completed-icon {
          font-size: 26px;
        }

        .wizard-step.pending .wizard-step-icon {
          color: #94a3b8;
        }

        .wizard-step-pulse {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 3px solid var(--step-color);
          animation: pulse-ring 1.5s ease-out infinite;
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(1.5);
            opacity: 0;
          }
        }

        .wizard-step-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 12px;
          text-align: center;
        }

        .wizard-step-number {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: #94a3b8;
        }

        .wizard-step.active .wizard-step-number,
        .wizard-step.completed .wizard-step-number {
          color: var(--step-color);
        }

        .wizard-step-title {
          font-size: 14px;
          font-weight: 700;
          color: #334155;
          margin-top: 2px;
        }

        .wizard-step.pending .wizard-step-title {
          color: #94a3b8;
        }

        .wizard-step-description {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }

        .wizard-step.pending .wizard-step-description {
          color: #cbd5e1;
        }

        .wizard-connector {
          flex: 1;
          height: 4px;
          position: relative;
          margin: 28px 12px 0;
          display: flex;
          align-items: center;
        }

        .wizard-connector-track {
          position: absolute;
          width: 100%;
          height: 100%;
          background: #e2e8f0;
          border-radius: 2px;
        }

        .wizard-connector-fill {
          position: absolute;
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .wizard-connector-arrow {
          position: absolute;
          right: -8px;
          color: #0d9488;
          font-size: 16px;
          animation: arrow-move 1s ease-in-out infinite;
        }

        @keyframes arrow-move {
          0%, 100% {
            transform: translateX(0);
            opacity: 0.5;
          }
          50% {
            transform: translateX(5px);
            opacity: 1;
          }
        }

        .wizard-progress-detail {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }

        .wizard-progress-detail .ant-progress-text {
          font-weight: 600;
          color: #475569;
        }
      `}</style>
    </div>
  );
};

const { Text, Title } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;
const { Option } = Select;

// Get all holidays for validation
const ALL_HOLIDAYS = getAllHolidays();

// --- 動態動畫組件 (保留原設計) ---
const ResetChaseLoader = () => (
  <div className="chase-overlay">
    <div className="chase-scene">
      <div className="ghost-chaser">
        <div style={{ background: '#ef4444', width: '140px', height: '140px', borderRadius: '70px 70px 0 0', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '20px', paddingTop: '40px', justifyContent: 'center' }}>
            <div style={{ width: '30px', height: '35px', background: 'white', borderRadius: '50%' }} />
            <div style={{ width: '30px', height: '35px', background: 'white', borderRadius: '50%' }} />
          </div>
        </div>
      </div>
      <div className="pacman-runner"></div>
      <div className="dots-trail">{[1, 2, 3, 4].map(i => <div key={i} className="dot-node" />)}</div>
    </div>
    <Title level={4} style={{ color: 'white', marginTop: '40px' }}>Resetting Schedules...</Title>
  </div>
);

const SyncGeometricLoader = ({ text = "Syncing to SharePoint...", progress }: { text?: string; progress?: { current: number; total: number } | null }) => (
  <div className="sync-overlay">
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <div className="loader"><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40"></circle></svg></div>
      <div className="loader triangle"><svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72"></polygon></svg></div>
      <div className="loader"><svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8"></rect></svg></div>
    </div>
    <Title level={4} style={{ color: '#0d9488', marginTop: '20px' }}>{text}</Title>
    {progress && (
      <div style={{ width: '200px', marginTop: '16px' }}>
        <Progress
          percent={Math.round((progress.current / progress.total) * 100)}
          size="small"
          format={() => `${progress.current}/${progress.total}`}
        />
      </div>
    )}
  </div>
);

const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="summary-card-item">
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="summary-card-body">
      <div className="summary-card-header"><div className="summary-card-title">{label}</div></div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

const REGION_DISPLAY_CONFIG: Record<string, { label: string, social: string, svg: React.ReactNode }> = {
  'HK': { label: 'HK Island', social: 'hk', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M3 21H21" stroke="currentColor" strokeWidth="2"/><path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2"/></svg> },
  'KN': { label: 'Kowloon', social: 'kn', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="currentColor" strokeWidth="2"/></svg> },
  'NT': { label: 'N.T.', social: 'nt', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M2 20L9 4L14 14L18 8L22 20H2Z" stroke="currentColor" strokeWidth="2"/></svg> },
  'Islands': { label: 'Lantau', social: 'islands', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14Z" stroke="currentColor" strokeWidth="2"/><path d="M12 10V3" stroke="currentColor" strokeWidth="2"/></svg> },
  'MO': { label: 'Macau', social: 'mo', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2"/><path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2"/></svg> }
};

export const Generator: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  // Wizard mode state
  const [showWizard, setShowWizard] = useState(false);

  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(GENERATOR_DEFAULTS.shopsPerDay);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(GENERATOR_DEFAULTS.groupsPerDay);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingType, setLoadingType] = useState<'reset' | 'sync'>('sync');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetRange, setResetRange] = useState<any>(null);

  // Batch operation state
  const [saveProgress, setSaveProgress] = useState<{ current: number; total: number } | null>(null);
  const [lastBatchResult, setLastBatchResult] = useState<BatchResult<any> | null>(null);
  const [showRetryModal, setShowRetryModal] = useState(false);

  // Wizard progress state
  const [wizardStep, setWizardStep] = useState<WizardStep>('configure');
  const [syncCompleted, setSyncCompleted] = useState(false);

  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed' && s.status !== 'Closed'), [shops]);

  const stats = useMemo(() => ({
    total: activePool.length, completed: activePool.filter(s => s.status === 'Done').length,
    unplanned: activePool.filter(s => s.status === 'Unplanned').length
  }), [activePool]);

  const regionRemainStats = useMemo(() => {
    const unplannedPool = activePool.filter(s => s.status === 'Unplanned');
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    unplannedPool.forEach(s => { if (counts.hasOwnProperty(s.region)) counts[s.region]++; });
    return Object.keys(counts).map(key => {
      const config = REGION_DISPLAY_CONFIG[key] || { label: key, social: key.toLowerCase(), svg: null };
      return { key, count: counts[key], displayName: config.label, socialKey: config.social, icon: config.svg };
    });
  }, [activePool]);

  const regionOptions = useMemo(() => Array.from(new Set(activePool.map(s => s.region))).filter(Boolean).sort(), [activePool]);
  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? activePool.filter(s => selectedRegions.includes(s.region)) : activePool;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [activePool, selectedRegions]);

  // Calculate configured filters count for wizard feedback
  const configuredFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedRegions.length > 0) count++;
    if (selectedDistricts.length > 0) count++;
    if (!includeMTR) count++;
    if (shopsPerDay !== GENERATOR_DEFAULTS.shopsPerDay) count++;
    if (groupsPerDay !== GENERATOR_DEFAULTS.groupsPerDay) count++;
    return count;
  }, [selectedRegions, selectedDistricts, includeMTR, shopsPerDay, groupsPerDay]);

  // Update wizard step based on state changes
  useEffect(() => {
    if (syncCompleted) {
      setWizardStep('complete');
    } else if (isSaving) {
      setWizardStep('sync');
    } else if (generatedResult.length > 0) {
      setWizardStep('generate');
    } else {
      setWizardStep('configure');
    }
  }, [isSaving, generatedResult.length, syncCompleted]);

  // Reset syncCompleted when starting fresh
  useEffect(() => {
    if (generatedResult.length === 0 && !isSaving) {
      setSyncCompleted(false);
    }
  }, [generatedResult.length, isSaving]);

  const handleResetByPeriod = async () => {
    if (!resetRange) { message.error("Please select a date range!"); return; }
    const [start, end] = resetRange;
    const targets = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).isBetween(start, end, 'day', '[]'));
    if (targets.length === 0) { message.warning("No schedules found."); return; }
    confirm({
      title: 'Reset Period?',
      onOk: async () => {
        setLoadingType('reset');
        setIsSaving(true);
        setSaveProgress({ current: 0, total: targets.length });
        try {
          const result = await executeBatch(
            targets,
            async (shop) => {
              const response = await fetch(
                `${API_URLS.shopList}/items/${shop.sharePointItemId}/fields`,
                {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    [SP_FIELDS.SCHEDULE_DATE]: null,
                    [SP_FIELDS.SCHEDULE_GROUP]: "0",
                    [SP_FIELDS.STATUS]: 'Unplanned'
                  })
                }
              );
              if (!response.ok) throw new Error('Reset failed');
            },
            {
              onProgress: (processed, total) => setSaveProgress({ current: processed, total }),
            }
          );
          setResetModalVisible(false);
          setResetRange(null);
          onRefresh();
          message.success(formatBatchResult(result));
        } finally {
          setIsSaving(false);
          setSaveProgress(null);
        }
      }
    });
  };

  const handleResetAll = () => {
    const plannedShops = shops.filter(s => s.status === 'Planned');
    if (plannedShops.length === 0) return message.info("No planned schedules.");
    confirm({
      title: 'RESET ALL?',
      onOk: async () => {
        setLoadingType('reset');
        setIsSaving(true);
        setSaveProgress({ current: 0, total: plannedShops.length });
        try {
          const result = await executeBatch(
            plannedShops,
            async (shop) => {
              const response = await fetch(
                `${API_URLS.shopList}/items/${shop.sharePointItemId}/fields`,
                {
                  method: 'PATCH',
                  headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    [SP_FIELDS.SCHEDULE_DATE]: null,
                    [SP_FIELDS.SCHEDULE_GROUP]: "0",
                    [SP_FIELDS.STATUS]: 'Unplanned'
                  })
                }
              );
              if (!response.ok) throw new Error('Reset failed');
            },
            {
              onProgress: (processed, total) => setSaveProgress({ current: processed, total }),
            }
          );
          onRefresh();
          message.success(formatBatchResult(result));
        } finally {
          setIsSaving(false);
          setSaveProgress(null);
        }
      }
    });
  };

  // Check if date should be disabled (weekends + public holidays)
  const disabledDate = useCallback((current: dayjs.Dayjs) => {
    if (!current) return false;

    // Check if weekend (0 = Sunday, 6 = Saturday)
    const isWeekend = current.day() === 0 || current.day() === 6;

    // Check if public holiday using multi-year holiday system
    const dateStr = current.format('YYYY-MM-DD');
    const isPublicHoliday = isHoliday(dateStr);

    return isWeekend || isPublicHoliday;
  }, []);

  // Core logic: auto-skip weekends and holidays
  const handleGenerate = useCallback(() => {
    setIsCalculating(true);

    const isWorkingDay = (date: dayjs.Dayjs) => {
      const day = date.day();
      const isWeekend = (day === 0 || day === 6);
      const dateStr = date.format('YYYY-MM-DD');
      const isPublicHoliday = isHoliday(dateStr);
      return !isWeekend && !isPublicHoliday;
    };

    const getNextWorkingDay = (date: dayjs.Dayjs) => {
      let next = date;
      while (!isWorkingDay(next)) { next = next.add(1, 'day'); }
      return next;
    };

    let pool = activePool.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return s.status === 'Unplanned' && matchRegion && matchDistrict && matchMTR;
    });
    
    if (pool.length === 0) { message.warning("No unplanned shops match filters."); setIsCalculating(false); return; }
    
    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    
    const results: any[] = [];
    let currentDay = getNextWorkingDay(dayjs(startDate));

    pool.forEach((shop, index) => {
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      results.push({ ...shop, scheduledDate: currentDay.format('YYYY-MM-DD'), groupId: groupInDay });
      if ((index + 1) % shopsPerDay === 0) {
        currentDay = getNextWorkingDay(currentDay.add(1, 'day'));
      }
    });

    const sortedResults = results.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return dayjs(a.scheduledDate).unix() - dayjs(b.scheduledDate).unix();
      return a.groupId - b.groupId;
    });

    setGeneratedResult(sortedResults);
    setIsCalculating(false);
  }, [activePool, selectedRegions, selectedDistricts, includeMTR, startDate, shopsPerDay, groupsPerDay]);

  const saveToSharePoint = async () => {
    setLoadingType('sync');
    setIsSaving(true);
    setSaveProgress({ current: 0, total: generatedResult.length });
    setLastBatchResult(null);

    try {
      const result = await executeBatch(
        generatedResult,
        async (shop) => {
          const response = await fetch(
            `${API_URLS.shopList}/items/${shop.sharePointItemId}/fields`,
            {
              method: 'PATCH',
              headers: {
                'Authorization': `Bearer ${graphToken}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate,
                [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(),
                [SP_FIELDS.STATUS]: 'Planned'
              })
            }
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
        }
      );

      setLastBatchResult(result);

      if (result.failureCount === 0) {
        message.success(`Successfully synced ${result.successCount} shops!`);
        setSyncCompleted(true);
        setTimeout(() => {
          setGeneratedResult([]);
          onRefresh();
        }, 2000); // Brief delay to show completion state
      } else if (result.successCount > 0) {
        message.warning(`Synced ${result.successCount} shops. ${result.failureCount} failed.`);
        setShowRetryModal(true);
      } else {
        message.error(`Failed to sync all ${result.failureCount} shops.`);
        setShowRetryModal(true);
      }
    } catch (error) {
      message.error('Sync failed. Please try again.');
    } finally {
      setIsSaving(false);
      setSaveProgress(null);
    }
  };

  const handleRetryFailed = async () => {
    if (!lastBatchResult || lastBatchResult.failureCount === 0) return;

    const failedShops = lastBatchResult.failed.map(f => f.item);
    setGeneratedResult(failedShops);
    setShowRetryModal(false);
    // Trigger save again with only failed items
    setTimeout(() => saveToSharePoint(), 100);
  };

  // Render wizard mode
  if (showWizard) {
    return (
      <div className="w-full flex flex-col gap-6 pb-20">
        {/* Wizard Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              icon={<RocketOutlined />}
              onClick={() => setShowWizard(false)}
              className="rounded-lg border-slate-200"
            >
              Exit Wizard
            </Button>
            <Title level={2} className="m-0 text-slate-800">
              <ThunderboltOutlined className="text-orange-500 mr-2" />
              Scheduling Wizard
            </Title>
          </div>
        </div>

        {/* Wizard Component */}
        <SchedulingWizard
          shops={shops}
          graphToken={graphToken}
          onRefresh={onRefresh}
          onClose={() => setShowWizard(false)}
        />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {isSaving && (loadingType === 'reset' ? <ResetChaseLoader /> : <SyncGeometricLoader progress={saveProgress} />)}

      {/* Intelligent Scheduling Wizard Progress Bar */}
      <SchedulingWizardProgressBar
        currentStep={wizardStep}
        configuredFilters={configuredFiltersCount}
        generatedCount={generatedResult.length}
        syncProgress={saveProgress}
        isProcessing={isCalculating || isSaving}
      />

      {/* Retry Failed Modal */}
      <Modal
        title="Partial Sync Failure"
        open={showRetryModal}
        onCancel={() => {
          setShowRetryModal(false);
          setGeneratedResult([]);
          onRefresh();
        }}
        footer={[
          <Button key="skip" onClick={() => {
            setShowRetryModal(false);
            setGeneratedResult([]);
            onRefresh();
          }}>
            Skip Failed Items
          </Button>,
          <Button
            key="retry"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRetryFailed}
          >
            Retry Failed ({lastBatchResult?.failureCount || 0})
          </Button>,
        ]}
      >
        {lastBatchResult && (
          <div className="py-4">
            <p className="mb-4">
              <CheckCircleOutlined className="text-green-500 mr-2" />
              Successfully saved: <strong>{lastBatchResult.successCount}</strong> shops
            </p>
            <p className="mb-4 text-red-500">
              Failed to save: <strong>{lastBatchResult.failureCount}</strong> shops
            </p>
            {lastBatchResult.failed.length > 0 && (
              <div className="max-h-40 overflow-auto bg-gray-50 p-3 rounded">
                <Text type="secondary" className="text-xs">Failed items:</Text>
                <ul className="list-disc list-inside mt-2">
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

      <div className="flex justify-between items-center">
        <Title level={2} className="m-0 text-slate-800">Schedule Generator</Title>
        <Space>
          {/* Wizard Launch Button */}
          <Button
            type="primary"
            icon={<ThunderboltOutlined />}
            onClick={() => setShowWizard(true)}
            className="rounded-lg font-bold h-10 px-6"
            style={{
              background: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
              border: 'none',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
            }}
          >
            Start Wizard
          </Button>
          <Button icon={<HistoryOutlined />} onClick={() => setResetModalVisible(true)} className="rounded-lg border-red-200 text-red-500 font-bold hover:bg-red-50">Reset by Period</Button>
          <Button danger type="primary" icon={<DeleteOutlined />} onClick={handleResetAll} className="rounded-lg font-bold">Reset All</Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={8}><SummaryCard label="Active Shops" value={stats.total} subtext="Operational units" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Completed" value={stats.completed} subtext="Done this year" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Remaining" value={stats.unplanned} subtext="Pending schedule" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      {/* ✅ 整合後的佈局：左側區域統計 + 右側生成設定 */}
      <Row gutter={[24, 24]}>
        {/* 左側：Active Unplanned Shops by Region */}
        <Col span={9}>
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100 h-full flex flex-col">
            <Text strong className="text-[14px] text-slate-400 uppercase tracking-widest block mb-8">Unplanned Pool</Text>
            <ul className="example-2 grid grid-cols-2 w-full gap-2 list-none p-0 m-0">
              {regionRemainStats.map(reg => (
                <li key={reg.key} className="icon-content flex justify-center w-full">
                  <a href="#" data-social={reg.socialKey} style={{ width: '100%', height: '100px', borderRadius: '20px', flexDirection: 'column', gap: '4px', margin: '0 auto' }}>
                    <div className="filled"></div>
                    <div style={{ position: 'relative', zIndex: 10 }}>{reg.icon}</div>
                    <span style={{ position: 'relative', zIndex: 10, fontSize: '10px', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase' }}>{reg.displayName}</span>
                    <div className="font-black text-lg" style={{ position: 'relative', zIndex: 10 }}>{reg.count}</div>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Col>

        {/* 右側：Generation Settings */}
        <Col span={15}>
          <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 h-full">
            <div className="flex justify-between items-center mb-10">
              <Space className="text-[18px] font-bold uppercase text-slate-800"><ControlOutlined className="text-teal-600" /> Generation Settings</Space>
              <div className="flex items-center gap-3 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                 <Switch checked={includeMTR} onChange={setIncludeMTR} size="small" />
                 <Text className="text-[11px] font-black uppercase text-slate-500">Include MTR</Text>
              </div>
            </div>
            
            <Row gutter={[16, 24]}>
              <Col span={12}>
                <Text strong className="text-slate-400 block mb-2 uppercase text-[10px] ml-1">Filter Regions</Text>
                <Select mode="multiple" className="w-full h-11 custom-select" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions} allowClear maxTagCount="responsive">
                  {regionOptions.map(r => <Option key={r} value={r}>{r}</Option>)}
                </Select>
              </Col>
              <Col span={12}>
                <Text strong className="text-slate-400 block mb-2 uppercase text-[10px] ml-1">Filter Districts</Text>
                <Select mode="multiple" className="w-full h-11 custom-select" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts} allowClear maxTagCount="responsive">
                  {availableDistricts.map(d => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Col>
              <Col span={8}>
          <Text strong className="text-slate-400 block mb-2 uppercase text-xs ml-1">Start Date</Text>
          {/* ✅ 替換為 Ant Design DatePicker 並加入 disabledDate */}
          <DatePicker 
            value={startDate ? dayjs(startDate) : null} 
            onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : '')}
            disabledDate={disabledDate}
            format="YYYY/MM/DD"
            placeholder="Select Start Date"
            className="bg-slate-50 border border-slate-200 h-11 rounded-xl w-full px-4 font-bold text-slate-700"
            allowClear={false}
          />
       </Col>
       
       <Col span={8}>
          <Text strong className="text-slate-400 block mb-2 uppercase text-xs ml-1">Shops Per Day</Text>
          <InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || GENERATOR_DEFAULTS.shopsPerDay)} min={1} className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl font-bold flex items-center" />
       </Col>
       <Col span={8}>
          <Text strong className="text-slate-400 block mb-2 uppercase text-xs ml-1">Groups Per Day</Text>
          <InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || GENERATOR_DEFAULTS.groupsPerDay)} min={1} className="w-full h-11 bg-slate-50 border-slate-200 rounded-xl font-bold flex items-center" />
       </Col>
    </Row>
            
            <div className="flex justify-end mt-10">
              <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}>
                <div className="dots_border"></div>
                <Space className="text_button"><ControlOutlined /><span>GENERATE SCHEDULE</span></Space>
              </button>
            </div>
          </div>
        </Col>
      </Row>

      {generatedResult.length > 0 && (
        <Card title={<Space className="text-slate-700 font-bold"><SyncOutlined spin /> Schedule Preview (Holidays Excluded)</Space>} className="rounded-[40px] border-none shadow-sm overflow-hidden">
          <Table dataSource={generatedResult} pagination={{ pageSize: 15 }} rowKey="id" columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: d => <b className="text-slate-700">{dayjs(d).format('YYYY-MM-DD (ddd)')}</b> },
            { title: 'Group', dataIndex: 'groupId', key: 'group', render: g => <Tag className={`font-black px-3 rounded-md border-none tag-group-${g}`}>{`Group ${String.fromCharCode(64 + g)}`}</Tag> },
            { title: 'Shop Name', dataIndex: 'name', key: 'name', render: (n, r) => <Space><img src={r.brandIcon} className="w-6 h-6 object-contain" /><span>{n}</span></Space> },
            { title: 'District', dataIndex: 'district', key: 'district' },
          ]} />
          <div className="flex justify-end p-8 border-t bg-slate-50">
             <Button type="primary" icon={<SaveOutlined />} onClick={saveToSharePoint} className="bg-emerald-600 h-12 rounded-xl px-16 font-black shadow-lg">Confirm & Sync to SharePoint</Button>
          </div>
        </Card>
      )}

      <Modal title={<Space><CalendarOutlined /> Reset Range</Space>} open={resetModalVisible} onCancel={() => setResetModalVisible(false)} onOk={handleResetByPeriod} okText="Confirm Reset" okButtonProps={{ danger: true }} centered>
        <div className="py-6 text-center">
          <Text className="block mb-6 text-slate-500">Reset schedules within this period to 'Unplanned'.</Text>
          <RangePicker className="w-full h-12 rounded-xl" onChange={(dates) => setResetRange(dates)} />
        </div>
      </Modal>

      <style>{`
        .custom-select .ant-select-selector {
          background-color: #f8fafc !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 12px !important;
        }
      `}</style>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const MemoizedGenerator = React.memo(Generator);
