import React, { useState, useEffect, useMemo } from 'react';
import { Table, Input, Select, Card, Typography, Space, Tag, Button, Row, Col, message, Modal, Descriptions, Divider, Avatar } from 'antd';
import { 
  SearchOutlined, ReloadOutlined, DatabaseOutlined, 
  BarcodeOutlined, IdcardOutlined, EditOutlined, 
  PictureOutlined, GlobalOutlined, HistoryOutlined, UserOutlined 
} from '@ant-design/icons';
import { INV_FIELDS } from '../constants';

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
    status: 'All',
    serialNo: '',
    cmdb: '',
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
            shopCode: f[INV_FIELDS.SHOP_CODE] || '',
            businessUnit: f[INV_FIELDS.BUSINESS_UNIT] || '',
            shopBrand: f[INV_FIELDS.SHOP_BRAND] || '',
            shopName: f[INV_FIELDS.SHOP_NAME] || '',
            productTypeEng: f[INV_FIELDS.PRODUCT_TYPE_ENG] || '',
            productTypeChi: f[INV_FIELDS.PRODUCT_TYPE_CHI] || '',
            stockTakeStatus: f[INV_FIELDS.STOCK_TAKE_STATUS] || 'Unverified',
            assetItemId: f[INV_FIELDS.ASSET_ITEM_ID] || '',
            brand: f[INV_FIELDS.BRAND] || '',
            assetName: f[INV_FIELDS.ASSET_NAME] || '',
            cmdb: f[INV_FIELDS.CMDB] || '',
            serialNo: f[INV_FIELDS.SERIAL_NO] || '',
            ipAddress: f[INV_FIELDS.IP_ADDRESS] || '',
            inUseStatus: f[INV_FIELDS.IN_USE_STATUS] || 'N/A',
            remarks: f[INV_FIELDS.REMARKS] || '',
            wToW: f[INV_FIELDS.W_TO_W] || '',
            createdBy: f[INV_FIELDS.CREATED_BY] || '',
            recordTimeAlt: f[INV_FIELDS.RECORD_TIME_ALT] || '',
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
      (filters.status === 'All' || item.stockTakeStatus === filters.status) &&
      (item.cmdb || '').toLowerCase().includes(filters.cmdb.toLowerCase()) &&
      (item.serialNo || '').toLowerCase().includes(filters.serialNo.toLowerCase()) &&
      (item.assetItemId || '').toLowerCase().includes(filters.assetItemId.toLowerCase())
    );
  }, [data, filters]);

  const columns = [
    {
      title: 'Shop / Brand',
      key: 'shop',
      width: '18%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.shopName}</Text>
          <Tag color="orange" style={{ fontSize: '10px' }}>{record.shopBrand}</Tag>
        </Space>
      ),
    },
    {
      title: 'Product Type',
      key: 'type',
      width: '15%',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong className="text-teal-700">{record.productTypeEng}</Text>
          <Text style={{ color: '#94a3b8', fontSize: '11px' }}>{record.productTypeChi}</Text>
        </Space>
      ),
    },
    {
      title: 'Asset Detail',
      key: 'asset',
      render: (record: any) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.assetName}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>SN: {record.serialNo} | CMDB: {record.cmdb}</Text>
        </Space>
      ),
    },
    {
      title: 'Stock Take Status',
      key: 'status',
      width: 180,
      render: (record: any) => {
        let color = 'default';
        if (record.stockTakeStatus === 'Verified') color = 'green';
        if (record.stockTakeStatus === 'New Record') color = 'orange';
        if (record.stockTakeStatus === 'Device Not Found') color = '#94a3b8'; // Grey

        return (
          <Space direction="vertical" size={0}>
            <Tag color={color} className="font-bold uppercase" style={{ fontSize: '10px' }}>
              {record.stockTakeStatus}
            </Tag>
            <Text style={{ fontSize: '10px', color: '#94a3b8' }}>In Use: {record.inUseStatus}</Text>
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
        /* ✅ 自定義動畫按鈕 */
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
            <Input prefix={<SearchOutlined />} placeholder="Name..." onChange={e => setFilters({...filters, shopName: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">ST Status</Text>
            <Select className="w-full h-10" defaultValue="All" onChange={val => setFilters({...filters, status: val})}>
              <Option value="All">All</Option>
              <Option value="Verified">Verified</Option>
              <Option value="New Record">New Record</Option>
              <Option value="Device Not Found">Not Found</Option>
            </Select>
          </Col>
          <Col span={4}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">CMDB / Serial</Text>
            <Input placeholder="Search..." onChange={e => setFilters({...filters, cmdb: e.target.value})} className="rounded-lg h-10" />
          </Col>
          <Col span={12}>
            <Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Asset Item ID</Text>
            <Input prefix={<IdcardOutlined />} placeholder="Type Asset Item ID to search..." onChange={e => setFilters({...filters, assetItemId: e.target.value})} className="rounded-lg h-10" />
          </Col>
        </Row>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* ✅ 詳細資訊彈窗 */}
      <Modal
        title={<Space><DatabaseOutlined className="text-teal-600" /> Asset Inventory Detail</Space>}
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={850}
        centered
        footer={[
          <Button key="edit" icon={<EditOutlined />} onClick={() => message.info("Edit mode enabled")} className="rounded-lg border-teal-600 text-teal-600">Edit Details</Button>,
          <Button key="close" type="primary" onClick={() => setModalVisible(false)} className="bg-slate-800 border-none rounded-lg px-8">Close</Button>
        ]}
      >
        {selectedItem && (
          <div className="max-h-[70vh] overflow-y-auto px-2">
            <div className="flex justify-between items-start mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Space direction="vertical" size={0}>
                <Text type="secondary" className="text-[10px] uppercase font-bold tracking-widest">Asset Name</Text>
                <Title level={3} style={{ margin: 0 }}>{selectedItem.assetName}</Title>
                <Space className="mt-1">
                  <Tag icon={<IdcardOutlined />} color="blue" className="rounded-md font-mono">{selectedItem.assetItemId}</Tag>
                  <Text type="secondary" className="text-xs">Brand: <span className="font-bold text-slate-700">{selectedItem.brand}</span></Text>
                </Space>
              </Space>
              <div className="text-right">
                <Tag color={selectedItem.stockTakeStatus === 'Verified' ? 'green' : (selectedItem.stockTakeStatus === 'New Record' ? 'orange' : 'default')} className="m-0 px-4 py-1 rounded-lg font-black text-[11px] uppercase">
                  {selectedItem.stockTakeStatus}
                </Tag>
                <div className="mt-2 flex flex-col items-end">
                   <Text className="text-[10px] text-slate-400 font-bold uppercase">In Use Status</Text>
                   <Text strong className="text-teal-600">{selectedItem.inUseStatus}</Text>
                </div>
              </div>
            </div>

            <Row gutter={24}>
              <Col span={15}>
                <Descriptions title={<Text strong className="text-teal-700"><GlobalOutlined /> Shop & Category</Text>} bordered column={2} size="small" className="mb-6">
                  <Descriptions.Item label="Shop Name" span={2}>{selectedItem.shopName}</Descriptions.Item>
                  <Descriptions.Item label="Shop Code">{selectedItem.shopCode}</Descriptions.Item>
                  <Descriptions.Item label="Brand">{selectedItem.shopBrand}</Descriptions.Item>
                  <Descriptions.Item label="BU">{selectedItem.businessUnit}</Descriptions.Item>
                  <Descriptions.Item label="Category">
                     <Text strong>{selectedItem.productTypeEng}</Text><br/>
                     <Text className="text-[11px] text-slate-400">{selectedItem.productTypeChi}</Text>
                  </Descriptions.Item>
                </Descriptions>

                <Descriptions title={<Text strong className="text-blue-700"><BarcodeOutlined /> Hardware Info</Text>} bordered column={2} size="small" className="mb-6">
                  <Descriptions.Item label="CMDB No"><Text copyable className="font-mono">{selectedItem.cmdb}</Text></Descriptions.Item>
                  <Descriptions.Item label="Serial No"><Text copyable className="font-mono">{selectedItem.serialNo}</Text></Descriptions.Item>
                  <Descriptions.Item label="IP Address" span={2}><Tag color="cyan">{selectedItem.ipAddress || 'N/A'}</Tag></Descriptions.Item>
                  <Descriptions.Item label="W to W" span={2}><Tag color="purple">{selectedItem.wToW || 'N/A'}</Tag></Descriptions.Item>
                </Descriptions>
              </Col>

              <Col span={9}>
                <Text strong className="text-slate-500 block mb-2 uppercase text-[11px]"><PictureOutlined /> Asset Photo</Text>
                <div className="photo-placeholder">
                  <PictureOutlined style={{ fontSize: '32px' }} />
                  <span className="text-[10px] font-bold mt-2 uppercase">Coming Soon</span>
                </div>

                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                   <Text strong className="text-[10px] uppercase block mb-3 text-slate-400"><HistoryOutlined /> Audit Trace</Text>
                   <Space direction="vertical" size={12} className="w-full">
                      <div className="flex items-center gap-3">
                        <Avatar size="small" icon={<UserOutlined />} className="bg-teal-500" />
                        <Space direction="vertical" size={0}>
                          <Text className="text-[11px] font-bold">Created By</Text>
                          <Text className="text-[10px] text-slate-500">{selectedItem.createdBy}</Text>
                        </Space>
                      </div>
                      <div className="flex items-center gap-3">
                        <Avatar size="small" icon={<ReloadOutlined />} className="bg-blue-500" />
                        <Space direction="vertical" size={0}>
                          <Text className="text-[11px] font-bold">Record Time</Text>
                          <Text className="text-[10px] text-slate-500">{selectedItem.recordTimeAlt}</Text>
                        </Space>
                      </div>
                   </Space>
                </div>
              </Col>
            </Row>

            <Divider orientation="left"><Text type="secondary" className="text-xs uppercase">Remarks</Text></Divider>
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100 italic text-slate-600 text-xs">
              {selectedItem.remarks || "No additional remarks."}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
