import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Empty, Row, Col, Button } from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined, DatabaseOutlined } from '@ant-design/icons';
import { InventoryItem } from '../types';
import { INV_FIELDS } from '../constants';
import { Inventory } from './components/Inventory'; // ✅ 加入這一行

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

  // --- 從 SPO 抓取資料 ---
  const fetchInventory = async () => {
    if (!invToken) return;
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752E-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${invToken}` } });
      const json = await res.json();
      
      if (json.value) {
        const mapped: InventoryItem[] = json.value.map((item: any) => {
          const f = item.fields || {};
          return {
            id: item.id,
            shopName: f[INV_FIELDS.SHOP_NAME] || '',
            shopBrand: f[INV_FIELDS.SHOP_BRAND] || '',
            productTypeEng: f[INV_FIELDS.PRODUCT_TYPE_ENG] || '',
            productTypeChi: f[INV_FIELDS.PRODUCT_TYPE_CHI] || '',
            cmdb: f[INV_FIELDS.CMDB] || '',
            serialNo: f[INV_FIELDS.SERIAL_NO] || '',
            assetName: f[INV_FIELDS.ASSET_NAME] || '',
            inUseStatus: f[INV_FIELDS.IN_USE_STATUS] || 'N/A',
          };
        });
        setData(mapped);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchInventory(); }, [invToken]);

  // --- 過濾邏輯 (Flexible logic) ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchShop = item.shopName.toLowerCase().includes(filters.shopName.toLowerCase());
      const matchBrand = item.shopBrand.toLowerCase().includes(filters.shopBrand.toLowerCase());
      const matchStatus = filters.status === 'All' || item.inUseStatus === filters.status;
      const matchCMDB = item.cmdb.toLowerCase().includes(filters.cmdb.toLowerCase());
      const matchSerial = item.serialNo.toLowerCase().includes(filters.serialNo.toLowerCase());
      return matchShop && matchBrand && matchStatus && matchCMDB && matchSerial;
    });
  }, [data, filters]);

  // --- 表格欄位定義 ---
  const columns = [
    {
      title: 'Shop Name',
      dataIndex: 'shopName',
      key: 'shopName',
      sorter: (a: any, b: any) => a.shopName.localeCompare(b.shopName),
    },
    {
      title: 'Product Type',
      key: 'productType',
      render: (record: InventoryItem) => (
        <div className="flex flex-col">
          <Text strong style={{ fontSize: '13px' }}>{record.productTypeEng}</Text>
          <Text style={{ fontSize: '11px', color: '#94a3b8' }}>{record.productTypeChi}</Text>
        </div>
      ),
    },
    {
      title: 'CMDB / Unique ID',
      dataIndex: 'cmdb',
      key: 'cmdb',
      render: (val: string) => <Text code>{val}</Text>,
      sorter: (a: any, b: any) => a.cmdb.localeCompare(b.cmdb),
    },
    {
      title: 'Serial No.',
      dataIndex: 'serialNo',
      key: 'serialNo',
    },
    {
      title: 'Asset Name',
      dataIndex: 'assetName',
      key: 'assetName',
    },
    {
      title: 'Status',
      dataIndex: 'inUseStatus',
      key: 'status',
      render: (status: string) => {
        let color = status === 'Verified' ? 'green' : status === 'New Item' ? 'blue' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      }
    }
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <Title level={3}><DatabaseOutlined /> Inventory Asset Master</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading}>Sync Data</Button>
      </div>

      {/* --- 篩選控制面板 --- */}
      <Card className="rounded-2xl shadow-sm border-none">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Text type="secondary" className="text-xs">SHOP NAME / BRAND</Text>
            <div className="flex gap-2 mt-1">
              <Input 
                placeholder="Search Shop..." 
                prefix={<SearchOutlined />} 
                onChange={e => setFilters({...filters, shopName: e.target.value})}
              />
              <Input 
                placeholder="Brand..." 
                onChange={e => setFilters({...filters, shopBrand: e.target.value})}
              />
            </div>
          </Col>
          <Col xs={24} md={4}>
            <Text type="secondary" className="text-xs">STATUS</Text>
            <Select 
              className="w-full mt-1" 
              defaultValue="All" 
              onChange={val => setFilters({...filters, status: val})}
            >
              <Option value="All">All Status</Option>
              <Option value="Verified">Verified</Option>
              <Option value="Not Found">Not Found</Option>
              <Option value="New Item">New Item</Option>
            </Select>
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" className="text-xs">CMDB UNIQUE NO.</Text>
            <Input 
              className="mt-1"
              placeholder="Type CMDB ID..." 
              onChange={e => setFilters({...filters, cmdb: e.target.value})}
            />
          </Col>
          <Col xs={24} md={6}>
            <Text type="secondary" className="text-xs">SERIAL NO.</Text>
            <Input 
              className="mt-1"
              placeholder="Type Serial..." 
              onChange={e => setFilters({...filters, serialNo: e.target.value})}
            />
          </Col>
        </Row>
      </Card>

      {/* --- 資料表格 --- */}
      <Card className="rounded-2xl shadow-sm border-none overflow-hidden">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 12 }}
          className="st-inventory-table"
        />
      </Card>
    </div>
  );
};
