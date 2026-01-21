// ShopFormModal.tsx - Part 1

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Select, Divider, AutoComplete, Input } from 'antd';
import { 
  InfoCircleOutlined, 
  GlobalOutlined,
  SearchOutlined,
  DownOutlined
} from '@ant-design/icons';
import { Shop } from '../types';

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

  const searchOptions = useMemo(() => {
    if (!searchText) return [];
    return shops
      .filter(s => 
        s.name?.toLowerCase().includes(searchText.toLowerCase()) || 
        s.id?.toLowerCase().includes(searchText.toLowerCase())
      )
      .map(s => ({
        label: `${s.id} - ${s.name}`,
        value: s.id,
        data: s
      }));
  }, [searchText, shops]);

  const handleSelectSearch = (value: string, option: any) => {
    const s = option.data;
    setFormData({
      ...formData,
      name: s.name || '', code: s.id || '', brand: s.brand || '',
      region: s.region || '', district: s.district || '', area: s.area || '',
      addr_en: s.address || '', bu: s.businessUnit || '', sys: s.sys || ''
    });
    setSearchText('');
  };

  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({
          name: shop.name || '', code: shop.id || '', brand: shop.brand || '',
          region: shop.region || '', district: shop.district || '', area: shop.area || '',
          addr_en: shop.address || '', addr_chi: (shop as any).address_chi || '',
          building: (shop as any).building || '', mtr: shop.is_mtr ? 'Yes' : 'No',
          phone: shop.phone || '', contact: shop.contactName || '',
          remark: (shop as any).remark || '', sys: (shop as any).sys || '',
          bu: shop.businessUnit || '', lat: shop.latitude || '', lng: shop.longitude || '',
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
        <input className="uiverse-input-field" type="text" required value={formData[key] || ''} onChange={e => setFormData({...formData, [key]: e.target.value})} placeholder=" " />
        <span className="floating-label">{label}</span>
      </div>
    </Col>
  );

  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => {
    const hasValue = formData[key] !== undefined && formData[key] !== '';
    return (
      <Col span={span}>
        <div className={`st-inputBox-pro select-external-wrapper ${hasValue ? 'has-content' : ''}`}>
          <div className="uiverse-input-field readonly-display">
            {formData[key] || ''}
          </div>
          <Select
            className="uiverse-invisible-select"
            suffixIcon={<div className="trigger-btn-outside"><DownOutlined /></div>}
            value={formData[key] || undefined}
            onChange={val => setFormData({...formData, [key]: val})}
            options={options}
            variant="borderless"
            showSearch
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
      if (res.ok) { message.success(isEdit ? "Updated!" : "Created!"); onSuccess(); }
    } catch (err) { message.error("Network Error"); }
  };

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} width={900} centered bodyStyle={{ padding: '80px 40px 40px 40px', backgroundColor: '#f8fafc' }}>
      <div className="flex justify-between items-start mb-8">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>{shop ? 'Store Profile Manager' : 'New Store Registration'}</Title>
          <Text type="secondary">Direct SharePoint Master Data Access</Text>
        </div>
        <div style={{ width: '280px' }}>
          <AutoComplete options={searchOptions} onSelect={handleSelectSearch} onSearch={setSearchText} value={searchText} style={{ width: '100%' }}>
            <Input.Search placeholder="Quick Search Shop..." enterButton={<SearchOutlined />} />
          </AutoComplete>
        </div>
      </div>
      <div className="st-form-section">
        <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}><InfoCircleOutlined /> BASIC IDENTIFICATION</Divider>
        <Row gutter={[24, 75]}>
          {renderInput("Official Shop Name", "name", 24)}
          {renderInput("Shop Code", "code", 8)}
          {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
          {renderSelect("Schedule Group", "group", [{label:'Group A', value:'1'},{label:'Group B', value:'2'},{label:'Group C', value:'3'}], 8)}
          {renderSelect("Business Unit", "bu", dynamicOptions.bus, 12)}
          {renderInput("System ID", "sys", 12)}
        </Row>
      </div>

      <div className="st-form-section mt-12">
        <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}><GlobalOutlined /> ADDRESS & LOGISTICS</Divider>
        <Row gutter={[24, 75]}>
          {renderInput("English Address (Full)", "addr_en", 24)}
          {renderInput("Chinese Address", "addr_chi", 24)}
          {renderSelect("Region", "region", dynamicOptions.regions, 8)}
          {renderSelect("District", "district", dynamicOptions.districts, 8)}
          {renderSelect("Area", "area", dynamicOptions.areas, 8)}
          {renderInput("Building / Landmark", "building", 24)}
        </Row>
      </div>

      <div className="flex justify-end gap-6 mt-16">
        <button className="px-10 py-3 bg-white border-2 border-black text-black rounded-xl font-black hover:bg-slate-50 shadow-[3px_3px_0_#000] active:translate-y-1 active:shadow-none" onClick={onCancel}>CANCEL</button>
        <button className="px-14 py-3 bg-teal-500 text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0_#000] hover:bg-teal-600 hover:scale-[1.02]" onClick={handleSubmit}>SAVE RECORDS</button>
      </div>

      <style>{`
        .st-inputBox-pro { position: relative; width: 100%; display: flex; align-items: center; }
        .uiverse-input-field {
          width: 100% !important; height: 54px !important; background: white !important;
          border: 2.5px solid #000 !important; border-radius: 0.6rem !important;
          padding: 0 16px !important; font-size: 15px !important; font-weight: 700 !important;
          outline: none !important; transition: all 0.2s ease !important;
          display: flex !important; align-items: center !important;
        }
        .readonly-display { cursor: default; color: #000; }
        .uiverse-input-field:focus, .select-external-wrapper:focus-within .uiverse-input-field {
          box-shadow: 3px 4px 0 #000 !important; border-color: #0d9488 !important;
        }
        .st-inputBox-pro .floating-label {
          position: absolute; left: 16px; top: 50%; transform: translateY(-50%);
          pointer-events: none; transition: 0.3s; font-size: 15px !important; 
          font-weight: 800 !important; color: #64748b; text-transform: uppercase; z-index: 20;
        }
        .uiverse-input-field:focus ~ .floating-label, .uiverse-input-field:not(:placeholder-shown) ~ .floating-label,
        .select-external-wrapper.has-content .floating-label, .select-external-wrapper:focus-within .floating-label {
          transform: translateY(-72px) translateX(-4px) !important;
          font-size: 14px !important; color: #0d9488 !important;
          background: #f8fafc !important; padding: 0 10px !important; font-weight: 900 !important;
        }
        .uiverse-invisible-select { position: absolute !important; width: 100% !important; height: 100% !important; top: 0; left: 0; opacity: 0; z-index: 5; }
        .trigger-btn-outside {
          position: absolute !important; right: -35px !important; top: 50% !important;
          transform: translateY(-50%) !important; width: 32px; height: 32px;
          background: #0d9488; color: white; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; border: 2px solid #000; box-shadow: 2px 2px 0 #000;
          transition: 0.2s; z-index: 30; pointer-events: auto;
        }
        .trigger-btn-outside:hover { background: #0f766e; transform: translateY(-50%) scale(1.1); }
      `}</style>
    </Modal>
  );
};
