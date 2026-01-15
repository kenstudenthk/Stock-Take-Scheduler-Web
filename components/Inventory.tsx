import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Button, Row, Col, message, Modal, Descriptions, Divider } from 'antd';
import { 
  SearchOutlined, ReloadOutlined, DatabaseOutlined, 
  BarcodeOutlined, IdcardOutlined, EditOutlined 
} from '@ant-design/icons';
import { INV_FIELDS } from '../constants'; // 使用您提供的 constants.ts

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  invToken: string;
}

export const Inventory: React.FC<Props> = ({ invToken }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [filters, setFilters] = useState({
    shopName: '',
    shopBrand: '',
    status: 'All',
    cmdb: '',
    serialNo: '',
    assetItemId: ''
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
            // --- 使用 INV_FIELDS 進行精準對應 ---
            shopName: f[INV_FIELDS.SHOP_NAME] || '',
            shopBrand: f[INV_FIELDS.SHOP_BRAND] || '',
            shopCode: f[INV_FIELDS.SHOP_CODE] || '',
            productTypeEng: f[INV_FIELDS.PRODUCT_TYPE_ENG] || '',
            productTypeChi: f[INV_FIELDS.PRODUCT_TYPE_CHI] || '',
            cmdb: f[INV_FIELDS.CMDB] || '',
            serialNo: f[INV_FIELDS.SERIAL_NO] || '',
            assetName: f[INV_FIELDS.ASSET_NAME] || '',
            inUseStatus: f[INV_FIELDS.IN_USE_STATUS] || 'N/A',
            stockTakeStatus: f[INV_FIELDS.STOCK_TAKE_STATUS] || 'Unverified', // ✅ 新增盤點狀態
            brand: f[INV_FIELDS.BRAND] || '',
            recordTime: f[INV_FIELDS.RECORD_TIME] || '',
            assetItemId: f[INV_FIELDS.ASSET_ITEM_ID] || '',
            remarks: f[INV_FIELDS.REMARKS] || '',
            businessUnit: f[INV_FIELDS.BUSINESS_UNIT] || '',
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
      (item.shopName || '').toLowerCase().includes(filters.shopName.toLowerCase()) &&
      (item.shopBrand || '').toLowerCase().includes(filters.shopBrand.toLowerCase()) &&
      (filters.status === 'All' || item.inUseStatus === filters.status) &&
      (item.cmdb || '').toLowerCase().includes(filters.cmdb.toLowerCase()) &&
      (item.serialNo || '').toLowerCase().includes(filters.serialNo.toLowerCase()) &&
      (item.assetItemId || '').toLowerCase().includes(filters.assetItemId.toLowerCase())
    );
  }, [data, filters]);

  const columns = [
    {
      title: 'Shop / Store',
      key: 'shop',
      width: '18%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '13px' }}>{record.shopName}</Text>
          <Tag color="orange" style={{ fontSize: '10px', borderRadius: '4px' }}>{record.shopBrand}</Tag>
        </Space>
      ),
    },
    {
      title: 'Product Type', // ✅ 更新欄位名稱與格式
      key: 'productType',
      width: '15%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-teal-700" style={{ fontSize: '13px' }}>{record.productTypeEng}</Text>
          <Text style={{ color: '#94a3b8', fontSize: '11px' }}>{record.productTypeChi}</Text>
        </Space>
      ),
    },
    {
      title: 'Asset Detail',
      key: 'asset',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '13px' }}>{record.assetName}</Text>
          <Space split={<Divider type="vertical" />}>
            <Text type="secondary" style={{ fontSize: '11px' }}>SN: {record.serialNo}</Text>
            <Text type="secondary" style={{ fontSize: '11px' }}>CMDB: {record.cmdb}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Stock Take Status', // ✅ 更新狀態顯示邏輯
      key: 'status',
      width: 160,
      render: (record: any) => {
        let color = 'default';
        const stStatus = record.stockTakeStatus;
        
        // 設定盤點狀態顏色
        if (stStatus === 'Verified') color = 'green';
        if (stStatus === 'New Record') color = 'orange';
        if (stStatus === 'Device Not Found') color = '#94a3b8'; // Grey

        return (
          <Space direction="vertical" size={0}>
            <Tag color={color} className="font-bold uppercase" style={{ fontSize: '10px' }}>
              {stStatus}
            </Tag>
            <Text style={{ fontSize: '10px', color: '#94a3b8', paddingLeft: '4px' }}>
              In Use: {record.inUseStatus}
            </Text>
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center' as const,
      render: (record: any) => (
        <div className="tooltip-container" onClick={() => { setSelectedItem(record); setModalVisible(true); }}>
          <div className="icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.518 0-10-4.482-10-10s4.482-10 10-10 10 4.482 10 10-4.482 10-10 10zm-1-16h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <div className="tooltip"><p>View Details</p></div>
        </div>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Title level={2} style={{ margin: 0 }}>Inventory Database</Title>
        <Button type="primary" icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading} className="bg-teal-600 rounded-xl h-11 px-6 font-bold shadow-lg">Refresh Data</Button>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={4}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Shop Search</Text>
            <Input prefix={<SearchOutlined />} placeholder="Shop name..." onChange={e => setFilters({...filters, shopName: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">CMDB / Serial</Text>
            <Input placeholder="Search..." onChange={e => setFilters({...filters, cmdb: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={16}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Asset Item ID</Text>
            <Input prefix={<IdcardOutlined />} placeholder="Search by Asset ID..." onChange={e => setFilters({...filters, assetItemId: e.target.value})} className="rounded-lg h-10" />
          </Col>
        </Row>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      <Modal
        title={<Space><DatabaseOutlined className="text-teal-600" /> Asset Inventory Detail</Space>}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          /* ✅ 新增 Edit 按鈕 */
          <Button key="edit" icon={<EditOutlined />} onClick={() => message.info("Edit feature coming soon!")} className="rounded-lg border-teal-600 text-teal-600">
            Edit Item
          </Button>,
          <Button key="close" type="primary" onClick={() => setModalVisible(false)} className="rounded-lg bg-slate-800 border-none">
            Close
          </Button>
        ]}
        width={700}
        centered
      >
        {selectedItem && (
          <div className="py-2">
            <div className="flex justify-between items-start mb-6">
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ margin: 0 }}>{selectedItem.assetName}</Title>
                <Text type="secondary" className="text-xs uppercase">{selectedItem.brand} | {selectedItem.assetItemId}</Text>
              </Space>
              <div className="text-right">
                <Tag color={selectedItem.stockTakeStatus === 'Verified' ? 'green' : (selectedItem.stockTakeStatus === 'New Record' ? 'orange' : 'default')} className="m-0 font-bold px-3 py-0.5 rounded-full">
                  {selectedItem.stockTakeStatus}
                </Tag>
                <div className="text-[10px] text-slate-400 mt-1">In Use: {selectedItem.inUseStatus}</div>
              </div>
            </div>
            
            <Descriptions bordered column={2} size="small" className="rounded-xl overflow-hidden bg-slate-50">
              <Descriptions.Item label="Shop Info" span={2}>
                <Text strong>{selectedItem.shopName}</Text> ({selectedItem.shopCode})
              </Descriptions.Item>
              <Descriptions.Item label="CMDB">{selectedItem.cmdb}</Descriptions.Item>
              <Descriptions.Item label="Serial No">{selectedItem.serialNo}</Descriptions.Item>
              <Descriptions.Item label="Category" span={2}>
                {selectedItem.productTypeEng} <br/>
                <Text type="secondary" className="text-xs">{selectedItem.productTypeChi}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="Remarks" span={2}>{selectedItem.remarks || '--'}</Descriptions.Item>
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};
