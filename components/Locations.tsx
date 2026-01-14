import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker, Badge, Switch } from 'antd'; 
import { 
  EnvironmentOutlined, 
  SearchOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { wgs84ToGcj02 } from '../utils/coordTransform';

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
  const markersRef = useRef<any[]>([]); 
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null);
  // ✅ 新增：控制是否包含去年已關閉門市的狀態
  const [includeMasterClosed, setIncludeMasterClosed] = useState(false);

  // ✅ 1. 核心過濾邏輯
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      // A. 搜尋過濾
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.address.toLowerCase().includes(search.toLowerCase());
      // B. 區域過濾
      const matchRegion = !regionFilter || s.region === regionFilter;
      // C. 盤點狀態過濾
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(s.status);
      // D. 日期過濾
      const matchDate = !dateFilter || (
        s.scheduledDate && 
        dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateFilter.format('YYYY-MM-DD')
      );
      // ✅ E. 去年關閉門市過濾：如果不勾選「Include」，則排除 masterStatus 為 'Closed' 的門市
      const matchMasterClosed = includeMasterClosed || s.masterStatus !== 'Closed';
      
      return matchSearch && matchRegion && matchStatus && matchDate && matchMasterClosed;
    });
  }, [shops, search, regionFilter, statusFilter, dateFilter, includeMasterClosed]);

  // ✅ 2. 統計數據
  const stats = useMemo(() => ({
    total: filteredShops.length,
    completed: filteredShops.filter(s => s.status === 'Done').length,
    scheduled: filteredShops.filter(s => ['Planned', 'Rescheduled'].includes(s.status)).length,
    closed: filteredShops.filter(s => s.status === 'Closed').length
  }), [filteredShops]);

  // ✅ 3. 地圖初始化與 Marker 更新 (邏輯保持不變)
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;
    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719], zoom: 11, viewMode: '3D'
    });
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    if (markersRef.current.length > 0) {
      mapRef.current.remove(markersRef.current);
      markersRef.current = [];
    }
    const newMarkers = filteredShops.map(shop => {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: `<div style="background: ${shop.status === 'Done' ? '#10b981' : shop.status === 'Closed' ? '#ef4444' : '#3b82f6'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`
      });
      return marker;
    });
    mapRef.current.add(newMarkers);
    markersRef.current = newMarkers;
    if (newMarkers.length > 0) mapRef.current.setFitView(newMarkers);
  }, [filteredShops]);

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* 1. Header */}
      <div>
        <Title level={2} className="m-0 text-slate-800">Map View</Title>
        <Text className="text-slate-400 font-medium">Real-time status tracking on high-definition map.</Text>
      </div>

      {/* 4. Summary Boxes */}
      <Row gutter={[20, 20]}>
        <Col span={6}><SummaryCard label="Total on Map" value={stats.total} bgColor="#1e293b" icon={<ShopOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#10b981" icon={<CheckCircleOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Scheduled" value={stats.scheduled} bgColor="#3b82f6" icon={<CalendarOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#ef4444" icon={<CloseCircleOutlined style={{color:'white'}} />} /></Col>
      </Row>

      {/* ✅ 5. Date Picker & Include Closed Switch (位於統計盒下方) */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
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
        </div>

        {/* ✅ 新增：在右側加入 Include Last Year Closed Shop 開關 */}
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <InfoCircleOutlined className="text-slate-400" />
          <Text className="text-[12px] font-bold text-slate-600">Include Last Year Closed Shops?</Text>
          <Switch 
            size="small" 
            checked={includeMasterClosed} 
            onChange={setIncludeMasterClosed} 
            className={includeMasterClosed ? 'bg-teal-600' : 'bg-slate-300'}
          />
        </div>
      </div>

      <div className="flex gap-6 h-[720px]">
        {/* 地圖容器 */}
        <div id="map-container" className="flex-1 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50" style={{ height: '100%', width: '100%' }}></div>

        {/* 右側面板 */}
        <div className="w-[400px] flex flex-col gap-4">
          <Card className="rounded-[32px] border-none shadow-sm" bodyStyle={{ padding: '28px' }}>
            <div className="flex items-center gap-2 mb-5 text-teal-600">
              <FilterOutlined />
              <Text strong className="uppercase tracking-widest text-[11px]">Filter Configuration</Text>
            </div>
            
            <Space direction="vertical" className="w-full" size="large">
              <Input prefix={<SearchOutlined className="text-slate-300" />} placeholder="Search shop name..." className="h-12 rounded-xl bg-slate-50 border-none" value={search} onChange={e => setSearch(e.target.value)} />
              <Select className="w-full h-12" placeholder="All Regions" allowClear onChange={setRegionFilter} options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))} />
              <Select mode="multiple" className="w-full" placeholder="Schedule Status" allowClear onChange={setStatusFilter} options={[{ label: 'Done', value: 'Done' }, { label: 'Planned', value: 'Planned' }, { label: 'Rescheduled', value: 'Rescheduled' }, { label: 'Unplanned', value: 'Unplanned' }, { label: 'Closed', value: 'Closed' }]} />
            </Space>
          </Card>

          <Card className="flex-1 rounded-[32px] border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            {/* 6. Colored List Title */}
            <div className="px-6 py-4 bg-teal-600 flex justify-between items-center">
              <Text strong className="text-white text-sm"><ShopOutlined className="mr-2" /> Filtered Shop List</Text>
              <Badge count={filteredShops.length} color="rgba(255,255,255,0.2)" />
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white">
              {filteredShops.length === 0 ? <Empty className="mt-12" /> : filteredShops.map(shop => (
                <div key={shop.id} className="p-4 mb-3 rounded-2xl hover:bg-slate-50 border border-slate-50 hover:border-slate-200 transition-all cursor-pointer group">
                  <div className="flex justify-between items-start mb-1">
                    <Text strong className="text-slate-700 group-hover:text-teal-600 truncate flex-1 pr-2">{shop.name}</Text>
                    <Tag className="m-0 border-none text-[9px] font-black uppercase" color={shop.status === 'Done' ? 'green' : 'blue'}>{shop.status}</Tag>
                  </div>
                  <Text type="secondary" className="text-[11px] block italic truncate">{shop.address}</Text>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
