import React, { useState, useMemo } from 'react';
import { Card, Collapse, Row, Col, Space, Button, Typography, Switch, Select, InputNumber, Table, Tag, message, Modal } from 'antd';
import { 
  ControlOutlined, CheckCircleOutlined, SaveOutlined, 
  ShopOutlined, CloseCircleOutlined, HourglassOutlined,
  EnvironmentOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Text, Title } = Typography;
const { confirm } = Modal;

const HK_HOLIDAYS_2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19", 
  "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07",
  "2026-05-01", "2026-05-24", "2026-05-25", "2026-06-19", 
  "2026-07-01", "2026-09-26", "2026-10-01", "2026-10-19", 
  "2026-12-25", "2026-12-26"
];

const REGION_MAP: Record<string, string> = {
  'HK': 'Hong Kong Island', 'KN': 'Kowloon', 'NT': 'New Territories', 'Islands': 'Islands', 'MO': 'Macau'
};

// --- 載入動畫組件：Ghost 追逐 Pac-man ---
const ChaseLoader = ({ text }: { text: string }) => (
  <div className="chase-overlay">
    <div className="chase-track">
      {/* 1 HTML: Ghost (Chaser) */}
      <div className="ghost-chaser ghost-bounce">
        <div style={{ background: '#ef4444', width: '100px', height: '100px', borderRadius: '50px 50px 0 0', position: 'relative' }}>
          <div style={{ display: 'flex', gap: '15px', paddingTop: '30px', justifyContent: 'center' }}>
            <div style={{ width: '20px', height: '25px', background: 'white', borderRadius: '50%' }} />
            <div style={{ width: '20px', height: '25px', background: 'white', borderRadius: '50%' }} />
          </div>
        </div>
      </div>
      {/* 2 HTML: Pac-man (Runner) */}
      <div className="pacman-runner"></div>
      {/* Food Dots */}
      <div className="food-dots">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="food-dot" />)}
      </div>
    </div>
    <Title level={4} style={{ color: 'white', marginTop: '40px' }}>{text}</Title>
  </div>
);

const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="summary-card-item">
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
      </div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

export const Generator: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(20);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(3);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);

  // ✅ 核心修正：定義用於下拉選單的 regionOptions
  const regionOptions = useMemo(() => 
    Array.from(new Set(activePool.map(s => s.region))).filter(Boolean).sort()
  , [activePool]);

  const stats = useMemo(() => ({
    total: activePool.length,
    completed: activePool.filter(s => s.status === 'Done').length,
    closed: activePool.filter(s => s.status === 'Closed').length,
    unplanned: activePool.filter(s => s.status === 'Unplanned').length
  }), [activePool]);

  const regionRemainStats = useMemo(() => {
    const unplannedPool = activePool.filter(s => s.status === 'Unplanned');
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    unplannedPool.forEach(s => { if (counts.hasOwnProperty(s.region)) counts[s.region]++; });
    return Object.keys(counts).map(key => ({ key, fullName: REGION_MAP[key], count: counts[key] }));
  }, [activePool]);

  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? activePool.filter(s => selectedRegions.includes(s.region)) : activePool;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [activePool, selectedRegions]);

  const handleResetAll = () => {
    confirm({
      title: 'Reset All Scheduled Shops?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'This will clear all Planned dates. Ghost will catch Pac-man to finish the job.',
      okText: 'Yes, Reset', okType: 'danger',
      onOk: async () => {
        setLoadingText('Ghost is catching Pac-man... (Resetting)');
        setIsSaving(true);
        const toReset = activePool.filter(s => s.status === 'Planned');
        for (const shop of toReset) {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: "0", [SP_FIELDS.STATUS]: 'Unplanned' })
          });
        }
        setIsSaving(false);
        onRefresh();
        message.success("Schedules reset!");
      }
    });
  };

  const handleGenerate = () => {
    setIsCalculating(true);
    // ... 生成邏輯 ...
    setIsCalculating(false);
  };

  const saveToSharePoint = async () => {
    setLoadingText('Saving to SharePoint...');
    setIsSaving(true);
    // ... 保存邏輯 ...
    setIsSaving(false);
    onRefresh();
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      {/* ✅ 顯示追逐動畫載入畫面 */}
      {isSaving && <ChaseLoader text={loadingText} />}

      <div className="flex justify-between items-start">
        <div><Title level={2} className="m-0">Schedule Generator</Title><Text type="secondary">Algorithm targets Unplanned shops.</Text></div>
        
        {/* Reset 按鈕 */}
        <button className="reset-all-btn" onClick={handleResetAll} disabled={isSaving}>
          <div className="svg-wrapper">
            <svg width="24px" height="24px" viewBox="0 -0.5 21 21"><path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M134.55,216 L136.65,216 L136.65,208 L134.55,208 L134.55,216 Z M128.25,218 L138.75,218 L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z M138.75,204 L138.75,200 L128.25,200 L128.25,204 L123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" transform="translate(-123.000000, -200.000000)" fill="currentColor"></path></svg>
          </div>
          <span>Reset All Schedule</span>
        </button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={stats.total} subtext="Excl. Master Closed" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} subtext="Status: Done" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed Shop" value={stats.closed} subtext="Status: Closed" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Non Schedule" value={stats.unplanned} subtext="Status: Unplanned" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      {/* 下方的區域統計與設定面板... */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mt-4">
        <Collapse ghost defaultActiveKey={['1', '2']} expandIconPosition="end">
          <Collapse.Panel key="2" header={<span className="font-bold">Location Filters</span>}>
             <Row gutter={24}>
               <Col span={12}>
                 <Select mode="multiple" className="w-full" placeholder="Select Region" value={selectedRegions} onChange={setSelectedRegions}>
                   {regionOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
                 </Select>
               </Col>
             </Row>
          </Collapse.Panel>
        </Collapse>
      </div>
    </div>
  );
};
