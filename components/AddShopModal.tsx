// ShopFormModal.tsx - Part 1

import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Select, Divider, AutoComplete, Input } from 'antd';
import { InfoCircleOutlined, GlobalOutlined, SearchOutlined, DownOutlined } from '@ant-design/icons';
import { Shop } from '../types';

const { Title, Text } = Typography;

export const ShopFormModal: React.FC<{visible:boolean, shop:Shop|null, onCancel:()=>void, onSuccess:()=>void, graphToken:string, shops:Shop[]}> = ({ visible, shop, onCancel, onSuccess, graphToken, shops }) => {
  const [formData, setFormData] = useState<any>({});
  const [searchText, setSearchText] = useState('');

  const opts = useMemo(() => {
    const s = shops || [];
    const getU = (k: keyof Shop) => Array.from(new Set(s.map(i => i[k]).filter(Boolean))).sort().map(v => ({ label: v, value: v }));
    return { bus: getU('businessUnit'), brands: getU('brand'), regions: getU('region'), districts: getU('district'), areas: getU('area') };
  }, [shops]);

  const searchOpts = useMemo(() => {
    if (!searchText) return [];
    return shops.filter(s => s.name?.toLowerCase().includes(searchText.toLowerCase()) || s.id?.toLowerCase().includes(searchText.toLowerCase()))
      .map(s => ({ label: `${s.id} - ${s.name}`, value: s.id, data: s }));
  }, [searchText, shops]);

  const handleSearchSelect = (v: string, o: any) => {
    const s = o.data;
    setFormData({ ...formData, name: s.name, code: s.id, brand: s.brand, region: s.region, district: s.district, area: s.area, addr_en: s.address, bu: s.businessUnit, sys: s.sys });
    setSearchText('');
  };

  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({ name: shop.name||'', code: shop.id||'', brand: shop.brand||'', region: shop.region||'', district: shop.district||'', area: shop.area||'', addr_en: shop.address||'', addr_chi: (shop as any).address_chi||'', building: (shop as any).building||'', mtr: shop.is_mtr?'Yes':'No', phone: shop.phone||'', contact: shop.contactName||'', remark: (shop as any).remark||'', sys: (shop as any).sys||'', bu: shop.businessUnit||'', lat: shop.latitude||'', lng: shop.longitude||'', group: shop.groupId?.toString()||'1' });
      } else { setFormData({ mtr: 'No', group: '1' }); }
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
      <div className="uiverse-input-field mock-box">{formData[k]||''}</div>
      <Select className="uv-hide-sel" suffixIcon={<div className="ext-btn"><DownOutlined /></div>} value={formData[k]||undefined} onChange={v => setFormData({...formData, [k]: v})} options={o} variant="borderless" showSearch />
      <span className="floating-label">{l}</span>
    </div></Col>
  );
  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return message.warning("Required!");
    const isEdit = !!shop;
    const url = isEdit ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields` : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;
    try {
      const res = await fetch(url, { method: isEdit?'PATCH':'POST', headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify(isEdit?formData:{fields:formData}) });
      if (res.ok) { message.success("Success!"); onSuccess(); }
    } catch (e) { message.error("Error"); }
  };

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} width={900} centered bodyStyle={{ padding: '80px 40px 40px', backgroundColor: '#f8fafc' }}>
      <div className="flex justify-between items-start mb-8">
        <div><Title level={3} style={{ margin: 0, fontWeight: 900 }}>STORE PROFILE</Title><Text type="secondary">SharePoint Sync</Text></div>
        <div style={{ width: '280px' }}><AutoComplete options={searchOpts} onSelect={handleSearchSelect} onSearch={setSearchText} value={searchText} style={{ width: '100%' }}><Input.Search placeholder="Search..." enterButton={<SearchOutlined />} /></AutoComplete></div>
      </div>
      <div className="st-form-section">
        <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}>BASIC</Divider>
        <Row gutter={[24, 75]}>
          {renderInp("Name", "name", 24)} {renderInp("Code", "code", 8)}
          {renderSel("Brand", "brand", opts.brands, 8)} {renderSel("Group", "group", [{label:'A',value:'1'},{label:'B',value:'2'}], 8)}
          {renderSel("BU", "bu", opts.bus, 12)} {renderInp("System ID", "sys", 12)}
        </Row>
      </div>
      <div className="st-form-section mt-12">
        <Divider orientation="left" style={{ color: '#0d9488', fontWeight: 800 }}>LOCATION</Divider>
        <Row gutter={[24, 75]}>
          {renderInp("Address", "addr_en", 24)} {renderSel("Region", "region", opts.regions, 8)}
          {renderSel("District", "district", opts.districts, 8)} {renderSel("Area", "area", opts.areas, 8)}
        </Row>
      </div>
      <div className="flex justify-end gap-6 mt-16">
        <button className="px-10 py-3 bg-white border-2 border-black rounded-xl font-black shadow-[3px_3px_0_#000]" onClick={onCancel}>CANCEL</button>
        <button className="px-14 py-3 bg-teal-500 text-white border-2 border-black rounded-xl font-black shadow-[4px_4px_0_#000]" onClick={handleSubmit}>SAVE</button>
      </div>
      <style>{`
        .st-inputBox-pro { position: relative; width: 100%; display: flex; align-items: center; }
        .uiverse-input-field { width: 100% !important; height: 54px !important; background: white !important; border: 2.5px solid #000 !important; border-radius: 0.6rem !important; padding: 0 16px !important; font-size: 15px !important; font-weight: 700 !important; outline: none !important; display: flex !important; align-items: center !important; }
        .mock-box { cursor: default; color: #000; }
        .uiverse-input-field:focus, .sel-ext-wrapper:focus-within .uiverse-input-field { box-shadow: 3px 4px 0 #000 !important; border-color: #0d9488 !important; }
        .st-inputBox-pro .floating-label { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: 0.3s; font-size: 15px !important; font-weight: 800 !important; color: #64748b; text-transform: uppercase; z-index: 20; }
        .uiverse-input-field:focus ~ .floating-label, .uiverse-input-field:not(:placeholder-shown) ~ .floating-label, .sel-ext-wrapper.has-content .floating-label, .sel-ext-wrapper:focus-within .floating-label { transform: translateY(-72px) translateX(-4px) !important; font-size: 14px !important; color: #0d9488 !important; background: #f8fafc !important; padding: 0 10px !important; font-weight: 900 !important; }
        .uv-hide-sel { position: absolute !important; width: 100% !important; height: 100% !important; top: 0; left: 0; opacity: 0; z-index: 5; }
        .ext-btn { position: absolute !important; right: -35px !important; top: 50% !important; transform: translateY(-50%) !important; width: 32px; height: 32px; background: #0d9488; color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; cursor: pointer; border: 2px solid #000; box-shadow: 2px 2px 0 #000; z-index: 30; pointer-events: auto; }
      `}</style>
    </Modal>
  );
};
