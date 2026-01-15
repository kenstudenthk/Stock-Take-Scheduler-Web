import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Button, Row, Col, message, Modal, Descriptions, Divider } from 'antd';
import { SearchOutlined, ReloadOutlined, DatabaseOutlined, BarcodeOutlined, IdcardOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { INV_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  invToken: string;
}

export const Inventory: React.FC<Props> = ({ invToken }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null); // ✅ 儲存被選中的資產
  const [modalVisible, setModalVisible] = useState(false);     // ✅ 控制 Modal 顯示
  
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
      width: '20%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '14px' }}>{record.shopName}</Text>
          <Space><Tag color="orange" style={{ fontSize: '10px' }}>{record.shopBrand}</Tag></Space>
        </Space>
      ),
    },
    {
      title: 'Asset Detail',
      key: 'asset',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '13px' }}>{record.assetName}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>SN: {record.serialNo} | CMDB: {record.cmdb}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'inUseStatus',
      key: 'status',
      width: 130,
      render: (status: string) => {
        let color = status === 'In Use' ? 'green' : (status === 'Not Found' ? 'red' : 'blue');
        return <Tag color={color} className="font-bold">{status}</Tag>;
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center' as const,
      render: (record: any) => (
        /* ✅ 核心組件注入：使用您提供的 HTML 結構作為按鈕 */
        <div 
          className="tooltip-container" 
          onClick={() => { setSelectedItem(record); setModalVisible(true); }}
        >
          <div className="icon">
            <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.518 0-10-4.482-10-10s4.482-10 10-10 10 4.482 10 10-4.482 10-10 10zm-1-16h2v6h-2zm0 8h2v2h-2z" />
            </svg>
          </div>
          <div className="tooltip">
            <p>View Item Details</p>
          </div>
        </div>
      ),
    }
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      {/* Header 與 Filter 區塊保持不變 */}
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
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Serial No</Text>
            <Input placeholder="Serial..." onChange={e => setFilters({...filters, serialNo: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">CMDB</Text>
            <Input placeholder="CMDB..." onChange={e => setFilters({...filters, cmdb: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={12}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Asset Item ID</Text>
            <Input prefix={<IdcardOutlined />} placeholder="Search by Asset ID..." onChange={e => setFilters({...filters, assetItemId: e.target.value})} className="rounded-lg h-10" />
          </Col>
        </Row>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* ✅ 詳情彈窗：與 Master List 邏輯一致 */}
      <Modal
        title={<Space><DatabaseOutlined className="text-teal-600" /> 資產詳細資訊 Asset Details</Space>}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[<Button key="close" type="primary" onClick={() => setModalVisible(false)} className="rounded-lg px-8">Close</Button>]}
        width={700}
        centered
        className="detail-modal-styled"
      >
        {selectedItem && (
          <div className="py-4">
            <div className="flex justify-between items-start mb-6">
              <Space direction="vertical" size={0}>
                <Title level={4} style={{ margin: 0 }}>{selectedItem.assetName}</Title>
                <Text type="secondary" className="text-xs uppercase tracking-widest">{selectedItem.brand} | {selectedItem.businessUnit}</Text>
              </Space>
              <Tag color="teal" className="m-0 font-bold px-4 py-1 rounded-full uppercase">{selectedItem.inUseStatus}</Tag>
            </div>
            
            <Descriptions bordered column={2} size="small" className="rounded-xl overflow-hidden">
              <Descriptions.Item label="Shop Name" span={2}>{selectedItem.shopName}</Descriptions.Item>
              <Descriptions.Item label="Shop Code">{selectedItem.shopCode}</Descriptions.Item>
              <Descriptions.Item label="Brand">{selectedItem.shopBrand}</Descriptions.Item>
              <Descriptions.Item label="Asset ID" span={2}><Text copyable className="font-mono text-blue-600">{selectedItem.assetItemId}</Text></Descriptions.Item>
              <Descriptions.Item label="Serial No"><Text className="font-mono">{selectedItem.serialNo}</Text></Descriptions.Item>
              <Descriptions.Item label="CMDB No"><Tag color="blue">{selectedItem.cmdb}</Tag></Descriptions.Item>
              <Descriptions.Item label="Category" span={2}>{selectedItem.productTypeEng} ({selectedItem.productTypeChi})</Descriptions.Item>
              <Descriptions.Item label="Remarks" span={2}>{selectedItem.remarks || '--'}</Descriptions.Item>
            </Descriptions>
            
            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
               <Text type="secondary" className="text-[11px] uppercase block">Last Data Update from SharePoint</Text>
               <Text strong className="text-xs">{selectedItem.recordTime || 'No recent record'}</Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};