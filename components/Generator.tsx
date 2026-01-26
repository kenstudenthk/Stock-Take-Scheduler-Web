import React, { useState, useMemo } from 'react';
import { 
  Card, Collapse, Row, Col, Space, Button, Typography, Switch, Select, 
  InputNumber, Table, Tag, message, Modal, DatePicker, Divider 
} from 'antd';
import { 
  ControlOutlined, CheckCircleOutlined, SaveOutlined, 
  ShopOutlined, CloseCircleOutlined, HourglassOutlined,
  EnvironmentOutlined, ExclamationCircleOutlined, DeleteOutlined,
  CalendarOutlined, SyncOutlined, HistoryOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;
const { Option } = Select;
// 在 Generator 組件外部或頂部定義 (建議 2025/2026 清單)
const HK_HOLIDAYS = [
  '2025-01-01', '2025-01-29', '2025-01-30', '2025-01-31', // 元旦、年初一至三
  '2025-04-04', '2025-04-18', '2025-04-19', '2025-04-21', // 清明、耶穌受難、復活節
  '2025-05-01', '2025-05-05', // 勞動節、佛誕
  '2025-05-31', '2025-07-01', // 端午節、特區紀念日
  '2025-10-01', '2025-10-07', '2025-10-29', // 國慶、中秋後、重陽
  '2025-12-25', '2025-12-26', // 聖誕節
  // 您可以繼續添加 2026 年的日期...
];

// --- ✅ 1. Pac-man 重置動畫組件 ---
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

// --- ✅ 2. 幾何同步動畫組件 ---
const SyncGeometricLoader = ({ text = "Syncing to SharePoint..." }) => (
  <div className="sync-overlay">
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      <div className="loader"><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40"></circle></svg></div>
      <div className="loader triangle"><svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72"></polygon></svg></div>
      <div className="loader"><svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8"></rect></svg></div>
    </div>
    <Title level={4} style={{ color: '#0d9488', marginTop: '20px' }}>{text}</Title>
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
  'HK': { label: 'Hong Kong Island', social: 'hk', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M3 21H21" stroke="currentColor" strokeWidth="2"/><path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2"/></svg> },
  'KN': { label: 'Kowloon', social: 'kn', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/><path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="currentColor" strokeWidth="2"/></svg> },
  'NT': { label: 'New Territories', social: 'nt', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M2 20L9 4L14 14L18 8L22 20H2Z" stroke="currentColor" strokeWidth="2"/></svg> },
  'Islands': { label: 'Lantau Island', social: 'islands', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14Z" stroke="currentColor" strokeWidth="2"/><path d="M12 10V3" stroke="currentColor" strokeWidth="2"/></svg> },
  'MO': { label: 'Macau', social: 'mo', svg: <svg width="24px" height="24px" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2"/><path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2"/></svg> }
};

export const Generator: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(9);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(3);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingType, setLoadingType] = useState<'reset' | 'sync'>('sync');
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetRange, setResetRange] = useState<any>(null);

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

  const handleResetByPeriod = async () => {
    if (!resetRange) { message.error("Please select a date range!"); return; }
    const [start, end] = resetRange;
    const targets = shops.filter(s => s.scheduledDate && dayjs(s.scheduledDate).isBetween(start, end, 'day', '[]'));
    if (targets.length === 0) { message.warning("No schedules found."); return; }
    confirm({
      title: 'Reset Period?',
      onOk: async () => {
        setLoadingType('reset'); setIsSaving(true);
        try {
          for (const shop of targets) {
            await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: "0", [SP_FIELDS.STATUS]: 'Unplanned' })
            });
          }
          setResetModalVisible(false); setResetRange(null); onRefresh(); message.success("Period Reset Complete!");
        } finally { setIsSaving(false); }
      }
    });
  };

  const handleResetAll = () => {
    const plannedShops = shops.filter(s => s.status === 'Planned');
    if (plannedShops.length === 0) return message.info("No planned schedules.");
    confirm({
      title: 'RESET ALL?',
      onOk: async () => {
        setLoadingType('reset'); setIsSaving(true);
        try {
          for (const shop of plannedShops) {
            await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: "0", [SP_FIELDS.STATUS]: 'Unplanned' })
            });
          }
          onRefresh(); message.success("All Schedules Reset!");
        } finally { setIsSaving(false); }
      }
    });
  };

const handleGenerate = () => {
    setIsCalculating(true);

    // --- ✅ 助手函數：判斷是否為工作日 (跳過週末與假期) ---
    const isWorkingDay = (date: dayjs.Dayjs) => {
      const day = date.day();
      const isWeekend = (day === 0 || day === 6); // 0 是週日, 6 是週六
      const isHoliday = HK_HOLIDAYS.includes(date.format('YYYY-MM-DD'));
      return !isWeekend && !isHoliday;
    };

    // --- ✅ 助手函數：尋找下一個有效工作日 ---
    const getNextWorkingDay = (date: dayjs.Dayjs) => {
      let next = date;
      while (!isWorkingDay(next)) {
        next = next.add(1, 'day');
      }
      return next;
    };

    let pool = activePool.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return s.status === 'Unplanned' && matchRegion && matchDistrict && matchMTR;
    });
    
    if (pool.length === 0) { 
      message.warning("No unplanned shops match filters."); 
      setIsCalculating(false); 
      return; 
    }
    
    // 地理排序保持不變
    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    
    const results: any[] = [];
    
    // ✅ 初始日期也必須檢查是否為工作日
    let currentDay = getNextWorkingDay(dayjs(startDate));

    pool.forEach((shop, index) => {
      // 計算組別
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      
      results.push({ 
        ...shop, 
        scheduledDate: currentDay.format('YYYY-MM-DD'), 
        groupId: groupInDay 
      });

      // ✅ 當這一天的名額滿了，跳到下一個「工作日」
      if ((index + 1) % shopsPerDay === 0) {
        currentDay = getNextWorkingDay(currentDay.add(1, 'day'));
      }
    });

    // 排序邏輯保持不變
    const sortedResults = results.sort((a, b) => {
      if (a.scheduledDate !== b.scheduledDate) return dayjs(a.scheduledDate).unix() - dayjs(b.scheduledDate).unix();
      return a.groupId - b.groupId;
    });

    setGeneratedResult(sortedResults);
    setIsCalculating(false);
  };

  const saveToSharePoint = async () => {
    setLoadingType('sync'); setIsSaving(true);
    try {
      for (const shop of generatedResult) {
        await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate, [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(), [SP_FIELDS.STATUS]: 'Planned' })
        });
      }
      onRefresh(); setGeneratedResult([]); message.success("Sync Complete!");
    } finally { setIsSaving(false); }
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {isSaving && (loadingType === 'reset' ? <ResetChaseLoader /> : <SyncGeometricLoader />)}

      <div className="flex justify-between items-center">
        <Title level={2} className="m-0 text-slate-800">Schedule Generator</Title>
        <Space>
          <Button icon={<HistoryOutlined />} onClick={() => setResetModalVisible(true)} className="rounded-lg border-red-200 text-red-500 font-bold hover:bg-red-50">Reset by Period</Button>
          <Button danger type="primary" icon={<DeleteOutlined />} onClick={handleResetAll} className="rounded-lg font-bold">Reset All</Button>
        </Space>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={8}><SummaryCard label="Active Shops" value={stats.total} subtext="Operational units" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Completed" value={stats.completed} subtext="Done this year" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Remaining" value={stats.unplanned} subtext="Pending schedule" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      <div className="mt-4 bg-white p-10 rounded-[40px] shadow-sm border border-slate-100">
        <Text strong className="text-[16px] text-slate-400 uppercase tracking-widest block mb-10">Active Unplanned Shops by Region</Text>
        <ul className="example-2 grid grid-cols-5 w-full gap-0 list-none p-0 m-0" style={{ display: 'grid' }}>
          {regionRemainStats.map(reg => (
            <li key={reg.key} className="icon-content flex justify-center w-full">
              <a href="#" data-social={reg.socialKey} style={{ width: '94%', height: '110px', borderRadius: '24px', flexDirection: 'column', gap: '8px', margin: '0 auto' }}>
                <div className="filled"></div><div style={{ position: 'relative', zIndex: 10 }}>{reg.icon}</div>
                <span style={{ position: 'relative', zIndex: 10, fontSize: '11px', fontWeight: 900, textAlign: 'center', textTransform: 'uppercase' }}>{reg.displayName}</span>
              </a>
              <div className="tooltip font-bold">{reg.count}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <Space className="mb-10 text-[18px] font-bold uppercase text-slate-800"><ControlOutlined className="text-teal-600" /> Generation Settings</Space>
        
        <Row gutter={[24, 24]} className="mb-8 p-6 bg-slate-50 rounded-2xl border border-slate-100">
           <Col span={8}>
              <Text strong className="text-slate-400 block mb-2 uppercase text-xs">Regions</Text>
              <Select mode="multiple" className="w-full h-11" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions} allowClear maxTagCount="responsive">
                {regionOptions.map(r => <Option key={r} value={r}>{r}</Option>)}
              </Select>
           </Col>
           <Col span={8}>
              <Text strong className="text-slate-400 block mb-2 uppercase text-xs">Districts</Text>
              <Select mode="multiple" className="w-full h-11" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts} allowClear maxTagCount="responsive">
                {availableDistricts.map(d => <Option key={d} value={d}>{d}</Option>)}
              </Select>
           </Col>
           <Col span={8}>
              <Text strong className="text-slate-400 block mb-2 uppercase text-xs">MTR Shops</Text>
              <div className="flex items-center gap-3 mt-2 h-11 px-4 bg-white rounded-lg border border-slate-200">
                 <Switch checked={includeMTR} onChange={setIncludeMTR} size="small" />
                 <Text className="text-xs font-bold text-slate-600">Include MTR Locations</Text>
              </div>
           </Col>
        </Row>

        <Row gutter={24}>
          <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
          <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 9)} className="w-full h-12 bg-slate-50 border-none rounded-xl" /></Col>
          <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 bg-slate-50 border-none rounded-xl" /></Col>
        </Row>
        
        <div className="flex justify-end mt-12">
          <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}>
            <div className="dots_border"></div>
            <Space className="text_button"><ControlOutlined /><span>GENERATE SCHEDULE</span></Space>
          </button>
        </div>
      </div>

      {generatedResult.length > 0 && (
        <Card title={<Space><SyncOutlined spin /> Preview (Sorted by Date & Group)</Space>} className="rounded-3xl border-none shadow-sm overflow-hidden">
          <Table dataSource={generatedResult} pagination={{ pageSize: 15 }} rowKey="id" columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: d => <b>{d}</b> },
            { title: 'Group', dataIndex: 'groupId', key: 'group', render: g => <Tag color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'}>{`Group ${String.fromCharCode(64 + g)}`}</Tag> },
            { title: 'Shop', dataIndex: 'name', key: 'name' },
          ]} />
          <div className="flex justify-end p-6 border-t bg-slate-50">
             <Button type="primary" icon={<SaveOutlined />} onClick={saveToSharePoint} className="bg-emerald-600 h-12 rounded-xl px-12 font-bold shadow-lg">Confirm & Sync</Button>
          </div>
        </Card>
      )}

      <Modal title={<Space><CalendarOutlined /> Reset Range</Space>} open={resetModalVisible} onCancel={() => setResetModalVisible(false)} onOk={handleResetByPeriod} okText="Confirm Reset" okButtonProps={{ danger: true }} centered>
        <div className="py-6 text-center">
          <Text className="block mb-6 text-slate-500">Reset schedules within this period to 'Unplanned'.</Text>
          <RangePicker className="w-full h-12 rounded-xl" onChange={(dates) => setResetRange(dates)} />
        </div>
      </Modal>
    </div>
  );
};
