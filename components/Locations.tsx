import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { Select, Input, Typography, Empty, DatePicker, Switch, message, Card } from 'antd';
import {
  MapPin, Search, Store, CheckCircle, Calendar, XCircle,
  Filter, Info, Tags
} from 'lucide-react';
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Select, Input, Typography, Tag, Space, Row, Col, Empty, DatePicker, Switch, message } from 'antd';
import { Search, Store, CheckCircle2, Calendar, XCircle, Filter, Info, Tags } from 'lucide-react';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { wgs84ToGcj02 } from '../utils/coordTransform';

const { Title, Text } = Typography;

// --- Legend category helper ---
const getShopCategory = (shop: Shop): string => {
  if (shop.status === 'Done') return 'completed';
  if (shop.status === 'Closed') return 'closed';
  if (shop.groupId === 1) return 'group-a';
  if (shop.groupId === 2) return 'group-b';
  if (shop.groupId === 3) return 'group-c';
  return 'other';
};

// --- Marker color from category ---
const CATEGORY_COLORS: Record<string, string> = {
  'group-a': '#3B82F6',
  'group-b': '#A855F7',
  'group-c': '#F59E0B',
  'completed': '#22C55E',
  'closed': '#EF4444',
  'other': '#94A3B8',
};

const getMarkerColor = (shop: Shop): string => {
  return CATEGORY_COLORS[getShopCategory(shop)] ?? '#94A3B8';
};

// --- Legend items config ---
const LEGEND_ITEMS = [
  { key: 'group-a', label: 'Group A', color: '#3B82F6' },
  { key: 'group-b', label: 'Group B', color: '#A855F7' },
  { key: 'group-c', label: 'Group C', color: '#F59E0B' },
  { key: '__divider__', label: '', color: '' },
  { key: 'completed', label: 'Completed', color: '#22C55E' },
  { key: 'closed', label: 'Closed', color: '#EF4444' },
];

// --- BentoStatCard (consistent with ShopList) ---
const BentoStatCard = memo(({
  title, value, icon, color, size = 'normal'
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  size?: 'normal' | 'large';
}) => (
  <div
    className={`bento-stat-card bento-${size}`}
    style={{ '--accent-color': color } as React.CSSProperties}
  >
    <div className="bento-stat-icon">{icon}</div>
    <div className="bento-stat-content">
      <span className="bento-stat-value">{value}</span>
      <span className="bento-stat-title">{title}</span>
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
));

// --- ShopBentoCard ---
const ShopBentoCard = memo(({
  shop, onClick, isActive
}: {
  shop: Shop;
  onClick: () => void;
  isActive: boolean;
}) => {
  const groupColor = getMarkerColor(shop);
  const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : '-';

  return (
    <button
      onClick={onClick}
      className={`shop-bento-card ${isActive ? 'shop-bento-card--active' : ''}`}
      style={{ '--card-accent': groupColor } as React.CSSProperties}
      aria-label={`View ${shop.name} on map. Status: ${shop.status}, Group ${groupLetter}`}
    >
      <div className="shop-bento-header">
        <span className="shop-bento-name">{shop.name}</span>
        <span className="shop-bento-status" data-status={shop.status?.toLowerCase()}>
          {shop.status}
        </span>
      </div>
      <div className="shop-bento-meta">
        <span className="shop-bento-group" style={{ backgroundColor: groupColor }}>
          Group {groupLetter}
        </span>
        <span className="shop-bento-id">{shop.id}</span>
      </div>
      <p className="shop-bento-address">
        <MapPin className="w-3 h-3" strokeWidth={2} />
        {shop.address}
      </p>
    </button>
  );
});

// --- Main component ---
export const Locations: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const mapRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const markersRef = useRef<{ [key: string]: any }>({});

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null);
  const [includeMasterClosed, setIncludeMasterClosed] = useState(false);
  const [activeShopId, setActiveShopId] = useState<string | null>(null);
  const [legendFilters, setLegendFilters] = useState<Set<string>>(new Set());

  // 1. Core filter (search / region / date / masterClosed)
  const filteredShops = useMemo(() => {
    return shops.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.address.toLowerCase().includes(search.toLowerCase());
      const matchRegion = !regionFilter || s.region === regionFilter;
      const matchDate = !dateFilter || (
        s.scheduledDate &&
        dayjs(s.scheduledDate).format('YYYY-MM-DD') === dateFilter.format('YYYY-MM-DD')
      );
      const matchMasterClosed = includeMasterClosed || s.masterStatus !== 'Closed';

      return matchSearch && matchRegion && matchStatus && matchDate && matchMasterClosed;
    });
  }, [shops, search, regionFilter, dateFilter, includeMasterClosed]);

  // 2. Legend counts (always based on filteredShops)
  const legendCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'group-a': 0, 'group-b': 0, 'group-c': 0, 'completed': 0, 'closed': 0
    };
    filteredShops.forEach(shop => {
      const cat = getShopCategory(shop);
      if (cat in counts) counts[cat]++;
    });
    return counts;
  }, [filteredShops]);

  // 3. Apply legend filter on top → displayedShops
  const displayedShops = useMemo(() => {
    if (legendFilters.size === 0) return filteredShops;
    return filteredShops.filter(shop => legendFilters.has(getShopCategory(shop)));
  }, [filteredShops, legendFilters]);

  // Stats from displayedShops (what's actually on the map)
  const stats = useMemo(() => ({
    total: displayedShops.length,
    completed: displayedShops.filter(s => s.status === 'Done').length,
    scheduled: displayedShops.filter(s => ['Planned', 'Rescheduled'].includes(s.status)).length,
    closed: displayedShops.filter(s => s.status === 'Closed').length
  }), [displayedShops]);

  // Region options
  const regionOptions = useMemo(() =>
    Array.from(new Set(shops.map(s => s.region))).filter(Boolean).map(r => ({ label: r, value: r })),
    [shops]
  );

  // Legend toggle handler
  const toggleLegend = useCallback((key: string) => {
    setLegendFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  // --- Map init ---
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;

    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719],
      zoom: 11,
      viewMode: '3D',
      pitch: 45
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

    window.AMap.plugin(['AMap.ToolBar', 'AMap.MapType', 'AMap.Scale', 'AMap.ControlBar'], () => {
      mapRef.current.addControl(new window.AMap.ToolBar({ position: 'RB', offset: new window.AMap.Pixel(20, 40) }));
      mapRef.current.addControl(new window.AMap.MapType({ defaultType: 0, position: 'RT' }));
      mapRef.current.addControl(new window.AMap.Scale());
      mapRef.current.addControl(new window.AMap.ControlBar({ position: { top: '20px', left: '20px' } }));
    });

    infoWindowRef.current = new window.AMap.InfoWindow({ offset: new window.AMap.Pixel(0, -20) });
  }, []);

  // --- Shop click → smooth pan ---
  const handleShopClick = useCallback((shop: Shop) => {
    const marker = markersRef.current[shop.id];
    if (!marker || !mapRef.current) {
      message.warning('Marker not found on map.');
      return;
    }
    setActiveShopId(shop.id);
    const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
    mapRef.current.setZoomAndCenter(17, [lng, lat], false, 800);
    setTimeout(() => {
      marker.emit('click', { target: marker });
    }, 400);
    message.success(`Viewing: ${shop.name}`, 1.5);
  }, []);

  // --- Create InfoWindow content (accessible) ---
  const createInfoContent = useCallback((shop: Shop, color: string) => {
    const groupLetter = shop.groupId ? String.fromCharCode(64 + shop.groupId) : 'N/A';
    return `
      <div class="info-window" role="dialog" aria-label="Shop details for ${shop.name}">
        <h3 class="info-window-title">${shop.name}</h3>
        <p class="info-window-address">${shop.address}</p>
        <div class="info-window-tags">
          <span class="info-window-tag info-window-tag--group" style="background-color:${color};">Group ${groupLetter}</span>
          <span class="info-window-tag info-window-tag--status" data-status="${shop.status?.toLowerCase()}">${shop.status}</span>
        </div>
      </div>
    `;
  }, []);

  // --- Update markers ---
  useEffect(() => {
    if (!mapRef.current) return;

    requestAnimationFrame(() => {
      // Clear existing
      const existing = Object.values(markersRef.current);
      if (existing.length > 0) {
        mapRef.current.remove(existing);
        markersRef.current = {};
      }

      const newMarkers: any[] = [];

      displayedShops.forEach(shop => {
        const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
        const color = getMarkerColor(shop);
        const isActive = shop.id === activeShopId;

        const markerContent = `
          <div class="map-marker ${isActive ? 'map-marker--active' : ''}" style="--marker-color:${color};" role="button" aria-label="${shop.name} marker">
            <div class="map-marker-inner"></div>
            ${isActive ? '<div class="map-marker-pulse"></div>' : ''}
          </div>
        `;

        const marker = new window.AMap.Marker({
          position: [lng, lat],
          content: markerContent,
        });

        marker.on('click', () => {
          setActiveShopId(shop.id);
          infoWindowRef.current.setContent(createInfoContent(shop, color));
          infoWindowRef.current.open(mapRef.current, [lng, lat]);
        });

        markersRef.current[shop.id] = marker;
        newMarkers.push(marker);
      });

      mapRef.current.add(newMarkers);
      if (newMarkers.length > 0) mapRef.current.setFitView(newMarkers);
    });
  }, [displayedShops, activeShopId, createInfoContent]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Interactive Map</Title>
          <Text className="text-slate-400 font-medium">Click on shop cards or legend to filter the map.</Text>
        </div>
      </div>

      {/* Bento Stats Grid */}
      <div className="bento-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '16px' }}>
        <BentoStatCard title="Total on Map" value={stats.total} icon={<Store className="w-6 h-6" />} color="var(--card-total)" size="large" />
        <BentoStatCard title="Completed" value={stats.completed} icon={<CheckCircle className="w-6 h-6" />} color="var(--marker-done)" />
        <BentoStatCard title="Scheduled" value={stats.scheduled} icon={<Calendar className="w-6 h-6" />} color="var(--marker-group-a)" />
        <BentoStatCard title="Closed" value={stats.closed} icon={<XCircle className="w-6 h-6" />} color="var(--marker-closed)" />
      </div>

      {/* Glassmorphism Filter Bar */}
      <div className="glass-filter-bar">
        <div className="glass-filter-group">
          <Calendar className="w-5 h-5 text-blue-700" strokeWidth={2} />
          <label className="glass-filter-label">Schedule Date</label>
          <DatePicker
            className="glass-date-picker"
            onChange={(date) => setDateFilter(date)}
            value={dateFilter}
            aria-label="Filter by schedule date"
          />
        </div>

        <div className="glass-filter-divider" />

        <div className="glass-filter-group">
          <Info className="w-5 h-5 text-slate-400" strokeWidth={2} />
          <label className="glass-filter-label" htmlFor="include-closed-toggle">
            Include Last Year Closed
          </label>
          <Switch
            size="small"
            checked={includeMasterClosed}
            onChange={setIncludeMasterClosed}
          />
        </div>
      </div>

      {/* Interactive Legend with counts */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-slate-400 flex-shrink-0">
          <Tags className="w-4 h-4" strokeWidth={2} />
          <span className="text-[10px] uppercase font-black tracking-widest">Legend:</span>
        </div>
        <div className="legend-panel" role="group" aria-label="Filter map by category">
          {LEGEND_ITEMS.map((item) => {
            if (item.key === '__divider__') {
              return <div key="div" className="legend-divider" />;
            }
            const isActive = legendFilters.has(item.key);
            const hasAnyFilter = legendFilters.size > 0;
            const isDimmed = hasAnyFilter && !isActive;
            return (
              <button
                key={item.key}
                className={`legend-toggle ${isActive ? 'legend-toggle--active' : ''} ${isDimmed ? 'legend-toggle--dimmed' : ''}`}
                style={{ '--legend-color': item.color } as React.CSSProperties}
                onClick={() => toggleLegend(item.key)}
                aria-pressed={isActive}
                aria-label={`${item.label}: ${legendCounts[item.key] ?? 0} shops`}
              >
                <span className="legend-dot" />
                <span className="legend-label-text">{item.label}</span>
                <span className="legend-count">{legendCounts[item.key] ?? 0}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Map + Sidebar */}
      <div className="flex gap-6 h-[720px]">
        <div
          id="map-container"
          className="flex-1 rounded-[40px] overflow-hidden border border-slate-100 shadow-sm bg-slate-50"
          style={{ height: '100%', width: '100%' }}
        />

        <div className="w-[400px] flex flex-col gap-4">
          {/* Search Card */}
          <Card className="rounded-[32px] border-none shadow-sm" styles={{ body: { padding: '24px' } }}>
            <div className="flex items-center gap-2 mb-4 text-blue-700">
              <Filter className="w-4 h-4" strokeWidth={2} />
              <Text strong className="uppercase tracking-widest text-[11px]">Quick Search</Text>
            </div>
            <div className="flex flex-col gap-3 w-full">
              <Input
                prefix={<Search className="w-4 h-4 text-slate-300" strokeWidth={2} />}
                placeholder="Search shop..."
                className="h-11 rounded-xl bg-slate-50 border-none"
                value={search}
                onChange={e => setSearch(e.target.value)}
                aria-label="Search shops by name or address"
              />
              <Select
                className="w-full h-11 custom-select"
                placeholder="Region"
                allowClear
                onChange={setRegionFilter}
                options={regionOptions}
                aria-label="Filter by region"
              />
            </div>
          </Card>

          {/* Results Card */}
          <Card
            className="flex-1 rounded-[32px] border-none shadow-sm overflow-hidden"
            styles={{ body: { padding: 0, height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 } }}
          >
            <div className="px-6 py-4 bg-slate-800 flex justify-between items-center text-white">
              <Text strong className="text-white">
                <Store className="w-4 h-4 inline-block mr-2 align-text-bottom" strokeWidth={2} />
                Result ({displayedShops.length})
              </Text>
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

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-white" style={{ minHeight: 0 }}>
              {displayedShops.length === 0 ? (
                <Empty className="mt-12" description="No shops match your filters" />
              ) : (
                displayedShops.map(shop => (
                  <ShopBentoCard
                    key={shop.id}
                    shop={shop}
                    onClick={() => handleShopClick(shop)}
                    isActive={shop.id === activeShopId}
                  />
                ))
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
