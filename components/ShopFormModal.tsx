// ShopFormModal.tsx

import React, { useEffect, useState, useMemo } from 'react';
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

  // ✅ 1. 動態提取唯一選項
  const dynamicOptions = useMemo(() => {
    const safeShops = shops || []; 
    const getUnique = (key: keyof Shop) => 
      Array.from(new Set(safeShops.map(s => s[key]).filter(Boolean)))
        .sort()
        .map(val => ({ label: val, value: val }));

    return {
      bus: getUnique('businessUnit'),
      brands: getUnique('brand'),
      regions: getUnique('region'),
      districts: getUnique('district'),
      areas: getUnique('area'),
    };
  }, [shops]);

  // ✅ 2. 初始資料載入
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

  // ✅ 3. 渲染 Uiverse 風格的 Input (保留原本的 Title Movement 結構)
  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input 
          className="uiverse-input-field" // 加入新類名
          type="text" 
          required 
          value={formData[key] || ''} 
          onChange={e => setFormData({...formData, [key]: e.target.value})} 
          placeholder=" " // 確保 placeholder 為空，以便讓 span 標籤能正確觸發移動邏輯
        />
        <span>{label}</span>
      </div>
    </Col>
  );

  // ✅ 4. 渲染 Uiverse 風格的 Select
  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro select-container-uiverse">
        <Select
          className="st-input-select-wrapper uiverse-select-field"
          variant="borderless"
          showSearch
          placeholder=" "
          value={formData[key] || undefined}
          onChange={val => setFormData({...formData, [key]: val})}
          options={options}
          optionFilterProp="label"
          style={{ width: '100%', paddingTop: '10px' }}
        />
        <span className="static-label">{label}</span>
      </div>
    </Col>
  );

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

  return (
    <>
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
            {renderSelect("Schedule Group", "group", [{label:'Group A', value:'1'},{label:'Group B', value:'2'},{label:'Group C', value:'3'}], 8)}
            {renderSelect("Business Unit", "bu", dynamicOptions.bus, 12)}
            {renderInput("System ID", "sys", 12)}
          </Row>
        </div>

        <div className="st-form-section mt-8">
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

        <div className="flex justify-end gap-4 mt-12">
          <button className="px-8 py-3 bg-white border-2 border-black text-black rounded-xl font-bold hover:bg-slate-50 transition-all shadow-[2.5px_3px_0_#000] active:translate-y-1 active:shadow-none" onClick={onCancel}>
            CANCEL
          </button>
          <button className="px-12 py-3 bg-teal-500 text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0_#000] hover:bg-teal-600 hover:scale-[1.02] transition-all" onClick={handleSubmit}>
            {shop ? 'UPDATE RECORDS' : 'CREATE RECORD'}
          </button>
        </div>

        {/* ✅ 注入 Uiverse 文字框樣式 */}
        <style>{`
          .uiverse-input-field {
            width: 100% !important;
            padding: 0.875rem !important;
            font-size: 1rem !important;
            border: 1.5px solid #000 !important;
            border-radius: 0.5rem !important;
            box-shadow: 2.5px 3px 0 #000 !important;
            outline: none !important;
            transition: ease 0.25s !important;
            background: white !important;
          }

          .uiverse-input-field:focus {
            box-shadow: 5.5px 7px 0 black !important;
          }

          /* 修復原本 Title Movement 的 span 定位，確保不會被 box-shadow 遮擋 */
          .st-inputBox-pro span {
            pointer-events: none;
            transition: 0.3s;
          }

          /* 針對 Select 的容器同步風格 */
          .select-container-uiverse {
            border: 1.5px solid #000 !important;
            border-radius: 0.5rem !important;
            box-shadow: 2.5px 3px 0 #000 !important;
            background: white !important;
            padding-right: 8px !important;
          }
          
          .uiverse-select-field .ant-select-selection-item {
            font-weight: bold !important;
            color: #000 !important;
          }
        `}</style>
      </Modal>
    </>
  );
};
