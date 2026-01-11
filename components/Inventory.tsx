import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Button, Row, Col, message } from 'antd';
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, FilterOutlined } from '@ant-design/icons';
import { InventoryItem } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  invToken: string;
}

export const Inventory: React.FC<Props> = ({ invToken }) => {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- 篩選器狀態 ---
  const [filters, setFilters] = useState({
    shopName: '',
    shopBrand: '',
    status: 'All',
    cmdb: '',
    serialNo: ''
  });

  const fetchInventory = async () => {
    if (!invToken) {
      message.warning("Please set Inventory Access Token in Settings first.");
      return;
    }
    setLoading(true);
    try {
      // ✅ 使用您提供的新正確 List ID
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48/items?$expand=fields($select=*)&$top=999`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${invToken}` }
      });
      const json = await res.json();
      
      if (json.value) {
        const mapped = json.value.map((item: any) => {
          const f = item.fields || {};
          // 🕵️‍♂️ 這裡進行精準的欄位映射 (StaticName 匹配)
          return {
            id: item.id,
            shopName: f['Shop_x0020_Name'] || f['ShopName'] || '',
            shopBrand: f['Shop_x0020_Brand'] || '',
            productTypeEng: f['Product_x0020_Type_x0020__x0028_'] || '',
            productTypeChi: f['Product_x0020_Type_x0020__x0028_0'] || '',
            cmdb: f['CMDB'] || '',
            serialNo: f['SerialNo'] || '',
            assetName: f['Asset_x0020_Name'] || '',
            inUseStatus: f['In_x0020_Use_x0020_Status'] || 'N/A',
          };
        });
        setData(mapped);
        if (mapped.length > 0) message.success(`Loaded ${mapped.length} assets`);
      }
    } catch (err) {
      message.error("Failed to fetch inventory from SPO");
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, [invToken]);

  // --- 過濾邏輯 ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      return (
        item.shopName.toLowerCase().includes(filters.shopName.toLowerCase()) &&
        item.shopBrand.toLowerCase().includes(filters.shopBrand.toLowerCase()) &&
        (filters.status === 'All' || item.inUseStatus === filters.status) &&
        item.cmdb.toLowerCase().includes(filters.cmdb.toLowerCase()) &&
        item.serialNo.toLowerCase().includes(filters.serialNo.toLowerCase())
      );
    });
  }, [data, filters]);

  // --- 表格定義 ---
  const columns = [
    {
      title: 'Shop Details',
      key: 'shop',
      width: '20%',
      render: (record: InventoryItem) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.shopName}</Text>
          <Tag color="blue" style={{ fontSize: '10px' }}>{record.shopBrand}</Tag>
        </Space>
      ),
      sorter: (a: any, b: any) => a.shopName.localeCompare(b.shopName),
    },
    {
      title: 'Product Type',
      key: 'type',
      render: (record: InventoryItem) => (
        <div className="flex flex-col">
          <Text strong style={{ fontSize: '13px' }}>{record.productTypeEng}</Text>
          <Text style={{ fontSize: '11px', color: '#94a3b8' }}>{record.productTypeChi}</Text>
        </div>
      ),
    },
    {
      title: 'Asset Info',
      key: 'asset',
      render: (record: InventoryItem) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '12px' }}>{record.assetName}</Text>
          <Space>
            <Tag icon={<DatabaseOutlined />} color="cyan">{record.cmdb}</Tag>
            <Text type="secondary" size="small">SN: {record.serialNo}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'inUseStatus',
      key: 'status',
      width: 120,
      render: (status: string) => {
        let color = 'default';
        if (status === 'Verified') color = 'green';
        if (status === 'New Item') color = 'blue';
        if (status === 'Not Found') color = 'red';
        return <Tag color={color} className="font-bold">{status}</Tag>;
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <Title level={2} style={{ margin: 0 }}>Inventory Asset List</Title>
          <Text type="secondary">Real-time data from SPO Inventory List</Text>
        </div>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchInventory} 
          loading={loading}
          className="rounded-lg h-10 shadow-md bg-teal-600"
        >
          Sync Inventory
        </Button>
      </div>

      {/* 搜尋過濾器 */}
      <Card className="rounded-2xl border-none shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={6}>
            <Text strong className="text-xs mb-1 block">SEARCH SHOP</Text>
            <Input 
              prefix={<SearchOutlined className="text-slate-300" />} 
              placeholder="Shop name..." 
              onChange={e => setFilters({...filters, shopName: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
          <Col span={6}>
            <Text strong className="text-xs mb-1 block">IN USE STATUS</Text>
            <Select 
              className="w-full h-10" 
              defaultValue="All" 
              onChange={val => setFilters({...filters, status: val})}
            >
              <Option value="All">All Status</Option>
              <Option value="Verified">Verified</Option>
              <Option value="Not Found">Not Found</Option>
              <Option value="New Item">New Item</Option>
            </Select>
          </Col>
          <Col span={6}>
            <Text strong className="text-xs mb-1 block">CMDB / UNIQUE ID</Text>
            <Input 
              placeholder="Search CMDB..." 
              onChange={e => setFilters({...filters, cmdb: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
          <Col span={6}>
            <Text strong className="text-xs mb-1 block">SERIAL NO.</Text>
            <Input 
              placeholder="Search Serial..." 
              onChange={e => setFilters({...filters, serialNo: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 12, showSizeChanger: false }}
          locale={{ emptyText: <Empty description="No Inventory Data Found" /> }}
        />
      </Card>
    </div>
  );
};
