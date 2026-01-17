import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import bcrypt from 'bcryptjs';

const { Text } = Typography;

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

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault(); // 防止網頁刷新
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
      message.error("連線失敗");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-full relative">
      {/* 1. 右上角 Tooltip 連線燈 */}
      <div className="absolute top-4 right-4">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">
            {isConnected ? "SharePoint Connection: OK" : "Please go to Setting update the token first"}
          </div>
        </div>
      </div>

      {/* 2. 新風格 Login Form */}
      <div className="login-container">
        <form className="form" onSubmit={handleLogin}>
          <div className="text-center mb-4">
            <h2 style={{ color: '#58bc82', margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Team Login</h2>
            <Text type="secondary" style={{ fontSize: '12px' }}>Stock Take Scheduler Pro</Text>
          </div>

          <span className="input-span">
            <label htmlFor="email" className="label">Alias Email</label>
            <input 
              type="text" 
              name="email" 
              id="email" 
              value={aliasemail}
              onChange={(e) => setAliasemail(e.target.value)}
              placeholder="e.g. k-chan"
            />
          </span>

          <span className="input-span">
            <label htmlFor="password" className="label">Password</label>
            <input 
              type="password" 
              name="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </span>

          <button className="submit" type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Log in"}
          </button>

          {/* 3. 特殊動畫按鈕 (Set Password / Create Account) */}
          <div className="buttons-wrapper">
             <div className="buttons">
                <button className="btn" type="button" onClick={() => message.info("Please contact admin")}>
                  <span></span>
                  <p data-start="GO!" data-text="Update" data-title="Set Password"></p>
                </button>
                <button className="btn" type="button" onClick={() => message.info("Admin only")}>
                  <span></span>
                  <p data-start="JOIN!" data-text="Register" data-title="Create Account"></p>
                </button>
              </div>
          </div>
        </form>
      </div>

      {/* 4. 合併所有 CSS */}
      <style>{`
        /* --- Tooltip Style --- */
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .tooltiptext {
          visibility: hidden; width: 180px; background-color: #333; color: #fff; text-align: center;
          border-radius: 5px; padding: 8px; position: absolute; z-index: 10; top: 150%; left: 50%;
          margin-left: -160px; opacity: 0; transition: opacity 0.3s; font-size: 11px;
        }
        .custom-tooltip .icon {
          display: inline-block; width: 22px; height: 22px; color: #fff; border-radius: 50%;
          text-align: center; line-height: 22px; font-weight: bold;
        }

        /* --- 新 Login Form Style --- */
        .login-container {
          background: white;
          padding: 40px;
          border-radius: 30px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
        }
        .form {
          --bg-light: #efefef;
          --bg-dark: #707070;
          --clr: #58bc82;
          --clr-alpha: #9c9c9c20; /* 稍微調淺一點更美觀 */
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.2rem;
          width: 350px; /* 增加闊度配合下方雙按鈕 */
        }
        .form .input-span {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form input[type="text"],
        .form input[type="password"] {
          border-radius: 0.8rem;
          padding: 1rem 0.75rem;
          width: 100%;
          border: none;
          background-color: var(--clr-alpha);
          outline: 2px solid #e0e0e0;
          transition: all 0.3s;
        }
        .form input:focus {
          outline: 2px solid var(--clr);
          background-color: white;
        }
        .label {
          align-self: flex-start;
          color: var(--clr);
          font-weight: 700;
          font-size: 0.85rem;
          margin-left: 4px;
        }
        .form .submit {
          padding: 0.8rem;
          width: 100%;
          border-radius: 3rem;
          background-color: var(--bg-dark);
          color: var(--bg-light);
          border: none;
          cursor: pointer;
          transition: all 300ms;
          font-weight: 700;
          font-size: 1rem;
          margin-top: 10px;
        }
        .form .submit:hover {
          background-color: var(--clr);
          transform: translateY(-2px);
          box-shadow: 0 5px 15px rgba(88, 188, 130, 0.3);
        }

        /* --- 特殊動畫按鈕 Style --- */
        .buttons-wrapper { width: 100%; margin-top: 10px; }
        .buttons { display: flex; justify-content: space-between; gap: 10px; }
        .buttons .btn {
          width: 100%;
          height: 45px;
          background-color: white;
          color: #568fa6;
          position: relative;
          overflow: hidden;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          cursor: pointer;
          border: 1px solid #eee;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .buttons .btn:before, .buttons .btn:after {
          content: ""; position: absolute; width: 0; height: 2px;
          background-color: #44d8a4; transition: all 0.3s ease;
        }
        .buttons .btn:before { right: 0; top: 0; }
        .buttons .btn:after { left: 0; bottom: 0; }
        .buttons .btn span { width: 100%; height: 100%; position: absolute; left: 0; top: 0; z-index: 1; }
        .buttons .btn span:before, .buttons .btn span:after {
          content: ""; position: absolute; width: 2px; height: 0;
          background-color: #44d8a4; transition: all 0.3s ease;
        }
        .buttons .btn span:before { right: 0; top: 0; }
        .buttons .btn span:after { left: 0; bottom: 0; }
        .buttons .btn p { position: absolute; width: 100%; height: 100%; margin:0; }
        .buttons .btn p:before, .buttons .btn p:after {
          position: absolute; width: 100%; transition: all 0.4s ease; left: 0;
        }
        .buttons .btn p:before { content: attr(data-title); top: 50%; transform: translateY(-50%); }
        .buttons .btn p:after { content: attr(data-text); top: 150%; color: #44d8a4; }
        .buttons .btn:hover:before, .buttons .btn:hover:after { width: 100%; }
        .buttons .btn:hover span:before, .buttons .btn:hover span:after { height: 100%; }
        .buttons .btn:hover p:before { top: -50%; }
        .buttons .btn:hover p:after { top: 50%; transform: translateY(-50%); }
      `}</style>
    </div>
  );
};
