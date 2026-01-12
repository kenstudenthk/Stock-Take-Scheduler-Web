import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Avatar, Table, Card, Row, Col, Space, Select, Input, Badge, Button, message, Typography, Tag } from 'antd'; // ✅ 補上 Tag 匯入
import { SearchOutlined, EnvironmentOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Shop } from '../types';

const { Text } = Typography;

// --- 1. 輔助函數 (放在外部是正確的) ---
const getGroupRowStyle = (groupId: number) => {
  switch (groupId) {
    case 1: return { backgroundColor: '#f0f9ff' }; // Group A - Light Blue
    case 2: return { backgroundColor: '#faf5ff' }; // Group B - Light Purple
    case 3: return { backgroundColor: '#fff7ed' }; // Group C - Light Orange
    default: return {};
  }
};

// 安全密鑰配置
if (typeof window !== 'undefined') {
  (window as any)._AMapSecurityConfig = { securityJsCode: 'e8fbca88770fac2110a951fab66651ab' };
}

export const Locations: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // --- 2. 狀態管理 (必須在組件內部) ---
  const [searchText, setSearchText] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [filteredShops, setFilteredShops] = useState<Shop[]>(shops);

  // ✅ 關鍵修復：當外部 shops 數據更新時，同步更新內部狀態
  useEffect(() => {
    setFilteredShops(shops);
  // 如果地圖已經初始化好了，立即更新標註點
    if (mapInstance.current) {
      updateMapMarkers(shops);
    }
  }, [shops]);

  // --- 3. 動態過濾選項 ---
  const regionOptions = useMemo(() => 
    Array.from(new Set(shops.map(s => s.region))).filter(Boolean).sort(), [shops]);

  const districtOptions = useMemo(() => {
    const filteredByRegion = selectedRegion === 'all' ? shops : shops.filter(s => s.region === selectedRegion);
    return Array.from(new Set(filteredByRegion.map(s => s.district))).filter(Boolean).sort();
  }, [shops, selectedRegion]);

  // --- 4. 核心過濾函數 ---
  const handleApplyFilters = () => {
    const results = shops.filter(shop => {
      const matchSearch = shop.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          shop.id.toLowerCase().includes(searchText.toLowerCase());
      const matchRegion = selectedRegion === 'all' || shop.region === selectedRegion;
      const matchDistrict = selectedDistrict === 'all' || shop.district === selectedDistrict;
      return matchSearch && matchRegion && matchDistrict;
    });
    setFilteredShops(results);
    updateMapMarkers(results);
    message.success(`Found ${results.length} shops`);
  };

  const handleReset = () => {
    setSearchText('');
    setSelectedRegion('all');
    setSelectedDistrict('all');
    setFilteredShops(shops);
    updateMapMarkers(shops);
  };

  // --- 5. 地圖控制邏輯 ---
  const updateMapMarkers = (targetShops: Shop[]) => {
    if (!mapInstance.current) || !(window as any).AMap) return;
    mapInstance.current.remove(markersRef.current);
    markersRef.current = [];

    const infoWindow = new (window as any).AMap.InfoWindow({
      offset: new (window as any).AMap.Pixel(0, -15),
      closeWhenClickMap: true
    });

   // 門市座標在 SharePoint 為空時會變成 0。
    // 修正為檢查數值是否不等於 0 或 undefined。
    const newMarkers = targetShops
      .filter(s => s.latitude !== 0 && s.longitude !== 0 && s.latitude != null) 
      .map(s => {
        const color = s.status === 'completed' ? '#10b981' : s.groupId === 1 ? '#0ea5e9' : '#f59e0b';
        const marker = new (window as any).AMap.Marker({
          position: [s.longitude, s.latitude],
          content: `<div style="background:${color}; width:14px; height:14px; border-radius:50%; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3); cursor:pointer;"></div>`,
          extData: s
        });

        marker.on('click', (e: any) => {
          const shop = e.target.getExtData();
          const content = `
            <div style="padding: 12px; min-width: 200px; font-family: sans-serif;">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <span style="font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase;">${shop.brand}</span>
                <span style="background: ${shop.status === 'completed' ? '#ecfdf5' : '#eff6ff'}; color: ${shop.status === 'completed' ? '#10b981' : '#3b82f6'}; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: bold;">${(shop.status || 'pending').toUpperCase()}</span>
              </div>
              <div style="font-weight: bold; color: #1e293b; font-size: 14px; margin-bottom: 4px;">${shop.name}</div>
              <div style="border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 8px; font-size: 11px; color: #475569;">
                <strong>Area:</strong> ${shop.district}<br/>
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
    
    // 如果有標註點，自動調整視野以顯示所有點
    if (newMarkers.length > 0) {
      mapInstance.current.setFitView(newMarkers);
    }
  };

  useEffect(() => {
    AMapLoader.load({
      key: "a444f584e377f930c102c6b0b2cb118e",
      version: "2.0",
      plugins: ['AMap.Marker'],
    }).then((AMap) => {
      if (!mapRef.current) return;
      mapInstance.current = new AMap.Map(mapRef.current, { zoom: 11, center: [114.177, 22.3] });
      updateMapMarkers(shops);
    });
    return () => mapInstance.current?.destroy();
  }, []);

  const handleExport = () => {
    const headers = "Name,Region,District,Status\n";
    const csvContent = filteredShops.map(s => `${s.name},${s.region},${s.district},${s.status}`).join("\n");
    const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "filtered_shops.csv";
    link.click();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 過濾工具欄 */}
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

      {/* 統計數值 */}
      <Row gutter={20}>
        <Col span={6}><StatCard title="Visible Shops" value={filteredShops.length} /></Col>
        <Col span={6}><StatCard title="Completed" value={filteredShops.filter(s => s.status === 'completed').length} color="text-emerald-500" /></Col>
        <Col span={6}><StatCard title="Scheduled" value={filteredShops.filter(s => s.status === 'scheduled').length} color="text-orange-500" /></Col>
        <Col span={6}><StatCard title="Pending" value={filteredShops.filter(s => s.status === 'pending').length} color="text-red-500" /></Col>
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
                  <Tag className="rounded-full border-none px-3 font-bold text-[10px]" color={s === 'completed' ? 'success' : 'processing'}>
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

// --- 6. 統計卡片組件 ---
const StatCard = ({ title, value, color = "text-slate-900" }: any) => (
  <Card size="small" className="border-none shadow-sm rounded-2xl bg-white h-full">
    <div className="flex flex-col p-2">
      <Text type="secondary" className="text-[10px] uppercase font-bold tracking-wider mb-1">{title}</Text>
      <Text className={`text-2xl font-black ${color}`}>{value}</Text>
    </div>
  </Card>
);

export default Locations;
