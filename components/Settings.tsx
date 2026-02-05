import React, { useState, useEffect } from 'react';
import { Card, Input, Typography, Button, Space, message, Collapse, Divider, Alert, Progress, Tag } from 'antd';
import {
  CopyOutlined,
  KeyOutlined,
  DatabaseOutlined,
  ShopOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
  ExportOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';
import { TOKEN_CONFIG } from '../constants/config';

const { Title, Text, Link } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

interface Props {
  token: string;
  onUpdateToken: (t: string) => void;
  invToken: string;
  onUpdateInvToken: (t: string) => void;
  onLogout?: () => void;
}

export const Settings: React.FC<Props> = ({ 
  token, 
  onUpdateToken, 
  invToken, 
  onUpdateInvToken,
  onLogout
}) => {
  
  // ✅ Token 状态追踪
  const [tokenTimestamp, setTokenTimestamp] = useState<number>(
    parseInt(localStorage.getItem(TOKEN_CONFIG.storageKeys.tokenTimestamp) || '0')
  );
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [tokenStatus, setTokenStatus] = useState<'valid' | 'warning' | 'expired'>('valid');

  const shopListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8";
  const invListUrl = "https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/2f2dff1c-8ce1-4B7B-9FF8-083A0BA1BB48";
  const graphExplorerUrl = "https://developer.microsoft.com/en-us/graph/graph-explorer";

  // ✅ 计算 Token 剩余时间
  useEffect(() => {
    const calculateTimeLeft = () => {
      if (!token || !tokenTimestamp) {
        setTimeLeft(0);
        setTokenStatus('expired');
        return;
      }

      const elapsed = Date.now() - tokenTimestamp;
      const remaining = (60 * 60 * 1000) - elapsed; // 假设 Token 有效期 60 分钟
      const minutesLeft = Math.floor(remaining / 1000 / 60);

      setTimeLeft(minutesLeft);

      if (minutesLeft <= 0) {
        setTokenStatus('expired');
      } else if (minutesLeft <= 15) {
        setTokenStatus('warning');
      } else {
        setTokenStatus('valid');
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // 每分钟更新一次

    return () => clearInterval(interval);
  }, [token, tokenTimestamp]);

  // ✅ 更新 Token 并记录时间戳
  const handleUpdateToken = (newToken: string) => {
    const trimmed = newToken.trim();
    onUpdateToken(trimmed);
    
    if (trimmed) {
      const now = Date.now();
      localStorage.setItem(TOKEN_CONFIG.storageKeys.tokenTimestamp, now.toString());
      setTokenTimestamp(now);
      message.success('Token updated successfully!');
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    message.success(`${label} copied!`);
  };

  // ✅ 快速打开 Graph Explorer 并复制 URL
  const openGraphExplorer = (url: string) => {
    navigator.clipboard.writeText(url);
    window.open(graphExplorerUrl, '_blank');
    message.info('URL copied! Paste it into Graph Explorer search bar.');
  };

  // ✅ Token 状态显示
  const renderTokenStatus = () => {
    if (!token) {
      return (
        <Alert
          message="No Token Found"
          description="Please paste your access token below to start using the app."
          type="error"
          showIcon
          icon={<WarningOutlined />}
          className="mb-4"
        />
      );
    }

    const percentage = Math.max(0, Math.min(100, (timeLeft / 60) * 100));

    return (
      <Card className="mb-4 border-none shadow-sm" style={{ 
        background: tokenStatus === 'expired' ? '#fff1f0' : 
                   tokenStatus === 'warning' ? '#fffbe6' : '#f6ffed' 
      }}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <div className="flex justify-between items-center">
            <Text strong>
              <ClockCircleOutlined className="mr-2" />
              Token Status
            </Text>
            {tokenStatus === 'valid' && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Active</Tag>
            )}
            {tokenStatus === 'warning' && (
              <Tag color="warning" icon={<WarningOutlined />}>Expiring Soon</Tag>
            )}
            {tokenStatus === 'expired' && (
              <Tag color="error" icon={<WarningOutlined />}>Expired</Tag>
            )}
          </div>

          <Progress
            percent={percentage}
            strokeColor={
              tokenStatus === 'expired' ? '#ff4d4f' :
              tokenStatus === 'warning' ? '#faad14' : '#52c41a'
            }
            showInfo={false}
            size="small"
          />

          <div className="flex justify-between">
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {tokenStatus === 'expired' ? 
                'Token has expired. Please refresh.' :
                `Approximately ${timeLeft} minutes remaining`
              }
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              Last updated: {new Date(tokenTimestamp).toLocaleTimeString()}
            </Text>
          </div>

          {tokenStatus !== 'valid' && (
            <Button 
              type="primary" 
              danger={tokenStatus === 'expired'}
              onClick={() => openGraphExplorer(shopListUrl)}
              className="w-full mt-2"
            >
              🔄 Refresh Token Now
            </Button>
          )}
        </Space>
      </Card>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      {/* 标题 */}
      <div className="mb-6">
        <Title level={2}>⚙️ System Settings</Title>
        <Text type="secondary">Manage your SharePoint List connections and security tokens.</Text>
      </div>

      {/* ✅ Token 状态卡片 */}
      {renderTokenStatus()}

      {/* 如何获取 Token 的指南 */}
      <Alert
        className="mb-8 rounded-2xl border-teal-100 bg-teal-50"
        message={<Text strong style={{ color: '#0d9488' }}>📖 How to get an Access Token?</Text>}
        description={
          <div className="mt-2">
            <ol className="pl-4 text-slate-600 text-sm space-y-2">
              <li>
                1. Click the button below to open{' '}
                <Link href={graphExplorerUrl} target="_blank" strong underline>
                  Microsoft Graph Explorer <ExportOutlined />
                </Link>{' '}
                and sign in with your account.
              </li>
              <li>
                2. The SharePoint URL will be automatically copied. Paste it into the Graph Explorer search bar.
              </li>
              <li>
                3. Click <strong>"Run query"</strong> to test permissions.
              </li>
              <li>
                4. Click on the <strong>"Access token"</strong> tab, copy the token, and paste it below.
              </li>
            </ol>
            
            <Space className="mt-4" wrap>
              <Button 
                type="primary" 
                icon={<ExportOutlined />}
                onClick={() => openGraphExplorer(shopListUrl)}
              >
                Open Graph Explorer (Shop List)
              </Button>
              <Button 
                icon={<ExportOutlined />}
                onClick={() => openGraphExplorer(invListUrl)}
              >
                Open Graph Explorer (Inventory)
              </Button>
            </Space>
          </div>
        }
        type="info"
        showIcon={<QuestionCircleOutlined style={{ color: '#0d9488' }} />}
      />

      {/* SharePoint URL 参考 */}
      <Card className="rounded-2xl shadow-sm border-none mb-6">
        <Space direction="vertical" className="w-full" size="large">
          <div>
            <Text strong className="block mb-2 text-slate-400 text-xs uppercase tracking-wider">
              <ShopOutlined /> Shop List SPO Endpoint
            </Text>
            <Input 
              value={shopListUrl} 
              readOnly 
              suffix={
                <Button 
                  type="text" 
                  icon={<CopyOutlined />} 
                  onClick={() => handleCopy(shopListUrl, "Shop List URL")} 
                />
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
                <Button 
                  type="text" 
                  icon={<CopyOutlined />} 
                  onClick={() => handleCopy(invListUrl, "Inventory URL")} 
                />
              }
              className="bg-slate-50 font-mono text-xs py-2 rounded-lg"
            />
          </div>
        </Space>

        <Divider className="my-8" />

        {/* Token 输入框 */}
        <div className="mb-4 flex justify-between items-center">
          <Text strong className="text-slate-400 text-xs uppercase tracking-wider">
            <KeyOutlined /> Security Access Tokens
          </Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>
            ⚠️ Tokens expire every 60-90 mins
          </Text>
        </div>

        <Collapse
          bordered={false}
          defaultActiveKey={!token || !invToken ? ['1', '2'] : []}
          expandIcon={({ isActive }) => <CaretRightOutlined rotate={isActive ? 90 : 0} />}
          className="bg-transparent"
        >
          {/* Shop List Token */}
          <Panel 
            header={
              <Space>
                <Text strong>Shop Master List Token</Text>
                {token ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>✅</Tag>
                ) : (
                  <Tag color="error" icon={<WarningOutlined />}>❌</Tag>
                )}
              </Space>
            } 
            key="1"
            className="mb-4 bg-white border border-slate-100 rounded-xl overflow-hidden"
          >
            <TextArea 
              placeholder="Paste Access Token from Graph Explorer here..."
              rows={4}
              value={token}
              onChange={(e) => handleUpdateToken(e.target.value)}
              className="rounded-lg font-mono text-xs mb-2 border-none bg-slate-50 focus:bg-white transition-all"
            />
            <Space>
              <Button 
                type="primary" 
                size="small"
                onClick={() => openGraphExplorer(shopListUrl)}
              >
                Get New Token
              </Button>
              <Button 
                type="link" 
                size="small" 
                danger 
                onClick={() => handleUpdateToken('')}
              >
                Clear Token
              </Button>
            </Space>
          </Panel>

          {/* Inventory List Token */}
          <Panel 
            header={
              <Space>
                <Text strong>Inventory List Token</Text>
                {invToken ? (
                  <Tag color="success" icon={<CheckCircleOutlined />}>✅</Tag>
                ) : (
                  <Tag color="error" icon={<WarningOutlined />}>❌</Tag>
                )}
              </Space>
            } 
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
            <Space>
              <Button 
                type="primary" 
                size="small"
                onClick={() => openGraphExplorer(invListUrl)}
              >
                Get New Token
              </Button>
              <Button 
                type="link" 
                size="small" 
                danger 
                onClick={() => onUpdateInvToken('')}
              >
                Clear Token
              </Button>
            </Space>
          </Panel>
        </Collapse>
      </Card>

      {/* ✅ 新增：Token 过期提醒设置 */}
      <Card className="rounded-2xl shadow-sm border-none mb-6">
        <Title level={4}>💡 Token Management Tips</Title>
        <Space direction="vertical" size="small">
          <Text>• Tokens typically expire after <strong>60 minutes</strong></Text>
          <Text>• You'll receive a warning when <strong>15 minutes</strong> remain</Text>
          <Text>• Keep the Graph Explorer tab open for quick token refresh</Text>
          <Text>• Bookmark this page for easy access: <code>Settings</code></Text>
        </Space>
      </Card>

      <div className="text-center mt-10">
        {onLogout && (
          <Button 
            type="primary" 
            danger 
            size="large" 
            icon={<LogoutOutlined />} 
            onClick={onLogout}
            className="w-full mb-6 sm:hidden"
            style={{ height: '48px', borderRadius: '12px', fontWeight: 'bold' }}
          >
            LOGOUT SYSTEM
          </Button>
        )}
        <Text type="secondary" style={{ fontSize: '11px' }}>
          Authentication Method: OAuth 2.0 Bearer Token | Microsoft Graph API v1.0
        </Text>
      </div>
    </div>
  );
};

export default Settings;