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

const HK_HOLIDAYS_2026 = [
  "2026-01-01", // 1月1日
  "2026-02-17", "2026-02-18", "2026-02-19", // 農曆新年 (初一至初三)
  "2026-04-03", "2026-04-04", "2026-04-06", // 耶穌受難節/復活節
  "2026-04-05", "2026-04-07", // 清明節及翌日
  "2026-05-01", // 勞動節
  "2026-05-24", "2026-05-25", // 佛誕及翌日
  "2026-06-19", // 端午節
  "2026-07-01", // 特區成立紀念日
  "2026-09-26", // 中秋節翌日
  "2026-10-01", // 國慶日
  "2026-10-19", // 重陽節
  "2026-12-25", // 聖誕節
  "2026-12-26"  // 聖誕節後第一個周日
];

const isWorkDay = (date: dayjs.Dayjs, skipSat: boolean) => {
  const dateStr = date.format('YYYY-MM-DD');
  const dayOfWeek = date.day(); // 0 是週日, 6 是週六

  // 如果是週日，必跳過
  if (dayOfWeek === 0) return false;
  // 如果勾選了跳過週六
  if (skipSat && dayOfWeek === 6) return false;
  // 如果是公眾假期，必跳過
  if (HK_HOLIDAYS_2026.includes(dateStr)) return false;

  return true;
};

// 3. 在 handleGenerate 函數內，修改日期增加的邏輯：
const handleGenerate = () => {
  setIsCalculating(true);

// ✅ Full Region Mapping as requested
const REGION_MAP: Record<string, string> = {
  'HK': 'Hong Kong Island',
  'KN': 'Kowloon',
  'NT': 'New Territories',
  'Islands': 'Islands',
  'MO': 'Macau'
};

interface ScheduledShop extends Shop {
  scheduledDate: string;
  groupId: number;
  dayOfWeek: string;
}

// ✅ SummaryCard Component matching Dashboard HTML structure exactly
const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="card-item">
    <div className="img-section" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
    <div className="card-desc">
      <div className="card-header">
        <div className="card-title">{label}</div>
        <div className="card-menu">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <div className="card-time">{value}</div>
      <p className="recent-text">{subtext}</p>
    </div>
  </div>
);

export const Generator: React.FC<{ shops: Shop[], graphToken: string }> = ({ shops, graphToken }) => {
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(20);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(3);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [includeMTR, setIncludeMTR] = useState(true);

  const [generatedResult, setGeneratedResult] = useState<ScheduledShop[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // --- Statistics Logic ---
  const globalStats = useMemo(() => {
    const total = shops.length;
    const closed = shops.filter(s => s.status === 'Closed').length;
    const completed = shops.filter(s => s.status === 'Done' || s.status === 'Re-Open').length;
    const remain = total - completed - closed;
    return { total, completed, closed, remain };
  }, [shops]);

  // ✅ Regional Pending Stats Logic
  const regionRemainStats = useMemo(() => {
    const unassignedShops = shops.filter(s => 
      !['Planned', 'Done', 'Closed', 'Re-Open', 'In-Progress', 'Reschedule'].includes(s.status)
    );
    
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    unassignedShops.forEach(s => {
      if (counts.hasOwnProperty(s.region)) counts[s.region]++;
    });

    return Object.keys(counts).map(key => ({
      key,
      fullName: REGION_MAP[key],
      count: counts[key]
    }));
  }, [shops]);

  const regionOptions = useMemo(() => Array.from(new Set(shops.map(s => s.region))).filter(Boolean).sort(), [shops]);
  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? shops.filter(s => selectedRegions.includes(s.region)) : shops;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [shops, selectedRegions]);

  const handleGenerate = () => {
    setIsCalculating(true);
    let pool = shops.filter(s => {
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
      const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
      const matchMTR = includeMTR ? true : s.is_mtr === false;
      return matchRegion && matchDistrict && matchMTR && !['Done', 'Closed', 'Planned', 'In-Progress'].includes(s.status);
    });

    if (pool.length === 0) {
      message.warning("No unassigned shops found.");
      setIsCalculating(false);
      return;
    }

    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    const results: ScheduledShop[] = [];
    let currentDay = dayjs(startDate);

    while (!isWorkDay(currentDay, true)) { // 預設跳過週六日及假期
    currentDay = currentDay.add(1, 'day');
  }

    pool.forEach((shop, index) => {
      if (index > 0 && index % shopsPerDay === 0) {
        currentDay = currentDay.add(1, 'day');
       while (!isWorkDay(currentDay, true)) { 
        currentDay = currentDay.add(1, 'day');
      }
    }
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      results.push({ ...shop, scheduledDate: currentDay.format('YYYY-MM-DD'), groupId: groupInDay, dayOfWeek: currentDay.format('ddd') });
    });

    setTimeout(() => {
      setGeneratedResult(results);
      setIsCalculating(false);
      message.success(`Successfully assigned ${results.length} shops!`);
    }, 800);
  };

  const saveToSharePoint = async () => {
    if (!graphToken) return message.error("Missing Access Token!");
    setIsSaving(true);
    setUploadProgress(0);
    for (let i = 0; i < generatedResult.length; i++) {
      const shop = generatedResult[i];
      try {
        await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate,
            [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(),
            [SP_FIELDS.STATUS]: 'Planned'
          })
        });
        setUploadProgress(Math.round(((i + 1) / generatedResult.length) * 100));
      } catch (e) { console.error("Sync Error", shop.name); }
    }
    setIsSaving(false);
    message.success("All schedules synced to SharePoint!");
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      <div>
        <Title level={2} className="m-0">Schedule Generator</Title>
        <Text type="secondary">Auto-assign shops using spatial clustering.</Text>
      </div>

      {/* ✅ Top Row: Global Stats exactly like Dashboard */}
      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={globalStats.total} subtext="Overall list" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={globalStats.completed} subtext="Finished" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={globalStats.closed} subtext="Exceptions" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5}} />} /></Col>
        <Col span={6}><SummaryCard label="Remain" value={globalStats.remain} subtext="Not Completed" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 40, color: 'rgba(255,255,255,0.7)', marginTop: 5}} />} /></Col>
      </Row>

      {/* ✅ Second Row: Regional Breakdown */}
      <div className="mt-2">
        <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-4">Remain Unassigned Shops by Region</Text>
        <Row gutter={[16, 16]}>
          {regionRemainStats.map((reg) => (
            <Col key={reg.key} style={{ width: '20%' }}>
              <Card size="small" className="rounded-2xl border-none shadow-sm bg-indigo-50/50">
                <div className="flex flex-col items-center py-2 text-center">
                  <Text strong className="text-indigo-600 text-[10px] truncate w-full px-1"><EnvironmentOutlined /> {reg.fullName}</Text>
                  <Title level={4} className="m-0 text-indigo-900 mt-1">{reg.count}</Title>
                  <Text className="text-[9px] text-indigo-400 uppercase font-bold">Pending</Text>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mt-4">
        <Space className="mb-10 text-[11px] font-bold uppercase tracking-widest text-slate-800">
          <ControlOutlined className="text-teal-600" /> Algorithm Configuration
        </Space>
        
        <Collapse ghost defaultActiveKey={['1', '2']} expandIconPosition="end">
          <Collapse.Panel key="1" header={<Space className="py-2"><div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">1</div><span className="font-bold">Core Parameters</span></Space>}>
            <Row gutter={24} className="py-2">
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 20)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
            </Row>
          </Collapse.Panel>

          <Collapse.Panel key="2" header={<Space className="py-2"><div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">2</div><span className="font-bold">Location Filters</span></Space>}>
            <Row gutter={24} className="py-2">
              <Col span={10}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Regions</Text><Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions}>{regionOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}</Select></Col>
              <Col span={10}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Districts</Text><Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts}>{availableDistricts.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}</Select></Col>
              <Col span={4}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">MTR Incl.</Text><div className="h-12 flex items-center gap-2"><Switch checked={includeMTR} onChange={setIncludeMTR} /><span className="text-xs font-bold text-slate-600">{includeMTR ? 'Yes' : 'No'}</span></div></Col>
            </Row>
          </Collapse.Panel>
        </Collapse>

        <div className="flex justify-end mt-12">
          <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}>
            <div className="dots_border"></div>
            <span className="text_button">{isCalculating ? 'Generating...' : 'Generate Schedule'}</span>
          </button>
        </div>
      </div>

      {generatedResult.length > 0 && (
        <div className="flex flex-col gap-6">
          <Card title="Preview" className="rounded-3xl border-none shadow-sm overflow-hidden">
            <Table dataSource={generatedResult} size="small" rowKey="id" pagination={{ pageSize: 10 }} columns={[
              { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: (d, r) => <b>{d} ({r.dayOfWeek})</b> },
              { title: 'Team', dataIndex: 'groupId', key: 'group', render: (g) => <Tag color="blue">Team {String.fromCharCode(64 + g)}</Tag> },
              { title: 'Shop Name', dataIndex: 'name', key: 'name' },
              { title: 'District', dataIndex: 'district', key: 'district' },
              { title: 'Brand', dataIndex: 'brand', key: 'brand' },
            ]} />
          </Card>
          <div className="flex justify-end"><Button type="primary" icon={<SaveOutlined />} loading={isSaving} onClick={saveToSharePoint} className="bg-emerald-600 border-none h-12 px-8 rounded-xl font-bold">Sync to SharePoint</Button></div>
        </div>
      )}

      {/* ✅ Added the specific Dashboard styles to the Generator component */}
      <style>{`
        .card-item { --primary-clr: #1C204B; --dot-clr: #BBC0FF; width: 100%; height: 160px; border-radius: 15px; color: #fff; display: grid; cursor: pointer; grid-template-rows: 40px 1fr; overflow: hidden; transition: all 0.3s ease; }
        .card-item:hover { transform: translateY(-5px); }
        .img-section { transition: 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94); border-top-left-radius: 15px; border-top-right-radius: 15px; display: flex; justify-content: flex-end; padding-right: 20px; }
        .card-desc { border-radius: 15px; padding: 15px 20px; position: relative; top: -10px; display: grid; background: var(--primary-clr); z-index: 2; }
        .card-time { font-size: 2em; font-weight: 700; line-height: 1; }
        .card-title { flex: 1; font-size: 0.85em; font-weight: 500; color: var(--dot-clr); text-transform: uppercase; letter-spacing: 1px; }
        .card-header { display: flex; align-items: center; width: 100%; margin-bottom: 5px; }
        .card-menu { display: flex; gap: 3px; }
        .card-menu .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--dot-clr); }
        .recent-text { font-size: 0.75em; color: var(--dot-clr); opacity: 0.7; }
      `}</style>
    </div>
  );
};
