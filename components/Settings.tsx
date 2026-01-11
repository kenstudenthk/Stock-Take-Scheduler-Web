import React from 'react';
import { Card, Input, Typography, Button, Space, message, Divider, Row, Col, Alert } from 'antd';
import { CopyOutlined, KeyOutlined, LinkOutlined, DatabaseOutlined, ShopOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface Props {
  token: string;
  onUpdateToken: (t: string) => void;
  invToken: string;
  onUpdateInvToken: (t: string) => void;
}

export const Settings: React.FC<Props> = ({ token, onUpdateToken, invToken, onUpdateInvToken }) => {
  
  const shopListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8";
  const invListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752E-7609-4468-81f8-8babaf503ad8";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="mb-8">
        <Title level={2}>System Connection Settings</Title>
        <Text type="secondary">Manage your Microsoft Graph API connections and Access Tokens for SharePoint synchronization.</Text>
      </div>

      <Row gutter={[24, 24]}>
        {/* --- 第一部分：Shop Master List --- */}
        <Col span={24}>
          <Card 
            title={<Space><ShopOutlined className="text-teal-600" /><span>Shop Master List Configuration</span></Space>}
            className="rounded-2xl shadow-sm border-none"
          >
            <div className="mb-6">
              <Text strong className="block mb-2">Endpoint URL (Read/Write)</Text>
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
              <Text strong className="block mb-2">Access Token</Text>
              <TextArea 
                placeholder="Paste Shop List Access Token here..."
                rows={4}
                value={token}
                onChange={(e) => onUpdateToken(e.target.value)}
                className="rounded-xl font-mono text-xs"
              />
              <div className="mt-3 flex justify-between items-center">
                <Text type="secondary" size="small">Last Updated: {token ? 'Active' : 'Missing'}</Text>
                <Button type="primary" ghost size="small" icon={<KeyOutlined />} onClick={() => onUpdateToken('')}>Clear Token</Button>
              </div>
            </div>
          </Card>
        </Col>

        {/* --- 第二部分：Inventory SPO List --- */}
        <Col span={24}>
          <Card 
            title={<Space><DatabaseOutlined className="text-blue-600" /><span>Inventory SPO List Configuration</span></Space>}
            className="rounded-2xl shadow-sm border-none"
          >
            <div className="mb-6">
              <Text strong className="block mb-2">Endpoint URL (Inventory Data)</Text>
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
              <Text strong className="block mb-2">Inventory Access Token</Text>
              <TextArea 
                placeholder="Paste Inventory List Access Token here..."
                rows={4}
                value={invToken}
                onChange={(e) => onUpdateInvToken(e.target.value)}
                className="rounded-xl font-mono text-xs border-blue-200 focus:border-blue-400"
              />
              <div className="mt-3 flex justify-between items-center">
                <Text type="secondary" size="small">Status: {invToken ? 'Token Present' : 'Awaiting Token'}</Text>
                <Button type="primary" ghost danger size="small" onClick={() => onUpdateInvToken('')}>Clear Token</Button>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      <Alert
        className="mt-8 rounded-xl"
        message="Token Usage Tip"
        description="Usually, if both lists are in the same SharePoint Site, you can use the same token for both. If they belong to different environments, please paste the corresponding tokens above."
        type="info"
        showIcon
      />
    </div>
  );
};
