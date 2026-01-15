import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Button, Row, Col, message, Empty, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, BarcodeOutlined, IdcardOutlined } from '@ant-design/icons';
import { InventoryItem } from '../types';
import { INV_FIELDS } from '../constants'; // Ensure we use the mapped field names

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  invToken: string;
}

export const Inventory: React.FC<Props> = ({ invToken }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [filters, setFilters] = useState({
    shopName: '',
    shopBrand: '',
    status: 'All',
    cmdb: '',
    serialNo: '',
    assetItemId: '' // ✅ Added filter state for Asset Item ID
  });

  const fetchInventory = async () => {
    if (!invToken) return;
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${invToken}` } });
      const json = await res.json();
      
      if (json.value) {
        const mapped = json.value.map((item: any) => {
          const f = item.fields || {};
          return {
            id: item.id,
            // --- Precise mapping based on SharePoint field names ---
            shopName: f[INV_FIELDS.SHOP_NAME] || '',
            shopBrand: f[INV_FIELDS.SHOP_BRAND] || '',
            shopCode: f[INV_FIELDS.SHOP_CODE] || '',
            productTypeEng: f[INV_FIELDS.PRODUCT_TYPE_ENG] || '',
            productTypeChi: f[INV_FIELDS.PRODUCT_TYPE_CHI] || '',
            cmdb: f[INV_FIELDS.CMDB] || '',
            serialNo: f[INV_FIELDS.SERIAL_NO] || '',
            assetName: f[INV_FIELDS.ASSET_NAME] || '',
            inUseStatus: f[INV_FIELDS.IN_USE_STATUS] || 'N/A',
            brand: f[INV_FIELDS.BRAND] || '',
            recordTime: f[INV_FIELDS.RECORD_TIME] || '',
            assetItemId: f[INV_FIELDS.ASSET_ITEM_ID] || '', // ✅ Map Asset Item ID to the data object
          };
        });
        setData(mapped);
      }
    } catch (err) {
      message.error("Sync Failed");
    }
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, [invToken]);

  const filteredData = useMemo(() => {
    return data.filter(item => 
      item.shopName.toLowerCase().includes(filters.shopName.toLowerCase()) &&
      item.shopBrand.toLowerCase().includes(filters.shopBrand.toLowerCase()) &&
      (filters.status === 'All' || item.inUseStatus === filters.status) &&
      item.cmdb.toLowerCase().includes(filters.cmdb.toLowerCase()) &&
      item.serialNo.toLowerCase().includes(filters.serialNo.toLowerCase()) &&
      item.assetItemId.toLowerCase().includes(filters.assetItemId.toLowerCase()) // ✅ Added search logic
    );
  }, [data, filters]);

  const columns = [
    {
      title: 'Shop / Store',
      key: 'shop',
      width: '20%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>{record.shopName}</Text>
          <Space>
             <Tag color="orange" style={{ fontSize: '10px' }}>{record.shopBrand}</Tag>
             <Text type="secondary" code style={{ fontSize: '10px' }}>{record.shopCode}</Text>
          </Space>
        </Space>
      ),
      sorter: (a: any, b: any) => a.shopName.localeCompare(b.shopName),
    },
    {
      title: 'Product Category',
      key: 'type',
      width: '18%',
      render: (record: any) => (
        <div className="flex flex-col">
          <Text strong className="text-teal-700">{record.productTypeEng}</Text>
          <Text size="small" style={{ color: '#94a3b8', fontSize: '11px' }}>{record.productTypeChi}</Text>
        </div>
      ),
    },
    {
      title: 'Asset Detail',
      key: 'asset',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '13px' }}>{record.assetName}</Text>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary" style={{ fontSize: '12px' }}>SN: {record.serialNo}</Text>
            <Tag icon={<BarcodeOutlined />} color="blue">{record.cmdb}</Tag>
          </Space>
          {/* ✅ Display Asset Item ID in the table row */}
          <Text type="secondary" style={{ fontSize: '10px' }}>ID: {record.assetItemId}</Text> 
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'inUseStatus',
      key: 'status',
      width: 130,
      render: (status: string) => {
        let color = 'default';
        if (status === 'In Use' || status === 'Verified') color = 'green';
        if (status === 'New Item' || status === 'New Record') color = 'blue';
        if (status === 'Not Found') color = 'red';
        return <Tag color={color} className="font-bold">{status}</Tag>;
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm">
        <Space direction="vertical" size={0}>
          <Title level={2} style={{ margin: 0 }}>Inventory Database</Title>
          <Text type="secondary">Connected to SharePoint Online Asset Management List</Text>
        </Space>
        <Button 
          type="primary" 
          icon={<ReloadOutlined />} 
          onClick={fetchInventory} 
          loading={loading}
          size="large"
          className="bg-teal-600 rounded-xl shadow-lg"
        >
          Refresh Data
        </Button>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={4}> {/* ✅ Adjusted span to fit 5+ columns */}
            <Text strong className="text-slate-400 text-xs uppercase mb-2 block">Shop Search</Text>
            <Input 
              prefix={<SearchOutlined />} 
              placeholder="Shop name..." 
              onChange={e => setFilters({...filters, shopName: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-xs uppercase mb-2 block">In-Use Status</Text>
            <Select className="w-full h-10" defaultValue="All" onChange={val => setFilters({...filters, status: val})}>
              <Option value="All">All Status</Option>
              <Option value="In Use">In Use</Option>
              <Option value="Verified">Verified</Option>
              <Option value="Not Found">Not Found</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-xs uppercase mb-2 block">Serial</Text>
            <Input 
              placeholder="Serial No..." 
              onChange={e => setFilters({...filters, serialNo: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-xs uppercase mb-2 block">CMDB</Text>
            <Input 
              placeholder="CMDB Number..." 
              onChange={e => setFilters({...filters, cmdb: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
          <Col span={8}> {/* ✅ Added Asset Item ID Filter column */}
            <Text strong className="text-slate-400 text-xs uppercase mb-2 block">Asset Item ID</Text>
            <Input 
              prefix={<IdcardOutlined />}
              placeholder="Type Asset Item ID..." 
              onChange={e => setFilters({...filters, assetItemId: e.target.value})}
              className="rounded-lg h-10"
            />
          </Col>
        </Row>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: false }}
          className="st-inventory-table"
        />
      </Card>
    </div>
  );
};
