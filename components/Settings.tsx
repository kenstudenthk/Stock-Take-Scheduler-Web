import React from 'react';
import { Card, Input, Typography, Button, Space, message, Row, Col, Alert } from 'antd';
import { 
  CopyOutlined, 
  KeyOutlined, 
  DatabaseOutlined, 
  ShopOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface Props {
  token: string;
  onUpdateToken: (t: string) => void;
  invToken: string;
  onUpdateInvToken: (t: string) => void;
}

export const Settings: React.FC<Props> = ({ 
  token, 
  onUpdateToken, 
  invToken, 
  onUpdateInvToken 
}) => {
  
  const shopListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8";
  const invListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752E-7609-4468-81f8-8babaf503ad8";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="max-w-5xl mx-auto py-4">
      <div className="mb-8">
        <Title level={2}>System Connection Settings</Title>
        <Text type="secondary">Manage your Microsoft Graph API connections and Access Tokens for SharePoint synchronization.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* --- Shop Master List --- */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <ShopOutlined style={{ color: '#0d9488' }} />
                <span>Shop Master List Configuration</span>
              </Space>
            }
            className="rounded-2xl shadow-sm border-none"
          >
            <div className="mb-6">
              <Text strong className="block mb-2 text-slate-500 text-xs">ENDPOINT URL (SPO LIST)</Text>
              <Input 
                value={shopListUrl} 
                readOnly 
                suffix={
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(shopListUrl, "Shop List URL")} />
                }
                className="bg-slate-50 font-mono text-xs py-2"
              />
            </div>

            <div>
              <Text strong className="block mb-2 text-slate-500 text-xs">ACCESS TOKEN</Text>
              <TextArea 
                placeholder="Paste Shop List Access Token here..."
                rows={4}
                value={token}
                onChange={(e) => onUpdateToken(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <div className="mt-3 flex justify-between items-center">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Status: {token ? <Text type="success">Active</Text> : <Text type="danger">Missing</Text>}
                </Text>
                <Button type="link" size="small" danger onClick={() => onUpdateToken('')}>Clear Token</Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* --- Inventory SPO List --- */}
        <Col span={24}>
          <Card 
            title={
              <Space>
                <DatabaseOutlined style={{ color: '#2563eb' }} />
                <span>Inventory SPO List Configuration</span>
              </Space>
            }
            className="rounded-2xl shadow-sm border-none"
          >
            <div className="mb-6">
              <Text strong className="block mb-2 text-slate-500 text-xs">ENDPOINT URL (INVENTORY DATA)</Text>
              <Input 
                value={invListUrl} 
                readOnly 
                suffix={
                  <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(invListUrl, "Inventory URL")} />
                }
                className="bg-slate-50 font-mono text-xs py-2"
              />
            </div>

            <div>
              <Text strong className="block mb-2 text-slate-500 text-xs">INVENTORY ACCESS TOKEN</Text>
              <TextArea 
                placeholder="Paste Inventory List Access Token here..."
                rows={4}
                value={invToken}
                onChange={(e) => onUpdateInvToken(e.target.value)}
                className="rounded-xl font-mono text-xs border-blue-100 focus:border-blue-400"
              />
              <div className="mt-3 flex justify-between items-center">
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Status: {invToken ? <Text type="success">Token Present</Text> : <Text type="danger">Awaiting Token</Text>}
                </Text>
                <Button type="link" size="small" danger onClick={() => onUpdateInvToken('')}>Clear Token</Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Alert
        className="mt-8 rounded-xl"
        message="Important Notice"
        description="Tokens typically expire every 60-90 minutes. If you see 'SPO Sync Failed', please refresh your token from the Microsoft Azure portal and update the boxes above."
        type="warning"
        showIcon
      />
    </div>
  );
};
