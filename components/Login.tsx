import React, { useState, useEffect } from 'react';
import { Card, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import bcrypt from 'bcryptjs';

const { Title, Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: any;
  onUpdateToken: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService }) => {
  const [aliasemail, setAliasemail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // ✅ 新增：連線狀態 state
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // ✅ 新增：組件載入時檢查連線
  useEffect(() => {
    const checkConnection = async () => {
      const result = await sharePointService.checkMemberListConnection();
      setIsConnected(result);
    };
    checkConnection();
  }, [sharePointService]);

  const handleLogin = async () => {
    if (!aliasemail || !password) return message.warning("請輸入 Alias Email 同密碼");
    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user) {
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        if (isMatch) {
          message.success(`歡迎返嚟，${user.Name}`);
          onLoginSuccess(user);
        } else {
          message.error("密碼錯誤");
        }
      } else {
        message.error("搵唔到帳號（請檢查 Token 是否過期）");
      }
    } catch (err) {
      message.error("無法連線至 SharePoint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full relative">
      {/* ✅ Tooltip 部分：放在 Login Card 的右上角 */}
      <div className="absolute top-4 right-4">
        <div className="custom-tooltip">
          <div 
            className="icon" 
            style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}
          >
            i
          </div>
          <div className="tooltiptext">
            {isConnected 
              ? "SharePoint Connection: OK" 
              : "Please go to Setting update the token first"}
          </div>
        </div>
      </div>

      <Card className="w-[400px] rounded-3xl shadow-xl border-none bg-white/50 backdrop-blur-md">
        <Space direction="vertical" className="w-full" size="large">
          <div className="text-center">
            <Title level={3} className="m-0">Team Login</Title>
            <Text type="secondary">Stock Take Scheduler Pro</Text>
          </div>
          
          <Input 
            prefix={<UserOutlined />} 
            placeholder="Alias Email" 
            size="large"
            value={aliasemail}
            onChange={e => setAliasemail(e.target.value)}
            className="rounded-xl"
          />
          
          <Input.Password 
            prefix={<LockOutlined />} 
            placeholder="Password" 
            size="large"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="rounded-xl"
          />
          
          <Button 
            type="primary" 
            block 
            size="large" 
            loading={loading}
            onClick={handleLogin}
            className="bg-blue-600 rounded-xl h-12 font-bold"
          >
            登入系統
          </Button>
        </Space>
      </Card>

      {/* ✅ CSS 樣式 */}
      <style>{`
        .custom-tooltip {
          position: relative;
          display: inline-block;
          cursor: pointer;
          font-family: "Arial", sans-serif;
        }

        .custom-tooltip:hover .tooltiptext {
          visibility: visible;
          opacity: 1;
        }

        .tooltiptext {
          visibility: hidden;
          width: 200px;
          background-color: #333;
          color: #fff;
          text-align: center;
          border-radius: 5px;
          padding: 10px;
          position: absolute;
          z-index: 10;
          top: 150%;
          left: 50%;
          margin-left: -180px; /* 向左移一點避免出界 */
          opacity: 0;
          transition: opacity 0.3s;
          font-size: 12px;
          line-height: 1.4;
        }

        .tooltiptext::after {
          content: "";
          position: absolute;
          bottom: 100%;
          left: 90%;
          margin-left: -10px;
          border-width: 10px;
          border-style: solid;
          border-color: transparent transparent #333 transparent;
        }

        .custom-tooltip .icon {
          display: inline-block;
          width: 24px;
          height: 24px;
          color: #fff;
          border-radius: 50%;
          text-align: center;
          line-height: 24px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: transform 0.2s;
        }
        
        .custom-tooltip:hover .icon {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  );
};
