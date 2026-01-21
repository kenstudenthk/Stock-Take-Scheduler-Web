import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Select, Divider, AutoComplete, Input } from 'antd';
import { 
  InfoCircleOutlined, 
  GlobalOutlined,
  SearchOutlined
} from '@ant-design/icons';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
  shops: Shop[]; 
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken, shops }) => {
  const [formData, setFormData] = useState<any>({});
  const [searchText, setSearchText] = useState('');

  // ✅ 1. 修復 dynamicOptions 邏輯
  const dynamicOptions = useMemo(() => {
    const safeShops = shops || [];
    const getUnique = (key: keyof Shop) => 
      Array.from(new Set(safeShops.map(s => s[key]).filter(Boolean)))
        .sort()
        .map(val => ({ label: val, value: val }));

    return {
      brands: getUnique('brand'),
      regions: getUnique('region'),
      districts: getUnique('district'),
      areas: getUnique('area'),
    };
  }, [shops]);

  // ✅ 2. 修復初始資料載入
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
          bu: shop.businessUnit || '',
          sys: (shop as any).sys || '',
        });
      } else {
        setFormData({});
      }
    }
  }, [shop, visible]);

  // ✅ 3. 定義 handleSubmit 邏輯
  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return message.warning("Shop Name and Code are required!");
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
      if (res.ok) {
        message.success(isEdit ? "Updated!" : "Created!");
        onSuccess();
      }
    } catch (err) { message.error("Network Error"); }
  };

  // ✅ 4. 渲染 Input 樣式
  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input 
          type="text" 
          required 
          value={formData[key] || ''} 
          onChange={e => setFormData({...formData, [key]: e.target.value})} 
          placeholder=" "
        />
        <span>{label}</span>
      </div>
    </Col>
  );

  // ✅ 5. 渲染 Select 組件
  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <Select
          className="st-input-select-wrapper"
          variant="borderless"
          showSearch
          placeholder=" "
          value={formData[key] || undefined}
          onChange={val => setFormData({...formData, [key]: val})}
          options={options}
          style={{ width: '100%', paddingTop: '10px' }}
        />
        <span className="static-label" style={{ position: 'absolute', top: '-10px', left: '10px', fontSize: '12px', color: '#0d9488' }}>{label}</span>
      </div>
    </Col>
  );

  return (
    <Modal 
      open={visible} 
      onCancel={onCancel} 
      footer={null} 
      width={900} 
      centered 
      bodyStyle={{ padding: '32px', backgroundColor: '#f8fafc' }}
    >
      <div className="mb-6">
        <Title level={3} style={{ margin: 0 }}>{shop ? 'Store Profile Manager' : 'New Store Registration'}</Title>
        <Text type="secondary">Managing SharePoint records directly.</Text>
      </div>

      <div className="st-form-section">
        <Divider orientation="left" style={{ color: '#0d9488' }}><InfoCircleOutlined /> BASIC IDENTIFICATION</Divider>
        <Row gutter={[20, 24]}>
          {renderInput("Official Shop Name", "name", 24)}
          {renderInput("Shop Code", "code", 8)}
          {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
        </Row>
      </div>

      <div className="st-form-section mt-4">
        <Divider orientation="left" style={{ color: '#0d9488' }}><GlobalOutlined /> ADDRESS & LOGISTICS</Divider>
        <Row gutter={[20, 24]}>
          {renderInput("English Address (Full)", "addr_en", 24)}
          {renderInput("Chinese Address", "addr_chi", 24)}
          {renderSelect("Region", "region", dynamicOptions.regions, 8)}
          {renderSelect("District", "district", dynamicOptions.districts, 8)}
          {renderSelect("Area", "area", dynamicOptions.areas, 8)}
          {renderInput("Building / Landmark", "building", 24)}
        </Row>
      </div>

      <div className="flex justify-end gap-4 mt-8">
        <button 
          className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all" 
          onClick={onCancel}
        >
          CANCEL
        </button>
        <button 
          className="px-12 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 hover:scale-105 transition-all" 
          onClick={handleSubmit}
        >
          {shop ? 'UPDATE RECORDS' : 'CREATE RECORD'}
        </button>
      </div>
    </Modal>
  );
};
