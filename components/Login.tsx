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
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

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

  // 按鈕點擊事件處理
  const handleSetPassword = () => message.info("功能開發中：請聯繫管理員重設密碼");
  const handleCreateAccount = () => message.info("功能開發中：目前僅限管理員手動新增帳號");

  return (
    <div className="flex items-center justify-center h-full relative">
      {/* 右上角連線指示燈 */}
      <div className="absolute top-4 right-4">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">
            {isConnected ? "SharePoint Connection: OK" : "Please go to Setting update the token first"}
          </div>
        </div>
      </div>

      <Card className="w-[400px] rounded-3xl shadow-xl border-none bg-white/50 backdrop-blur-md overflow-hidden">
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
            className="bg-blue-600 rounded-xl h-12 font-bold mb-2"
          >
            登入系統
          </Button>

          {/* ✅ 新增：自定義樣式的兩個按鈕 */}
          <div className="buttons">
            <button className="btn" onClick={handleSetPassword}>
              <span></span>
              <p data-start="GO!" data-text="Update Now" data-title="Set Password"></p>
            </button>
            <button className="btn" onClick={handleCreateAccount}>
              <span></span>
              <p data-start="JOIN!" data-text="Register" data-title="Create Account"></p>
            </button>
          </div>
        </Space>
      </Card>

      {/* ✅ CSS 樣式整合 */}
      <style>{`
        /* Tooltip Style */
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .tooltiptext {
          visibility: hidden; width: 200px; background-color: #333; color: #fff; text-align: center;
          border-radius: 5px; padding: 10px; position: absolute; z-index: 10; top: 150%; left: 50%;
          margin-left: -180px; opacity: 0; transition: opacity 0.3s; font-size: 11px;
        }
        .custom-tooltip .icon {
          display: inline-block; width: 22px; height: 22px; color: #fff; border-radius: 50%;
          text-align: center; line-height: 22px; font-weight: bold;
        }

        /* ✅ 你提供的特殊按鈕樣式 */
        .buttons {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: -10px;
        }

        .buttons .btn {
          width: 165px; /* 微調寬度以適應 Card */
          height: 45px;
          background-color: white;
          color: #568fa6;
          position: relative;
          overflow: hidden;
          font-size: 11px;
          letter-spacing: 0.5px;
          font-weight: 600;
          text-transform: uppercase;
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid #eee;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 12px;
          padding: 0;
        }

        .buttons .btn:before, .buttons .btn:after {
          content: "";
          position: absolute;
          width: 0;
          height: 2px;
          background-color: #44d8a4;
          transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons .btn:before { right: 0; top: 0; transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1); }
        .buttons .btn:after { left: 0; bottom: 0; }

        .buttons .btn span {
          width: 100%; height: 100%; position: absolute; left: 0; top: 0; z-index: 1;
        }

        .buttons .btn span:before, .buttons .btn span:after {
          content: "";
          position: absolute;
          width: 2px;
          height: 0;
          background-color: #44d8a4;
          transition: all 0.3s cubic-bezier(0.35, 0.1, 0.25, 1);
        }

        .buttons .btn span:before { right: 0; top: 0; transition: all 0.5s cubic-bezier(0.35, 0.1, 0.25, 1); }
        .buttons .btn span:after { left: 0; bottom: 0; }

        .buttons .btn p {
          padding: 0; margin: 0; transition: all 0.4s cubic-bezier(0.35, 0.1, 0.25, 1);
          position: absolute; width: 100%; height: 100%;
        }

        .buttons .btn p:before, .buttons .btn p:after {
          position: absolute; width: 100%; transition: all 0.4s cubic-bezier(0.35, 0.1, 0.25, 1);
          z-index: 1; left: 0;
        }

        .buttons .btn p:before {
          content: attr(data-title);
          top: 50%;
          transform: translateY(-50%);
        }

        .buttons .btn p:after {
          content: attr(data-text);
          top: 150%;
          color: #44d8a4;
        }

        .buttons .btn:hover:before, .buttons .btn:hover:after { width: 100%; }
        .buttons .btn:hover span:before, .buttons .btn:hover span:after { height: 100%; }

        .buttons .btn:hover p:before {
          top: -50%;
          transform: rotate(5deg);
        }

        .buttons .btn:hover p:after {
          top: 50%;
          transform: translateY(-50%);
        }

        .buttons .btn:active { outline: none; border: none; }
        .buttons .btn:focus { outline: 0; }
      `}</style>
    </div>
  );
};
