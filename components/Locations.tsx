import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Card, Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker, Badge, Switch, message } from 'antd'; 
import { 
  EnvironmentOutlined, 
  SearchOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  CalendarOutlined,
  CloseCircleOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  TagsOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { wgs84ToGcj02 } from '../utils/coordTransform';

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
  const infoWindowRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({}); 
  
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

  // ✅ 2. 地圖初始化與控制項加載
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;
    
    // 初始化地圖
    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719], 
      zoom: 11, 
      viewMode: '3D', // 3D 模式才能完整使用 ControlBar
      pitch: 45 // 初始傾斜角度
    });

    // 加載控制項插件
    window.AMap.plugin(['AMap.ToolBar', 'AMap.MapType', 'AMap.Scale', 'AMap.ControlBar'], () => {
      // 1. 縮放工具欄 (右下角)
      mapRef.current.addControl(new window.AMap.ToolBar({
        position: 'RB',
        offset: new window.AMap.Pixel(20, 40)
      }));

      // 2. 地圖類型切換 (右上角 - 衛星圖/普通圖)
      mapRef.current.addControl(new window.AMap.MapType({
        defaultType: 0, // 0: 2D, 1: 衛星圖
        position: 'RT'
      }));

      // 3. 比例尺 (左下角)
      mapRef.current.addControl(new window.AMap.Scale());

      // 4. 3D 控制盤 (左上角 - 控制旋轉和俯仰)
      mapRef.current.addControl(new window.AMap.ControlBar({
        position: {
          top: '20px',
          left: '20px'
        }
      }));
    });

    infoWindowRef.current = new window.AMap.InfoWindow({
      offset: new window.AMap.Pixel(0, -20)
    });
  }, []);

  // 3. 地圖聯動：列表點擊處理函數
  const handleShopClick = (shop: Shop) => {
    const marker = markersRef.current[shop.id];
    if (marker && mapRef.current) {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      mapRef.current.setZoomAndCenter(17, [lng, lat], false, 600); 
      marker.emit('click', { target: marker });
      message.success(`Focusing on: ${shop.name}`, 1);
    } else {
      message.warning("Marker not found on map.");
    }
  };

  // 4. 更新 Marker
  useEffect(() => {
    if (!mapRef.current) return;
    
    const existingMarkers = Object.values(markersRef.current);
    if (existingMarkers.length > 0) {
      mapRef.current.remove(existingMarkers);
      markersRef.current = {};
    }

    const newMarkersList: any[] = [];
    filteredShops.forEach(shop => {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      
      let markerColor = '#94a3b8'; 
      if (shop.status === 'Done') markerColor = '#10b981'; 
      else if (shop.status === 'Closed') markerColor = '#ef4444'; 
      else {
        if (shop.groupId === 1) markerColor = '#3b82f6'; 
        else if (shop.groupId === 2) markerColor = '#a855f7'; 
        else if (shop.groupId === 3) markerColor = '#f97316'; 
      }

      const marker = new window.AMap.Marker({
        position: [lng, lat],
        content: `<div style="background: ${markerColor}; width: 18px; height: 18px; border-radius: 50%; border: 2.5px solid white; box-shadow: 0 3px 6px rgba(0,0,0,0.3); cursor: pointer;"></div>`
      });

      marker.on('click', () => {
        const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : 'N/A';
        const content = `
          <div style="padding: 12px; min-width: 220px; font-family: 'Inter', sans-serif;">
            <div style="font-weight: 900; font-size: 14px; margin-bottom: 4px; color: #0f172a;">${shop.name}</div>
            <div style="font-size: 11px; color: #64748b; margin-bottom: 12px; line-height: 1.4;">${shop.address}</div>
            <div style="display: flex; gap: 8px; align-items: center;">
               <span style="background: ${markerColor}; color: white; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase;">
                 Group ${groupLetter}
               </span>
               <span style="background: #f1f5f9; color: #475569; padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 900; text-transform: uppercase;">
                 ${shop.status}
               </span>
            </div>
          </div>
        `;
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapRef.current, [lng, lat]);
      });

      markersRef.current[shop.id] = marker;
      newMarkersList.push(marker);
    });

    mapRef.current.add(newMarkersList);
    if (newMarkersList.length > 0) mapRef.current.setFitView(newMarkersList);
  }, [filteredShops]);

  return (
    <div className="w-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Interactive Map</Title>
          <Text className="text-slate-400 font-medium">Click on shop cards to locate on map.</Text>
        </div>
      </div>

      <Row gutter={[20, 20]}>
        <Col span={6}><SummaryCard label="Total on Map" value={stats.total} bgColor="#1e293b" icon={<ShopOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Completed" value={stats.completed} bgColor="#10b981" icon={<CheckCircleOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Scheduled" value={stats.scheduled} bgColor="#3b82f6" icon={<CalendarOutlined style={{color:'white'}} />} /></Col>
        <Col span={6}><SummaryCard label="Closed" value={stats.closed} bgColor="#ef4444" icon={<CloseCircleOutlined style={{color:'white'}} />} /></Col>
      </Row>

      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
        <Space size="large">
          <Space><CalendarOutlined className="text-teal-600" /><Text strong className="uppercase text-[11px] tracking-widest">Date Filter:</Text></Space>
          <DatePicker className="h-11 rounded-xl w-64 bg-slate-50 border-none" onChange={(date) => setDateFilter(date)} value={dateFilter} />
        </Space>
        <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
          <InfoCircleOutlined className="text-slate-400" /><Text className="text-[12px] font-bold text-slate-600">Include Last Year Closed?</Text>
          <Switch size="small" checked={includeMasterClosed} onChange={setIncludeMasterClosed} />
        </div>
      </div>

      <div className="flex items-center gap-6 px-2">
        <Space size={4} className="text-slate-400"><TagsOutlined /><Text className="text-[10px] uppercase font-black tracking-widest">Legend:</Text></Space>
        <div className="flex gap-4 flex-wrap">
          <Space><div className="w-3 h-3 rounded-full bg-[#3b82f6] border border-white shadow-sm" /><Text className="text-[11px] font-bold text-slate-500">Group A</Text></Space>
          <Space><div className="w-3 h-3 rounded-full bg-[#a855f7] border border-white shadow-sm" /><Text className="text-[11px] font-bold text-slate-500">Group B</Text></Space>
          <Space><div className="w-3 h-3 rounded-full bg-[#f97316] border border-white shadow-sm" /><Text className="text-[11px] font-bold text-slate-500">Group C</Text></Space>
          <div className="w-[1px] h-3 bg-slate-200 mx-1" />
          <Space><div className="w-3 h-3 rounded-full bg-[#10b981] border border-white shadow-sm" /><Text className="text-[11px] font-bold text-slate-500">Completed</Text></Space>
          <Space><div className="w-3 h-3 rounded-full bg-[#ef4444] border border-white shadow-sm" /><Text className="text-[11px] font-bold text-slate-500">Closed</Text></Space>
        </div>
      </div>

      <div className="flex gap-6 h-[720px]">
        <div id="map-container" className="flex-1 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50" style={{ height: '100%', width: '100%' }}></div>
        
        <div className="w-[400px] flex flex-col gap-4">
          <Card className="rounded-[32px] border-none shadow-sm" bodyStyle={{ padding: '24px' }}>
              <div className="flex items-center gap-2 mb-4 text-teal-600"><FilterOutlined /><Text strong className="uppercase tracking-widest text-[11px]">Quick Search</Text></div>
              <Space direction="vertical" className="w-full" size="middle">
                <Input prefix={<SearchOutlined className="text-slate-300" />} placeholder="Search shop..." className="h-11 rounded-xl bg-slate-50 border-none" value={search} onChange={e => setSearch(e.target.value)} />
                <Select className="w-full h-11 custom-select" placeholder="Region" allowClear onChange={setRegionFilter} options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))} />
              </Space>
          </Card>

          <Card className="flex-1 rounded-[32px] border-none shadow-sm overflow-hidden" bodyStyle={{ padding: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div className="px-6 py-4 bg-slate-800 flex justify-between items-center text-white">
              <Text strong className="text-white"><ShopOutlined className="mr-2" /> Result ({filteredShops.length})</Text>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white" style={{ minHeight: 0 }}>
              {filteredShops.length === 0 ? <Empty className="mt-12" /> : filteredShops.map(shop => {
                const groupColor = shop.groupId === 1 ? 'blue' : shop.groupId === 2 ? 'purple' : shop.groupId === 3 ? 'orange' : 'default';
                const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : '-';

                return (
                  <div 
                    key={shop.id} 
                    onClick={() => handleShopClick(shop)}
                    className="p-5 mb-4 rounded-3xl hover:bg-slate-50 border border-slate-100 hover:border-teal-200 transition-all cursor-pointer shadow-sm active:scale-95 group"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <Text strong className="text-slate-800 text-[14px] truncate flex-1 pr-2 group-hover:text-teal-600 transition-colors">{shop.name}</Text>
                      <Tag className="m-0 border-none text-[10px] font-black uppercase" color={shop.status === 'Done' ? 'green' : 'blue'}>{shop.status}</Tag>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="m-0 border-none text-[9px] font-black" color={groupColor}>GROUP {groupLetter}</Tag>
                      <Text type="secondary" className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{shop.id}</Text>
                    </div>
                    <Text type="secondary" className="text-[11px] block italic leading-relaxed text-slate-400 line-clamp-2">{shop.address}</Text>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
