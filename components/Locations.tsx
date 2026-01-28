import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker, Switch, message } from 'antd';
import { Search, Store, CheckCircle2, Calendar, XCircle, Filter, Info, Tags } from 'lucide-react';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { wgs84ToGcj02 } from '../utils/coordTransform';

const { Title, Text } = Typography;

// --- Marker Color Constants ---
const MARKER_COLORS = {
  GROUP_A: '#3B82F6',
  GROUP_B: '#A855F7',
  GROUP_C: '#F97316',
  DONE: '#10B981',
  CLOSED: '#EF4444',
  DEFAULT: '#94A3B8'
} as const;

// --- Batch Size for Marker Rendering ---
const BATCH_SIZE = 50;

// --- Overlap Detection Configuration ---
const OVERLAP_CONFIG = {
  PRECISION: 5,      // Coordinate precision (decimal places) - ~1 meter accuracy
  RADIUS: 0.00008,   // Offset radius in degrees (~8-10 meters)
} as const;

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
  const offsetCoordsRef = useRef<Map<string, [number, number]>>(new Map());

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

  // Helper function to get marker color
  const getMarkerColor = useCallback((shop: Shop): string => {
    if (shop.status === 'Done') return MARKER_COLORS.DONE;
    if (shop.status === 'Closed') return MARKER_COLORS.CLOSED;
    if (shop.groupId === 1) return MARKER_COLORS.GROUP_A;
    if (shop.groupId === 2) return MARKER_COLORS.GROUP_B;
    if (shop.groupId === 3) return MARKER_COLORS.GROUP_C;
    return MARKER_COLORS.DEFAULT;
  }, []);

  /**
   * Calculate offset coordinates for overlapping markers (防重疊)
   * Groups shops by rounded coordinates and arranges overlapping markers in a radial pattern
   * @param shopsToProcess - Array of shops to process
   * @returns Map<shopId, [offsetLng, offsetLat]> with GCJ-02 coordinates
   */
  const offsetOverlappingMarkers = useCallback((shopsToProcess: Shop[]): Map<string, [number, number]> => {
    const offsetMap = new Map<string, [number, number]>();
    const positionGroups = new Map<string, Shop[]>();

    // 1. Group shops by rounded coordinates (PRECISION decimal places)
    shopsToProcess.forEach(shop => {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      const key = `${lng.toFixed(OVERLAP_CONFIG.PRECISION)},${lat.toFixed(OVERLAP_CONFIG.PRECISION)}`;

      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(shop);
    });

    // 2. Calculate offsets for each group
    positionGroups.forEach((groupShops, key) => {
      const [baseLng, baseLat] = key.split(',').map(Number);
      const count = groupShops.length;

      if (count === 1) {
        // Single marker - no offset needed, use original converted coordinates
        const [lng, lat] = wgs84ToGcj02(groupShops[0].longitude, groupShops[0].latitude);
        offsetMap.set(groupShops[0].id, [lng, lat]);
      } else {
        // Multiple markers - arrange in radial pattern
        groupShops.forEach((shop, index) => {
          const angle = (2 * Math.PI * index) / count;
          const offsetLng = baseLng + OVERLAP_CONFIG.RADIUS * Math.cos(angle);
          const offsetLat = baseLat + OVERLAP_CONFIG.RADIUS * Math.sin(angle);
          offsetMap.set(shop.id, [offsetLng, offsetLat]);
        });
      }
    });

    return offsetMap;
  }, []);

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
  const handleShopClick = useCallback((shop: Shop) => {
    const marker = markersRef.current[shop.id];
    if (marker && mapRef.current) {
      // Use offset coordinates if available, otherwise fallback to original
      const [lng, lat] = offsetCoordsRef.current.get(shop.id) || wgs84ToGcj02(shop.longitude, shop.latitude);
      mapRef.current.setZoomAndCenter(17, [lng, lat], false, 600);
      marker.emit('click', { target: marker });
      message.success(`Focusing on: ${shop.name}`, 1);
    } else {
      message.warning("Marker not found on map.");
    }
  }, []);

  // 4. 更新 Marker with batch rendering for performance
  useEffect(() => {
    if (!mapRef.current) return;

    // Calculate offset coordinates for overlapping markers (防重疊)
    const offsetCoords = offsetOverlappingMarkers(filteredShops);
    offsetCoordsRef.current = offsetCoords;

    const existingMarkers = Object.values(markersRef.current);
    if (existingMarkers.length > 0) {
      mapRef.current.remove(existingMarkers);
      markersRef.current = {};
    }

    const newMarkersList: any[] = [];
    let currentIndex = 0;

    const processBatch = () => {
      const batch = filteredShops.slice(currentIndex, currentIndex + BATCH_SIZE);

      batch.forEach(shop => {
        // Use offset coordinates to prevent marker overlap
        const [lng, lat] = offsetCoords.get(shop.id) || wgs84ToGcj02(shop.longitude, shop.latitude);
        const markerColor = getMarkerColor(shop);

        const marker = new window.AMap.Marker({
          position: [lng, lat],
          content: `<div class="map-marker-dot" style="background: ${markerColor};"></div>`
        });

        marker.on('click', () => {
          const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : 'N/A';
          const content = `
            <div class="map-infowindow">
              <div class="map-infowindow-name">${shop.name}</div>
              <div class="map-infowindow-address">${shop.address}</div>
              <div class="map-infowindow-tags">
                <span class="map-infowindow-tag map-infowindow-tag--group" style="background: ${markerColor};">
                  Group ${groupLetter}
                </span>
                <span class="map-infowindow-tag map-infowindow-tag--status">
                  ${shop.status}
                </span>
              </div>
            </div>
          `;
          infoWindowRef.current.setContent(content);
          // InfoWindow opens at offset position
          infoWindowRef.current.open(mapRef.current, [lng, lat]);
        });

        markersRef.current[shop.id] = marker;
        newMarkersList.push(marker);
      });

      currentIndex += BATCH_SIZE;

      if (currentIndex < filteredShops.length) {
        requestAnimationFrame(processBatch);
      } else {
        // All batches processed, add markers to map
        mapRef.current.add(newMarkersList);
        if (newMarkersList.length > 0) {
          mapRef.current.setFitView(newMarkersList);
        }
      }
    };

    requestAnimationFrame(processBatch);
  }, [filteredShops, getMarkerColor, offsetOverlappingMarkers]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Interactive Map</Title>
          <Text className="text-slate-400 font-medium">Click on shop cards to locate on map.</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[20, 20]}>
        <Col span={6}>
          <SummaryCard
            label="Total on Map"
            value={stats.total}
            bgColor="#1e293b"
            icon={<Store size={20} color="white" />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Completed"
            value={stats.completed}
            bgColor={MARKER_COLORS.DONE}
            icon={<CheckCircle2 size={20} color="white" />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Scheduled"
            value={stats.scheduled}
            bgColor={MARKER_COLORS.GROUP_A}
            icon={<Calendar size={20} color="white" />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Closed"
            value={stats.closed}
            bgColor={MARKER_COLORS.CLOSED}
            icon={<XCircle size={20} color="white" />}
          />
        </Col>
      </Row>

      {/* Glassmorphism Filter Panel */}
      <div className="glass-filter-panel flex items-center justify-between">
        <Space size="large">
          <div className="filter-section-label">
            <Calendar size={16} className="text-teal-600" />
            <span>Date Filter:</span>
          </div>
          <DatePicker
            className="h-11 rounded-xl w-64 bg-slate-50 border-none"
            onChange={(date) => setDateFilter(date)}
            value={dateFilter}
          />
        </Space>
        <div className="include-closed-toggle">
          <Info size={16} className="text-slate-400" />
          <span className="include-closed-label">Include Last Year Closed?</span>
          <Switch size="small" checked={includeMasterClosed} onChange={setIncludeMasterClosed} />
        </div>
      </div>

      {/* Legend */}
      <div className="legend-section">
        <div className="legend-label">
          <Tags size={14} />
          <span>Legend:</span>
        </div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-dot" style={{ background: MARKER_COLORS.GROUP_A }} />
            <span className="legend-text">Group A</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: MARKER_COLORS.GROUP_B }} />
            <span className="legend-text">Group B</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: MARKER_COLORS.GROUP_C }} />
            <span className="legend-text">Group C</span>
          </div>
          <div className="legend-divider" />
          <div className="legend-item">
            <div className="legend-dot" style={{ background: MARKER_COLORS.DONE }} />
            <span className="legend-text">Completed</span>
          </div>
          <div className="legend-item">
            <div className="legend-dot" style={{ background: MARKER_COLORS.CLOSED }} />
            <span className="legend-text">Closed</span>
          </div>
        </div>
      </div>

      {/* Main Content: Map + Sidebar */}
      <div className="flex gap-6 h-[720px]">
        {/* Map Container */}
        <div
          id="map-container"
          className="locations-map-container"
          style={{ height: '100%', width: '100%' }}
        />

        {/* Bento Card Sidebar */}
        <div className="w-[400px] bento-sidebar">
          {/* Search Card */}
          <div className="bento-search-card">
            <div className="filter-section-label mb-4">
              <Filter size={16} className="text-teal-600" />
              <span>Quick Search</span>
            </div>
            <Space direction="vertical" className="w-full" size="middle">
              <Input
                prefix={<Search size={16} className="text-slate-300" />}
                placeholder="Search shop..."
                className="h-11 rounded-xl bg-slate-50 border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <Select
                className="w-full h-11 custom-select"
                placeholder="Region"
                allowClear
                onChange={setRegionFilter}
                options={Array.from(new Set(shops.map(s => s.region))).map(r => ({ label: r, value: r }))}
              />
            </Space>
          </div>

          {/* Results Card */}
          <div className="bento-results-card">
            <div className="bento-results-header">
              <div className="bento-results-header-text">
                <Store size={16} />
                <span>Result ({filteredShops.length})</span>
              </div>
            </div>

            <div className="bento-results-list custom-scrollbar">
              {filteredShops.length === 0 ? (
                <Empty className="mt-12" />
              ) : (
                filteredShops.map(shop => {
                  const groupColor = shop.groupId === 1 ? 'blue' : shop.groupId === 2 ? 'purple' : shop.groupId === 3 ? 'orange' : 'default';
                  const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : '-';

                  return (
                    <div
                      key={shop.id}
                      onClick={() => handleShopClick(shop)}
                      onKeyDown={(e) => e.key === 'Enter' && handleShopClick(shop)}
                      tabIndex={0}
                      role="button"
                      aria-label={`View ${shop.name} on map`}
                      className="bento-shop-item"
                    >
                      <div className="bento-shop-name truncate pr-2">{shop.name}</div>
                      <div className="bento-shop-tags">
                        <Tag
                          className="m-0 border-none text-[9px] font-black"
                          color={groupColor}
                        >
                          GROUP {groupLetter}
                        </Tag>
                        <Tag
                          className="m-0 border-none text-[10px] font-black uppercase"
                          color={shop.status === 'Done' ? 'green' : 'blue'}
                        >
                          {shop.status}
                        </Tag>
                        <Text type="secondary" className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                          {shop.id}
                        </Text>
                      </div>
                      <div className="bento-shop-address italic">{shop.address}</div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
