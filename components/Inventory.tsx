import React, { useState, useEffect, useMemo } from 'react';
import { 
  Table, Input, Select, Card, Typography, Space, Tag, Button, 
  Row, Col, message, Modal, Descriptions, Divider, Avatar, Form, AutoComplete 
} from 'antd';
import { 
  SearchOutlined, ReloadOutlined, DatabaseOutlined, 
  BarcodeOutlined, IdcardOutlined, EditOutlined, 
  PictureOutlined, GlobalOutlined, HistoryOutlined, UserOutlined, PlusOutlined 
} from '@ant-design/icons';
import { INV_FIELDS } from '../constants';
import { Shop } from '../types';

const { Title, Text } = Typography;
const { Option } = Select;

interface Props {
  invToken: string;
  shops: Shop[]; // 從 App.tsx 傳入的商店主檔
}

export const Inventory: React.FC<Props> = ({ invToken, shops }) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailVisible, setDetailVisible] = useState(false);
  
  // 表單狀態
  const [form] = Form.useForm();
  const [formVisible, setFormVisible] = useState(false);
  const [formMode, setFormMode] = useState<'new' | 'edit'>('new');

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

  // ✅ 智慧聯動：商店選擇後的自動填寫邏輯 (包含 CMDB 前 5 碼)
  const handleShopSelect = (value: string) => {
    const selectedShop = shops.find(s => `${s.id} - ${s.name}` === value);
    if (selectedShop) {
      form.setFieldsValue({
        shopCode: selectedShop.id,
        shopBrand: selectedShop.brand,
        businessUnit: (selectedShop as any).businessUnit || '',
        // ✅ 自動填入 CMDB 的前 5 碼 (即 Shop Code)
        cmdb: selectedShop.id 
      });
      message.info(`Auto-filled: Shop Code ${selectedShop.id} & CMDB prefix.`);
    }
  };

  const handleAddNew = () => {
    setFormMode('new');
    form.resetFields();
    setFormVisible(true);
  };

  const handleEdit = () => {
    setFormMode('edit');
    form.setFieldsValue(selectedItem);
    setDetailVisible(false);
    setFormVisible(true);
  };

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
        let color = record.stockTakeStatus === 'Verified' ? 'green' : (record.stockTakeStatus === 'New Record' ? 'orange' : '#94a3b8');
        return (
          <Space direction="vertical" size={0}>
            <Tag color={color} className="font-bold uppercase" style={{ fontSize: '10px' }}>{record.stockTakeStatus}</Tag>
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
        <div className="tooltip-container" onClick={() => { setSelectedItem(record); setDetailVisible(true); }}>
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
        <Space direction="vertical" size={0}>
           <Title level={2} style={{ margin: 0 }}>Inventory Database</Title>
           <Text type="secondary">Asset Management System</Text>
        </Space>
        <Space>
           <Button icon={<PlusOutlined />} onClick={handleAddNew} size="large" className="rounded-xl font-bold">New Item</Button>
           <Button type="primary" icon={<ReloadOutlined />} onClick={fetchInventory} loading={loading} size="large" className="bg-teal-600 rounded-xl font-bold shadow-lg">Refresh Data</Button>
        </Space>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <Row gutter={[16, 16]}>
          <Col span={4}><Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Shop Search</Text><Input prefix={<SearchOutlined />} placeholder="Name..." onChange={e => setFilters({...filters, shopName: e.target.value})} className="rounded-lg h-10" /></Col>
          <Col span={4}><Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">ST Status</Text><Select className="w-full h-10" defaultValue="All" onChange={val => setFilters({...filters, status: val})}><Option value="All">All</Option><Option value="Verified">Verified</Option><Option value="New Record">New Record</Option><Option value="Device Not Found">Not Found</Option></Select></Col>
          <Col span={16}><Text strong className="text-slate-400 text-[10px] uppercase mb-1 block">Asset Item ID</Text><Input prefix={<IdcardOutlined />} placeholder="Type Asset Item ID to search..." onChange={e => setFilters({...filters, assetItemId: e.target.value})} className="rounded-lg h-10" /></Col>
        </Row>
      </Card>

      <Card className="rounded-2xl border-none shadow-sm overflow-hidden">
        <Table columns={columns} dataSource={filteredData} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* 詳情彈窗 */}
      <Modal
        title={<Space><DatabaseOutlined className="text-teal-600" /> Asset Inventory Detail</Space>}
        visible={detailVisible}
        onCancel={() => setDetailVisible(false)}
        width={850}
        centered
        footer={[
          <Button key="edit" icon={<EditOutlined />} onClick={handleEdit} className="rounded-lg border-teal-600 text-teal-600">Edit Asset</Button>,
          <Button key="close" type="primary" onClick={() => setDetailVisible(false)} className="bg-slate-800 border-none rounded-lg px-8">Close</Button>
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
                <div className="mt-2 text-right"><Text strong className="text-teal-600">{selectedItem.inUseStatus}</Text></div>
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
                     <Text strong>{selectedItem.productTypeEng}</Text><br/><Text className="text-[11px] text-slate-400">{selectedItem.productTypeChi}</Text>
                  </Descriptions.Item>
                </Descriptions>
                <Descriptions title={<Text strong className="text-blue-700"><BarcodeOutlined /> Hardware Info</Text>} bordered column={2} size="small">
                  <Descriptions.Item label="CMDB No"><Text copyable className="font-mono">{selectedItem.cmdb}</Text></Descriptions.Item>
                  <Descriptions.Item label="Serial No"><Text copyable className="font-mono">{selectedItem.serialNo}</Text></Descriptions.Item>
                  <Descriptions.Item label="IP Address" span={2}><Tag color="cyan">{selectedItem.ipAddress || 'N/A'}</Tag></Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={9}>
                <Text strong className="text-slate-500 block mb-2 uppercase text-[11px]"><PictureOutlined /> Asset Photo</Text>
                <div className="photo-placeholder"><PictureOutlined style={{ fontSize: '32px' }} /><span className="text-[10px] font-bold mt-2 uppercase">Coming Soon</span></div>
                <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                   <Text strong className="text-[10px] uppercase block mb-3 text-slate-400"><HistoryOutlined /> Audit Trace</Text>
                   <Space direction="vertical" size={12} className="w-full">
                      <div className="flex items-center gap-3"><Avatar size="small" icon={<UserOutlined />} className="bg-teal-500" /><Space direction="vertical" size={0}><Text className="text-[11px] font-bold">Created By</Text><Text className="text-[10px] text-slate-500">{selectedItem.createdBy}</Text></Space></div>
                      <div className="flex items-center gap-3"><Avatar size="small" icon={<ReloadOutlined />} className="bg-blue-500" /><Space direction="vertical" size={0}><Text className="text-[11px] font-bold">Record Time</Text><Text className="text-[10px] text-slate-500">{selectedItem.recordTimeAlt}</Text></Space></div>
                   </Space>
                </div>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* ✅ 編輯/新增表單彈窗 */}
      <Modal
        title={<Space><EditOutlined className="text-teal-600" /> {formMode === 'new' ? 'Add New Asset' : 'Edit Asset Detail'}</Space>}
        visible={formVisible}
        onCancel={() => setFormVisible(false)}
        onOk={() => form.submit()}
        width={650}
        okText="Save Record"
        centered
      >
        <Form form={form} layout="vertical" onFinish={(values) => { message.loading("Updating SharePoint..."); setFormVisible(false); }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="shopName" label="Shop Name (Type Code or Name to search)" rules={[{ required: true }]}>
                <AutoComplete
                  options={shops.map(s => ({ value: `${s.id} - ${s.name}` }))}
                  onSelect={handleShopSelect}
                  placeholder="e.g. 5110"
                  filterOption={(inputValue, option) =>
                    option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
                  }
                />
              </Form.Item>
            </Col>
            
            <Col span={8}><Form.Item name="shopCode" label="Shop Code"><Input disabled className="bg-slate-50" /></Form.Item></Col>
            <Col span={8}><Form.Item name="shopBrand" label="Shop Brand"><Input disabled className="bg-slate-50" /></Form.Item></Col>
            <Col span={8}><Form.Item name="businessUnit" label="Business Unit"><Input disabled className="bg-slate-50" /></Form.Item></Col>
            
            <Divider className="my-2" />
            
            <Col span={24}><Form.Item name="assetName" label="Asset Name" rules={[{ required: true }]}><Input placeholder="e.g. iPad Pro 11-inch" /></Form.Item></Col>
            
            <Col span={12}>
              <Form.Item name="cmdb" label="CMDB Number" rules={[{ required: true }]}>
                {/* 使用者在選擇商店後，這裡會自動出現前 5 碼，只需補齊後 4 碼 */}
                <Input placeholder="ShopCode + 0001" maxLength={9} />
              </Form.Item>
            </Col>
            
            <Col span={12}><Form.Item name="assetItemId" label="Asset Item ID"><Input placeholder="e.g. EQ-12345" /></Form.Item></Col>
            <Col span={12}><Form.Item name="brand" label="Manufacturer / Brand"><Input placeholder="e.g. Apple" /></Form.Item></Col>
            <Col span={12}><Form.Item name="serialNo" label="Serial Number"><Input placeholder="Unique SN" /></Form.Item></Col>
            
            <Col span={12}>
              <Form.Item name="stockTakeStatus" label="Stock Take Status">
                <Select>
                  <Option value="Verified">Verified</Option>
                  <Option value="New Record">New Record</Option>
                  <Option value="Device Not Found">Device Not Found</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
               <Form.Item name="inUseStatus" label="In Use Status">
                 <Select>
                   <Option value="In Use">In Use</Option>
                   <Option value="Spare">Spare</Option>
                   <Option value="Damaged">Damaged</Option>
                 </Select>
               </Form.Item>
            </Col>
            
            <Col span={24}><Form.Item name="remarks" label="Remarks"><Input.TextArea rows={2} /></Form.Item></Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
};
