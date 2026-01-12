import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, Table, Card, Row, Col, Space, Select, Input, Button, message, Typography, Tag } from 'antd';
import { SearchOutlined, EnvironmentOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Shop } from '../types';

const { Text } = Typography;

// 安全密鑰配置
if (typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: 'e8fbca88770fac2110a951fab66651ab' };
}

const getGroupRowStyle = (groupId: number) => {
  switch (groupId) {
    case 1: return { backgroundColor: '#f0f9ff' };
    case 2: return { backgroundColor: '#faf5ff' };
    case 3: return { backgroundColor: '#fff7ed' };
    default: return {};
  }
};

export const Locations: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const AMapRef = useRef<any>(null); // 保存 AMap 建構對象

  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);

  // 當 shops 屬性更新時（例如 SharePoint 載入完成）
  useEffect(() => {
    setFilteredShops(shops);
    if (mapInstance.current) {
      updateMapMarkers(shops);
    }
  }, [shops]);

  const regionOptions = useMemo(() => 
    Array.from(new Set(shops.map(s => s.region))).filter(Boolean).sort(), [shops]);

  const districtOptions = useMemo(() => {
    const filteredByRegion = selectedRegion === 'all' ? shops : shops.filter(s => s.region === selectedRegion);
    return Array.from(new Set(filteredByRegion.map(s => s.district))).filter(Boolean).sort();
  }, [shops, selectedRegion]);

  // ✅ 核心更新：更強大的地圖標註邏輯
  const updateMapMarkers = (targetShops: Shop[]) => {
    if (!mapInstance.current || !AMapRef.current) return;

    // 1. 清除現有標註
    mapInstance.current.remove(markersRef.current);
    markersRef.current = [];

    const AMap = AMapRef.current;

    // 2. 建立資訊窗體
    const infoWindow = new AMap.InfoWindow({
      offset: new AMap.Pixel(0, -15),
      closeWhenClickMap: true
    });

    // 3. 過濾有效的座標 (排除 0, null, undefined 和 NaN)
    const validShops = targetShops.filter(s => 
      s.latitude && s.longitude && 
      !isNaN(s.latitude) && !isNaN(s.longitude) && 
      s.latitude !== 0
    );

    // 💡 偵錯用：如果地圖沒點，請打開瀏覽器按 F12 查看這行
    console.log(`Map: Processing ${targetShops.length} shops, Found ${validShops.length} valid coordinates.`);

    // 4. 建立新標註
    const newMarkers = validShops.map(s => {
        const color = s.status?.toLowerCase() === 'completed' ? '#10b981' : s.groupId === 1 ? '#0ea5e9' : '#f59e0b';
        const marker = new AMap.Marker({
          position: [s.longitude, s.latitude], // [經度, 緯度]
          content: `<div style="background:${color}; width:16px; height:16px; border-radius:50%; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); cursor:pointer;"></div>`,
          extData: s,
          anchor: 'center'
        });

        marker.on('click', (e: any) => {
          const shop = e.target.getExtData();
          const content = `
            <div style="padding: 12px; min-width: 220px; font-family: sans-serif;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${shop.brand}</span>
                <span style="background: ${shop.status === 'completed' ? '#ecfdf5' : '#eff6ff'}; color: ${shop.status === 'completed' ? '#10b981' : '#3b82f6'}; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: bold;">${(shop.status || 'pending').toUpperCase()}</span>
              </div>
              <div style="font-weight: bold; color: #1e293b; font-size: 14px; margin-bottom: 4px;">${shop.name}</div>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 8px; font-size: 11px; color: #475569;">
                <strong>District:</strong> ${shop.district}<br/>
                <strong>Address:</strong> ${shop.address}
              </div>
            </div>
          `;
          infoWindow.setContent(content);
          infoWindow.open(mapInstance.current, e.target.getPosition());
        });
        return marker;
      });

    markersRef.current = newMarkers;
    mapInstance.current.add(newMarkers);
    
    // 5. 自動縮放視野以包圍所有點
    if (newMarkers.length > 0) {
      mapInstance.current.setFitView(newMarkers, false, [60, 60, 60, 60]);
    }
  };

  const handleApplyFilters = () => {
    const results = shops.filter(shop => {
      const matchSearch = (shop.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
                          (shop.id || '').toLowerCase().includes(searchText.toLowerCase());
      const matchRegion = selectedRegion === 'all' || shop.region === selectedRegion;
      const matchDistrict = selectedDistrict === 'all' || shop.district === selectedDistrict;
      return matchSearch && matchRegion && matchDistrict;
    });
    setFilteredShops(results);
    updateMapMarkers(results);
    message.success(`Showing ${results.length} results`);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedRegion('all');
    setSelectedDistrict('all');
    setFilteredShops(shops);
    updateMapMarkers(shops);
  };

  useEffect(() => {
    AMapLoader.load({
      key: "a444f584e377f930c102c6b0b2cb118e",
      version: "2.0",
      plugins: ['AMap.Marker', 'AMap.InfoWindow'],
    }).then((AMap) => {
      if (!mapRef.current) return;
      AMapRef.current = AMap; // 儲存對象供後續使用
      mapInstance.current = new AMap.Map(mapRef.current, { 
        zoom: 11, 
        center: [114.177, 22.3],
        viewMode: '2D'
      });
      updateMapMarkers(shops);
    }).catch(e => {
      console.error("AMap Load Error:", e);
    });
    return () => mapInstance.current?.destroy();
  }, []);

  const handleExport = () => {
    const headers = "Name,Region,District,Status\n";
    const csvContent = filteredShops.map(s => `${s.name},${s.region},${s.district},${s.status}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "shop_locations.csv";
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      <Card bodyStyle={{ padding: '16px 24px' }} className="border-none shadow-sm rounded-2xl">
        <Row gutter={16} align="middle">
          <Col span={6}>
            <Input 
              prefix={<SearchOutlined className="text-slate-400" />} 
              placeholder="Search Shop Name..." 
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="rounded-xl bg-slate-50 border-none h-11"
            />
          </Col>
          <Col span={12}>
            <Space size="middle">
              <Select value={selectedRegion} onChange={v => { setSelectedRegion(v); setSelectedDistrict('all'); }} className="w-40">
                <Select.Option value="all">All Regions</Select.Option>
                {regionOptions.map(r => <Select.Option key={r} value={r}>{r}</Select.Option>)}
              </Select>
              <Select value={selectedDistrict} onChange={setSelectedDistrict} className="w-40">
                <Select.Option value="all">All Districts</Select.Option>
                {districtOptions.map(d => <Select.Option key={d} value={d}>{d}</Select.Option>)}
              </Select>
              <Button icon={<ReloadOutlined />} onClick={handleReset} className="rounded-xl h-11">Reset</Button>
              <Button type="primary" onClick={handleApplyFilters} className="bg-teal-600 h-11 rounded-xl">Apply Filters</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={20}>
        <Col span={6}><StatCard title="Visible Shops" value={filteredShops.length} /></Col>
        <Col span={6}><StatCard title="Completed" value={filteredShops.filter(s => s.status?.toLowerCase() === 'completed').length} color="text-emerald-500" /></Col>
        <Col span={6}><StatCard title="Scheduled" value={filteredShops.filter(s => s.status?.toLowerCase() === 'scheduled').length} color="text-orange-500" /></Col>
        <Col span={6}><StatCard title="Pending" value={filteredShops.filter(s => s.status?.toLowerCase() === 'pending').length} color="text-red-500" /></Col>
      </Row>

      <Row gutter={20}>
        <Col span={15}>
          <div ref={mapRef} style={{ height: '580px', borderRadius: '24px', overflow: 'hidden', border: '1px solid #f1f5f9' }} />
        </Col>

        <Col span={9}>
          <Card 
            title={<Text strong>Filtered Shop List</Text>} 
            extra={<Button type="text" icon={<DownloadOutlined />} onClick={handleExport} />} 
            className="border-none shadow-sm h-[580px] flex flex-col rounded-3xl"
            bodyStyle={{ padding: 0, flex: 1, overflow: 'hidden' }}
          >
            <Table 
              dataSource={filteredShops} 
              pagination={{ pageSize: 10, size: 'small' }}
              size="small"
              rowKey="id"
              scroll={{ y: 440 }}
              onRow={(record) => ({
                style: getGroupRowStyle(record.groupId),
                className: 'transition-colors hover:brightness-95'
              })}
              columns={[
                { title: '', dataIndex: 'brandIcon', width: 50, render: (src) => <Avatar src={src} shape="square" size="small" /> },
                { title: 'Shop Name', dataIndex: 'name', render: (t) => <Text strong className="text-xs">{t}</Text> },
                { title: 'Area', dataIndex: 'area', render: (t) => <Text type="secondary" className="text-xs">{t || 'N/A'}</Text> },
                { title: 'Status', dataIndex: 'status', width: 110, render: (s) => (
                  <Tag className="rounded-full border-none px-3 font-bold text-[10px]" color={s?.toLowerCase() === 'completed' ? 'success' : 'processing'}>
                    {(s || 'pending').toUpperCase()}
                  </Tag>
                )},
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const StatCard = ({ title, value, color = "text-slate-900" }: any) => (
  <Card size="small" className="border-none shadow-sm rounded-2xl bg-white h-full">
    <div className="flex flex-col p-2">
      <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider mb-1">{title}</Text>
      <Text className={`text-2xl font-black ${color}`}>{value}</Text>
    </div>
  </Card>
);

export default Locations;
