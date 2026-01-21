// ShopFormModal.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Select, Divider, AutoComplete, Input } from 'antd';
import { InfoCircleOutlined, GlobalOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons';
import { Shop } from '../types';
import { gcj02towgs84 } from '../utils/coordTransform';

const { Title, Text } = Typography;

export const ShopFormModal: React.FC<{visible:boolean, shop:Shop|null, onCancel:()=>void, onSuccess:()=>void, graphToken:string, shops:Shop[]}> = ({ visible, shop, onCancel, onSuccess, graphToken, shops }) => {
  const [formData, setFormData] = useState<any>({});
  const [searchText, setSearchText] = useState('');

  const opts = useMemo(() => {
    const s = shops || [];
    const getU = (k: keyof Shop) => Array.from(new Set(s.map(i => i[k]).filter(Boolean))).sort().map(v => ({ label: v, value: v }));
    return { brands: getU('brand'), reg: getU('region'), dist: getU('district'), areas: getU('area') };
  }, [shops]);

  // 地圖地點搜尋 (模擬 Amap 選中)
  const onLocationSelect = (v: string, o: any) => {
    const s = o.data;
    const [wgsLng, wgsLat] = gcj02towgs84(s.longitude || 0, s.latitude || 0);
    setFormData({ ...formData, name: s.name, addr_en: s.address, lat: wgsLat, lng: wgsLng });
    setSearchText('');
    message.success("Coordinates updated via Amap logic.");
  };

  useEffect(() => {
    if (visible && shop) {
      setFormData({ name: shop.name, code: shop.id, brand: shop.brand, region: shop.region, district: shop.district, area: shop.area, addr_en: shop.address, lat: shop.latitude, lng: shop.longitude, bu: shop.businessUnit, group: shop.groupId?.toString() || '1' });
    }
  }, [shop, visible]);

  const renderInp = (l: string, k: string, s: number = 12) => (
    <Col span={s}><div className="st-inputBox-pro">
      <input className="uiverse-input-field" type="text" required value={formData[k]||''} onChange={e => setFormData({...formData, [k]: e.target.value})} placeholder=" " />
      <span className="floating-label">{l}</span>
    </div></Col>
  );

  const renderSel = (l: string, k: string, o: any[], s: number = 12) => (
    <Col span={s}><div className={`st-inputBox-pro sel-ext-wrapper ${formData[k]?'has-content':''}`}>
      <div className="uiverse-input-field mock-display">{formData[k]||''}</div>
      <Select className="uv-hide-select" suffixIcon={<div className="ext-trigger-btn"><DownOutlined /></div>} value={formData[k]||undefined} onChange={v => setFormData({...formData, [k]: v})} options={o} variant="borderless" showSearch />
      <span className="floating-label">{l}</span>
    </div></Col>
  );

  const onSave = async () => {
    if (!formData.name || !formData.code) return message.warning("Required!");
    const isEdit = !!shop;
    const url = isEdit ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields` : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;
    try {
      const res = await fetch(url, { method: isEdit?'PATCH':'POST', headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(isEdit?formData:{fields:formData}) });
      if (res.ok) { message.success("Success!"); onSuccess(); }
    } catch (e) { message.error("API Error"); }
  };

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} width={900} centered bodyStyle={{ padding: '80px 40px 40px', backgroundColor: '#f8fafc' }}>
      <div className="flex justify-between mb-8">
        <div><Title level={3} style={{margin:0, fontWeight:900}}>STORE PROFILE</Title><Text type="secondary">Amap & SharePoint Sync</Text></div>
        <div style={{width:'300px'}}>
          <AutoComplete onSearch={setSearchText} onSelect={onLocationSelect} value={searchText} style={{width:'100%'}}>
            <Input.Search placeholder="Search Amap Location..." enterButton={<SearchOutlined />} />
          </AutoComplete>
        </div>
      </div>
      <div className="st-form-section">
        <Divider orientation="left" style={{color:'#0d9488',fontWeight:800}}><InfoCircleOutlined /> BASIC IDENTIFICATION</Divider>
        <Row gutter={[24, 75]}>
          {renderInp("Name", "name", 24)} {renderInp("Code", "code", 8)}
          {renderSel("Brand", "brand", opts.brands, 8)} {renderSel("Group", "group", [{label:'A',value:'1'},{label:'B',value:'2'}], 8)}
        </Row>
      </div>
      <div className="st-form-section mt-12">
        <Divider orientation="left" style={{color:'#0d9488',fontWeight:800}}><GlobalOutlined /> ADDRESS & LOGISTICS</Divider>
        <Row gutter={[24, 75]}>
          {renderInp("English Address", "addr_en", 24)} {renderSel("Region", "region", opts.reg, 8)}
          {renderSel("District", "district", opts.dist, 8)} {renderSel("Area", "area", opts.areas, 8)}
        </Row>
      </div>
      <div className="flex justify-end gap-6 mt-16">
        <button className="px-10 py-3 bg-white border-2 border-black rounded-xl font-black shadow-[3px_3px_0_#000]" onClick={onCancel}>CANCEL</button>
        <button className="px-14 py-3 bg-teal-500 text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0_#000]" onClick={onSave}>SAVE</button>
      </div>
      <style>{`
        .st-inputBox-pro { position: relative; width: 100%; display: flex; align-items: center; }
        .uiverse-input-field { width: 100% !important; height: 54px !important; background: white !important; border: 2.5px solid #000 !important; border-radius: 0.6rem !important; padding: 0 16px !important; font-size: 15px !important; font-weight: 700 !important; outline: none !important; display: flex !important; align-items: center !important; transition: 0.2s; }
        .mock-display { cursor: default; color: #000; }
        .uiverse-input-field:focus, .sel-ext-wrapper:focus-within .uiverse-input-field { box-shadow: 3px 4px 0 #000 !important; border-color: #0d9488 !important; }
        .st-inputBox-pro .floating-label { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: 0.3s; font-size: 15px !important; font-weight: 800 !important; color: #64748b; text-transform: uppercase; z-index: 20; }
        .uiverse-input-field:focus ~ .floating-label, .uiverse-input-field:not(:placeholder-shown) ~ .floating-label, .sel-ext-wrapper.has-content .floating-label, .sel-ext-wrapper:focus-within .floating-label { transform: translateY(-70px) translateX(-4px) !important; font-size: 14px !important; color: #0d9488 !important; background: #f8fafc !important; padding: 0 10px !important; font-weight: 900 !important; }
        .uv-hide-select { position: absolute !important; width: 100% !important; height: 100% !important; top: 0; left: 0; opacity: 0; z-index: 5; }
        .ext-trigger-btn { position: absolute !important; right: -35px !important; top: 50% !important; transform: translateY(-50%) !important; width: 32px; height: 32px; background: #0d9488; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #000; box-shadow: 2px 2px 0 #000; z-index: 30; }
      `}</style>
    </Modal>
  );
};
