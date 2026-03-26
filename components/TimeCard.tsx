import React, { useMemo, useState } from "react";
import {
  Card,
  Col,
  DatePicker,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  Button,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { TimeCardEntry } from "../types";

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface TimeCardProps {
  entries: TimeCardEntry[];
  loading: boolean;
  graphToken: string;
}

export const TimeCard: React.FC<TimeCardProps> = ({ entries, loading }) => {
  const [filterFE, setFilterFE] = useState<string[]>([]);
  const [filterShop, setFilterShop] = useState<string[]>([]);
  const [filterAction, setFilterAction] = useState<string[]>([]);
  const [filterRole, setFilterRole] = useState<string[]>([]);
  const [filterDateRange, setFilterDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null]
  >([null, null]);

  const feOptions = useMemo(
    () =>
      [...new Set(entries.map((e) => e.feName).filter(Boolean))].sort(),
    [entries],
  );

  const shopOptions = useMemo(
    () =>
      [...new Set(entries.map((e) => e.shopName).filter(Boolean))].sort(),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterFE.length > 0 && !filterFE.includes(e.feName)) return false;
      if (filterShop.length > 0 && !filterShop.includes(e.shopName))
        return false;
      if (filterAction.length > 0 && !filterAction.includes(e.action))
        return false;
      if (filterRole.length > 0 && !filterRole.includes(e.role)) return false;
      if (filterDateRange[0] && filterDateRange[1]) {
        const t = dayjs(e.actionTime);
        if (
          t.isBefore(filterDateRange[0].startOf("day")) ||
          t.isAfter(filterDateRange[1].endOf("day"))
        )
          return false;
      }
      return true;
    });
  }, [entries, filterFE, filterShop, filterAction, filterRole, filterDateRange]);

  const stats = useMemo(() => {
    const uniqueFEs = new Set(filteredEntries.map((e) => e.feName)).size;
    const checkIns = filteredEntries.filter(
      (e) => e.action === "Check In",
    ).length;
    const checkOuts = filteredEntries.filter(
      (e) => e.action === "Check Out",
    ).length;
    return { total: filteredEntries.length, uniqueFEs, checkIns, checkOuts };
  }, [filteredEntries]);

  const hasFilter =
    filterFE.length > 0 ||
    filterShop.length > 0 ||
    filterAction.length > 0 ||
    filterRole.length > 0 ||
    filterDateRange[0] !== null;

  const clearFilters = () => {
    setFilterFE([]);
    setFilterShop([]);
    setFilterAction([]);
    setFilterRole([]);
    setFilterDateRange([null, null]);
  };

  const columns: ColumnsType<TimeCardEntry> = [
    {
      title: "FE Name",
      dataIndex: "feName",
      width: 150,
      sorter: (a, b) => a.feName.localeCompare(b.feName),
    },
    {
      title: "Shop Name",
      dataIndex: "shopName",
      width: 200,
      sorter: (a, b) => a.shopName.localeCompare(b.shopName),
    },
    {
      title: "Action",
      dataIndex: "action",
      width: 110,
      render: (v: string) => (
        <Tag color={v === "Check In" ? "green" : "orange"}>{v}</Tag>
      ),
    },
    {
      title: "Role",
      dataIndex: "role",
      width: 110,
      render: (v: string) => (
        <Tag color={v === "Main" ? "blue" : "purple"}>{v}</Tag>
      ),
    },
    {
      title: "Action Time",
      dataIndex: "actionTime",
      width: 180,
      sorter: (a, b) =>
        dayjs(a.actionTime).valueOf() - dayjs(b.actionTime).valueOf(),
      defaultSortOrder: "descend",
      render: (v: string) =>
        v ? dayjs(v).format("YYYY-MM-DD HH:mm") : "-",
    },
  ];

  return (
    <div style={{ padding: "0 4px" }}>
      <Title level={4} style={{ marginBottom: 16 }}>
        Time Card
      </Title>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Total Entries" value={stats.total} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic title="Unique FEs" value={stats.uniqueFEs} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Check Ins"
              value={stats.checkIns}
              valueStyle={{ color: "#16a34a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Check Outs"
              value={stats.checkOuts}
              valueStyle={{ color: "#ea580c" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Select
            mode="multiple"
            placeholder="FE Name"
            style={{ minWidth: 160 }}
            value={filterFE}
            onChange={setFilterFE}
            options={feOptions.map((v) => ({ label: v, value: v }))}
            allowClear
            maxTagCount="responsive"
          />
          <Select
            mode="multiple"
            placeholder="Shop Name"
            style={{ minWidth: 200 }}
            value={filterShop}
            onChange={setFilterShop}
            options={shopOptions.map((v) => ({ label: v, value: v }))}
            allowClear
            maxTagCount="responsive"
          />
          <Select
            mode="multiple"
            placeholder="Action"
            style={{ minWidth: 140 }}
            value={filterAction}
            onChange={setFilterAction}
            options={[
              { label: "Check In", value: "Check In" },
              { label: "Check Out", value: "Check Out" },
            ]}
            allowClear
          />
          <Select
            mode="multiple"
            placeholder="Role"
            style={{ minWidth: 130 }}
            value={filterRole}
            onChange={setFilterRole}
            options={[
              { label: "Main", value: "Main" },
              { label: "Assistant", value: "Assistant" },
            ]}
            allowClear
          />
          <RangePicker
            value={filterDateRange as any}
            onChange={(v) =>
              setFilterDateRange(v ? [v[0], v[1]] : [null, null])
            }
          />
          {hasFilter && (
            <Button size="small" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </Space>
      </Card>

      {/* Table */}
      <Table<TimeCardEntry>
        columns={columns}
        dataSource={filteredEntries}
        rowKey="id"
        loading={loading}
        size="small"
        pagination={{ pageSize: 50, showSizeChanger: false }}
        scroll={{ x: 750 }}
      />
    </div>
  );
};
