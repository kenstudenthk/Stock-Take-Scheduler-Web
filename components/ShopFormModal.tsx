import React from 'react';
import { Modal, Form, Input, Select, Row, Col, message } from 'antd';
import { SP_FIELDS } from '../constants';

interface Props {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const AddShopModal: React.FC<Props> = ({ visible, onCancel, onSuccess, graphToken }) => {
  const [form] = Form.useForm();

  const handleFinish = async (values: any) => {
    const payload = {
      fields: {
        [SP_FIELDS.SHOP_CODE]: values.code,
        [SP_FIELDS.SHOP_NAME]: values.name,
        [SP_FIELDS.REGION]: values.region,
        [SP_FIELDS.DISTRICT]: values.district,
        [SP_FIELDS.AREA]: values.area,
        [SP_FIELDS.BRAND]: values.brand,
        [SP_FIELDS.ADDRESS_ENG]: values.address,
        [SP_FIELDS.LATITUDE]: parseFloat(values.lat || '0'),
        [SP_FIELDS.LONGITUDE]: parseFloat(values.lng || '0'),
        [SP_FIELDS.STATUS]: 'PLANNED'
      }
    };

    try {
      const res = await fetch('https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        message.success("New Shop Added!");
        form.resetFields();
        onSuccess();
      }
    } catch (err) { message.error("Failed to add shop"); }
  };

  return (
    <Modal title="ADD NEW SHOP" open={visible} onCancel={onCancel} onOk={() => form.submit()} width={600}>
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Row gutter={16}>
          <Col span={12}><Form.Item label="Shop Name" name="name" rules={[{required: true}]}><Input/></Form.Item></Col>
          <Col span={12}><Form.Item label="Shop Code" name="code" rules={[{required: true}]}><Input/></Form.Item></Col>
        </Row>
        <Row gutter={16}>
          <Col span={8}><Form.Item label="Region" name="region"><Select options={[{value:'Hong Kong', label:'HK'}, {value:'Kowloon', label:'KLN'}]}/></Form.Item></Col>
          <Col span={8}><Form.Item label="District" name="district"><Input/></Form.Item></Col>
          <Col span={8}><Form.Item label="Brand" name="brand"><Input/></Form.Item></Col>
        </Row>
        <Form.Item label="Address" name="address"><Input.TextArea/></Form.Item>
      </Form>
    </Modal>
  );
};
