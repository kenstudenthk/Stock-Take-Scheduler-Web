import React, { useEffect, useState } from 'react';
import { Modal, message, Row, Col, Typography, Button, Space, AutoComplete, Select, Divider } from 'antd';
import { 
  InfoCircleOutlined, 
  SearchOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  CopyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;

// --- ✅ 1. 定義靜態下拉選項 (放在組件外) ---
const BU_OPTIONS = [
  { label: 'Branded Restaurants', value: 'Branded Restaurants' },
  { label: 'Quick Service Restaurants', value: 'QSR' },
  { label: 'Cakes & Bakery', value: 'Bakery' },
  { label: 'Institutional Catering', value: 'Catering' }
];

const BRAND_OPTIONS = [
  { label: 'Maxim\'s MX', value: 'MX' },
  { label: 'Maxim\'s Cakes', value: 'Cakes' },
  { label: 'Starbucks', value: 'Starbucks' },
  { label: 'Genki Sushi', value: 'Genki' },
  { label: 'Arome', value: 'Arome' }
];

const REGION_OPTIONS = [
  { label: 'Hong Kong Island', value: 'HK' },
  { label: 'Kowloon', value: 'KN' },
  { label: 'New Territories', value: 'NT' },
  { label: 'Islands', value: 'Islands' },
  { label: 'Macau', value: 'MO' }
];

const DISTRICT_OPTIONS = [
  'Central', 'Wan Chai', 'Causeway Bay', 'Quarry Bay', 'Chai Wan',
  'Tsim Sha Tsui', 'Mong Kok', 'Kwun Tong', 'Kowloon Bay', 'Sham Shui Po',
  'Sha Tin', 'Tsuen Wan', 'Tuen Mun', 'Yuen Long', 'Tai Po', 'Tseung Kwan O'
].map(d => ({ label: d, value: d }));

const AREA_OPTIONS = [
  { label: 'Shopping Mall', value: 'Mall' },
  { label: 'Street Shop', value: 'Street' },
  { label: 'MTR Station', value: 'MTR' },
  { label: 'Office Building', value: 'Office' }
];

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [formData, setFormData] = useState<any>({});
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  // 初始化數據
  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({
          name: shop.name || '',
          code: shop.id || '',
          brand: shop.brand || '',
          region: shop.region || '',
          district: shop.district || '',
          area: shop.area || '',
          addr_en: shop.address || '',
          addr_chi: (shop as any).address_chi || '',
          building: (shop as any).building || '',
          mtr: shop.is_mtr ? 'Yes' : 'No',
          phone: shop.phone || '',
          contact: shop.contactName || '',
          remark: (shop as any).remark || '',
          sys: (shop as any).sys || '',
          bu: shop.businessUnit || '',
          lat: shop.latitude || '',
          lng: shop.longitude || '',
          group: shop.groupId?.toString() || '1'
        });
      } else {
        setFormData({ mtr: 'No', group: '1' });
      }
    }
  }, [shop, visible]);

  // --- ✅ 2. 定義渲染輔助函數 (各僅一次) ---
  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input 
          type="text" 
          required 
          value={formData[key] || ''} 
          onChange={e => setFormData({...formData, [key]: e.target.value})} 
        />
        <span>{label}</span>
      </div>
    </Col>
  );

  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro" style={{ border: 'none' }}>
        <span style={{ top: '-18px', fontSize: '10px', color: '#0d9488' }}>{label}</span>
        <Select
          style={{ width: '100%' }}
          className="custom-select-pro"
          placeholder={`Select ${label}`}
          value={formData[key] || undefined}
          onChange={val => setFormData({...formData, [key]: val})}
          options={options}
          showSearch
          optionFilterProp="label"
        />
      </div>
    </Col>
  );

  // 地點搜尋與提交邏輯 (保持不變)
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value || !window.AMap) return;
    window.AMap.plugin('AMap.AutoComplete', () => {
      const auto = new window.AMap.AutoComplete({ city: '香港' });
      auto.search(value, (status: string, result: any) => {
        if (status === 'complete' && result.tips) {
          setSearchOptions(result.tips.filter((t: any) => t.location).map((t: any) => ({
            value: `${t.name} - ${t.address || ''}`,
            location: t.location,
            label: <div><b>{t.name}</b><div style={{fontSize:'10px'}}>{t.address}</div></div>
          })));
        }
      });
    });
  };

  const handleSubmit = async () => {
    const isEdit = !!shop;
    const url = isEdit 
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? formData : { fields: formData })
      });
      if (res.ok) { message.success("Success!"); onSuccess(); }
    } catch (err) { message.error("Sync Error"); }
  };

  return (
    <>
      <Modal open={visible} onCancel={onCancel} footer={null} width={900} centered bodyStyle={{ padding: '32px', backgroundColor: '#f8fafc' }}>
        <Title level={3}>{shop ? 'Store Profile Manager' : 'New Store Registration'}</Title>
        
        <div className="st-form-section">
          <Divider orientation="left"><InfoCircleOutlined /> BASIC IDENTIFICATION</Divider>
          <Row gutter={[20, 20]}>
            {renderInput("Official Shop Name", "name", 24)}
            {renderInput("Shop Code", "code", 8)}
            {renderSelect("Brand", "brand", BRAND_OPTIONS, 8)}
            {renderSelect("Schedule Group", "group", [{label:'Group A', value:'1'}, {label:'Group B', value:'2'}, {label:'Group C', value:'3'}], 8)}
            {renderSelect("Business Unit", "bu", BU_OPTIONS, 12)}
            {renderInput("System ID", "sys", 12)}
          </Row>
        </div>

        <div className="st-form-section">
          <Divider orientation="left"><GlobalOutlined /> ADDRESS & LOGISTICS</Divider>
          <Row gutter={[20, 20]}>
            {renderInput("English Address", "addr_en", 24)}
            {renderInput("Chinese Address", "addr_chi", 24)}
            {renderSelect("Region", "region", REGION_OPTIONS, 8)}
            {renderSelect("District", "district", DISTRICT_OPTIONS, 8)}
            {renderSelect("Area", "area", AREA_OPTIONS, 8)}
          </Row>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <Button size="large" onClick={onCancel}>CANCEL</Button>
          <Button size="large" type="primary" className="bg-teal-600" onClick={handleSubmit}>
            {shop ? 'UPDATE RECORDS' : 'CREATE RECORD'}
          </Button>
        </div>
      </Modal>

      <Modal title="Geocoding" open={searchModalVisible} onCancel={() => setSearchModalVisible(false)} footer={null}>
        <AutoComplete style={{ width: '100%' }} options={searchOptions} onSearch={handleSearch} placeholder="Search..." />
      </Modal>
    </>
  );
};
