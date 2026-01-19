// ShopFormModal.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Select, Divider } from 'antd';
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
          phone: (shop as any).phone || '',
          contact: (shop as any).contactName || '',
          remark: (shop as any).remark || '',
          sys: (shop as any).sys || '',
          bu: (shop as any).businessUnit || '',
          lat: shop.latitude || '',
          lng: shop.longitude || '',
          group: (shop as any).groupId?.toString() || '1'
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
        <span className="floating-label">{label}</span>
      </div>
    </Col>
  );

  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => {
    const hasValue = formData[key] !== undefined && formData[key] !== '';
    return (
      <Col span={span}>
        <div className={`st-inputBox-pro select-container-uiverse ${hasValue ? 'has-value' : ''}`}>
          <Select
            className="uiverse-select-field"
            variant="borderless"
            showSearch
            placeholder=" "
            value={formData[key] || undefined}
            onChange={val => setFormData({...formData, [key]: val})}
            options={options}
            optionFilterProp="label"
            style={{ width: '100%', height: '100%' }}
          />
          <span className="floating-label">{label}</span>
        </div>
      </Col>
    );
  };

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
        bodyStyle={{ padding: '80px 40px 40px 40px', backgroundColor: '#f8fafc' }}
      >
        <div className="mb-10">
          <Title level={2} style={{ margin: 0, fontWeight: 900, fontSize: '28px' }}>{shop ? 'STORE PROFILE MANAGER' : 'NEW STORE REGISTRATION'}</Title>
          <Text type="secondary" style={{ fontSize: '14px' }}>Real-time SharePoint Data Synchronization</Text>
        </div>

        <div className="st-form-section">
          <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800, fontSize: '12px' }}>
            <InfoCircleOutlined /> BASIC IDENTIFICATION
          </Divider>
          <Row gutter={[24, 60]}>
            {renderInput("Official Shop Name", "name", 24)}
            {renderInput("Shop Code", "code", 8)}
            {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
            {renderSelect("Schedule Group", "group", [{label:'Group A', value:'1'},{label:'Group B', value:'2'},{label:'Group C', value:'3'}], 8)}
            {renderSelect("Business Unit", "bu", dynamicOptions.bus, 12)}
            {renderInput("System ID", "sys", 12)}
          </Row>
        </div>

        <div className="st-form-section mt-14">
          <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800, fontSize: '12px' }}>
            <GlobalOutlined /> ADDRESS & LOGISTICS
          </Divider>
          <Row gutter={[24, 60]}>
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
          .st-inputBox-pro {
            position: relative;
            width: 100%;
          }

          /* --- 1. 基礎容器設定：加粗黑邊框，移除初始陰影 --- */
          .uiverse-input-field, .select-container-uiverse {
            width: 100% !important;
            height: 56px !important;
            background: white !important;
            border: 2.5px solid #000 !important;
            border-radius: 0.6rem !important;
            box-shadow: none !important; 
            transition: all 0.2s ease !important;
            display: flex !important;
            align-items: center !important;
          }

          /* --- 2. Focus (正在編輯) 時才彈出黑色影子 --- */
          .uiverse-input-field:focus, .select-container-uiverse:focus-within {
            box-shadow: 3px 4px 0 #000 !important;
            border-color: #0d9488 !important;
          }

          /* --- 3. 標題：更大 (15px) 且更高 (-68px) --- */
          .st-inputBox-pro .floating-label {
            position: absolute;
            left: 16px;
            top: 50%;
            transform: translateY(-50%);
            pointer-events: none;
            transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-size: 15px !important; 
            font-weight: 800 !important;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            background: transparent;
            z-index: 20;
          }

          /* 標題浮動：完全跳出黑色邊框 */
          .uiverse-input-field:focus ~ .floating-label,
          .uiverse-input-field:not(:placeholder-shown) ~ .floating-label,
          .select-container-uiverse:focus-within .floating-label,
          .select-container-uiverse.has-value .floating-label {
            transform: translateY(-52px) translateX(-4px) !important; 
            font-size: 14px !important;
            color: #0d9488 !important;
            background: #f8fafc !important; 
            padding: 0 10px !important;
            font-weight: 900 !important;
          }

          /* --- 4. Select 垂直居中終極方案 --- */
          .select-container-uiverse {
            padding: 0 !important;
            overflow: visible !important;
          }

          /* 強制將 Ant Select 的觸發區域撐滿 56px 高度 */
          .uiverse-select-field {
            height: 100% !important;
            width: 100% !important;
          }

          .uiverse-select-field .ant-select-selector {
            height: 56px !important;
            line-height: 56px !important;
            display: flex !important;
            align-items: center !important;
            padding: 0 16px !important;
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* 選中文字 (Selected Item) 的絕對置中 */
          .uiverse-select-field .ant-select-selection-item {
            font-weight: 800 !important;
            font-size: 15px !important;
            color: #000 !important;
            display: flex !important;
            align-items: center !important;
            height: 56px !important; /* 與容器同高 */
            line-height: 1 !important; /* 配合 flex-center 使用 */
            margin: 0 !important;
          }

          /* 佔位符置中 */
          .uiverse-select-field .ant-select-selection-placeholder {
            line-height: 56px !important;
            height: 56px !important;
            display: flex !important;
            align-items: center !important;
            font-weight: 700;
          }

          /* 搜索輸入框置中 */
          .uiverse-select-field .ant-select-selection-search {
            inset-inline-start: 16px !important;
            display: flex !important;
            align-items: center !important;
            height: 56px !important;
          }
        `}</style>
      </Modal>
    </>
  );
};
