/**
 * Reports.tsx — Strategic Management Analytics + Operational Health
 *
 * Section 1a: Business Unit Share (Company-wide, expand to brands)
 * Section 1b/1c: Coverage Matrices (filtered)
 * Section 2:  Operational Health (filtered)
 * Section 3:  Completion Trend (Company-wide)
 * Section 4:  District Table (filtered)
 */

import React, { useMemo, useState } from "react";
import {
  Card,
  Col,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import { Shop, User } from "../types";

dayjs.extend(isoWeek);

const { Title, Text } = Typography;

const BRAND_COLORS = [
  "#6366F1", "#10B981", "#F59E0B", "#EF4444", "#3B82F6",
  "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#84CC16",
  "#06B6D4", "#A855F7", "#22D3EE", "#FB923C", "#4ADE80",
];

interface ReportsProps {
  shops: Shop[];
  currentUser: User | null;
}

interface DistrictRow {
  district: string;
  region: string;
  total: number;
  done: number;
  planned: number;
  pending: number;
  rescheduled: number;
  reschedPct: number;
  pct: number;
}

const Reports: React.FC<ReportsProps> = ({ shops }) => {
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [expandedBU, setExpandedBU] = useState<string | null>(null);

  // Company-wide active shops (immune to filters)
  const activeShops = useMemo(
    () => shops.filter((s) => s.masterStatus !== "Closed"),
    [shops],
  );

  const brandOptions = useMemo(
    () => [...new Set(activeShops.map((s) => s.brand))].sort().map((b) => ({ label: b, value: b })),
    [activeShops],
  );
  const regionOptions = useMemo(
    () => [...new Set(activeShops.map((s) => s.region))].sort().map((r) => ({ label: r, value: r })),
    [activeShops],
  );
  const statusOptions = ["Planned", "Pending", "Rescheduled", "Done", "Re-Open", "Unplanned"].map((s) => ({ label: s, value: s }));

  const filteredShops = useMemo(() => {
    return activeShops.filter((s) => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(s.brand)) return false;
      if (selectedRegions.length > 0 && !selectedRegions.includes(s.region)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(s.status)) return false;
      return true;
    });
  }, [activeShops, selectedBrands, selectedRegions, selectedStatuses]);

  // ── Section 1a — BU Share (company-wide) ─────────────────────────────────

  const buShare = useMemo(() => {
    const map: Record<string, number> = {};
    activeShops.forEach((s) => {
      if (!s.businessUnit) return;
      map[s.businessUnit] = (map[s.businessUnit] || 0) + 1;
    });
    const total = activeShops.filter((s) => s.businessUnit).length || 1;
    return Object.entries(map)
      .map(([bu, count]) => ({ bu, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [activeShops]);

  const buBrandBreakdown = useMemo(() => {
    const result: Record<string, Array<{ brand: string; count: number; pct: number }>> = {};
    activeShops.forEach((s) => {
      if (!s.businessUnit || !s.brand) return;
      if (!result[s.businessUnit]) result[s.businessUnit] = [];
      const existing = result[s.businessUnit].find((b) => b.brand === s.brand);
      if (existing) existing.count++;
      else result[s.businessUnit].push({ brand: s.brand, count: 1, pct: 0 });
    });
    Object.entries(result).forEach(([bu, brands]) => {
      const buTotal = buShare.find((b) => b.bu === bu)?.count || 1;
      brands.forEach((b) => { b.pct = Math.round((b.count / buTotal) * 100); });
      brands.sort((a, b) => b.count - a.count);
    });
    return result;
  }, [activeShops, buShare]);

  // ── Section 1b/1c — Coverage Matrices (filtered) ─────────────────────────

  const matrixRegions = useMemo(
    () => [...new Set(filteredShops.map((s) => s.region))].sort(),
    [filteredShops],
  );

  const brandMatrixRows = useMemo(() => {
    if (filteredShops.length === 0) return [];
    const brands = [...new Set(filteredShops.map((s) => s.brand))].sort();
    return brands.map((brand) => {
      const done = filteredShops.filter((s) => s.brand === brand && (s.status === "Done" || s.status === "Re-Open")).length;
      const total = filteredShops.filter((s) => s.brand === brand).length;
      const row: Record<string, number | string> = { brand, total, donePct: total > 0 ? Math.round((done / total) * 100) : 0 };
      matrixRegions.forEach((r) => { row[r] = filteredShops.filter((s) => s.brand === brand && s.region === r).length; });
      return row;
    });
  }, [filteredShops, matrixRegions]);

  const brandMatrixMaxCount = useMemo(() => {
    let max = 1;
    brandMatrixRows.forEach((row) => { matrixRegions.forEach((r) => { const v = Number(row[r] || 0); if (v > max) max = v; }); });
    return max;
  }, [brandMatrixRows, matrixRegions]);

  const buMatrixRows = useMemo(() => {
    if (filteredShops.length === 0) return [];
    const bus = [...new Set(filteredShops.filter((s) => s.businessUnit).map((s) => s.businessUnit as string))].sort();
    return bus.map((bu) => {
      const done = filteredShops.filter((s) => s.businessUnit === bu && (s.status === "Done" || s.status === "Re-Open")).length;
      const total = filteredShops.filter((s) => s.businessUnit === bu).length;
      const row: Record<string, number | string> = { bu, total, donePct: total > 0 ? Math.round((done / total) * 100) : 0 };
      matrixRegions.forEach((r) => { row[r] = filteredShops.filter((s) => s.businessUnit === bu && s.region === r).length; });
      return row;
    });
  }, [filteredShops, matrixRegions]);

  const buMatrixMaxCount = useMemo(() => {
    let max = 1;
    buMatrixRows.forEach((row) => { matrixRegions.forEach((r) => { const v = Number(row[r] || 0); if (v > max) max = v; }); });
    return max;
  }, [buMatrixRows, matrixRegions]);

  // ── Section 2 — Operational Health (filtered) ────────────────────────────

  const stats = useMemo(() => {
    const total = filteredShops.length;
    const done = filteredShops.filter((s) => s.status === "Done" || s.status === "Re-Open").length;
    const planned = filteredShops.filter((s) => s.status === "Planned").length;
    const pending = filteredShops.filter((s) => s.status === "Pending" || s.status === "Unplanned").length;
    const rescheduled = filteredShops.filter((s) => s.status === "Rescheduled").length;
    const donePct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, done, planned, pending, rescheduled, donePct };
  }, [filteredShops]);

  const regionCompletion = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    filteredShops.forEach((s) => {
      if (!map[s.region]) map[s.region] = { done: 0, total: 0 };
      map[s.region].total++;
      if (s.status === "Done" || s.status === "Re-Open") map[s.region].done++;
    });
    return Object.entries(map)
      .map(([region, v]) => ({ region, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0, done: v.done, total: v.total }))
      .sort((a, b) => b.pct - a.pct);
  }, [filteredShops]);

  const brandCompletion = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    filteredShops.forEach((s) => {
      if (!map[s.brand]) map[s.brand] = { done: 0, total: 0 };
      map[s.brand].total++;
      if (s.status === "Done" || s.status === "Re-Open") map[s.brand].done++;
    });
    return Object.entries(map)
      .map(([brand, v]) => ({ brand, pct: v.total > 0 ? Math.round((v.done / v.total) * 100) : 0, done: v.done, total: v.total }))
      .sort((a, b) => a.pct - b.pct);
  }, [filteredShops]);

  const statusData = useMemo(() => [
    { name: "Done", value: stats.done, color: "#10B981" },
    { name: "Planned", value: stats.planned, color: "#3B82F6" },
    { name: "Pending", value: stats.pending, color: "#F59E0B" },
    { name: "Rescheduled", value: stats.rescheduled, color: "#EF4444" },
  ], [stats]);

  const mtrStats = useMemo(() => {
    const mtr = filteredShops.filter((s) => s.is_mtr);
    const nonMtr = filteredShops.filter((s) => !s.is_mtr);
    return {
      mtrDone: mtr.filter((s) => s.status === "Done" || s.status === "Re-Open").length,
      mtrTotal: mtr.length,
      nonMtrDone: nonMtr.filter((s) => s.status === "Done" || s.status === "Re-Open").length,
      nonMtrTotal: nonMtr.length,
    };
  }, [filteredShops]);

  const groupStats = useMemo(() => {
    const groups: Record<number, { done: number; total: number }> = { 1: { done: 0, total: 0 }, 2: { done: 0, total: 0 }, 3: { done: 0, total: 0 } };
    filteredShops.forEach((s) => {
      const g = s.groupId;
      if (!groups[g]) groups[g] = { done: 0, total: 0 };
      groups[g].total++;
      if (s.status === "Done" || s.status === "Re-Open") groups[g].done++;
    });
    return groups;
  }, [filteredShops]);

  // ── Section 3 — Completion Trend (company-wide) ──────────────────────────

  const trendData = useMemo(() => {
    const doneShops = activeShops.filter((s) => (s.status === "Done" || s.status === "Re-Open") && s.scheduledDate);
    if (doneShops.length === 0) return [];
    const weekMap: Record<string, number> = {};
    doneShops.forEach((s) => {
      const d = dayjs(s.scheduledDate!);
      const key = `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, "0")}`;
      weekMap[key] = (weekMap[key] || 0) + 1;
    });
    const weeks = Object.keys(weekMap).sort();
    const total = activeShops.length;
    let cumulative = 0;
    return weeks.map((week, i) => {
      cumulative += weekMap[week];
      const target = Math.round(((i + 1) / weeks.length) * total);
      return { week, cumulative, target };
    });
  }, [activeShops]);

  // ── Section 4 — District Table (filtered) ────────────────────────────────

  const districtRows = useMemo((): DistrictRow[] => {
    const map: Record<string, DistrictRow> = {};
    filteredShops.forEach((s) => {
      const d = s.district;
      if (!map[d]) map[d] = { district: d, region: s.region, total: 0, done: 0, planned: 0, pending: 0, rescheduled: 0, reschedPct: 0, pct: 0 };
      map[d].total++;
      if (s.status === "Done" || s.status === "Re-Open") map[d].done++;
      else if (s.status === "Planned") map[d].planned++;
      else if (s.status === "Rescheduled") map[d].rescheduled++;
      else map[d].pending++;
    });
    return Object.values(map).map((r) => ({
      ...r,
      pct: r.total > 0 ? Math.round((r.done / r.total) * 100) : 0,
      reschedPct: r.total > 0 ? Math.round((r.rescheduled / r.total) * 100) : 0,
    })).sort((a, b) => b.total - a.total);
  }, [filteredShops]);

  const districtColumns = [
    { title: "District", dataIndex: "district", key: "district", sorter: (a: DistrictRow, b: DistrictRow) => a.district.localeCompare(b.district) },
    { title: "Region", dataIndex: "region", key: "region", sorter: (a: DistrictRow, b: DistrictRow) => a.region.localeCompare(b.region) },
    { title: "Total", dataIndex: "total", key: "total", sorter: (a: DistrictRow, b: DistrictRow) => a.total - b.total, width: 70 },
    { title: "Done", dataIndex: "done", key: "done", sorter: (a: DistrictRow, b: DistrictRow) => a.done - b.done, width: 70 },
    { title: "Planned", dataIndex: "planned", key: "planned", sorter: (a: DistrictRow, b: DistrictRow) => a.planned - b.planned, width: 80 },
    { title: "Pending", dataIndex: "pending", key: "pending", sorter: (a: DistrictRow, b: DistrictRow) => a.pending - b.pending, width: 80 },
    { title: "Resched", dataIndex: "rescheduled", key: "rescheduled", sorter: (a: DistrictRow, b: DistrictRow) => a.rescheduled - b.rescheduled, width: 80 },
    {
      title: "Resched%", dataIndex: "reschedPct", key: "reschedPct",
      sorter: (a: DistrictRow, b: DistrictRow) => a.reschedPct - b.reschedPct, width: 90,
      render: (pct: number) => (
        <Text style={{ color: pct >= 20 ? "#EF4444" : pct >= 10 ? "#F59E0B" : "#10B981", fontWeight: 600 }}>{pct}%</Text>
      ),
    },
    {
      title: "Done%", dataIndex: "pct", key: "pct",
      sorter: (a: DistrictRow, b: DistrictRow) => a.pct - b.pct, width: 80,
      render: (pct: number) => (
        <Text style={{ color: pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>{pct}%</Text>
      ),
    },
  ];

  const brandCompletionColor = (pct: number) => {
    if (pct >= 70) return "#10B981";
    if (pct >= 40) return "#6366F1";
    if (pct >= 20) return "#F59E0B";
    return "#EF4444";
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto" }}>
      <Title level={3} style={{ marginBottom: 24 }}>Reports</Title>

      {/* Filter Bar */}
      <Card style={{ marginBottom: 24 }}>
        <Space wrap>
          <Select mode="multiple" placeholder="Filter by Brand" style={{ minWidth: 200 }} options={brandOptions} value={selectedBrands} onChange={setSelectedBrands} allowClear />
          <Select mode="multiple" placeholder="Filter by Region" style={{ minWidth: 200 }} options={regionOptions} value={selectedRegions} onChange={setSelectedRegions} allowClear />
          <Select mode="multiple" placeholder="Filter by Status" style={{ minWidth: 200 }} options={statusOptions} value={selectedStatuses} onChange={setSelectedStatuses} allowClear />
          {(selectedBrands.length > 0 || selectedRegions.length > 0 || selectedStatuses.length > 0) && (
            <Tag color="blue" style={{ cursor: "pointer" }} onClick={() => { setSelectedBrands([]); setSelectedRegions([]); setSelectedStatuses([]); }}>
              Clear All Filters
            </Tag>
          )}
        </Space>
      </Card>

      {/* ================================================================= */}
      {/* Section 1 — Strategic Overview                                     */}
      {/* ================================================================= */}
      <Title level={4} style={{ marginBottom: 16 }}>Strategic Overview</Title>

      {/* 1a — BU Share (full-width, expandable to brands) */}
      <Card
        title={<span>Business Unit Share of Total Shops <Tag color="geekblue">Company-wide</Tag></span>}
        style={{ marginBottom: 16 }}
      >
        {buShare.map((item, i) => {
          const isExpanded = expandedBU === item.bu;
          const brands = buBrandBreakdown[item.bu] || [];
          return (
            <div key={item.bu} style={{ marginBottom: 12 }}>
              <div
                style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, cursor: "pointer", userSelect: "none" }}
                onClick={() => setExpandedBU(isExpanded ? null : item.bu)}
              >
                <Text style={{ fontSize: 13 }}>
                  {item.bu}
                  <span style={{ fontSize: 10, color: "#9CA3AF", marginLeft: 6 }}>{isExpanded ? "▲" : "▼"}</span>
                </Text>
                <Text style={{ fontSize: 12, color: "#6B7280" }}>{item.pct}% · {item.count} shops</Text>
              </div>
              <div style={{ background: "#F3F4F6", borderRadius: 4, height: 14, overflow: "hidden" }}>
                <div style={{ width: `${item.pct}%`, height: "100%", background: BRAND_COLORS[i % BRAND_COLORS.length], borderRadius: 4, transition: "width 0.4s ease" }} />
              </div>
              {isExpanded && (
                <div style={{ marginTop: 8, paddingLeft: 16, borderLeft: `3px solid ${BRAND_COLORS[i % BRAND_COLORS.length]}40` }}>
                  {brands.map((b, j) => (
                    <div key={b.brand} style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                        <Text style={{ fontSize: 11, color: "#374151" }}>{b.brand}</Text>
                        <Text style={{ fontSize: 11, color: "#9CA3AF" }}>{b.pct}% of BU · {b.count} shops</Text>
                      </div>
                      <div style={{ background: "#F9FAFB", borderRadius: 3, height: 10, overflow: "hidden" }}>
                        <div style={{ width: `${b.pct}%`, height: "100%", background: BRAND_COLORS[(i + j + 1) % BRAND_COLORS.length], borderRadius: 3 }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      {/* 1b — Brand × Region Matrix */}
      <Card
        title={<span>Coverage Matrix — Brand × Region <Tag color="purple">Filtered</Tag></span>}
        style={{ marginBottom: 16 }}
      >
        {filteredShops.length === 0 ? (
          <Text type="secondary">No shops match the current filters.</Text>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Brand</th>
                  {matrixRegions.map((r) => (
                    <th key={r} style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>{r}</th>
                  ))}
                  <th style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Total</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Done%</th>
                </tr>
              </thead>
              <tbody>
                {brandMatrixRows.map((row) => (
                  <tr key={String(row.brand)}>
                    <td style={{ padding: "6px 10px", fontWeight: 500 }}>{row.brand}</td>
                    {matrixRegions.map((r) => {
                      const count = Number(row[r] || 0);
                      const opacity = count === 0 ? 0 : 0.15 + (count / brandMatrixMaxCount) * 0.65;
                      return (
                        <td key={r} style={{ textAlign: "center", padding: "6px 10px", background: count === 0 ? "transparent" : `rgba(99,102,241,${opacity})` }}>
                          {count > 0 ? count : "—"}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center", padding: "6px 10px", fontWeight: 600 }}>{row.total}</td>
                    <td style={{ textAlign: "center", padding: "6px 10px" }}>
                      <Text style={{ color: Number(row.donePct) >= 70 ? "#10B981" : Number(row.donePct) >= 40 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>
                        {row.donePct}%
                      </Text>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop: "2px solid #E5E7EB", fontWeight: 700 }}>
                  <td style={{ padding: "6px 10px" }}>Total</td>
                  {matrixRegions.map((r) => (
                    <td key={r} style={{ textAlign: "center", padding: "6px 10px" }}>
                      {filteredShops.filter((s) => s.region === r).length}
                    </td>
                  ))}
                  <td style={{ textAlign: "center", padding: "6px 10px" }}>{filteredShops.length}</td>
                  <td style={{ textAlign: "center", padding: "6px 10px" }}>
                    <Text style={{ color: stats.donePct >= 70 ? "#10B981" : stats.donePct >= 40 ? "#F59E0B" : "#EF4444", fontWeight: 700 }}>
                      {stats.donePct}%
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* 1c — BU × Region Matrix */}
      <Card
        title={<span>Coverage Matrix — Business Unit × Region <Tag color="purple">Filtered</Tag></span>}
        style={{ marginBottom: 24 }}
      >
        {filteredShops.length === 0 ? (
          <Text type="secondary">No shops match the current filters.</Text>
        ) : buMatrixRows.length === 0 ? (
          <Text type="secondary">No business unit data available.</Text>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Business Unit</th>
                  {matrixRegions.map((r) => (
                    <th key={r} style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>{r}</th>
                  ))}
                  <th style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Total</th>
                  <th style={{ textAlign: "center", padding: "6px 10px", background: "#F9FAFB", fontWeight: 600 }}>Done%</th>
                </tr>
              </thead>
              <tbody>
                {buMatrixRows.map((row) => (
                  <tr key={String(row.bu)}>
                    <td style={{ padding: "6px 10px", fontWeight: 500 }}>{row.bu}</td>
                    {matrixRegions.map((r) => {
                      const count = Number(row[r] || 0);
                      const opacity = count === 0 ? 0 : 0.15 + (count / buMatrixMaxCount) * 0.65;
                      return (
                        <td key={r} style={{ textAlign: "center", padding: "6px 10px", background: count === 0 ? "transparent" : `rgba(16,185,129,${opacity})` }}>
                          {count > 0 ? count : "—"}
                        </td>
                      );
                    })}
                    <td style={{ textAlign: "center", padding: "6px 10px", fontWeight: 600 }}>{row.total}</td>
                    <td style={{ textAlign: "center", padding: "6px 10px" }}>
                      <Text style={{ color: Number(row.donePct) >= 70 ? "#10B981" : Number(row.donePct) >= 40 ? "#F59E0B" : "#EF4444", fontWeight: 600 }}>
                        {row.donePct}%
                      </Text>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ================================================================= */}
      {/* Section 2 — Operational Health                                     */}
      {/* ================================================================= */}
      <Title level={4} style={{ marginBottom: 16 }}>Operational Health <Tag color="purple">Filtered</Tag></Title>

      {/* 2a — Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {[
          { title: "Total Shops", value: stats.total, color: "#1E40AF" },
          { title: "Done", value: stats.done, color: "#10B981" },
          { title: "Planned", value: stats.planned, color: "#3B82F6" },
          { title: "Completion %", value: `${stats.donePct}%`, color: stats.donePct >= 70 ? "#10B981" : stats.donePct >= 40 ? "#F59E0B" : "#EF4444" },
        ].map((card) => (
          <Col xs={12} sm={6} key={card.title}>
            <Card style={{ borderTop: `4px solid ${card.color}`, textAlign: "center" }}>
              <Statistic title={card.title} value={card.value} valueStyle={{ color: card.color, fontWeight: 700 }} />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 2b — Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title="Region Completion %">
            <div style={{ height: Math.max(200, regionCompletion.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regionCompletion} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="region" width={80} />
                  <RechartsTooltip formatter={(v) => `${v}%`} />
                  <Bar dataKey="pct" fill="#6366F1" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="Brand Completion Rate (worst first)">
            <div style={{ height: Math.max(200, brandCompletion.length * 44) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={brandCompletion} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
                  <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <YAxis type="category" dataKey="brand" width={100} />
                  <RechartsTooltip
                    formatter={(_v: number, _name: string, props: { payload?: { done: number; total: number } }) =>
                      [`${props?.payload?.done ?? 0}/${props?.payload?.total ?? 0}`, "Done"]
                    }
                  />
                  <Bar dataKey="pct" radius={[0, 4, 4, 0]} fill="#6366F1" label={{ position: "right", formatter: (v: number) => `${v}%`, fontSize: 11 }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ marginTop: 8 }}>
              {brandCompletion.map((b) => (
                <div key={b.brand} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: brandCompletionColor(b.pct), marginRight: 6, flexShrink: 0 }} />
                  <Text style={{ fontSize: 12 }}>{b.brand} — {b.pct}% ({b.done}/{b.total})</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 2c — Status / MTR / Groups */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={8}>
          <Card title="Status Breakdown">
            {statusData.map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Tag color={item.color === "#10B981" ? "success" : item.color === "#3B82F6" ? "blue" : item.color === "#F59E0B" ? "warning" : "error"}>
                  {item.name}
                </Tag>
                <Text strong>{item.value}</Text>
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="MTR vs Non-MTR">
            <div style={{ marginBottom: 8 }}>
              <Text style={{ fontSize: 13 }}>MTR Shops</Text>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{mtrStats.mtrDone} / {mtrStats.mtrTotal} done</Text>
                <Text strong style={{ color: "#10B981" }}>
                  {mtrStats.mtrTotal > 0 ? Math.round((mtrStats.mtrDone / mtrStats.mtrTotal) * 100) : 0}%
                </Text>
              </div>
            </div>
            <div>
              <Text style={{ fontSize: 13 }}>Non-MTR Shops</Text>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{mtrStats.nonMtrDone} / {mtrStats.nonMtrTotal} done</Text>
                <Text strong style={{ color: "#6366F1" }}>
                  {mtrStats.nonMtrTotal > 0 ? Math.round((mtrStats.nonMtrDone / mtrStats.nonMtrTotal) * 100) : 0}%
                </Text>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card title="Group Breakdown">
            {([1, 2, 3] as const).map((g) => {
              const gs = groupStats[g] || { done: 0, total: 0 };
              const pct = gs.total > 0 ? Math.round((gs.done / gs.total) * 100) : 0;
              return (
                <div key={g} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <Text style={{ fontSize: 13 }}>Group {g}</Text>
                    <Text strong style={{ color: pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444" }}>{pct}%</Text>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{gs.done} / {gs.total} done</Text>
                </div>
              );
            })}
          </Card>
        </Col>
      </Row>

      {/* ================================================================= */}
      {/* Section 3 — Completion Trend (Company-wide)                        */}
      {/* ================================================================= */}
      <Title level={4} style={{ marginBottom: 16 }}>Completion Trend <Tag color="geekblue">Company-wide</Tag></Title>
      <Card style={{ marginBottom: 24 }}>
        {trendData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#9CA3AF" }}>No completion data yet</div>
        ) : (
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis />
                <RechartsTooltip />
                <Area type="monotone" dataKey="cumulative" name="Completed" stroke="#10B981" fill="#10B98130" strokeWidth={2} />
                <Area type="monotone" dataKey="target" name="Target" stroke="#9CA3AF" fill="none" strokeWidth={2} strokeDasharray="5 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {/* ================================================================= */}
      {/* Section 4 — District Table (filtered)                              */}
      {/* ================================================================= */}
      <Title level={4} style={{ marginBottom: 16 }}>District Breakdown <Tag color="purple">Filtered</Tag></Title>
      <Card>
        <Table dataSource={districtRows} columns={districtColumns} rowKey="district" size="small" pagination={{ pageSize: 20 }} />
      </Card>
    </div>
  );
};

export { Reports };
export default Reports;
