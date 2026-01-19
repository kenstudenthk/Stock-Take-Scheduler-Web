// ShopFormModal.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Space, Select, Divider } from 'antd';
import { 
  InfoCircleOutlined, 
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

  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input 
          className="uiverse-input-field" 
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

  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro select-container-uiverse">
        <Select
          className="uiverse-select-field"
          variant="borderless"
          showSearch
          placeholder=" "
          value={formData[key] || undefined}
          onChange={val => setFormData({...formData, [key]: val})}
          options={options}
          optionFilterProp="label"
          style={{ width: '100%' }}
        />
        <span className="uiverse-floating-label">{label}</span>
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
        width={1000} 
        centered 
        bodyStyle={{ padding: '40px', backgroundColor: '#f8fafc' }}
      >
        <div className="mb-8">
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>{shop ? 'STORE PROFILE MANAGER' : 'NEW STORE REGISTRATION'}</Title>
          <Text type="secondary">Real-time SharePoint Data Synchronization</Text>
        </div>

        <div className="st-form-section">
          <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}>
            <InfoCircleOutlined /> BASIC IDENTIFICATION
          </Divider>
          <Row gutter={[24, 32]}>
            {renderInput("Official Shop Name", "name", 24)}
            {renderInput("Shop Code", "code", 8)}
            {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
            {renderSelect("Schedule Group", "group", [{label:'Group A', value:'1'},{label:'Group B', value:'2'},{label:'Group C', value:'3'}], 8)}
            {renderSelect("Business Unit", "bu", dynamicOptions.bus, 12)}
            {renderInput("System ID", "sys", 12)}
          </Row>
        </div>

        <div className="st-form-section mt-10">
          <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}>
            <GlobalOutlined /> ADDRESS & LOGISTICS
          </Divider>
          <Row gutter={[24, 32]}>
            {renderInput("English Address (Full)", "addr_en", 24)}
            {renderInput("Chinese Address", "addr_chi", 24)}
            {renderSelect("Region", "region", dynamicOptions.regions, 8)}
            {renderSelect("District", "district", dynamicOptions.districts, 8)}
            {renderSelect("Area", "area", dynamicOptions.areas, 8)}
            {renderInput("Building / Landmark", "building", 24)}
          </Row>
        </div>

        <div className="flex justify-end gap-6 mt-16">
          <button className="px-10 py-3 bg-white border-2 border-black text-black rounded-xl font-black hover:bg-slate-50 transition-all shadow-[3px_3px_0_#000] active:translate-y-1 active:shadow-none" onClick={onCancel}>
            CANCEL
          </button>
          <button className="px-14 py-3 bg-teal-500 text-white border-2 border-black rounded-xl font-black shadow-[5px_5px_0_#000] hover:bg-teal-600 hover:scale-[1.02] transition-all" onClick={handleSubmit}>
            {shop ? 'SAVE CHANGES' : 'CREATE RECORD'}
          </button>
        </div>

        <style>{`
          /* 1. 基礎容器設定 */
          .st-inputBox-pro {
            position: relative;
            width: 100%;
          }

          /* 2. Input 文字框與垂直居中 (Vertical Center) */
          .uiverse-input-field {
            width: 100% !important;
            height: 54px !important; /* 固定高度以便居中 */
            padding: 0 1rem !important;
            font-size: 1rem !important;
            font-weight: 700 !important;
            border: 2px solid #000 !important;
            border-radius: 0.6rem !important;
            box-shadow: 3px 4px 0 #000 !important;
            outline: none !important;
            transition: all 0.25s ease !important;
            background: white !important;
            display: flex !important;
            align-items: center !important;
          }

          /* 3. 標題字體更大且更高 (Bigger & Higher) */
          .st-inputBox-pro span {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 13px !important; /* 更大的標題 */
            font-weight: 800 !important;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            background: transparent;
            padding: 0 4px;
          }

          /* 標題浮動邏輯：移動到更高位置 */
          .uiverse-input-field:focus ~ span,
          .uiverse-input-field:not(:placeholder-shown) ~ span,
          .uiverse-select-field.ant-select-in-form-item ~ span,
          .select-container-uiverse span {
            transform: translateY(-42px) translateX(-4px) !important; /* 向上移動更多 */
            font-size: 12px !important;
            color: #0d9488 !important;
            background: #f8fafc; /* 與背景色融合 */
          }

          /* 4. Select 組件修復：垂直居中與邊框同步 */
          .select-container-uiverse {
            border: 2px solid #000 !important;
            border-radius: 0.6rem !important;
            box-shadow: 3px 4px 0 #000 !important;
            background: white !important;
            height: 54px !important;
            display: flex;
            align-items: center; /* 強制垂直居中 */
          }

          .uiverse-select-field {
            width: 100% !important;
          }

          .uiverse-select-field .ant-select-selector {
            height: 50px !important;
            display: flex !important;
            align-items: center !important; /* 數值居中關鍵 */
            font-weight: 800 !important;
            font-size: 14px !important;
            color: #000 !important;
            background: transparent !important;
          }

          .uiverse-input-field:focus {
            box-shadow: 6px 7px 0 black !important;
            border-color: #0d9488 !important;
          }
        `}</style>
      </Modal>
    </>
  );
};
