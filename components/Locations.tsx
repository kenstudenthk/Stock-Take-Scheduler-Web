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
  InfoCircleOutlined,
  PhoneOutlined
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
  const infoWindowRef = useRef<any>(null); // ✅ 儲存 InfoWindow 實例
  const markersRef = useRef<any[]>([]); 
  
  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [includeMasterClosed, setIncludeMasterClosed] = useState(false);

  // 1. 核心過濾邏輯
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || 
                          s.address.toLowerCase().includes(search.toLowerCase());
      const matchRegion = !regionFilter || s.region === regionFilter;
      const matchStatus = statusFilter.length === 0 || statusFilter.includes(s.status);
      const matchDate = !dateFilter || (
        s.scheduledDate && 
        dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateFilter.format('YYYY-MM-DD')
      );
      const matchMasterClosed = includeMasterClosed || s.masterStatus !== 'Closed';
      
      return matchSearch && matchRegion && matchStatus && matchDate && matchMasterClosed;
    });
  }, [shops, search, regionFilter, statusFilter, dateFilter, includeMasterClosed]);

  const stats = useMemo(() => ({
    total: filteredShops.length,
    completed: filteredShops.filter(s => s.status === 'Done').length,
    scheduled: filteredShops.filter(s => ['Planned', 'Rescheduled'].includes(s.status)).length,
    closed: filteredShops.filter(s => s.status === 'Closed').length
  }), [filteredShops]);

  // 2. 地圖初始化
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;
    
    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719], 
      zoom: 11, 
      viewMode: '3D'
    });

    // ✅ 初始化 InfoWindow
    infoWindowRef.current = new window.AMap.InfoWindow({
      offset: new window.AMap.Pixel(0, -20),
      isCustom: false // 使用預設樣式外框
    });
  }, []);

  // 3. 更新 Marker 與 InfoWindow 邏輯
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
        content: `<div style="background: ${shop.status === 'Done' ? '#10b981' : shop.status === 'Closed' ? '#ef4444' : '#3b82f6'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2); cursor: pointer;"></div>`
      });

      // ✅ 修正：點擊 Marker 時開啟 InfoWindow
      marker.on('click', () => {
        const content = `
          <div style="padding: 12px; width: 220px; font-family: 'Inter', sans-serif;">
            <div style="font-weight: 800; font-size: 14px; color: #1e293b; margin-bottom: 4px;">${shop.name}</div>
            <div style="font-size: 11px; color: #64748b; line-height: 1.4; margin-bottom: 10px;">
              <i class="environment-icon"></i> ${shop.address}
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #f1f5f9; pt-8 mt-8">
              <span style="font-size: 10px; font-weight: 900; color: white; background: ${shop.status === 'Done' ? '#10b981' : '#3b82f6'}; padding: 2px 8px; border-radius: 6px; text-transform: uppercase;">
                ${shop.status}
              </span>
              <span style="font-size: 10px; color: #94a3b8;">ID: ${shop.id}</span>
            </div>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, [lng, lat]);
      });

      return marker;
    });

    mapRef.current.add(newMarkers);
    markersRef.current = newMarkers;
    
    if (newMarkers.length > 0) mapRef.current.setFitView(newMarkers);
  }, [filteredShops]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div>
        <Title level={2} className="m-0 text-slate-800">Map View</Title>
        <Text className="text-slate-400 font-medium">Click markers to view shop details and audit progress.</Text>
      </div>

      <Row gutter={[20, 20]}>
        <Col span={6}><SummaryCard label="Total on Map" value={stats.total} bgColor="#1e293b" icon={<ShopOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#10b981" icon={<CheckCircleOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Scheduled" value={stats.scheduled} bgColor="#3b82f6" icon={<CalendarOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#ef4444" icon={<CloseCircleOutlined style={{color:'white'}} />} /></Col>
      </Row>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Space><CalendarOutlined className="text-teal-600" /><Text strong className="uppercase text-[11px] tracking-widest">Schedule Date Filter:</Text></Space>
          <DatePicker className="h-11 rounded-xl w-64 bg-slate-50 border-none" onChange={(date) => setDateFilter(date)} value={dateFilter} />
        </div>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <InfoCircleOutlined className="text-slate-400" /><Text className="text-[12px] font-bold text-slate-600">Include Last Year Closed?</Text>
          <Switch size="small" checked={includeMasterClosed} onChange={setIncludeMasterClosed} />
        </div>
      </div>

      <div className="flex gap-6 h-[720px]">
        <div id="map-container" className="flex-1 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50" style={{ height: '100%', width: '100%' }}></div>
        
        <div className="w-[400px] flex flex-col gap-4">
          <Card className="rounded-[32px] border-none shadow-sm" bodyStyle={{ padding: '28px' }}>
             <div className="flex items-center gap-2 mb-5 text-teal-600"><FilterOutlined /><Text strong className="uppercase tracking-widest text-[11px]">Filter</Text></div>
             <Space direction="vertical" className="w-full" size="large">
               <Input prefix={<SearchOutlined className="text-slate-300" />} placeholder="Search shop..." className="h-12 rounded-xl bg-slate-50 border-none" value={search} onChange={e => setSearch(e.target.value)} />
               <Select className="w-full h-12" placeholder="Region" allowClear onChange={setRegionFilter} options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))} />
               <Select mode="multiple" className="w-full" placeholder="Status" allowClear onChange={setStatusFilter} options={[{ label: 'Done', value: 'Done' }, { label: 'Planned', value: 'Planned' }, { label: 'Rescheduled', value: 'Rescheduled' }, { label: 'Unplanned', value: 'Unplanned' }, { label: 'Closed', value: 'Closed' }]} />
             </Space>
          </Card>

          <Card className="flex-1 rounded-[32px] border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0, display: 'flex', flexDirection: 'column' }}>
            <div className="px-6 py-4 bg-teal-600 flex justify-between items-center"><Text strong className="text-white text-sm"><ShopOutlined className="mr-2" /> Shop List</Text><Badge count={filteredShops.length} color="rgba(255,255,255,0.2)" /></div>
            <div className="flex-1 overflow-y-auto p-4 bg-white">
              {filteredShops.length === 0 ? <Empty className="mt-12" /> : filteredShops.map(shop => (
                <div key={shop.id} className="p-4 mb-3 rounded-2xl hover:bg-slate-50 border border-slate-50 transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-1">
                    <Text strong className="text-slate-700 truncate flex-1 pr-2">{shop.name}</Text>
                    <Tag className="m-0 border-none text-[9px] font-black" color={shop.status === 'Done' ? 'green' : 'blue'}>{shop.status}</Tag>
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
