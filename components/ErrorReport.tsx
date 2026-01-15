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
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (values: any) => {
    if (!token) {
      message.error("No valid token found. Please update settings.");
      return;
    }

    setSubmitting(true);
    try {
      // ✅ 使用您提供的 SharePoint List URL
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/5d722abb-ab79-4fc5-b03c-099580db85ba/items`;

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
        message.success("Error report submitted! We will check it soon.");
        form.resetFields();
        onCancel();
      } else {
        const errData = await response.json();
        console.error("SP Error:", errData);
        message.error("Failed to submit. Check console for details.");
      }
    } catch (err) {
      message.error("Network Error. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <div className="bg-red-100 p-2 rounded-lg flex items-center justify-center">
            <BugOutlined className="text-red-500 text-xl" />
          </div>
          <span className="font-bold text-slate-800">Report System Problem</span>
        </Space>
      }
      visible={visible}
      onCancel={onCancel}
      footer={null}
      centered
      width={500}
      className="error-report-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 mb-6">
          <Text className="text-amber-700 text-[11px] font-bold uppercase tracking-wider block mb-1">Notice</Text>
          <Text className="text-amber-800 text-xs">
            Your report will be sent directly to the SharePoint list for tracking. 
            Please provide shop code if the error is data-related.
          </Text>
        </div>
        
        <Form.Item name="type" label={<span className="font-bold text-slate-600">Problem Category</span>} rules={[{ required: true }]}>
          <Select placeholder="What kind of issue?" className="h-10">
            <Select.Option value="Bug">System Bug (功能異常)</Select.Option>
            <Select.Option value="Data">Data Error (資料錯誤)</Select.Option>
            <Select.Option value="UI">Visual/UI Issue (介面問題)</Select.Option>
            <Select.Option value="Suggestion">Improvement (建議)</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="title" label={<span className="font-bold text-slate-600">Brief Summary</span>} rules={[{ required: true }]}>
          <Input placeholder="e.g. Cannot save new inventory item" className="h-10 rounded-lg" />
        </Form.Item>

        <Form.Item name="description" label={<span className="font-bold text-slate-600">Details</span>} rules={[{ required: true }]}>
          <TextArea rows={4} placeholder="What happened? Any error message?" className="rounded-lg" />
        </Form.Item>

        <Form.Item className="mb-0 text-right mt-8">
          <Space>
            <Button onClick={onCancel} className="rounded-lg h-10 px-6">Cancel</Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<SendOutlined />} 
              loading={submitting}
              className="bg-red-500 border-none rounded-lg h-10 px-8 font-bold shadow-md hover:bg-red-600"
            >
              Submit Report
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};
