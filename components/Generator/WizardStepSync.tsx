import React from 'react';
import { Typography, Button, Space, Progress } from 'antd';
import {
  CheckCircleOutlined,
  CloseOutlined,
  ReloadOutlined,
  CloudUploadOutlined,
} from '@ant-design/icons';
import { DESIGN_COLORS } from './wizardConstants';
import { BatchResult } from '../../utils/batchOperations';

const { Title, Text } = Typography;

interface WizardStepSyncProps {
  isSyncing: boolean;
  syncProgress: { current: number; total: number } | null;
  syncComplete: boolean;
  lastBatchResult: BatchResult<any> | null;
  onDone: () => void;
  onRetry: () => void;
  onStartOver: () => void;
}

// Animated sync loader overlay
const SyncLoader: React.FC<{ progress?: { current: number; total: number } | null }> = ({ progress }) => (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor: 'rgba(13, 148, 136, 0.95)' }}
  >
    <div className="text-center">
      <div className="relative w-24 h-24 mx-auto mb-6">
        <div className="absolute inset-0 border-4 border-white/20 rounded-full" />
        <div
          className="absolute inset-0 border-4 border-t-white rounded-full animate-spin"
          style={{ animationDuration: '1s' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <CloudUploadOutlined className="text-4xl text-white" />
        </div>
      </div>
      <Title level={4} style={{ color: 'white', marginBottom: 8 }}>
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

export const WizardStepSync: React.FC<WizardStepSyncProps> = ({
  isSyncing,
  syncProgress,
  syncComplete,
  lastBatchResult,
  onDone,
  onRetry,
  onStartOver,
}) => {
  // Show loader while syncing
  if (isSyncing) {
    return <SyncLoader progress={syncProgress} />;
  }

  // Success state
  if (syncComplete && (!lastBatchResult || lastBatchResult.failureCount === 0)) {
    return (
      <div className="wizard-step-sync text-center py-12">
        <div className="max-w-md mx-auto">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${DESIGN_COLORS.step3}20` }}
          >
            <CheckCircleOutlined style={{ fontSize: 48, color: DESIGN_COLORS.step3 }} />
          </div>
          <Title level={3} className="text-slate-800 mb-2">Sync Complete!</Title>
          <Text className="text-slate-500 block mb-6">
            Successfully scheduled {lastBatchResult?.successCount || 0} shops to SharePoint.
          </Text>
          <Button
            type="primary"
            size="large"
            onClick={onDone}
            className="rounded-xl"
            style={{ backgroundColor: DESIGN_COLORS.primary }}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  // Partial failure state
  if (lastBatchResult && lastBatchResult.failureCount > 0) {
    return (
      <div className="wizard-step-sync text-center py-12">
        <div className="max-w-md mx-auto">
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ backgroundColor: `${DESIGN_COLORS.step1}20` }}
          >
            <CloseOutlined style={{ fontSize: 48, color: DESIGN_COLORS.step1 }} />
          </div>
          <Title level={3} className="text-slate-800 mb-2">Partial Sync</Title>

          <div className="text-left bg-slate-50 p-4 rounded-2xl mb-6">
            <p className="mb-2">
              <CheckCircleOutlined className="text-green-500 mr-2" />
              Succeeded: <strong>{lastBatchResult.successCount}</strong>
            </p>
            <p className="text-red-500 mb-0">
              <CloseOutlined className="text-red-500 mr-2" />
              Failed: <strong>{lastBatchResult.failureCount}</strong>
            </p>
            {lastBatchResult.failed.length > 0 && (
              <div className="mt-4 max-h-32 overflow-auto bg-white p-3 rounded-xl border border-slate-200">
                <Text type="secondary" className="text-xs block mb-2">Failed items:</Text>
                <ul className="list-disc list-inside m-0 p-0">
                  {lastBatchResult.failed.slice(0, 5).map((f, i) => (
                    <li key={i} className="text-sm text-red-600">
                      {f.item.name}: {f.error}
                    </li>
                  ))}
                  {lastBatchResult.failed.length > 5 && (
                    <li className="text-sm text-gray-500">
                      ... and {lastBatchResult.failed.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>

          <Space>
            <Button
              onClick={onStartOver}
              className="rounded-xl"
            >
              Start Over
            </Button>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={onRetry}
              className="rounded-xl"
              style={{ backgroundColor: DESIGN_COLORS.cta, borderColor: DESIGN_COLORS.cta }}
            >
              Retry Failed ({lastBatchResult.failureCount})
            </Button>
          </Space>
        </div>
      </div>
    );
  }

  // Default / idle state (shouldn't normally be seen)
  return (
    <div className="wizard-step-sync text-center py-12">
      <div className="max-w-md mx-auto">
        <CloudUploadOutlined style={{ fontSize: 64, color: DESIGN_COLORS.slate300 }} />
        <Title level={4} className="text-slate-400 mt-4">Ready to Sync</Title>
      </div>
    </div>
  );
};

export default WizardStepSync;
