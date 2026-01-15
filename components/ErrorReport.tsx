import React from 'react';
import { Modal, Form, Input, Select, Button, message, Space, Typography } from 'antd';
import { BugOutlined, SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  visible: boolean;
  onCancel: () => void;
  token: string;
}

export const ErrorReport: React.FC<Props> = ({ visible, onCancel, token }) => {
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      // 這裡對應您在 SharePoint 建立的 ErrorReports List ID
      const listId = "YOUR_ERROR_REPORTS_LIST_ID"; 
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/${listId}/items`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            Title: values.title,
            ErrorType: values.type,
            Description: values.description,
            Status: 'New'
          }
        })
      });

      if (response.ok) {
        message.success("Error report submitted successfully!");
        form.resetFields();
        onCancel();
      } else {
        message.error("Failed to submit report.");
      }
    } catch (err) {
      message.error("Network Error");
    }
  };

  return (
    <Modal
      title={<Space><BugOutlined className="text-red-500" /> Report System Error</Space>}
      visible={visible}
      onCancel={onCancel}
      footer={null}
      centered
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Text type="secondary" className="block mb-4 text-xs">
          Your feedback helps us improve Stock Take Scheduler Pro.
        </Text>
        
        <Form.Item name="type" label="Error Type" rules={[{ required: true }]}>
          <Select placeholder="Select the problem type">
            <Select.Option value="Bug">System Bug (功能異常)</Select.Option>
            <Select.Option value="Data">Data Error (資料錯誤)</Select.Option>
            <Select.Option value="UI">Visual/UI Issue (介面問題)</Select.Option>
            <Select.Option value="Suggestion">Suggestion (改進建議)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="title" label="Short Title" rules={[{ required: true }]}>
          <Input placeholder="e.g. Cannot refresh inventory data" />
        </Form.Item>

        <Form.Item name="description" label="Detailed Description" rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="Please describe what happened and which shop you were checking..." />
        </Form.Item>

        <Form.Item className="mb-0 text-right">
          <Space>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" icon={<SendOutlined />} className="bg-red-500 border-none">
              Submit Report
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
