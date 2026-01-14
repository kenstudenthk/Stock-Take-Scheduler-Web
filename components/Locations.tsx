import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker, Badge } from 'antd';
import { 
  EnvironmentOutlined, 
  SearchOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined,
  CloseCircleOutlined,
  FilterOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { wgs84ToGcj02 } from '../utils/coordTransform'; // ✅ 確保您已建立此文件

const { Title, Text } = Typography;

// --- Uiverse 風格的統計卡片組件 ---
const SummaryCard = ({ label, value, bgColor, icon }: any) => (
  <div className="summary-card-item">
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>{icon}</div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
      </div>
      <div className="summary-card-value">{value}</div>
    </div>
  </div>
);

export const Locations: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]); // 用於追踪並清除標記
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null);

  // ✅ 1. 核心篩選邏輯：包含 Schedule Date 的連動
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      // 搜尋篩選
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.address.toLowerCase().includes(search.toLowerCase());
      // 區域篩選
      const matchRegion = !regionFilter || s.region === regionFilter;
      // 狀態篩選
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(s.status);
      
      // ✅ 日期篩選：將 shop.scheduledDate 與 DatePicker 的選取日期比對
      const matchDate = !dateFilter || (
        s.scheduledDate && 
        dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateFilter.format('YYYY-MM-DD')
      );
      
      return matchSearch && matchRegion && matchStatus && matchDate;
    });
  }, [shops, search, regionFilter, statusFilter, dateFilter]);

  // ✅ 2. 統計數據：僅統計地圖上篩選後的結果
  const stats = useMemo(() => ({
    total: filteredShops.length,
    completed: filteredShops.filter(s => s.status === 'Done').length,
    scheduled: filteredShops.filter(s => ['Planned', 'Rescheduled'].includes(s.status)).length,
    closed: filteredShops.filter(s => s.status === 'Closed').length
  }), [filteredShops]);

  // ✅ 3. 地圖初始化 (僅執行一次)
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;

    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719], // 香港中心點
      zoom: 11,
      viewMode: '3D',
      mapStyle: 'amap://styles/normal'
    });
    
    console.log("AMap Initialized");
  }, []);

  // ✅ 4. 當篩選條件改變時，更新地圖標記 (Markers)
  useEffect(() => {
    if (!mapRef.current) return;

    // 清除所有舊標記
    if (markersRef.current.length > 0) {
      mapRef.current.remove(markersRef.current);
      markersRef.current = [];
    }

    // 建立新標記
    const newMarkers = filteredShops.map(shop => {
      // 進行座標轉換
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        title: shop.name,
        // 自定義標記外觀
        content: `
          <div style="
            background: ${shop.status === 'Done' ? '#10b981' : shop.status === 'Closed' ? '#ef4444' : '#3b82f6'};
            width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          "></div>
        `
      });

      // 點擊彈窗
      marker.on('click', () => {
        const info = new window.AMap.InfoWindow({
          content: `
            <div style="padding: 10px; font-family: sans-serif;">
              <h4 style="margin:0 0 5px 0; color:#333;">${shop.name}</h4>
              <p style="font-size:12px; color:#666; margin:0;">${shop.address}</p>
              <div style="margin-top:8px;">
                <span style="background:#f1f5f9; padding:2px 6px; border-radius:4px; font-size:10px; font-weight:bold;">
                  ${shop.status}
                </span>
              </div>
            </div>
          `,
          offset: new window.AMap.Pixel(0, -15)
        });
        info.open(mapRef.current, [lng, lat]);
      });

      return marker;
    });

    // 將新標記加入地圖
    mapRef.current.add(newMarkers);
    markersRef.current = newMarkers;

    // 自動調整視野
    if (newMarkers.length > 0) {
      mapRef.current.setFitView(newMarkers);
    }
  }, [filteredShops]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 標頭 */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Map View</Title>
          <Text className="text-slate-400 font-medium">Visualization of shop audit schedules and real-time status.</Text>
        </div>
      </div>

      {/* 統計盒 */}
      <Row gutter={[20, 20]}>
        <Col span={6}><SummaryCard label="Total on Map" value={stats.total} bgColor="#1e293b" icon={<ShopOutlined style={{color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#10b981" icon={<CheckCircleOutlined style={{color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Scheduled" value={stats.scheduled} bgColor="#3b82f6" icon={<CalendarOutlined style={{color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#ef4444" icon={<CloseCircleOutlined style={{color: 'white'}} />} /></Col>
      </Row>

      {/* ✅ 日期篩選器 (位於統計盒下方) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-6">
        <div className="flex items-center gap-2 text-slate-500">
          <CalendarOutlined className="text-teal-600" />
          <Text strong className="uppercase text-[11px] tracking-widest">Schedule Date Filter:</Text>
        </div>
        <DatePicker 
          className="h-11 rounded-xl w-64 bg-slate-50 border-none" 
          placeholder="Filter by specific date"
          onChange={(date) => setDateFilter(date)}
          value={dateFilter}
        />
        {dateFilter && (
          <Tag color="teal" closable onClose={() => setDateFilter(null)} className="rounded-lg px-3 py-1 font-bold">
            Showing: {dateFilter.format('YYYY-MM-DD')}
          </Tag>
        )}
      </div>

      <div className="flex gap-6 h-[720px]">
        {/* ✅ 地圖容器 (確保高度足夠) */}
        <div 
          id="map-container" 
          className="flex-1 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50"
          style={{ height: '100%', width: '100%' }}
        ></div>

        {/* 右側篩選面板 */}
        <div className="w-[400px] flex flex-col gap-4">
          <Card className="rounded-[32px] border-none shadow-sm" bodyStyle={{ padding: '28px' }}>
            <div className="flex items-center gap-2 mb-5 text-teal-600">
              <FilterOutlined />
              <Text strong className="uppercase tracking-widest text-[11px]">Filter Configuration</Text>
            </div>
            
            <Space direction="vertical" className="w-full" size="large">
              <Input 
                prefix={<SearchOutlined className="text-slate-300" />} 
                placeholder="Search shop name or address..." 
                className="h-12 rounded-xl bg-slate-50 border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Select 
                className="w-full h-12" 
                placeholder="All Regions" 
                allowClear 
                onChange={setRegionFilter}
                options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))}
              />
              <Select 
                mode="multiple"
                className="w-full" 
                placeholder="Schedule Status" 
                allowClear 
                onChange={setStatusFilter}
                maxTagCount="responsive"
                options={[
                  { label: 'Done', value: 'Done' },
                  { label: 'Planned', value: 'Planned' },
                  { label: 'Rescheduled', value: 'Rescheduled' },
                  { label: 'Unplanned', value: 'Unplanned' },
                  { label: 'Closed', value: 'Closed' },
                ]}
              />
            </Space>
          </Card>

          <Card className="flex-1 rounded-[32px] border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {/* ✅ 列表標題顏色填充 */}
            <div className="px-6 py-4 bg-teal-600 flex justify-between items-center">
              <Text strong className="text-white text-sm">
                <ShopOutlined className="mr-2" /> Filtered Results
              </Text>
              <Badge count={filteredShops.length} color="rgba(255,255,255,0.2)" style={{ boxShadow: 'none' }} />
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
              {filteredShops.length === 0 ? (
                <Empty description="No matching shops" className="mt-12" />
              ) : (
                filteredShops.map(shop => (
                  <div key={shop.id} className="p-4 mb-3 rounded-2xl hover:bg-slate-50 border border-slate-50 hover:border-slate-200 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-1">
                      <Text strong className="text-slate-700 group-hover:text-teal-600 truncate flex-1 pr-2">{shop.name}</Text>
                      <Tag className="m-0 border-none rounded-md px-2 text-[9px] font-black uppercase" color={shop.status === 'Done' ? 'green' : 'blue'}>
                        {shop.status}
                      </Tag>
                    </div>
                    <Text type="secondary" className="text-[11px] block italic truncate">{shop.address}</Text>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
