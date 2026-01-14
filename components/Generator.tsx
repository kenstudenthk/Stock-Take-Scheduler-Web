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

// --- 1. REGION 顯示配置：對應正式名稱、專屬顏色代碼與向量圖標 ---
const REGION_DISPLAY_CONFIG: Record<string, { label: string, social: string, svg: React.ReactNode }> = {
  'HK': { 
    label: 'Hong Kong Island', 
    social: 'hk',
    svg: (
      <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 21H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M14 21V11L19 15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M7 7H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 11H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M7 15H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  'KN': { 
    label: 'Kowloon', 
    social: 'kn',
    svg: (
      <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
      </svg>
    )
  },
  'NT': { 
    label: 'New Territories', 
    social: 'nt',
    svg: (
      <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 20L9 4L14 14L18 8L22 20H2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  },
  'Islands': { 
    label: 'Lantau Island', 
    social: 'islands',
    svg: (
      <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14C7 11 10.5 10 12 10Z" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 10V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M12 3L16 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M2 20C4 18 6 18 8 20C10 22 12 22 14 20C16 18 18 18 20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  },
  'MO': { 
    label: 'Macau', 
    social: 'mo',
    svg: (
      <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    )
  }
};

// --- 加載動畫組件 ---
const ResetChaseLoader = () => (
  <div className="chase-overlay">
    <div className="chase-scene">
      <div className="ghost-chaser"><div style={{ background: '#ef4444', width: '140px', height: '140px', borderRadius: '70px 70px 0 0', position: 'relative' }}><div style={{ display: 'flex', gap: '20px', paddingTop: '40px', justifyContent: 'center' }}><div style={{ width: '30px', height: '35px', background: 'white', borderRadius: '50%' }} /><div style={{ width: '30px', height: '35px', background: 'white', borderRadius: '50%' }} /></div></div></div>
      <div className="pacman-runner"></div>
      <div className="dots-trail">{[1, 2, 3, 4].map(i => <div key={i} className="dot-node" />)}</div>
    </div>
    <Title level={4} style={{ color: 'white', marginTop: '40px' }}>Resetting All Schedules...</Title>
  </div>
);

const SyncGeometricLoader = () => (
  <div className="sync-overlay">
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <div className="loader"><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40"></circle></svg></div>
      <div className="loader triangle"><svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72"></polygon></svg></div>
      <div className="loader"><svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8"></rect></svg></div>
    </div>
    <Title level={4} style={{ color: '#0d9488' }}>Syncing to SharePoint...</Title>
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
  const [loadingType, setLoadingType] = useState<'reset' | 'sync'>('sync');

  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);
  const regionOptions = useMemo(() => Array.from(new Set(activePool.map(s => s.region))).filter(Boolean).sort(), [activePool]);

  const stats = useMemo(() => ({
    total: activePool.length, completed: activePool.filter(s => s.status === 'Done').length,
    closed: activePool.filter(s => s.status === 'Closed').length, unplanned: activePool.filter(s => s.status === 'Unplanned').length
  }), [activePool]);

  // --- 地區數據邏輯：將代碼轉換為正式名稱與圖標物件 ---
  const regionRemainStats = useMemo(() => {
    const unplannedPool = activePool.filter(s => s.status === 'Unplanned');
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    unplannedPool.forEach(s => { if (counts.hasOwnProperty(s.region)) counts[s.region]++; });
    return Object.keys(counts).map(key => {
      const config = REGION_DISPLAY_CONFIG[key] || { label: key, social: key.toLowerCase(), svg: null };
      return { key, count: counts[key], displayName: config.label, socialKey: config.social, icon: config.svg };
    });
  }, [activePool]);

  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? activePool.filter(s => selectedRegions.includes(s.region)) : activePool;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [activePool, selectedRegions]);

  const handleResetAll = () => {
    confirm({
      title: 'Reset All Scheduled Shops?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'Confirm resetting all Planned schedules?',
      okText: 'Yes, Reset', okType: 'danger',
      onOk: async () => {
        setLoadingType('reset'); setIsSaving(true);
        const toReset = activePool.filter(s => s.status === 'Planned');
        for (const shop of toReset) {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: "0", [SP_FIELDS.STATUS]: 'Unplanned' })
          });
        }
        setIsSaving(false); onRefresh(); message.success("Reset Complete!");
      }
    });
  };

  const handleGenerate = () => {
    setIsCalculating(true);
    let pool = activePool.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return s.status === 'Unplanned' && matchRegion && matchDistrict && matchMTR;
    });
    if (pool.length === 0) { message.warning("No unplanned shops match filters."); setIsCalculating(false); return; }
    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    const results: any[] = [];
    let currentDay = dayjs(startDate);
    pool.forEach((shop, index) => {
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      results.push({ ...shop, scheduledDate: currentDay.format('YYYY-MM-DD'), groupId: groupInDay });
      if ((index + 1) % shopsPerDay === 0) currentDay = currentDay.add(1, 'day');
    });
    results.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate) || a.groupId - b.groupId);
    setGeneratedResult(results);
    setIsCalculating(false);
  };

  const saveToSharePoint = async () => {
    setLoadingType('sync'); setIsSaving(true);
    for (const shop of generatedResult) {
      await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate, [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(), [SP_FIELDS.STATUS]: 'Planned' })
      });
    }
    setIsSaving(false); onRefresh(); message.success("Sync Complete!");
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {isSaving && (loadingType === 'reset' ? <ResetChaseLoader /> : <SyncGeometricLoader />)}

      <div className="flex justify-between items-start">
        <div><Title level={2} className="m-0 text-slate-800">Schedule Generator</Title><Text type="secondary">Algorithm targets Unplanned shops.</Text></div>
        <button className="reset-all-btn" onClick={handleResetAll} disabled={isSaving}>
          <div className="svg-wrapper"><svg width="24px" height="24px" viewBox="0 -0.5 21 21" fill="currentColor"><path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M134.55,216 L136.65,216 L136.65,208 L134.55,208 L134.55,216 Z M128.25,218 L138.75,218 L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z M138.75,204 L138.75,200 L128.25,200 L128.25,204 L123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" transform="translate(-123.000000, -200.000000)"></path></svg></div>
          <span>Reset All Schedule</span>
        </button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={stats.total} subtext="Excl. Master Closed" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} subtext="Status: Done" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed Shop" value={stats.closed} subtext="Status: Closed" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Non Schedule" value={stats.unplanned} subtext="Status: Unplanned" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      {/* ✅ 核心修正：五列平分佈局 (Full Width / 5) */}
      <div className="mt-4 mb-10 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <Text strong className="text-[16px] text-slate-400 uppercase tracking-widest block mb-10">Unplanned Shops by Region</Text>
        
        {/* 重要：強制設定為 display: grid 並設定 5 列，移除 CSS 預設的 gap */}
        <ul className="example-2 grid grid-cols-5 w-full gap-0 list-none p-0 m-0" style={{ display: 'grid' }}>
          {regionRemainStats.map(reg => (
            <li key={reg.key} className="icon-content flex justify-center w-full">
              <a
                href="#"
                aria-label={reg.displayName}
                data-social={reg.socialKey}
                onClick={(e) => e.preventDefault()}
                style={{ 
                  width: '94%',               /* 佔據 1/5 欄位的 94% 寬度，自動產生微小間距 */
                  height: '110px',            /* 容納圖標與兩行名稱的高度 */
                  borderRadius: '24px', 
                  flexDirection: 'column', 
                  gap: '8px',
                  margin: '0 auto'            /* 置中 */
                }}
              >
                <div className="filled"></div>
                
                {/* 內容層級確保 */}
                <div style={{ position: 'relative', zIndex: 10 }}>{reg.icon}</div>
                
                <span style={{ 
                  position: 'relative', 
                  zIndex: 10, 
                  fontSize: '11px', 
                  fontWeight: 900, 
                  textAlign: 'center', 
                  textTransform: 'uppercase',
                  lineHeight: '1.2',
                  padding: '0 8px',
                  display: 'block'
                }}>
                  {reg.displayName}
                </span>
              </a>
              
              {/* Tooltip 數字顯示 */}
              <div className="tooltip font-bold">{reg.count}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mt-4">
        <Space className="mb-10 text-[18px] font-bold uppercase tracking-widest text-slate-800">
          <ControlOutlined className="text-teal-600" /> Algorithm Configuration
        </Space>
        
        <Collapse ghost defaultActiveKey={['1', '2']} expandIconPosition="end">
          <Collapse.Panel key="1" header={<span className="font-bold">1. Core Parameters</span>}>
            <Row gutter={24} className="py-2">
              <Col span={8}><Text strong className="text-[14px] text-slate-400 uppercase block mb-2">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
              <Col span={8}><Text strong className="text-[14px] text-slate-400 uppercase block mb-2">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 9)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
              <Col span={8}><Text strong className="text-[14px] text-slate-400 uppercase block mb-2">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
            </Row>
          </Collapse.Panel>

          <Collapse.Panel key="2" header={<span className="font-bold">2. Location Filters</span>}>
            <Row gutter={24} className="py-2">
              <Col span={10}>
                <Text strong className="text-[14px] text-slate-400 uppercase block mb-2">Regions</Text>
                <Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions}>
                  {regionOptions.map(r => <Select.Option key={r} value={r}>{REGION_DISPLAY_CONFIG[r]?.label || r}</Select.Option>)}
                </Select>
              </Col>
              <Col span={10}>
                <Text strong className="text-[14px] text-slate-400 uppercase block mb-2">Districts</Text>
                <Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts}>
                  {availableDistricts.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong className="text-[14px] text-slate-400 uppercase block mb-2">MTR Incl.</Text>
                <div className="h-12 flex items-center gap-2"><Switch checked={includeMTR} onChange={setIncludeMTR} /><span className="text-xs font-bold text-slate-600">{includeMTR ? 'Yes' : 'No'}</span></div>
              </Col>
            </Row>
          </Collapse.Panel>
        </Collapse>

        <div className="flex justify-end mt-12">
          <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}>
            <div className="dots_border"></div>
            <Space className="text_button"><ControlOutlined /><span>{isCalculating ? 'GENERATING...' : 'GENERATE SCHEDULE'}</span></Space>
          </button>
        </div>
      </div>

      {generatedResult.length > 0 && (
        <Card title="Preview" className="rounded-3xl border-none shadow-sm overflow-hidden mt-8">
          <Table dataSource={generatedResult} pagination={{ pageSize: 20 }} columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: (d) => <b>{d}</b> },
            { title: 'Group', dataIndex: 'groupId', key: 'group', render: (g) => <Tag color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'} className="font-bold px-3">{`Group ${String.fromCharCode(64 + g)}`}</Tag> },
            { title: 'Shop Name', dataIndex: 'name', key: 'name' },
            { title: 'District', dataIndex: 'district', key: 'district' },
          ]} />
          <div className="flex justify-end mt-4 p-4 border-t"><Button type="primary" icon={<SaveOutlined />} onClick={saveToSharePoint} className="bg-emerald-600 h-12 rounded-xl px-8 font-bold">Sync to SharePoint</Button></div>
        </Card>
      )}
    </div>
  );
};
