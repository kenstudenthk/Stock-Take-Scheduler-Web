import React from 'react';
import { Row, Col, Space, Typography, Switch, Select, InputNumber, DatePicker, Button } from 'antd';
import {
  ControlOutlined,
  FilterOutlined,
  ScheduleOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../../types';
import { GENERATOR_DEFAULTS } from '../../constants/config';
import { DESIGN_COLORS, REGION_DISPLAY_CONFIG } from './wizardConstants';

const { Text } = Typography;
const { Option } = Select;

// Region icons as inline SVGs
const REGION_ICONS: Record<string, React.ReactNode> = {
  'HK': <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M3 21H21" stroke="currentColor" strokeWidth="2"/><path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2"/></svg>,
  'KN': <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="currentColor" strokeWidth="2"/></svg>,
  'NT': <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M2 20L9 4L14 14L18 8L22 20H2Z" stroke="currentColor" strokeWidth="2"/></svg>,
  'Islands': <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14Z" stroke="currentColor" strokeWidth="2"/><path d="M12 10V3" stroke="currentColor" strokeWidth="2"/></svg>,
  'MO': <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2"/><path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2"/></svg>,
};

interface WizardStepConfigureProps {
  shops: Shop[];
  // Configuration state
  startDate: string;
  setStartDate: (date: string) => void;
  shopsPerDay: number;
  setShopsPerDay: (value: number) => void;
  groupsPerDay: number;
  setGroupsPerDay: (value: number) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[]) => void;
  selectedDistricts: string[];
  setSelectedDistricts: (districts: string[]) => void;
  includeMTR: boolean;
  setIncludeMTR: (include: boolean) => void;
  // Callbacks
  onGenerate: () => void;
  isGenerating: boolean;
  // Computed values
  filteredPoolCount: number;
  regionOptions: string[];
  availableDistricts: string[];
  regionRemainStats: Array<{ key: string; count: number; displayName: string; socialKey: string }>;
  // Date validation
  disabledDate: (current: dayjs.Dayjs) => boolean;
}

export const WizardStepConfigure: React.FC<WizardStepConfigureProps> = ({
  shops,
  startDate,
  setStartDate,
  shopsPerDay,
  setShopsPerDay,
  groupsPerDay,
  setGroupsPerDay,
  selectedRegions,
  setSelectedRegions,
  selectedDistricts,
  setSelectedDistricts,
  includeMTR,
  setIncludeMTR,
  onGenerate,
  isGenerating,
  filteredPoolCount,
  regionOptions,
  availableDistricts,
  regionRemainStats,
  disabledDate,
}) => {
  const handleRegionToggle = (regionKey: string) => {
    if (selectedRegions.includes(regionKey)) {
      setSelectedRegions(selectedRegions.filter(r => r !== regionKey));
    } else {
      setSelectedRegions([...selectedRegions, regionKey]);
    }
  };

  return (
    <div className="wizard-step-configure">
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
              <Text strong className="text-sm text-slate-600 uppercase tracking-wide">
                Unplanned Pool
              </Text>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {regionRemainStats.map(reg => (
                <div
                  key={reg.key}
                  className={`
                    p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer
                    ${selectedRegions.includes(reg.key)
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-transparent bg-slate-50 hover:bg-slate-100'}
                  `}
                  onClick={() => handleRegionToggle(reg.key)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-teal-600">{REGION_ICONS[reg.key]}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase">
                      {reg.displayName}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-slate-800">{reg.count}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">Matched shops</span>
                <span className="text-2xl font-black">{filteredPoolCount}</span>
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
              <Text strong className="text-sm text-slate-600 uppercase tracking-wide">
                Generation Settings
              </Text>
            </div>

            <Row gutter={[16, 20]}>
              <Col span={24}>
                <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <ScheduleOutlined className="text-lg text-slate-400" />
                    <div>
                      <div className="text-sm font-bold text-slate-700">Include MTR Shops</div>
                      <div className="text-xs text-slate-400">Toggle to include/exclude MTR locations</div>
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
                  {availableDistricts.map(d => <Option key={d} value={d}>{d}</Option>)}
                </Select>
              </Col>

              <Col span={12}>
                <Text className="text-slate-400 block mb-2 uppercase text-[10px] font-bold ml-1">
                  Start Date
                </Text>
                <DatePicker
                  value={startDate ? dayjs(startDate) : null}
                  onChange={(date) => setStartDate(date ? date.format('YYYY-MM-DD') : '')}
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
                  onChange={v => setShopsPerDay(v || GENERATOR_DEFAULTS.shopsPerDay)}
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
                  onChange={v => setGroupsPerDay(v || GENERATOR_DEFAULTS.groupsPerDay)}
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
                onClick={onGenerate}
                disabled={filteredPoolCount === 0 || isGenerating}
                loading={isGenerating}
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
  );
};

export default WizardStepConfigure;
