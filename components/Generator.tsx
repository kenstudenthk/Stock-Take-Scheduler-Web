import React, { useState, useMemo } from 'react';
import { Card, Collapse, Row, Col, Space, Button, Typography, Switch, Select, Input, InputNumber, Table, Tag, Progress, message, Alert } from 'antd';
import { ControlOutlined, RocketOutlined, CheckCircleOutlined, SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';

const { Text } = Typography;

// 定義生成後的門市結構
interface ScheduledShop extends Shop {
  scheduledDate: string;
  groupId: number;
  dayOfWeek: string;
}

export const Generator: React.FC<{ shops: Shop[], graphToken: string }> = ({ shops, graphToken }) => {
  // --- 狀態管理 ---
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

  // --- 篩選器動態選項 ---
  const regionOptions = useMemo(() => Array.from(new Set(shops.map(s => s.region))).filter(Boolean).sort(), [shops]);
  const availableDistricts = useMemo(() => {
    const filtered = selectedRegions.length > 0 ? shops.filter(s => selectedRegions.includes(s.region)) : shops;
    return Array.from(new Set(filtered.map(s => s.district))).filter(Boolean).sort();
  }, [shops, selectedRegions]);

  // --- 核心算法：生成排程 ---
  const handleGenerate = () => {
    setIsCalculating(true);
    
    // 1. 執行篩選
  let pool = shops.filter(s => {
    // 地區篩選 (Region & District)
    const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(s.region);
    const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(s.district);
    
    // ✅ MTR 篩選邏輯：
    // 如果 includeMTR 是 false，則只保留 is_mtr 為 false 的店（排除地鐵店）
    // 如果 includeMTR 是 true，則全部保留
    const matchMTR = includeMTR ? true : s.is_mtr === false;
    return matchRegion && matchDistrict && matchMTR && !['Done', 'Closed'].includes(s.status);
  });

    if (pool.length === 0) {
      message.warning("No shops found matching the criteria.");
      setIsCalculating(false);
      return;
    }

    // 2. 空間排序 (Spatial Sorting) - 這是實現聚類的關鍵
    // 先按緯度再按經度排序，能讓地理位置接近的店排在一起
    pool.sort((a, b) => (a.latitude + a.longitude) - (b.latitude + b.longitude));

    // 3. 分配日期與小組
    const results: ScheduledShop[] = [];
    let currentDay = dayjs(startDate);
    let shopCount = 0;

    pool.forEach((shop, index) => {
      // 判斷是否需要換下一天
      if (index > 0 && index % shopsPerDay === 0) {
        currentDay = currentDay.add(1, 'day');
        // 跳過星期日
        if (currentDay.day() === 0) currentDay = currentDay.add(1, 'day');
      }

      // 決定小組 (1, 2, 3...)
      const groupInDay = (index % shopsPerDay) % groupsPerDay + 1;

      results.push({
        ...shop,
        scheduledDate: currentDay.format('YYYY-MM-DD'),
        groupId: groupInDay,
        dayOfWeek: currentDay.format('ddd')
      });
    });

    setTimeout(() => {
      setGeneratedResult(results);
      setIsCalculating(false);
      message.success(`Successfully assigned ${results.length} shops!`);
    }, 800);
  };

  // --- SharePoint 上傳邏輯 ---
  const saveToSharePoint = async () => {
    if (!graphToken) {
      message.error("Please connect to SharePoint in Settings first!");
      return;
    }

    setIsSaving(true);
    setUploadProgress(0);
    let successCount = 0;

    for (let i = 0; i < generatedResult.length; i++) {
      const shop = generatedResult[i];
      try {
        // 更新 SharePoint 列表中的欄位 (假設欄位名稱為 field_2 和 Schedule_x0020_Group)
        await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
          method: 'PATCH',
          headers: { 
            'Authorization': `Bearer ${graphToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            [SP_FIELDS.SCHEDULE_DATE]: shop.scheduledDate,
        [SP_FIELDS.SCHEDULE_GROUP]: shop.groupId.toString(),
        [SP_FIELDS.STATUS]: 'Planned' // ✅ Set to Planned
          })
        });
        successCount++;
        setUploadProgress(Math.round(((i + 1) / generatedResult.length) * 100));
      } catch (e) {
        console.error("Upload failed for shop:", shop.name);
      }
    }

    setIsSaving(false);
    message.success(`Saved ${successCount} schedules to SharePoint!`);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-20">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Schedule Generator</h1>
        <p className="text-slate-500 font-medium">Auto-assign {shops.length} shops using spatial clustering.</p>
      </div>
      
      {/* Step 1 & 2: Configuration */}
      <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
        <Space className="mb-10 text-[11px] font-bold uppercase tracking-widest text-slate-800">
          <ControlOutlined className="text-teal-600" /> Algorithm Configuration
        </Space>
        
        <Collapse ghost defaultActiveKey={['1', '2']} expandIconPosition="end">
          <Collapse.Panel key="1" header={<Space className="py-2"><div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">1</div><span className="font-bold">Core Parameters</span></Space>}>
            <Row gutter={24} className="py-2">
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Start Date</Text><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-slate-50 border-none h-12 rounded-xl w-full" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Target Shops / Day</Text><InputNumber value={shopsPerDay} onChange={v => setShopsPerDay(v || 20)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
              <Col span={8}><Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Total Groups / Day</Text><InputNumber value={groupsPerDay} onChange={v => setGroupsPerDay(v || 3)} className="w-full h-12 flex items-center bg-slate-50 border-none rounded-xl" /></Col>
            </Row>
          </Collapse.Panel>

          <Collapse.Panel key="2" header={<Space className="py-2"><div className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold">2</div><span className="font-bold">Location Filters</span></Space>}>
            <Row gutter={24} className="py-2">
              <Col span={10}>
                <Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Regions</Text>
                <Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Regions" value={selectedRegions} onChange={setSelectedRegions}>
                  {regionOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
                </Select>
              </Col>
              <Col span={10}>
                <Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Districts</Text>
                <Select mode="multiple" className="w-full min-h-[48px]" placeholder="All Districts" value={selectedDistricts} onChange={setSelectedDistricts}>
                  {availableDistricts.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
                </Select>
              </Col>
              <Col span={4}>
                <Text strong className="text-[10px] text-slate-400 uppercase block mb-2">MTR Incl.</Text>
                <div className="h-12 flex items-center gap-2"><Switch checked={includeMTR} onChange={setIncludeMTR} /><span className="text-xs font-bold text-slate-600">{includeMTR ? 'Yes' : 'No'}</span></div>
              </Col>
            </Row>
          </Collapse.Panel>
        </Collapse>
        
        // 找到 Generator.tsx 中原本 "Generate Schedule" 的 Button 位置
// 替換如下：

<div className="flex justify-end mt-12">
  <button 
    className="sparkle-button" 
    onClick={handleGenerate}
    disabled={isCalculating}
  >
    {/* 旋轉邊框 */}
    <div className="dots_border"></div>

    {/* 您提供的 Calendar SVG */}
    <svg 
      className="calendar-icon-svg"
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="matrix(0.16 0 0 0.16 12 12)">
        <path 
          style={{ stroke: 'none', fill: 'white' }} 
          transform="translate(-63.5, -64)" 
          d="M 32 1 C 23.7 1 16.700781 7.1 15.300781 15 L 4 15 C 2.3 15 1 16.3 1 18 L 1 124 C 1 125.7 2.3 127 4 127 L 123 127 C 124.7 127 126 125.7 126 124 L 126 33 C 126 31.3 124.7 30 123 30 C 121.3 30 120 31.3 120 33 L 120 121 L 111 121 L 111 18 C 111 16.3 109.7 15 108 15 L 96.699219 15 C 95.299219 7.1 88.3 1 80 1 C 71.7 1 64.700781 7.1 63.300781 15 L 47.800781 15 C 46.500781 6.8 40.2 1 32 1 z M 32 7 C 36.8 7 40.599219 10.2 41.699219 15 L 21.400391 15 C 22.700391 10.4 27 7 32 7 z M 80 7 C 85 7 89.299609 10.4 90.599609 15 L 69.400391 15 C 70.700391 10.4 75 7 80 7 z M 7 21 L 15.300781 21 C 16.700781 28.9 23.7 35 32 35 C 33.7 35 35 33.7 35 32 C 35 30.3 33.7 29 32 29 C 27 29 22.700391 25.6 21.400391 21 L 63.300781 21 C 64.700781 28.9 71.7 35 80 35 C 81.7 35 83 33.7 83 32 C 83 30.3 81.7 29 80 29 C 75 29 70.700391 25.6 69.400391 21 L 105 21 L 105 121 L 7 121 L 7 49 L 58 49 C 59.7 49 61 47.7 61 46 C 61 44.3 59.7 43 58 43 L 7 43 L 7 21 z M 78 43 C 76.3 43 75 44.3 75 46 C 75 47.7 76.3 49 78 49 L 88 49 C 89.7 49 91 47.7 91 46 C 91 44.3 89.7 43 88 43 L 78 43 z M 58.810547 69.964844 C 58.082031 70.009766 57.363281 70.337891 56.800781 70.900391 L 46.800781 80.900391 C 45.600781 82.100391 45.600781 83.999609 46.800781 85.099609 C 48.000781 86.299609 49.9 86.299609 51 85.099609 L 55.900391 80.199219 L 55.900391 98 C 55.900391 99.7 57.200391 101 58.900391 101 C 60.600391 101 61.900391 99.7 61.900391 98 L 61.900391 73 C 62.000391 71.8 61.299609 70.699219 60.099609 70.199219 C 59.687109 70.011719 59.247656 69.937891 58.810547 69.964844 z" 
        />
      </g>
    </svg>

    <span className="text_button">
      {isCalculating ? 'Generating...' : 'Generate Schedule'}
    </span>
  </button>
</div>
      </div>

      {/* Result Section */}
      {generatedResult.length > 0 && (
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-full text-emerald-500 shadow-sm"><CheckCircleOutlined className="text-2xl" /></div>
              <div>
                <h4 className="font-bold text-emerald-900 m-0">Schedule Ready for Sync</h4>
                <p className="text-emerald-600 text-sm">Cluster logic completed. {generatedResult.length} shops assigned across {Math.ceil(generatedResult.length / shopsPerDay)} business days.</p>
              </div>
            </div>
            <Button 
              type="primary" icon={<SaveOutlined />} 
              loading={isSaving} onClick={saveToSharePoint}
              className="bg-emerald-600 border-none h-12 px-8 rounded-xl font-bold shadow-md shadow-emerald-100"
            >
              Sync to SharePoint
            </Button>
          </div>

          {isSaving && (
            <Card className="rounded-2xl border-none shadow-sm p-2">
              <Text strong className="text-xs uppercase text-slate-400 mb-2 block tracking-wider">Upload Progress</Text>
              <Progress percent={uploadProgress} strokeColor="#10b981" status="active" />
              <Text className="text-[11px] text-slate-500 mt-2 block italic">Updating SPO fields: field_2 (Date) & Schedule_x0020_Group (Team)...</Text>
            </Card>
          )}

          <Card title="Generation Preview" className="rounded-3xl border-none shadow-sm overflow-hidden">
            <Table 
              dataSource={generatedResult}
              size="small"
              rowKey="id"
              columns={[
                { title: 'Date', dataIndex: 'scheduledDate', key: 'date', render: (d, r) => <b>{d} ({r.dayOfWeek})</b> },
                { title: 'Team', dataIndex: 'groupId', key: 'group', render: (g) => <Tag color="blue">Team {String.fromCharCode(64 + g)}</Tag> },
                { title: 'Shop Name', dataIndex: 'name', key: 'name' },
                { title: 'District', dataIndex: 'district', key: 'district' },
                { title: 'Brand', dataIndex: 'brand', key: 'brand' },
              ]}
              pagination={{ pageSize: 10 }}
            />
          </Card>
        </div>
      )}
    </div>
  );
};
