import React from 'react';
import { CheckCircleFilled, SettingOutlined, ThunderboltOutlined, CloudSyncOutlined } from '@ant-design/icons';

export type WizardStep = 'configure' | 'generate' | 'sync' | 'complete';

interface SchedulingWizardProgressBarProps {
  currentStep: WizardStep;
  configuredFilters?: number;
  generatedCount?: number;
  syncProgress?: { current: number; total: number } | null;
  isProcessing?: boolean;
}

const STEP_CONFIG = {
  configure: {
    index: 0,
    label: 'Configure',
    description: 'Set filters & parameters',
    icon: SettingOutlined,
    color: '#ef4444', // Red - Problem/Setup phase
    activeColor: '#dc2626',
  },
  generate: {
    index: 1,
    label: 'Generate',
    description: 'Create schedule',
    icon: ThunderboltOutlined,
    color: '#f97316', // Orange - Process phase
    activeColor: '#ea580c',
  },
  sync: {
    index: 2,
    label: 'Sync',
    description: 'Save to SharePoint',
    icon: CloudSyncOutlined,
    color: '#10b981', // Green - Solution phase
    activeColor: '#059669',
  },
  complete: {
    index: 3,
    label: 'Complete',
    description: 'All done',
    icon: CheckCircleFilled,
    color: '#0d9488', // Teal - Success
    activeColor: '#0d9488',
  },
};

const STEPS: WizardStep[] = ['configure', 'generate', 'sync'];

export const SchedulingWizardProgressBar: React.FC<SchedulingWizardProgressBarProps> = ({
  currentStep,
  configuredFilters = 0,
  generatedCount = 0,
  syncProgress,
  isProcessing = false,
}) => {
  const currentIndex = STEP_CONFIG[currentStep].index;

  const getStepStatus = (step: WizardStep): 'completed' | 'active' | 'pending' => {
    const stepIndex = STEP_CONFIG[step].index;
    if (currentStep === 'complete' || stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'active';
    return 'pending';
  };

  const getStepFeedback = (step: WizardStep): string | null => {
    const status = getStepStatus(step);
    if (status === 'pending') return null;

    switch (step) {
      case 'configure':
        if (status === 'completed') return `${configuredFilters} filters set`;
        return 'Setting parameters...';
      case 'generate':
        if (status === 'completed') return `${generatedCount} shops scheduled`;
        if (status === 'active' && isProcessing) return 'Calculating...';
        return generatedCount > 0 ? `${generatedCount} shops ready` : 'Ready to generate';
      case 'sync':
        if (status === 'completed') return 'Synced successfully';
        if (syncProgress) return `${syncProgress.current}/${syncProgress.total}`;
        return 'Ready to sync';
      default:
        return null;
    }
  };

  const getProgressPercentage = (): number => {
    if (currentStep === 'complete') return 100;
    if (currentStep === 'sync' && syncProgress) {
      return 66 + (syncProgress.current / syncProgress.total) * 34;
    }
    return currentIndex * 33;
  };

  return (
    <div className="wizard-progress-container">
      {/* Main progress bar */}
      <div className="wizard-progress-track">
        <div
          className="wizard-progress-fill"
          style={{
            width: `${getProgressPercentage()}%`,
            background: currentStep === 'complete'
              ? 'linear-gradient(90deg, #ef4444 0%, #f97316 50%, #10b981 100%)'
              : `linear-gradient(90deg, #ef4444 0%, ${STEP_CONFIG[currentStep].color} 100%)`,
          }}
        />
      </div>

      {/* Step indicators */}
      <div className="wizard-steps">
        {STEPS.map((step, index) => {
          const config = STEP_CONFIG[step];
          const status = getStepStatus(step);
          const Icon = config.icon;
          const feedback = getStepFeedback(step);

          return (
            <div
              key={step}
              className={`wizard-step wizard-step--${status} ${isProcessing && status === 'active' ? 'wizard-step--processing' : ''}`}
            >
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={`wizard-connector wizard-connector--${status === 'pending' ? 'pending' : 'active'}`}
                />
              )}

              {/* Step circle */}
              <div
                className="wizard-step-circle"
                style={{
                  borderColor: status === 'pending' ? '#e2e8f0' : config.color,
                  backgroundColor: status === 'completed' ? config.color : status === 'active' ? '#fff' : '#f8fafc',
                }}
              >
                {status === 'completed' ? (
                  <CheckCircleFilled style={{ color: '#fff', fontSize: 18 }} />
                ) : (
                  <Icon
                    style={{
                      color: status === 'active' ? config.activeColor : '#94a3b8',
                      fontSize: 18,
                    }}
                    className={isProcessing && status === 'active' ? 'wizard-icon-pulse' : ''}
                  />
                )}
              </div>

              {/* Step label and feedback */}
              <div className="wizard-step-content">
                <span
                  className="wizard-step-label"
                  style={{
                    color: status === 'pending' ? '#94a3b8' : status === 'active' ? config.activeColor : '#134e4a',
                  }}
                >
                  {config.label}
                </span>
                {feedback && (
                  <span
                    className="wizard-step-feedback"
                    style={{
                      color: status === 'active' ? config.activeColor : '#64748b',
                    }}
                  >
                    {feedback}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion badge */}
      {currentStep === 'complete' && (
        <div className="wizard-complete-badge">
          <CheckCircleFilled style={{ color: '#10b981', fontSize: 16, marginRight: 8 }} />
          <span>Schedule complete! Ready for review.</span>
        </div>
      )}
    </div>
  );
};

export default SchedulingWizardProgressBar;
