import React, { useState, useMemo } from 'react';
import { 
  Card, Collapse, Row, Col, Space, Button, Typography, Select, 
  InputNumber, Table, Tag, message, Modal, DatePicker, Divider 
} from 'antd';
import { 
  ControlOutlined, CheckCircleOutlined, SaveOutlined, 
  ShopOutlined, CloseCircleOutlined, HourglassOutlined,
  EnvironmentOutlined, ExclamationCircleOutlined, DeleteOutlined,
  CalendarOutlined, SyncOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

// 啟用 dayjs 的區間判斷插件
dayjs.extend(isBetween);

const { Text, Title } = Typography;
const { confirm } = Modal;
const { RangePicker } = DatePicker;

const REGION_DISPLAY_CONFIG: Record<string, { label: string, social: string, svg: React.ReactNode }> = {
  'HK': { label: 'Hong Kong Island', social: 'hk', svg: <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none"><path d="M3 21H21" stroke="currentColor" strokeWidth="2"/><path d="M5 21V7L10 3V21" stroke="currentColor" strokeWidth="2"/><path d="M14 21V11L19 15V21" stroke="currentColor" strokeWidth="2"/></svg> },
  'KN': { label: 'Kowloon', social: 'kn', svg: <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none"><path d="M12 21C15.5 17.4 19 14.1764 19 10.2C19 6.22355 15.866 3 12 3C8.13401 3 5 6.22355 5 10.2C5 14.1764 8.5 17.4 12 21Z" stroke="currentColor" strokeWidth="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/></svg> },
  'NT': { label: 'New Territories', social: 'nt', svg: <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none"><path d="M2 20L9 4L14 14L18 8L22 20H2Z" stroke="currentColor" strokeWidth="2"/></svg> },
  'Islands': { label: 'Lantau Island', social: 'islands', svg: <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none"><path d="M12 10C13.5 10 17 11 17 14C17 17 14 18 12 18C10 18 7 17 7 14C7 11 10.5 10 12 10Z" stroke="currentColor" strokeWidth="2"/><path d="M12 10V3" stroke="currentColor" strokeWidth="2"/><path d="M2 20C4 18 6 18 8 20C10 22 12 22 14 20C16 18 18 18 20 20" stroke="currentColor" strokeWidth="2"/></svg> },
  'MO': { label: 'Macau', social: 'mo', svg: <svg width="28px" height="28px" viewBox="0 0 24 24" fill="none"><path d="M12 3L4 9V21H20V9L12 3Z" stroke="currentColor" strokeWidth="2"/><path d="M9 21V12H15V21" stroke="currentColor" strokeWidth="2"/></svg> }
};

const SyncGeometricLoader = ({ text = "Syncing to SharePoint..." }) => (
  <div className="sync-overlay">
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}><div className="loader"><svg viewBox="0 0 80 80"><circle r="32" cy="40" cx="40"></circle></svg></div><div className="loader triangle"><svg viewBox="0 0 86 80"><polygon points="43 8 79 72 7 72"></polygon></svg></div><div className="loader"><svg viewBox="0 0 80 80"><rect height="64" width="64" y="8" x="8"></rect></svg></div></div>
    <Title level={4} style={{ color: '#0d9488' }}>{text}</Title>
  </div>
);

const SummaryCard = ({ label, value, subtext, bgColor, icon }: any) => (
  <div className="summary-card-item">
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="summary-card-body">
      <div className="summary-card-header"><div className="summary-card-title">{label}</div><div className="summary-card-menu"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div></div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

export const Generator: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  const [startDate, setStartDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [shopsPerDay, setShopsPerDay] = useState<number>(20);
  const [groupsPerDay, setGroupsPerDay] = useState<number>(3);
  const [generatedResult, setGeneratedResult] = useState<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // 重置功能狀態
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [resetRange, setResetRange] = useState<any>(null);

  // ✅ 過濾掉結業商店的池
  const activePool = useMemo(() => {
    return shops.filter(s => s.masterStatus !== 'Closed' && s.status !== 'Closed');
  }, [shops]);

  const stats = useMemo(() => ({
    total: activePool.length, 
    completed: activePool.filter(s => s.status === 'Done').length,
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

  // --- 核心功能 1: 生成排程 ---
  const handleGenerate = () => {
    setIsCalculating(true);
    let pool = activePool.filter(s => s.status === 'Unplanned');

    if (pool.length === 0) { message.warning("No unplanned active shops available."); setIsCalculating(false); return; }

    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));
    const results: any[] = [];
    let currentDay = dayjs(startDate);

    pool.forEach((shop, index) => {
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;
      results.push({ ...shop, scheduledDate: currentDay.format('YYYY-MM-DD'), groupId: groupInDay });
      if ((index + 1) % shopsPerDay === 0) currentDay = currentDay.add(1, 'day');
    });

    setGeneratedResult(results);
    setIsCalculating(false);
    message.success(`Generated schedules for ${results.length} shops.`);
  };

  // --- 核心功能 2: 同步至 SharePoint ---
  const saveToSharePoint = async () => {
    setIsSaving(true);
    try {
      for (const shop of generatedResult) {
        await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate, [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(), [SP_FIELDS.STATUS]: 'Planned' })
        });
      }
      onRefresh();
      setGeneratedResult([]);
      message.success("Sync Complete!");
    } catch (err) { message.error("Sync Failed"); }
    setIsSaving(false);
  };

  // --- ✅ 核心功能 3: 分段重置排程 (Reset by Period) ---
  const handleResetByPeriod = async () => {
    if (!resetRange) { message.error("Please select a date range first!"); return; }
    
    const [start, end] = resetRange;
    const targets = shops.filter(s => 
      s.scheduledDate && 
      dayjs(s.scheduledDate).isBetween(start, end, 'day', '[]')
    );

    if (targets.length === 0) { message.warning("No schedules found in the selected period."); return; }

    confirm({
      title: 'Confirm Reset',
      icon: <ExclamationCircleOutlined />,
      content: `Are you sure to reset ${targets.length} schedules from ${start.format('YYYY-MM-DD')} to ${end.format('YYYY-MM-DD')}?`,
      onOk: async () => {
        setIsSaving(true);
        try {
          for (const shop of targets) {
            await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: null, [SP_FIELDS.STATUS]: 'Unplanned' })
            });
          }
          setResetModalVisible(false);
          setResetRange(null);
          onRefresh();
          message.success("Period reset complete!");
        } catch (err) { message.error("Reset Failed"); }
        setIsSaving(false);
      }
    });
  };

  // --- 核心功能 4: 重置全部 ---
  const handleResetAll = () => {
    const plannedShops = shops.filter(s => s.status === 'Planned');
    if (plannedShops.length === 0) { message.info("No planned schedules to reset."); return; }

    confirm({
      title: 'Reset ALL Schedules?',
      icon: <DeleteOutlined className="text-red-500" />,
      content: `This will clear all ${plannedShops.length} planned items. This action cannot be undone.`,
      okText: 'Yes, Reset All',
      okType: 'danger',
      onOk: async () => {
        setIsSaving(true);
        try {
          for (const shop of plannedShops) {
            await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ [SP_FIELDS.SCHEDULE_DATE]: null, [SP_FIELDS.SCHEDULE_GROUP]: null, [SP_FIELDS.STATUS]: 'Unplanned' })
            });
          }
          onRefresh();
          message.success("All schedules reset!");
        } catch (err) { message.error("Reset Failed"); }
        setIsSaving(false);
      }
    });
  };

  return (
    <div className="w-full flex flex-col gap-8 pb-20">
      {isSaving && <SyncGeometricLoader text="Modifying SharePoint Data..." />}
      <Title level={2} className="m-0 text-slate-800">Schedule Generator</Title>

      {/* 數據統計概覽 */}
      <Row gutter={[24, 24]}>
        <Col span={8}><SummaryCard label="Active Shops" value={stats.total} subtext="Total operating units" bgColor="hsl(195, 74%, 62%)" icon={<ShopOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Completed" value={stats.completed} subtext="Done this year" bgColor="hsl(145, 58%, 55%)" icon={<CheckCircleOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
        <Col span={8}><SummaryCard label="Remaining" value={stats.unplanned} subtext="Pending schedule" bgColor="#f1c40f" icon={<HourglassOutlined style={{fontSize: 60, color: 'white', opacity: 0.5}} />} /></Col>
      </Row>

      {/* 地區統計圖表 */}
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

      <Row gutter={24}>
        <Col span={14}>
          {/* 生成設定 */}
          <div className="bg-white rounded-3xl p-8 h-full shadow-sm border border-slate-100">
            <Space className="mb-10 text-[18px] font-bold uppercase text-slate-800"><ControlOutlined className="text-teal-600" /> Generation Settings</Space>
            <Collapse ghost defaultActiveKey={['1']} expandIconPosition="end">
              <Collapse.Panel key="1" header={<span className="font-bold">Core Parameters</span>}>
                <Row gutter={24}>
                  <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Start Date</Text><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full px-4" /></Col>
                  <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 20)} className="w-full h-12 bg-slate-50 border-none rounded-xl" /></Col>
                  <Col span={8}><Text strong className="text-slate-400 block mb-2 uppercase text-xs">Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 bg-slate-50 border-none rounded-xl" /></Col>
                </Row>
              </Collapse.Panel>
            </Collapse>
            <div className="flex justify-end mt-12">
              <button className="sparkle-button" onClick={handleGenerate} disabled={isCalculating}>
                <div className="dots_border"></div>
                <Space className="text_button"><ControlOutlined /><span>GENERATE</span></Space>
              </button>
            </div>
          </div>
        </Col>

        <Col span={10}>
          {/* ✅ 管理工具: Reset Buttons */}
          <div className="bg-slate-50 rounded-3xl p-8 h-full border border-dashed border-slate-200">
             <Space className="mb-6 text-[16px] font-bold uppercase text-slate-500"><SyncOutlined /> Schedule Management</Space>
             <div className="flex flex-col gap-4">
                <Button 
                  danger 
                  type="primary" 
                  icon={<DeleteOutlined />} 
                  onClick={handleResetAll}
                  className="h-12 rounded-xl font-bold"
                  block
                >
                  RESET ALL SCHEDULES
                </Button>
                
                <Button 
                  icon={<CalendarOutlined />} 
                  onClick={() => setResetModalVisible(true)}
                  className="h-12 rounded-xl font-bold border-red-200 text-red-500 hover:bg-red-50"
                  block
                >
                  RESET SCHEDULE BY PERIOD
                </Button>
                
                <div className="mt-4 p-4 bg-white rounded-2xl border border-slate-100">
                   <Text type="secondary" className="text-xs italic">
                     * Resetting will change the shop status back to 'Unplanned' and clear the assigned dates.
                   </Text>
                </div>
             </div>
          </div>
        </Col>
      </Row>

      {generatedResult.length > 0 && (
        <Card title={<Space><SyncOutlined spin /> Generation Preview</Space>} className="rounded-3xl border-none shadow-sm overflow-hidden animate-in slide-in-from-bottom duration-500">
          <Table dataSource={generatedResult} pagination={{ pageSize: 15 }} rowKey="id" columns={[
            { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: d => <b>{d}</b> },
            { title: 'Group', dataIndex: 'groupId', key: 'group', render: g => <Tag color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'}>{`Group ${String.fromCharCode(64 + g)}`}</Tag> },
            { title: 'Shop', dataIndex: 'name', key: 'name' },
            { title: 'Region', dataIndex: 'region', key: 'region', render: r => <Tag>{r}</Tag> },
          ]} />
          <div className="flex justify-end p-6 border-t bg-slate-50">
             <Button type="primary" icon={<SaveOutlined />} onClick={saveToSharePoint} className="bg-emerald-600 h-12 rounded-xl px-12 font-bold shadow-lg">Confirm & Sync to SharePoint</Button>
          </div>
        </Card>
      )}

      {/* ✅ Reset by Period Modal */}
      <Modal
        title={<Space><CalendarOutlined /> Select Period to Reset</Space>}
        visible={resetModalVisible}
        onCancel={() => setResetModalVisible(false)}
        onOk={handleResetByPeriod}
        okText="Start Reset"
        okButtonProps={{ danger: true, className: 'rounded-lg' }}
        cancelButtonProps={{ className: 'rounded-lg' }}
        centered
      >
        <div className="py-6 text-center">
          <Text className="block mb-6 text-slate-500">
            Please choose the date range. Any planned schedule within this range will be cleared.
          </Text>
          <RangePicker 
            className="w-full h-12 rounded-xl" 
            onChange={(dates) => setResetRange(dates)}
          />
        </div>
      </Modal>
    </div>
  );
};
