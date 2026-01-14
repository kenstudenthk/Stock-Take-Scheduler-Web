import { wgs84ToGcj02 } from '../utils/coordTransform';
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker } from 'antd';
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

const { Title, Text } = Typography;

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
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]); // ✅ 新增：Schedule Status 篩選
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null); // ✅ 新增：日期篩選器

  // ✅ 核心篩選邏輯
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.address.toLowerCase().includes(search.toLowerCase());
      const matchRegion = !regionFilter || s.region === regionFilter;
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(s.status);
      const matchDate = !dateFilter || (s.scheduledDate && dayjs(s.scheduledDate).isSame(dateFilter, 'day'));
      
      return matchSearch && matchRegion && matchStatus && matchDate;
    });
  }, [shops, search, regionFilter, statusFilter, dateFilter]);

  // ✅ 統計數據邏輯 (對應地圖上的標記)
  const stats = useMemo(() => ({
    total: filteredShops.length,
    completed: filteredShops.filter(s => s.status === 'Done').length,
    scheduled: filteredShops.filter(s => ['Planned', 'Rescheduled'].includes(s.status)).length,
    closed: filteredShops.filter(s => s.status === 'Closed').length // ✅ 修改：最後一個改為 Closed
  }), [filteredShops]);

  // 地圖初始化與 Marker 更新邏輯保留 (節錄)
useEffect(() => {
  if (!window.AMap || !mapRef.current) return;

  // 清除舊標記
  mapRef.current.clearMap();

  filteredShops.forEach(shop => {
    // ✅ 進行座標轉換：由 WGS-84 轉為 GCJ-02
    const [gcjLng, gcjLat] = wgs84ToGcj02(shop.longitude, shop.latitude);

    const marker = new window.AMap.Marker({
      position: [gcjLng, gcjLat], // 使用轉換後的座標
      title: shop.name,
      map: mapRef.current,
      // 根據狀態設定不同的圖標顏色 (選用)
      content: `<div style="background: ${shop.status === 'Done' ? '#10b981' : '#3b82f6'}; 
                 width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`
    });
    

    // 點擊 Marker 顯示 InfoWindow (自定義資訊視窗)
    marker.on('click', () => {
      const infoWindow = new window.AMap.InfoWindow({
        content: `<div style="padding:12px; min-width:150px;">
                    <b style="font-size:14px; color:#333;">${shop.name}</b><br/>
                    <span style="font-size:12px; color:#666;">${shop.address}</span><br/>
                    <div style="margin-top:8px; font-weight:bold; color:teal;">Status: ${shop.status}</div>
                  </div>`,
        offset: new window.AMap.Pixel(0, -15)
      });
      infoWindow.open(mapRef.current, [gcjLng, gcjLat]);
    });
  });

  // 如果有結果，自動縮放地圖以適應所有標記
if (filteredShops.length > 0) {
    mapRef.current.setFitView();
  }
}, [filteredShops]);

  return (
    <div className="flex flex-col gap-6">
      {/* ✅ 1. Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Map View</Title>
          <Text className="text-slate-400 font-medium">Real-time shop locations and audit status.</Text>
        </div>
      </div>

      {/* ✅ 4. Summary Boxes */}
      <Row gutter={[20, 20]}>
        <Col span={6}><SummaryCard label="Total on Map" value={stats.total} bgColor="#1e293b" icon={<ShopOutlined style={{fontSize: 24, color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#10b981" icon={<CheckCircleOutlined style={{fontSize: 24, color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Scheduled" value={stats.scheduled} bgColor="#3b82f6" icon={<CalendarOutlined style={{fontSize: 24, color: 'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#ef4444" icon={<CloseCircleOutlined style={{fontSize: 24, color: 'white'}} />} /></Col>
      </Row>

      {/* ✅ 5. Date Picker below Summary */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
        <Text strong className="text-slate-500 uppercase text-[10px] tracking-widest"><CalendarOutlined /> Filter by Date:</Text>
        <DatePicker 
          className="h-10 rounded-xl custom-date-input" 
          onChange={(date) => setDateFilter(date)} 
          placeholder="Select Schedule Date"
        />
        {dateFilter && <Tag closable onClose={() => setDateFilter(null)} color="teal">{dateFilter.format('YYYY-MM-DD')}</Tag>}
      </div>

      <div className="flex gap-6 h-[700px]">
        {/* 左側地圖 */}
        <div id="map-container" className="flex-1 rounded-[32px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50"></div>

        {/* 右側篩選面板 */}
        <div className="w-[380px] flex flex-col gap-4">
          <Card className="rounded-3xl border-none shadow-sm" bodyStyle={{ padding: '24px' }}>
            {/* ✅ 2. Filter Title */}
            <div className="flex items-center gap-2 mb-4 text-teal-600">
              <FilterOutlined />
              <Text strong className="uppercase tracking-widest text-xs">Filter</Text>
            </div>
            
            <Space direction="vertical" className="w-full" size="middle">
              <Input 
                prefix={<SearchOutlined className="text-slate-400" />} 
                placeholder="Search shop name..." 
                className="h-11 rounded-xl bg-slate-50 border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Select 
                className="w-full h-11" 
                placeholder="Region" 
                allowClear 
                onChange={setRegionFilter}
                options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))}
              />
              {/* ✅ 3. Schedule Status Filter */}
              <Select 
                mode="multiple"
                className="w-full h-11" 
                placeholder="Schedule Status" 
                allowClear 
                onChange={setStatusFilter}
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

          <Card className="flex-1 rounded-3xl border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {/* ✅ 6. Colored Shop List Title */}
            <div className="p-4 bg-teal-600 text-white">
              <Title level={5} className="m-0 text-white flex items-center gap-2">
                <ShopOutlined /> Filter Shop List ({filteredShops.length})
              </Title>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {filteredShops.length === 0 ? (
                <Empty description="No shops found" className="mt-10" />
              ) : (
                filteredShops.map(shop => (
                  <div key={shop.id} className="p-3 mb-2 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-1">
                      <Text strong className="text-slate-700 group-hover:text-teal-600 transition-colors">{shop.name}</Text>
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
