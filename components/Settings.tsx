import React from 'react';
import { Card, Input, Typography, Button, Space, message, Collapse, Divider } from 'antd';
import { 
  CopyOutlined, 
  KeyOutlined, 
  DatabaseOutlined, 
  ShopOutlined,
  LinkOutlined,
  CaretRightOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

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
    message.success(`${label} copied!`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 標題 */}
      <div className="mb-8">
        <Title level={2}>System Settings</Title>
        <Text type="secondary">Manage your SharePoint List connections and security tokens.</Text>
      </div>

      <Card className="rounded-2xl shadow-sm border-none mb-6">
        {/* --- 第一部分：URL 連結行 (重複兩行) --- */}
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <Text strong className="block mb-2 text-slate-400 text-xs uppercase tracking-wider">
              <ShopOutlined /> Shop List SPO Endpoint
            </Text>
            <Input 
              value={shopListUrl} 
              readOnly 
              suffix={
                <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(shopListUrl, "Shop List URL")} />
              }
              className="bg-slate-50 font-mono text-xs py-2 rounded-lg"
            />
          </div>

          <div>
            <Text strong className="block mb-2 text-slate-400 text-xs uppercase tracking-wider">
              <DatabaseOutlined /> Inventory List SPO Endpoint
            </Text>
            <Input 
              value={invListUrl} 
              readOnly 
              suffix={
                <Button type="text" icon={<CopyOutlined />} onClick={() => handleCopy(invListUrl, "Inventory URL")} />
              }
              className="bg-slate-50 font-mono text-xs py-2 rounded-lg"
            />
          </div>
        </Space>

        <Divider className="my-8" />

        {/* --- 第二部分：Token 輸入框 (可展開/收縮) --- */}
        <Text strong className="block mb-4 text-slate-400 text-xs uppercase tracking-wider">
          <KeyOutlined /> Security Access Tokens
        </Text>

        <Collapse
          bordered={false}
          defaultActiveKey={['1']}
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          className="bg-transparent"
        >
          {/* Shop List Token */}
          <Panel 
            header={<Text strong>Shop Master List Token {token ? '✅' : '❌'}</Text>} 
            key="1"
            className="mb-4 bg-white border border-slate-100 rounded-xl overflow-hidden"
          >
            <TextArea 
              placeholder="Paste Shop List Access Token here..."
              rows={4}
              value={token}
              onChange={(e) => onUpdateToken(e.target.value)}
              className="rounded-lg font-mono text-xs mb-2"
            />
            <Button type="link" size="small" danger onClick={() => onUpdateToken('')} className="p-0">
              Clear Shop Token
            </Button>
          </Panel>

          {/* Inventory List Token */}
          <Panel 
            header={<Text strong>Inventory List Token {invToken ? '✅' : '❌'}</Text>} 
            key="2"
            className="bg-white border border-slate-100 rounded-xl overflow-hidden"
          >
            <TextArea 
              placeholder="Paste Inventory List Access Token here..."
              rows={4}
              value={invToken}
              onChange={(e) => onUpdateInvToken(e.target.value)}
              className="rounded-lg font-mono text-xs mb-2"
            />
            <Button type="link" size="small" danger onClick={() => onUpdateInvToken('')} className="p-0">
              Clear Inventory Token
            </Button>
          </Panel>
        </Collapse>
      </Card>

      <div className="text-center mt-10">
        <Text type="secondary" style={{ fontSize: '12px' }}>
          App Version 1.0.4 | Connection Type: Microsoft Graph API (V1.0)
        </Text>
      </div>
    </div>
  );
};
