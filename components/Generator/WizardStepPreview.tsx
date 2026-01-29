import React, { useMemo } from 'react';
import { Card, Table, Tag, Space, Button, Typography } from 'antd';
import {
  EyeOutlined,
  ArrowLeftOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { DESIGN_COLORS } from './wizardConstants';

const { Text } = Typography;

interface GeneratedShop {
  id: string;
  name: string;
  scheduledDate: string;
  groupId: number;
  district: string;
  brandIcon?: string;
  [key: string]: any;
}

interface WizardStepPreviewProps {
  generatedResult: GeneratedShop[];
  onBack: () => void;
  onSync: () => void;
  onRegenerate: () => void;
  isSyncing: boolean;
  hasPermission: boolean;
}

export const WizardStepPreview: React.FC<WizardStepPreviewProps> = ({
  generatedResult,
  onBack,
  onSync,
  onRegenerate,
  isSyncing,
  hasPermission,
}) => {
  // Calculate preview stats
  const previewStats = useMemo(() => {
    if (generatedResult.length === 0) return null;
    const dates = [...new Set(generatedResult.map(r => r.scheduledDate))].sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    return {
      totalShops: generatedResult.length,
      totalDays: dates.length,
      firstDate: dayjs(firstDate).format('MMM D'),
      lastDate: dayjs(lastDate).format('MMM D, YYYY'),
    };
  }, [generatedResult]);

  const columns = [
    {
      title: 'Date',
      dataIndex: 'scheduledDate',
      key: 'date',
      render: (d: string) => (
        <b className="text-slate-700">{dayjs(d).format('YYYY-MM-DD (ddd)')}</b>
      ),
    },
    {
      title: 'Group',
      dataIndex: 'groupId',
      key: 'group',
      render: (g: number) => (
        <Tag className={`font-black px-3 rounded-md border-none tag-group-${g}`}>
          {`Group ${String.fromCharCode(64 + g)}`}
        </Tag>
      ),
    },
    {
      title: 'Shop Name',
      dataIndex: 'name',
      key: 'name',
      render: (n: string, r: GeneratedShop) => (
        <Space>
          {r.brandIcon && <img src={r.brandIcon} className="w-6 h-6 object-contain" alt="" />}
          <span>{n}</span>
        </Space>
      ),
    },
    {
      title: 'District',
      dataIndex: 'district',
      key: 'district',
    },
  ];

  return (
    <div className="wizard-step-preview">
      {/* Preview Stats */}
      {previewStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Total Shops</div>
            <div className="text-2xl font-black" style={{ color: DESIGN_COLORS.primary }}>
              {previewStats.totalShops}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Working Days</div>
            <div className="text-2xl font-black" style={{ color: DESIGN_COLORS.cta }}>
              {previewStats.totalDays}
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">Start Date</div>
            <div className="text-lg font-bold text-slate-700">{previewStats.firstDate}</div>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
            <div className="text-xs text-slate-400 uppercase font-bold mb-1">End Date</div>
            <div className="text-lg font-bold text-slate-700">{previewStats.lastDate}</div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      <Card
        className="rounded-3xl border-none shadow-sm overflow-hidden"
        title={
          <Space className="text-slate-700 font-bold">
            <EyeOutlined style={{ color: DESIGN_COLORS.cta }} />
            Schedule Preview
            <Tag color="orange" className="ml-2">Holidays Excluded</Tag>
          </Space>
        }
        extra={
          <Button
            icon={<ReloadOutlined />}
            onClick={onRegenerate}
            className="rounded-xl"
          >
            Regenerate
          </Button>
        }
      >
        <Table
          dataSource={generatedResult}
          pagination={{ pageSize: 10, showSizeChanger: true }}
          rowKey="id"
          columns={columns}
        />
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between items-center mt-6 p-4 bg-white rounded-2xl border border-slate-100">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          size="large"
          className="rounded-xl"
        >
          Back to Configure
        </Button>
        {hasPermission && (
          <Button
            type="primary"
            size="large"
            icon={<CloudUploadOutlined />}
            onClick={onSync}
            loading={isSyncing}
            className="h-12 px-8 rounded-xl font-bold shadow-lg"
            style={{
              backgroundColor: DESIGN_COLORS.step3,
              borderColor: DESIGN_COLORS.step3,
            }}
          >
            Confirm & Sync to SharePoint
          </Button>
        )}
      </div>
    </div>
  );
};

export default WizardStepPreview;
