import React, { useState } from 'react';
import { Card, Input, Button, message, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import bcrypt from 'bcryptjs';

const { Title, Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: any;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return message.warning("請填寫 Email 同密碼");
    
    setLoading(true);
    try {
      // 1. 去 SharePoint 搵用戶
      const user = await sharePointService.getUserByEmail(email);
      
      if (user) {
        // 2. 用 bcrypt 比對密碼
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        
        if (isMatch) {
          message.success(`歡迎返嚟，${user.Name}!`);
          onLoginSuccess(user); // 登入成功，將 user object 傳返去 App.tsx
        } else {
          message.error("密碼不正確");
        }
      } else {
        message.error("搵唔到呢個 Email 帳號");
      }
    } catch (err) {
      console.error(err);
      message.error("登入過程發生錯誤");
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
            prefix={<MailOutlined className="text-slate-500" />} 
            placeholder="Email" 
            size="large"
            className="rounded-xl bg-[#0d1117] border-slate-700 text-white"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          
          <Input.Password 
            prefix={<LockOutlined className="text-slate-500" />} 
            placeholder="密碼" 
            size="large"
            className="rounded-xl bg-[#0d1117] border-slate-700 text-white"
            value={password}
            onChange={e => setPassword(e.target.value)}
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