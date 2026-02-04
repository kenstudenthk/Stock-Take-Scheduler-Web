import React from 'react';
import { Progress } from 'antd';
import {
  CheckCircleOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CloudUploadOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { DESIGN_COLORS, WIZARD_STEP_CONFIG, WizardStep, ANIMATION } from './wizardConstants';

interface WizardProgressBarProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick?: (step: WizardStep) => void;
  isProcessing?: boolean;
  processProgress?: { current: number; total: number } | null;
  configuredFilters?: number;
  generatedCount?: number;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  configure: <SettingOutlined />,
  generate: <ThunderboltOutlined />,
  sync: <CloudUploadOutlined />,
};

export const WizardProgressBar: React.FC<WizardProgressBarProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
  isProcessing = false,
  processProgress = null,
  configuredFilters = 0,
  generatedCount = 0,
}) => {
  const currentStepIndex = WIZARD_STEP_CONFIG.findIndex(s => s.key === currentStep);

  const getStepStatus = (stepKey: WizardStep): 'completed' | 'active' | 'pending' => {
    if (currentStep === 'complete') return 'completed';
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'active';
    return 'pending';
  };

  const getStepColor = (stepKey: WizardStep, status: 'completed' | 'active' | 'pending') => {
    const stepConfig = WIZARD_STEP_CONFIG.find(s => s.key === stepKey);
    if (!stepConfig) return DESIGN_COLORS.slate300;
    if (status === 'completed') return stepConfig.completedColor;
    if (status === 'active') return stepConfig.activeColor;
    return DESIGN_COLORS.slate300;
  };

  const getStepFeedback = (stepKey: WizardStep): string | null => {
    const status = getStepStatus(stepKey);
    if (status === 'pending') return null;

    switch (stepKey) {
      case 'configure':
        if (status === 'completed') return `${configuredFilters} filters set`;
        return 'Setting parameters...';
      case 'generate':
        if (status === 'completed') return `${generatedCount} shops scheduled`;
        if (status === 'active' && isProcessing) return 'Calculating...';
        return generatedCount > 0 ? `${generatedCount} shops ready` : 'Ready to generate';
      case 'sync':
        if (status === 'completed') return 'Synced successfully';
        if (processProgress) return `${processProgress.current}/${processProgress.total}`;
        return 'Ready to sync';
      default:
        return null;
    }
  };

  const getConnectorProgress = (stepIndex: number) => {
    const nextStepKey = WIZARD_STEP_CONFIG[stepIndex + 1]?.key;
    if (!nextStepKey) return 0;

    if (stepIndex >= currentStepIndex) return 0;
    if (completedSteps.includes(nextStepKey)) return 100;
    if (nextStepKey === currentStep) {
      if (isProcessing && processProgress) {
        return Math.round((processProgress.current / processProgress.total) * 100);
      }
      return 50;
    }
    return 0;
  };

  const getOverallProgress = (): number => {
    if (currentStep === 'complete') return 100;
    if (currentStep === 'sync' && processProgress) {
      return 66 + (processProgress.current / processProgress.total) * 34;
    }
    return currentStepIndex * 33;
  };

  return (
    <div className="wizard-progress-container">
      {/* Overall progress track */}
      <div className="wizard-progress-track">
        <div
          className="wizard-progress-fill"
          style={{
            width: `${getOverallProgress()}%`,
            background: currentStep === 'complete'
              ? `linear-gradient(90deg, ${DESIGN_COLORS.step1} 0%, ${DESIGN_COLORS.step2} 50%, ${DESIGN_COLORS.step3} 100%)`
              : `linear-gradient(90deg, ${DESIGN_COLORS.step1} 0%, ${getStepColor(currentStep, 'active')} 100%)`,
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="wizard-progress-bar">
        {WIZARD_STEP_CONFIG.map((step, index) => {
          const status = getStepStatus(step.key);
          const stepColor = getStepColor(step.key, status);
          const isClickable = completedSteps.includes(step.key) || step.key === currentStep;
          const feedback = getStepFeedback(step.key);

          return (
            <React.Fragment key={step.key}>
              {/* Step Node */}
              <div
                className={`wizard-step wizard-step--${status} ${isClickable ? 'wizard-step--clickable' : ''} ${isProcessing && status === 'active' ? 'wizard-step--processing' : ''}`}
                onClick={() => isClickable && onStepClick?.(step.key)}
                style={{ '--step-color': stepColor } as React.CSSProperties}
              >
                <div className="wizard-step-circle">
                  {status === 'completed' ? (
                    <CheckCircleOutlined className="wizard-step-icon wizard-step-icon--completed" />
                  ) : (
                    <span className="wizard-step-icon">{STEP_ICONS[step.key]}</span>
                  )}
                  {status === 'active' && isProcessing && (
                    <div className="wizard-step-pulse" />
                  )}
                </div>
                <div className="wizard-step-label">
                  <span className="wizard-step-number">Step {step.number}</span>
                  <span className="wizard-step-title">{step.title}</span>
                  <span className="wizard-step-description">{step.description}</span>
                  {feedback && (
                    <span className="wizard-step-feedback">{feedback}</span>
                  )}
                </div>
              </div>

              {/* Connector Line */}
              {index < WIZARD_STEP_CONFIG.length - 1 && (
                <div className="wizard-connector">
                  <div className="wizard-connector-track" />
                  <div
                    className="wizard-connector-fill"
                    style={{
                      width: `${getConnectorProgress(index)}%`,
                      backgroundColor: status === 'completed' ? DESIGN_COLORS.success : step.color,
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
            strokeColor={getStepColor(currentStep, 'active')}
            trailColor={DESIGN_COLORS.slate200}
            format={() => `${processProgress.current} / ${processProgress.total}`}
            size="small"
          />
        </div>
      )}

      {/* Completion badge */}
      {currentStep === 'complete' && (
        <div className="wizard-complete-badge">
          <CheckCircleOutlined style={{ color: DESIGN_COLORS.step3, fontSize: 16, marginRight: 8 }} />
          <span>Schedule complete! Ready for review.</span>
        </div>
      )}
    </div>
  );
};

export default WizardProgressBar;
