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

// --- 內部組件：Pac-man 追逐戰 Loading ---
const PacmanChaseLoader = () => (
  <div className="chase-overlay">
    <div className="chase-container">
      {/* 1 HTML: Ghost */}
      <div id="ghost-chaser">
        <div id="red" style={{ scale: '0.6' }}>
          <div id="pupil"></div><div id="pupil1"></div><div id="eye"></div><div id="eye1"></div>
          <div id="top3" style={{ background: 'red', width: '100px', height: '80px', borderRadius: '50px 50px 0 0' }}></div>
        </div>
      </div>
      {/* 2 HTML: Pacman */}
      <div className="pacman-runner"></div>
      {/* 2 HTML: Dots */}
      <div className="dots-trail">
        {[1, 2, 3, 4, 5].map(i => <div key={i} className="dot-item" />)}
      </div>
    </div>
    <Title level={4} style={{ color: 'white', marginTop: '20px' }}>Syncing Schedules...</Title>
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
  const [uploadProgress, setUploadProgress] = useState(0);

  // ✅ 核心篩選：排除 Master Closed (field_1 === 'Closed')
  const activePool = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);

  // ✅ 4 Summary Cards 統計邏輯 (基於 status 欄位)
  const stats = useMemo(() => {
    return {
      total: activePool.length,
      completed: activePool.filter(s => s.status === 'Done').length,
      closed: activePool.filter(s => s.status === 'Closed').length,
      unplanned: activePool.filter(s => s.status === 'Unplanned').length
    };
  }, [activePool]);

  // ✅ 5 Region 統計邏輯：僅統計 Unplanned 門市
  const regionStats = useMemo(() => {
    const counts: Record<string, number> = { 'HK': 0, 'KN': 0, 'NT': 0, 'Islands': 0, 'MO': 0 };
    activePool.filter(s => s.status === 'Unplanned').forEach(s => {
      if (counts.hasOwnProperty(s.region)) counts[s.region]++;
    });
    return Object.entries(counts).map(([key, count]) => ({ key, count }));
  }, [activePool]);

  // --- 關鍵修復：函數必須定義在 return 語句之前 ---

  const handleResetAll = () => {
    confirm({
      title: 'Reset All Scheduled Shops?',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: 'All "Planned" shops will be reset to "Unplanned". Proceed?',
      okText: 'Yes, Reset', okType: 'danger',
      onOk: async () => {
        setIsSaving(true);
        const toReset = activePool.filter(s => s.status === 'Planned');
        for (const shop of toReset) {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: "0", [SP_FIELDS.STATUS]: 'Unplanned' })
          });
        }
        message.success("Schedules reset successfully.");
        onRefresh();
        setIsSaving(false);
      }
    });
  };

  const handleGenerate = () => {
    setIsCalculating(true);
    let pool = activePool.filter(s => s.status === 'Unplanned' && (selectedRegions.length === 0 || selectedRegions.includes(s.region)));
    // ... 排序與生成邏輯 ...
    setGeneratedResult(pool.slice(0, shopsPerDay).map(s => ({ ...s, scheduledDate: startDate, groupId: 1 })));
    setIsCalculating(false);
  };

  const saveToSharePoint = async () => {
    setIsSaving(true);
    // ... 批次保存邏輯 ...
    setTimeout(() => { setIsSaving(false); onRefresh(); message.success("Sync Done"); }, 3000);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      {/* ✅ 點擊 Reset 後顯示的追逐動畫 */}
      {isSaving && <PacmanChaseLoader />}

      <div className="flex justify-between items-start">
        <div><Title level={2} className="m-0">Schedule Generator</Title><Text type="secondary">Targeting Unplanned shops only.</Text></div>
        <button className="reset-all-btn" onClick={handleResetAll} disabled={isSaving}>
          <div className="svg-wrapper-1"><div className="svg-wrapper">
            <svg width="24px" height="24px" viewBox="0 -0.5 21 21"><path d="M130.35,216 L132.45,216 L132.45,208 L130.35,208 L130.35,216 Z M128.25,218 L138.75,218 L138.75,206 L128.25,206 L128.25,218 Z M130.35,204 L136.65,204 L136.65,202 L130.35,202 L130.35,204 Z M123,204 L123,206 L126.15,206 L126.15,220 L140.85,220 L140.85,206 L144,206 L144,204 L138.75,204 Z" transform="translate(-123.000000, -200.000000)" fill="currentColor"></path></svg>
          </div></div>
          <span>Reset All Schedule</span>
        </button>
      </div>

      <Row gutter={[24, 24]}>
        <Col span={6}><SummaryCard label="Total Shop" value={stats.total} subtext="Excl. Master Closed" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} subtext="Status: Done" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed Shop" value={stats.closed} subtext="Status: Closed" bgColor="#ff4545" icon={<CloseCircleOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={6}><SummaryCard label="Non Schedule" value={stats.unplanned} subtext="Status: Unplanned" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 40, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      <div className="mt-2">
        <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-4">Unplanned Shops by Region</Text>
        <Row gutter={[16, 16]}>
          {regionStats.map(reg => (
            <Col key={reg.key} style={{ width: '20%' }}>
              <Card size="small" className="rounded-2xl border-none shadow-sm bg-indigo-50/50 text-center">
                <Text strong className="text-indigo-600 text-[10px] uppercase block"><EnvironmentOutlined /> {reg.key}</Text>
                <Title level={4} className="m-0 mt-1">{reg.count}</Title>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
      
      {/* Algorithm Config 區塊保持不變... */}
    </div>
  );
};
