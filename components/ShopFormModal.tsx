import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

interface Props {
  visible: boolean;
  shop: Shop | null; // 如果是 null 則為新增，有值則為編輯
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    region: '',
    district: ''
  });

  // 當選中的 shop 改變時（切換編輯對象或開啟新表單），更新 state
  useEffect(() => {
    if (shop) {
      setFormData({
        name: shop.name || '',
        code: shop.id || '',
        region: shop.region || '',
        district: shop.district || ''
      });
    } else {
      setFormData({ name: '', code: '', region: '', district: '' });
    }
  }, [shop, visible]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      return message.warning("Please fill in Name and Code");
    }

    const isEdit = !!shop;
    const url = isEdit 
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;

    const payload = {
      fields: {
        [SP_FIELDS.SHOP_NAME]: formData.name,
        [SP_FIELDS.SHOP_CODE]: formData.code,
        [SP_FIELDS.REGION]: formData.region,
        [SP_FIELDS.DISTRICT]: formData.district,
      }
    };

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 
          'Authorization': `Bearer ${graphToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(isEdit ? payload.fields : payload)
      });

      if (res.ok) {
        message.success(isEdit ? "Update Successful!" : "Shop Created!");
        onSuccess();
      }
    } catch (err) {
      message.error("Sync Failed");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null} // 使用自定義 Enter 按鈕
      width={450}
      centered
      bodyStyle={{ padding: 0 }}
    >
      <div className="st-form-container">
        <a className="st-form-title">{shop ? 'Edit Store' : 'New Store'}</a>
        
        <div className="st-inputBox">
          <input 
            type="text" 
            required 
            value={formData.name} 
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
          <span>Shop Name</span>
        </div>

        <div className="st-inputBox">
          <input 
            type="text" 
            required 
            value={formData.code} 
            onChange={e => setFormData({...formData, code: e.target.value})}
          />
          <span>Shop Code</span>
        </div>

        <div className="st-inputBox">
          <input 
            type="text" 
            required 
            value={formData.region} 
            onChange={e => setFormData({...formData, region: e.target.value})}
          />
          <span>Region (e.g. HK/KLN)</span>
        </div>

        <div className="st-inputBox">
          <input 
            type="text" 
            required 
            value={formData.district} 
            onChange={e => setFormData({...formData, district: e.target.value})}
          />
          <span>District</span>
        </div>

        <button className="st-form-enter" onClick={handleSubmit}>
          {shop ? 'Update' : 'Confirm'}
        </button>
      </div>
    </Modal>
  );
};
