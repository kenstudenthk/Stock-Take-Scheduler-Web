import React, { useEffect, useRef, useState, useMemo, useCallback, memo } from 'react';
import { Select, Input, Typography, Row, Col, Empty, DatePicker, Switch, message, Card } from 'antd';
import {
  MapPin, Search, Store, Calendar, Filter, Info, Tags
} from 'lucide-react';
import { ShopOutlined, CheckCircleOutlined, CalendarOutlined, CloseCircleOutlined } from '@ant-design/icons';
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

// --- Overlap Detection Configuration ---
const OVERLAP_CONFIG = {
  PRECISION: 5,
  RADIUS: 0.00008,
} as const;

// --- SummaryCard (consistent with Generator page) ---
const SummaryCard = ({ label, value, subtext, bgColor, icon }: {
  label: string;
  value: number;
  subtext: string;
  bgColor: string;
  icon: React.ReactNode;
}) => (
  <div className="summary-card-item" style={{ borderLeft: `4px solid ${bgColor}` }}>
    <div className="summary-card-icon-area" style={{ backgroundColor: bgColor }}>
      {icon}
    </div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu"><div className="dot"></div><div className="dot"></div><div className="dot"></div></div>
      </div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

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

      return matchSearch && matchRegion && matchDate && matchMasterClosed;
    });
  }, [shops, search, regionFilter, dateFilter, includeMasterClosed]);

  // 2. Apply legend filter on top → displayedShops
  const displayedShops = useMemo(() => {
    if (legendFilters.size === 0) return filteredShops;
    return filteredShops.filter(shop => legendFilters.has(getShopCategory(shop)));
  }, [filteredShops, legendFilters]);

  // 3. Legend counts (based on displayedShops — reflects what's on the map)
  const legendCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'group-a': 0, 'group-b': 0, 'group-c': 0, 'completed': 0, 'closed': 0
    };
    displayedShops.forEach(shop => {
      const cat = getShopCategory(shop);
      if (cat in counts) counts[cat]++;
    });
    return counts;
  }, [displayedShops]);

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

  // Overlap detection for markers
  const offsetOverlappingMarkers = useCallback((shopsToProcess: Shop[]): Map<string, [number, number]> => {
    const offsetMap = new Map<string, [number, number]>();
    const positionGroups = new Map<string, Shop[]>();

    shopsToProcess.forEach(shop => {
      const [lng, lat] = wgs84ToGcj02(shop.longitude, shop.latitude);
      const key = `${lng.toFixed(OVERLAP_CONFIG.PRECISION)},${lat.toFixed(OVERLAP_CONFIG.PRECISION)}`;

      if (!positionGroups.has(key)) {
        positionGroups.set(key, []);
      }
      positionGroups.get(key)!.push(shop);
    });

    positionGroups.forEach((groupShops, key) => {
      const [baseLng, baseLat] = key.split(',').map(Number);
      const count = groupShops.length;

      if (count === 1) {
        const [lng, lat] = wgs84ToGcj02(groupShops[0].longitude, groupShops[0].latitude);
        offsetMap.set(groupShops[0].id, [lng, lat]);
      } else {
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

  // --- Map init ---
  useEffect(() => {
    if (!window.AMap || mapRef.current) return;

    mapRef.current = new window.AMap.Map('map-container', {
      center: [114.177216, 22.303719],
      zoom: 11,
    });

    window.AMap.plugin(['AMap.ToolBar', 'AMap.Scale'], () => {
      mapRef.current.addControl(new window.AMap.ToolBar({ position: 'RB', offset: new window.AMap.Pixel(20, 40) }));
      mapRef.current.addControl(new window.AMap.Scale());
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

  // --- Create InfoWindow content ---
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

  // --- Update markers in batches (when displayedShops changes) ---
  const isFirstRenderRef = useRef(true);

  useEffect(() => {
    if (!mapRef.current) return;

    // Clear existing markers
    const existing = Object.values(markersRef.current);
    if (existing.length > 0) {
      mapRef.current.remove(existing);
      markersRef.current = {};
    }

    const offsetMap = offsetOverlappingMarkers(displayedShops);
    const BATCH_SIZE = 80;
    let batchIndex = 0;

    const addBatch = () => {
      const start = batchIndex * BATCH_SIZE;
      const batch = displayedShops.slice(start, start + BATCH_SIZE);
      if (batch.length === 0) {
        // All batches done — fit view only on first load
        if (isFirstRenderRef.current && Object.keys(markersRef.current).length > 0) {
          mapRef.current.setFitView(Object.values(markersRef.current));
          isFirstRenderRef.current = false;
        }
        return;
      }

      const newMarkers: any[] = [];
      batch.forEach(shop => {
        const position = offsetMap.get(shop.id);
        if (!position) return;
        const [lng, lat] = position;
        const color = getMarkerColor(shop);

        const markerContent = `
          <div class="map-marker" style="--marker-color:${color};" role="button" aria-label="${shop.name} marker">
            <div class="map-marker-inner"></div>
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
      batchIndex++;
      requestAnimationFrame(addBatch);
    };

    requestAnimationFrame(addBatch);
  }, [displayedShops, createInfoContent, offsetOverlappingMarkers]);

  // --- Update active marker style without recreating all markers ---
  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const isActive = id === activeShopId;
      const dom = marker.getContentDom?.();
      if (!dom) return;
      const el = dom.querySelector('.map-marker');
      if (!el) return;
      if (isActive) {
        el.classList.add('map-marker--active');
        if (!el.querySelector('.map-marker-pulse')) {
          const pulse = document.createElement('div');
          pulse.className = 'map-marker-pulse';
          el.appendChild(pulse);
        }
      } else {
        el.classList.remove('map-marker--active');
        const pulse = el.querySelector('.map-marker-pulse');
        if (pulse) pulse.remove();
      }
    });
  }, [activeShopId]);

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Title level={2} className="m-0 text-slate-800">Interactive Map</Title>
          <Text className="text-slate-400 font-medium">Click on shop cards or legend to filter the map.</Text>
        </div>
      </div>

      {/* Stats Cards */}
      <Row gutter={[24, 24]}>
        <Col span={6}>
          <SummaryCard
            label="Total on Map"
            value={stats.total}
            subtext="Visible markers"
            bgColor="hsl(195, 74%, 62%)"
            icon={<ShopOutlined style={{ fontSize: 60, color: 'white', opacity: 0.5 }} />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Completed"
            value={stats.completed}
            subtext="Done this year"
            bgColor="#22C55E"
            icon={<CheckCircleOutlined style={{ fontSize: 60, color: 'white', opacity: 0.5 }} />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Scheduled"
            value={stats.scheduled}
            subtext="Planned visits"
            bgColor="#3B82F6"
            icon={<CalendarOutlined style={{ fontSize: 60, color: 'white', opacity: 0.5 }} />}
          />
        </Col>
        <Col span={6}>
          <SummaryCard
            label="Closed"
            value={stats.closed}
            subtext="Permanently closed"
            bgColor="#EF4444"
            icon={<CloseCircleOutlined style={{ fontSize: 60, color: 'white', opacity: 0.5 }} />}
          />
        </Col>
      </Row>

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
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
