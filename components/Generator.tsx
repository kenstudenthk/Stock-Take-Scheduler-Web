import React, { useState, useMemo } from 'react';
import { Card, Collapse, Row, Col, Space, Button, Typography, Switch, Select, InputNumber, Table, Tag, message, Modal, Progress } from 'antd';
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
    <div className="chase-scene">
      {/* 1 HTML: Ghost (Chaser) */}
      <div className="ghost-chaser">
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
      <div className="dots-trail">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="dot-node" />)}
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

const isWorkDay = (date: dayjs.Dayjs) => {
  const dateStr = date.format('YYYY-MM-DD');
  const dayOfWeek = date.day(); 
  return dayOfWeek !== 0 && dayOfWeek !== 6 && !HK_HOLIDAYS_2026.includes(dateStr);
};

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

  // ✅ 核心修正：排除去年已關閉門市 (masterStatus)
  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);

  // ✅ 核心修正：定義用於下拉選單的 regionOptions
  const regionOptions = useMemo(() => 
    Array.from(new Set(activePool.map(s => s.region))).filter(Boolean).sort()
  , [activePool]);

  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? activePool.filter(s => selectedRegions.includes(s.region)) : activePool;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [activePool, selectedRegions]);

  // ✅ 統計卡片邏輯 (基於 status 欄位)
  const stats = useMemo(() => ({
    total: activePool.length,
    completed: activePool.filter(s => s.status === 'Done').length,
    closed: activePool.filter(s => s.status === 'Closed').length,
    unplanned: activePool.filter(s => s.status === 'Unplanned').length
  }), [activePool]);

  // ✅ 區域統計邏輯：僅統計 Unplanned
  const regionRemainStats = useMemo(() => {
    const unplannedPool = activePool.filter(s => s.status === 'Unplanned');
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    unplannedPool.forEach(s => { if (counts.hasOwnProperty(s.region)) counts[s.region]++; });
    return Object.keys(counts).map(key => ({ key, fullName: REGION_MAP[key], count: counts[key] }));
  }, [activePool]);

  // --- Handlers ---

  const handleResetAll = () => {
    confirm({
      title: 'Reset All Scheduled Shops?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'All "Planned" shops will be reset to "Unplanned". Proceed?',
      okText: 'Yes, Reset', okType: 'danger',
      onOk: async () => {
        setLoadingText('Resetting Schedules...');
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
        message.success("Schedules reset successfully.");
      }
    });
  };

  const handleGenerate = () => {
    setIsCalculating(true);
    // ✅ 僅針對 Unplanned 門市進行排程
    let pool = activePool.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return s.status === 'Unplanned' && matchRegion && matchDistrict && matchMTR;
    });

    if (pool.length === 0) {
      message.warning("No unplanned shops match your filters.");
      setIsCalculating(false);
      return;
    }

    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    const results: any[] = [];
    let currentDay = dayjs(startDate);

    pool.forEach((shop, index) => {
      while (!isWorkDay(currentDay)) { currentDay = currentDay.add(1, 'day'); }
      if (index > 0 && index % shopsPerDay === 0) {
        currentDay = currentDay.add(1, 'day');
        while (!isWorkDay(currentDay)) { currentDay = currentDay.add(1, 'day'); }
      }
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      results.push({ ...shop, scheduledDate: currentDay.format('YYYY-MM-DD'), groupId: groupInDay, dayOfWeek: currentDay.format('ddd') });
    });

    setGeneratedResult(results);
    setIsCalculating(false);
    message.success(`Generated schedule for ${results.length} shops.`);
  };

  const saveToSharePoint = async () => {
    setLoadingText('Saving to SharePoint...');
    setIsSaving(true);
    for (let i = 0; i < generatedResult.length; i++) {
      const shop = generatedResult[i];
      await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate, [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(), [SP_FIELDS.STATUS]: 'Planned' })
      });
    }
    setIsSaving(false);
    onRefresh();
    message.success("Sync complete!");
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      {/* ✅ 點擊 Reset 或 Sync 時顯示的追逐動畫 */}
      {isSaving && <ChaseLoader text={loadingText} />}

      <div className="flex justify-between items-start">
        <div><Title level={2} className="m-0">Schedule Generator</Title><Text type="secondary">Algorithm targets Unplanned shops only.</Text></div>
        
        {/* Reset 按鈕 */}
        <button className="reset-all-btn" onClick={handleResetAll} disabled={isSaving}>
          <div className="svg-wrapper">
            <svg width="24px" height="24px" viewBox="0 -0.5 21 21" fill="currentColor">
              <path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M134.55,216 L136.65,216 L136.65,208 L134.55,208 L134.55,216 Z M128.25,218 L138.75,218 L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z M138.75,204 L138.75,200 L128.25,200 L128.25,204 L123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" transform="translate(-123.000000, -200.000000)"></path>
            </svg>
          </div>
          <span>Reset All Schedule</span>
        </button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={stats.total} subtext="Excl. Last Year Closed" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} subtext="Status: Done" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed Shop" value={stats.closed} subtext="Status: Closed" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Non Schedule" value={stats.unplanned} subtext="Status: Unplanned" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      <div className="mt-2">
        <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-4">Non Schedule Shops by Region</Text>
        <Row gutter={[16, 16]}>
          {regionRemainStats.map(reg => (
            <Col key={reg.key} style={{ width: '20%' }}>
              <Card size="small" className="rounded-2xl border-none shadow-sm bg-indigo-50/50 text-center">
                <Text strong className="text-indigo-600 text-[10px] truncate w-full uppercase"><EnvironmentOutlined /> {reg.fullName}</Text>
                <Title level={4} className="m-0 text-indigo-900 mt-1">{reg.count}</Title>
                <Text className="text-[9px] text-indigo-400 uppercase font-bold">Unplanned</Text>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mt-4">
        <Space className="mb-10 text-[11px] font-bold uppercase tracking-widest text-slate-800"><ControlOutlined className="text-teal-600" /> Algorithm Configuration</Space>
        <Collapse ghost defaultActiveKey={['1', '2']} expandIconPosition="end">
          <Collapse.Panel key="1" header={<span className="font-bold">1. Core Parameters</span>}>
            <Row gutter={24} className="py-2">
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 20)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
            </Row>
          </Collapse.Panel>
          <Collapse.Panel key="2" header={<span className="font-bold">2. Location Filters</span>}>
            <Row gutter={24} className="py-2">
              <Col span={10}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Regions</Text><Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions}>{regionOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}</Select></Col>
              <Col span={10}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Districts</Text><Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts}>{availableDistricts.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}</Select></Col>
              <Col span={4}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">MTR Incl.</Text><div className="h-12 flex items-center gap-2"><Switch checked={includeMTR} onChange={setIncludeMTR} /><span className="text-xs font-bold text-slate-600">{includeMTR ? 'Yes' : 'No'}</span></div></Col>
            </Row>
          </Collapse.Panel>
        </Collapse>
        <div className="flex justify-end mt-12">
          <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}><div className="dots_border"></div><span className="text_button">{isCalculating ? 'Generating...' : 'Generate Schedule'}</span></button>
        </div>
      </div>

      {generatedResult.length > 0 && (
        <Card title="Preview" className="rounded-3xl border-none shadow-sm overflow-hidden mt-8">
          <Table dataSource={generatedResult} size="small" pagination={{ pageSize: 10 }} columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: (d, r) => <b>{d} ({r.dayOfWeek})</b> },
            { title: 'Team', dataIndex: 'groupId', key: 'group', render: (g) => <Tag color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'}>Team {String.fromCharCode(64 + g)}</Tag> },
            { title: 'Shop Name', dataIndex: 'name' },
            { title: 'District', dataIndex: 'district' },
          ]} />
          <div className="flex justify-end mt-4 p-4 border-t"><Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={saveToSharePoint} className="bg-emerald-600 border-none h-12 px-8 rounded-xl font-bold">Sync to SharePoint</Button></div>
        </Card>
      )}
    </div>
  );
};
