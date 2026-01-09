import React, { useState } from 'react';
import { Card, Input, Button, Typography, Space, Alert, Divider, Tag } from 'antd';
import { KeyOutlined, SaveOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

interface SettingsProps {
  token: string;
  onUpdateToken: (newToken: string) => void;
}

export const Settings: React.FC<SettingsProps> = ({ token, onUpdateToken }) => {
  const [tempToken, setTempToken] = useState(token);

  const handleSave = () => {
    onUpdateToken(tempToken);
    alert('Token updated and saved to local storage!');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Settings</Title>
      <p style={{ color: '#64748b' }}>Manage your application configuration and API connections.</p>
      
      <Card className="rounded-2xl shadow-sm border-slate-100 mt-6">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-widest text-xs">
            <KeyOutlined className="text-teal-600" /> Microsoft Graph API Configuration
          </div>
          
          <Alert
            message="Manual Token Update Required"
            description="Since Azure App Registration is restricted, you must manually provide a fresh Graph API token to sync with SharePoint. Tokens typically expire every 60-90 minutes."
            type="info"
            showIcon
            icon={<InfoCircleOutlined />}
          />

          <div>
            <Text strong className="text-xs text-slate-500 uppercase block mb-2">Active Access Token</Text>
            <Input.TextArea 
              rows={8} 
              value={tempToken} 
              onChange={(e) => setTempToken(e.target.value)}
              placeholder="Paste Bearer token here..."
              className="font-mono text-xs bg-slate-50 rounded-xl border-none p-4"
            />
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-700">Token Status</span>
              <span className="text-xs text-slate-400">Current connection health</span>
            </div>
            {token ? <Tag color="success" className="rounded-full px-4 border-none font-bold">ACTIVE</Tag> : <Tag color="error">DISCONNECTED</Tag>}
          </div>

          <Button 
            type="primary" 
            size="large" 
            icon={<SaveOutlined />} 
            onClick={handleSave}
            className="bg-teal-600 h-12 rounded-xl font-bold w-full"
          >
            Update Connection
          </Button>
        </Space>
      </Card>
    </div>
  );
};