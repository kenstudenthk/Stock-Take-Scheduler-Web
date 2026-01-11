import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [formData, setFormData] = useState({ name: '', code: '', district: '' });

  useEffect(() => {
    if (shop) {
      setFormData({ name: shop.name, code: shop.id, district: shop.district });
    } else {
      setFormData({ name: '', code: '', district: '' });
    }
  }, [shop, visible]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return message.error("Please fill required fields");

    const isEdit = !!shop;
    const url = isEdit 
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;

    const payload = {
      fields: {
        [SP_FIELDS.SHOP_NAME]: formData.name,
        [SP_FIELDS.SHOP_CODE]: formData.code,
        [SP_FIELDS.DISTRICT]: formData.district,
      }
    };

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? payload.fields : payload)
      });
      if (res.ok) {
        message.success(isEdit ? "Updated!" : "Created!");
        onSuccess();
      }
    } catch (err) { message.error("Action failed"); }
  };

  return (
    <Modal open={visible} onCancel={onCancel} footer={null} centered width={400} bodyStyle={{ padding: 0 }}>
      <div className="st-modal-container">
        <div className="st-card">
          <a className="st-login-title">{shop ? 'Edit Shop' : 'New Shop'}</a>
          
          <div className="st-inputBox">
            <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            <span>Shop Name</span>
          </div>

          <div className="st-inputBox">
            <input type="text" required value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
            <span>Shop Code</span>
          </div>

          <div className="st-inputBox">
            <input type="text" required value={formData.district} onChange={e => setFormData({...formData, district: e.target.value})} />
            <span>District</span>
          </div>

          <button className="st-enter-btn" onClick={handleSubmit}>
            {shop ? 'Update' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
