import React, { useState, useMemo } from 'react';
import { Card, Collapse, Row, Col, Space, Button, Typography, Switch, Select, InputNumber, Table, Tag, Progress, message } from 'antd';
import { 
  ControlOutlined, CheckCircleOutlined, SaveOutlined, 
  ShopOutlined, CloseCircleOutlined, HourglassOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Text, Title } = Typography;

// ✅ 2026 香港公眾假期
const HK_HOLIDAYS_2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19", 
  "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07",
  "2026-05-01", "2026-05-24", "2026-05-25", "2026-06-19", 
  "2026-07-01", "2026-09-26", "2026-10-01", "2026-10-19", 
  "2026-12-25", "2026-12-26"
];

const REGION_MAP: Record<string, string> = {
  'HK': 'Hong Kong Island',
  'KN': 'Kowloon',
  'NT': 'New Territories',
  'Islands': 'Islands',
  'MO': 'Macau'
};

// 輔助函數：判斷是否為工作日
const isWorkDay = (date: dayjs.Dayjs) => {
  const dateStr = date.format('YYYY-MM-DD');
  const dayOfWeek = date.day(); 
  return dayOfWeek !== 0 && dayOfWeek !== 6 && !HK_HOLIDAYS_2026.includes(dateStr);
};

// 復刻 Dashboard 統計組件
const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="card-item">
    <div className="img-section" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="card-desc">
      <div className="card-header">
        <div className="card-title">{label}</div>
        <div className="card-menu"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
      </div>
      <div className="card-time">{value}</div>
      <p className="recent-text">{subtext}</p>
    </div>
  </div>
);

export const Generator: React.FC<{ shops: Shop[], graphToken: string }> = ({ shops, graphToken }) => {
  // --- 狀態 ---
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(20);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(3);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ✅ 核心篩選：只看 Master Status 為開門的店
  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);

  // --- 統計邏輯 ---
  const globalStats = useMemo(() => {
    const total = activePool.length;
    const closedThisYear = activePool.filter(s => s.status === 'Closed').length;
    const completed = activePool.filter(s => s.status === 'Done' || s.status === 'Re-Open').length;
    const remain = total - completed - closedThisYear;
    return { total, completed, closed: closedThisYear, remain };
  }, [activePool]);

  const regionRemainStats = useMemo(() => {
    const pendingShops = activePool.filter(s => !['Planned', 'Done', 'Closed', 'In-Progress'].includes(s.status));
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    pendingShops.forEach(s => { if (counts.hasOwnProperty(s.region)) counts[s.region]++; });
    return Object.keys(counts).map(key => ({ key, fullName: REGION_MAP[key], count: counts[key] }));
  }, [activePool]);

  // --- 生成排程邏輯 ---
  const handleGenerate = () => {
    setIsCalculating(true);
    let pool = activePool.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : !s.is_mtr;
      return matchRegion && matchDistrict && matchMTR && !['Done', 'Closed', 'Planned', 'In-Progress'].includes(s.status);
    });

    if (pool.length === 0) {
      message.warning("No shops to assign.");
      setIsCalculating(false);
      return;
    }

    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    const results: any[] = [];
    let currentDay = dayjs(startDate);

    pool.forEach((shop, index) => {
      // 確保起始或跨日後的日期是工作日
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
    setIsSaving(true);
    for (let i = 0; i < generatedResult.length; i++) {
      const shop = generatedResult[i];
      await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate, [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(), [SP_FIELDS.STATUS]: 'Planned' })
      });
      setUploadProgress(Math.round(((i + 1) / generatedResult.length) * 100));
    }
    setIsSaving(false);
    message.success("Synced successfully!");
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      <style>{`.card-item { --primary-clr: #1C204B; --dot-clr: #BBC0FF; width: 100%; height: 160px; border-radius: 15px; color: #fff; display: grid; grid-template-rows: 40px 1fr; overflow: hidden; } .img-section { border-top-left-radius: 15px; border-top-right-radius: 15px; display: flex; justify-content: flex-end; padding-right: 20px; } .card-desc { border-radius: 15px; padding: 15px 20px; position: relative; top: -10px; background: var(--primary-clr); z-index: 2; } .card-time { font-size: 2em; font-weight: 700; } .card-title { flex: 1; font-size: 0.85em; font-weight: 500; color: var(--dot-clr); text-transform: uppercase; } .card-header { display: flex; align-items: center; width: 100%; } .card-menu { display: flex; gap: 3px; } .card-menu .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--dot-clr); }`}</style>
      
      <div><Title level={2}>Schedule Generator</Title><Text type="secondary">Excluding Master-Closed shops. Automatic Holiday Skipping Enabled.</Text></div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={globalStats.total} subtext="Active Master List" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 10}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={globalStats.completed} subtext="Done this year" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 10}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={globalStats.closed} subtext="Closed this year" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 10}} />} /></Col>
        <Col span={6}><SummaryCard label="Remain" value={globalStats.remain} subtext="Pending Work" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 10}} />} /></Col>
      </Row>

      <div className="mt-2">
        <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-4">Remain Shops by Region (Active Only)</Text>
        <Row gutter={[16, 16]}>
          {regionRemainStats.map(reg => (
            <Col key={reg.key} style={{ width: '20%' }}>
              <Card size="small" className="rounded-2xl border-none shadow-sm bg-indigo-50/50">
                <div className="flex flex-col items-center py-2 text-center">
                  <Text strong className="text-indigo-600 text-[10px] truncate w-full"><EnvironmentOutlined /> {reg.fullName}</Text>
                  <Title level={4} className="m-0 text-indigo-900 mt-1">{reg.count}</Title>
                  <Text className="text-[9px] text-indigo-400 uppercase font-bold">Pending</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mt-4">
        <Space className="mb-6 font-bold uppercase tracking-widest text-slate-800"><ControlOutlined className="text-teal-600" /> Settings</Space>
        <Row gutter={24}>
           <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
           <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 20)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
           <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
        </Row>
        <div className="flex justify-end mt-8"><Button className="sparkle-button h-12 px-10 rounded-xl" onClick={handleGenerate} loading={isCalculating}>Generate Schedule</Button></div>
      </div>

      {generatedResult.length > 0 && (
        <Card title="Preview" className="rounded-3xl border-none shadow-sm overflow-hidden">
          <Table dataSource={generatedResult} size="small" pagination={{ pageSize: 10 }} columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: (d, r) => <b>{d} ({r.dayOfWeek})</b> },
            { title: 'Team', dataIndex: 'groupId', key: 'group', render: (g) => <Tag color="blue">Team {String.fromCharCode(64 + g)}</Tag> },
            { title: 'Shop Name', dataIndex: 'name' },
            { title: 'District', dataIndex: 'district' },
          ]} />
          <div className="flex justify-end mt-4"><Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={saveToSharePoint} className="bg-emerald-600 border-none h-12 px-8 rounded-xl font-bold">Sync to SharePoint</Button></div>
        </Card>
      )}
    </div>
  );
};
