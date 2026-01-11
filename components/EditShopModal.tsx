import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const EditShopModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [form] = Form.useForm();

  useEffect(() => { if (shop) form.setFieldsValue(shop); }, [shop, form]);

  const handleUpdate = async (values: any) => {
    if (!shop) return;
    const payload = {
      [SP_FIELDS.SHOP_NAME]: values.name,
      [SP_FIELDS.ADDRESS_ENG]: values.address,
      [SP_FIELDS.PHONE]: values.phone,
      [SP_FIELDS.REMARK]: values.remark
    };

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        message.success("Shop Updated!");
        onSuccess();
      }
    } catch (err) { message.error("Update failed"); }
  };

  return (
    <Modal title={`Edit: ${shop?.name}`} open={visible} onCancel={onCancel} onOk={() => form.submit()}>
      <Form form={form} layout="vertical" onFinish={handleUpdate}>
        <Form.Item label="Shop Name" name="name"><Input/></Form.Item>
        <Form.Item label="Address" name="address"><Input/></Form.Item>
        <Form.Item label="Phone" name="phone"><Input/></Form.Item>
        <Form.Item label="Remark" name="remark"><Input.TextArea/></Form.Item>
      </Form>
    </Modal>
  );
};
