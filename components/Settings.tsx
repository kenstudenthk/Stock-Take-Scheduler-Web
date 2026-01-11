import React from 'react';
import { Card, Input, Typography, Button, Space, message, Collapse, Divider, Alert } from 'antd';
import { 
  CopyOutlined, 
  KeyOutlined, 
  DatabaseOutlined, 
  ShopOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
  ExportOutlined
} from '@ant-design/icons';

const { Title, Text, Link } = Typography;
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
  const invListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48";
  const graphExplorerUrl = "https://developer.microsoft.com/en-us/graph/graph-explorer";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied!`);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 標題 */}
      <div className="mb-6">
        <Title level={2}>System Settings</Title>
        <Text type="secondary">Manage your SharePoint List connections and security tokens.</Text>
      </div>

      {/* --- 新增：如何獲取 Token 的指南 --- */}
      <Alert
        className="mb-8 rounded-2xl border-teal-100 bg-teal-50"
        message={<Text strong style={{ color: '#0d9488' }}>How to get an Access Token?</Text>}
        description={
          <div className="mt-2">
            <ol className="pl-4 text-slate-600 text-xs space-y-2">
              <li>1. Open <Link href={graphExplorerUrl} target="_blank" strong underline>Microsoft Graph Explorer <ExportOutlined /></Link> and sign in with your corporate account.</li>
              <li>2. Ensure the URL below is copied and pasted into the Graph Explorer search bar to test permissions.</li>
              <li>3. Click on the <strong>"Access token"</strong> tab in Graph Explorer, copy the long string, and paste it into the boxes below.</li>
            </ol>
          </div>
        }
        type="info"
        showIcon={<QuestionCircleOutlined style={{ color: '#0d9488' }} />}
      />

      <Card className="rounded-2xl shadow-sm border-none mb-6">
        {/* --- URL 連結行 --- */}
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

        {/* --- Token 輸入框 (可展開/收縮) --- */}
        <div className="mb-4 flex justify-between items-center">
          <Text strong className="text-slate-400 text-xs uppercase tracking-wider">
            <KeyOutlined /> Security Access Tokens
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>Tokens expire every 60-90 mins</Text>
        </div>

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
              placeholder="Paste Access Token from Graph Explorer here..."
              rows={4}
              value={token}
              onChange={(e) => onUpdateToken(e.target.value)}
              className="rounded-lg font-mono text-xs mb-2 border-none bg-slate-50 focus:bg-white transition-all"
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
              placeholder="Paste Inventory Access Token here..."
              rows={4}
              value={invToken}
              onChange={(e) => onUpdateInvToken(e.target.value)}
              className="rounded-lg font-mono text-xs mb-2 border-none bg-slate-50 focus:bg-white transition-all"
            />
            <Button type="link" size="small" danger onClick={() => onUpdateInvToken('')} className="p-0">
              Clear Inventory Token
            </Button>
          </Panel>
        </Collapse>
      </Card>

      <div className="text-center mt-10">
        <Text type="secondary" style={{ fontSize: '11px' }}>
          Authentication Method: OAuth 2.0 Bearer Token | Microsoft Graph API v1.0
        </Text>
      </div>
    </div>
  );
};
