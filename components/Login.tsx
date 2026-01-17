import React, { useState } from 'react';
import { Card, Input, Button, message, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import bcrypt from 'bcryptjs';
import SharePointService from '../services/SharePointService';

const { Title, Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: SharePointService; // ✅ 接收你頭先嗰份 Service
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService }) => {
  const [aliasemail, setAliasemail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!aliasemail || !password) return message.warning("請填寫 Alias Email 同密碼");
    
    setLoading(true);
    try {
      // 1. 透過 Service 去 SharePoint 搵人
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      
      if (user) {
        // 2. 搵到人之後，用 bcrypt 比對密碼
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        
        if (isMatch) {
          message.success(`歡迎返嚟，${user.Name}!`);
          onLoginSuccess(user);
        } else {
          message.error("密碼不正確");
        }
      } else {
        message.error("搵唔到呢個帳號，請檢查 Alias Email");
      }
    } catch (err) {
      console.error(err);
      message.error("登入過程中發生錯誤");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[#0d1117]">
      <Card className="w-[380px] rounded-3xl shadow-2xl border-none bg-[#161b22]">
        <Space direction="vertical" className="w-full" size="large">
          <div className="text-center">
            <Title level={3} style={{ color: 'white', margin: 0 }}>Team Login</Title>
            <Text style={{ color: '#7d8590' }}>Stock Take Scheduler Pro</Text>
          </div>
          
          <Input 
            prefix={<UserOutlined className="text-slate-500" />} 
            placeholder="Alias Email" 
            size="large"
            className="rounded-xl bg-[#0d1117] border-slate-700 text-white"
            value={aliasemail}
            onChange={e => setAliasemail(e.target.value)}
            onPressEnter={handleLogin}
          />
          
          <Input.Password 
            prefix={<LockOutlined className="text-slate-500" />} 
            placeholder="Password" 
            size="large"
            className="rounded-xl bg-[#0d1117] border-slate-700 text-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onPressEnter={handleLogin}
          />
          
          <Button 
            type="primary" 
            block 
            size="large" 
            loading={loading}
            onClick={handleLogin}
            className="bg-blue-600 hover:bg-blue-500 rounded-xl font-bold h-12"
          >
            登入系統
          </Button>
        </Space>
      </Card>
    </div>
  );
};
