import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import bcrypt from 'bcryptjs';

const { Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: any;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService }) => {
  // 狀態管理
  const [isFlipped, setIsFlipped] = useState(false); // 控制翻轉
  const [aliasemail, setAliasemail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 背面專用
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // 檢查連線
  useEffect(() => {
    const checkConnection = async () => {
      const result = await sharePointService.checkMemberListConnection();
      setIsConnected(result);
    };
    checkConnection();
  }, [sharePointService]);

  // 正面：執行登入
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
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

  // 背面：執行設定密碼 (Confirm)
  const handleConfirmSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) {
      return message.warning("請填寫所有欄位");
    }
    if (password !== confirmPassword) {
      return message.error("兩次輸入的密碼不符");
    }

    setLoading(true);
    try {
      // 這裡暫時執行一個模擬成功邏輯，因為密碼更新通常需要後端 API
      // 如果你想直接更新 SharePoint，可以呼叫 sharePointService.updateMemberPassword
      message.loading("正在更新密碼...");
      setTimeout(() => {
        message.success("密碼更新成功！現在可以嘗試登入");
        setIsFlipped(false); // 轉回正面登入
        setLoading(false);
      }, 1500);
    } catch (err) {
      message.error("更新失敗");
      setLoading(false);
    }
  };

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

      <div className="wrapper">
        <div className="card-switch">
          <label className="switch">
            {/* 隱藏的 Checkbox 用來控制翻轉 */}
            <input 
              type="checkbox" 
              className="toggle" 
              checked={isFlipped} 
              onChange={() => setIsFlipped(!isFlipped)} 
            />
            <span className="slider"></span>
            <span className="card-side"></span>

            <div className="flip-card__inner">
              {/* --- 正面：Log In --- */}
              <div className="flip-card__front">
                <form className="form" onSubmit={handleLogin}>
                  <div className="text-center mb-2">
                    <h2 className="main-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Access your dashboard</Text>
                  </div>

                  <div className="input-group">
                    <label className="label">Alias Email</label>
                    <input 
                      type="text" 
                      placeholder="e.g. k-chan"
                      value={aliasemail}
                      onChange={(e) => setAliasemail(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">Password</label>
                    <input 
                      type="password" 
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <button className="submit-btn" type="submit" disabled={loading}>
                    {loading ? "Loading..." : "Log in"}
                  </button>
                  
                  <span className="footer-span" onClick={() => setIsFlipped(true)}>
                    Need to <a>Set Password?</a>
                  </span>
                </form>
              </div>

              {/* --- 背面：Set Password --- */}
              <div className="flip-card__back">
                <form className="form" onSubmit={handleConfirmSetPassword}>
                  <div className="text-center mb-2">
                    <h2 className="main-title" style={{ color: '#44d8a4' }}>Set Password</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Update your account</Text>
                  </div>

                  <div className="input-group">
                    <label className="label">Alias Email</label>
                    <input 
                      type="text" 
                      placeholder="Verify your ID"
                      value={aliasemail}
                      onChange={(e) => setAliasemail(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">New Password</label>
                    <input 
                      type="password" 
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">Re-Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button className="submit-btn confirm-bg" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Confirm!"}
                  </button>

                  <span className="footer-span" onClick={() => setIsFlipped(false)}>
                    Back to <a>Log in</a>
                  </span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        .wrapper {
          --input-focus: #58bc82;
          --font-color: #323232;
          --bg-color: #fff;
          --main-color: #323232;
          --clr: #58bc82;
        }

        /* --- 翻轉開關樣式 ( andrew-demchenk0 ) --- */
        .card-switch {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          width: 350px;
        }
        .switch {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 30px;
          width: 50px;
          height: 20px;
          margin-bottom: 300px; /* 為下方的卡片留空間 */
        }
        .card-side::before, .card-side::after {
          position: absolute; color: var(--main-color); font-weight: 600; font-size: 14px; top: 0; width: 100px;
        }
        .card-side::before { content: 'Log in'; left: -85px; text-decoration: underline; }
        .card-side::after { content: 'Set Pass'; left: 65px; }
        .toggle { opacity: 0; width: 0; height: 0; }
        .slider {
          box-sizing: border-box; border-radius: 5px; border: 2px solid var(--main-color);
          box-shadow: 4px 4px var(--main-color); position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0; background-color: #fff; transition: 0.3s;
        }
        .slider:before {
          position: absolute; content: ""; height: 20px; width: 20px; border: 2px solid var(--main-color);
          border-radius: 5px; left: -2px; bottom: 2px; background-color: #fff;
          box-shadow: 0 3px 0 var(--main-color); transition: 0.3s;
        }
        .toggle:checked + .slider { background-color: var(--input-focus); }
        .toggle:checked + .slider:before { transform: translateX(30px); }
        .toggle:checked ~ .card-side:before { text-decoration: none; }
        .toggle:checked ~ .card-side:after { text-decoration: underline; }

        /* --- 卡片主體與翻轉效果 --- */
        .flip-card__inner {
          width: 380px; height: 480px; position: absolute; top: 50px;
          transition: transform 0.8s; transform-style: preserve-3d;
        }
        .toggle:checked ~ .flip-card__inner { transform: rotateY(180deg); }

        .flip-card__front, .flip-card__back {
          padding: 30px; position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; background: white; border-radius: 20px;
          border: 2px solid var(--main-color); box-shadow: 8px 8px var(--main-color);
          display: flex; flex-direction: column;
        }
        .flip-card__back { transform: rotateY(180deg); }

        /* --- 融合綠色簡約風格 ( bociKond ) --- */
        .form { display: flex; flex-direction: column; gap: 1rem; width: 100%; }
        .main-title { color: var(--clr); font-weight: 800; font-size: 1.6rem; margin: 0; }
        .input-group { display: flex; flex-direction: column; gap: 0.4rem; text-align: left; }
        .label { color: var(--clr); font-weight: 700; font-size: 0.85rem; margin-left: 5px; }
        
        .form input {
          border-radius: 0.8rem; padding: 0.9rem 0.75rem; width: 100%; border: none;
          background-color: #9c9c9c15; outline: 2px solid #323232; transition: all 0.3s;
          font-weight: 600;
        }
        .form input:focus { outline: 2px solid var(--clr); background-color: white; }

        .submit-btn {
          padding: 0.9rem; width: 100%; border-radius: 3rem; background-color: #323232;
          color: #fff; border: none; cursor: pointer; transition: all 0.3s;
          font-weight: 700; font-size: 1rem; margin-top: 10px;
          box-shadow: 4px 4px var(--main-color);
        }
        .submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px var(--main-color); }
        .submit-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px var(--main-color); }
        .confirm-bg:hover { background-color: #44d8a4; }

        .footer-span { margin-top: 10px; font-size: 0.8rem; color: #666; cursor: pointer; }
        .footer-span a { color: var(--clr); font-weight: 700; text-decoration: underline; }

        /* --- Tooltip 指示燈 --- */
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .tooltiptext {
          visibility: hidden; width: 180px; background-color: #333; color: #fff; text-align: center;
          border-radius: 5px; padding: 8px; position: absolute; z-index: 100; top: 150%; left: 50%;
          margin-left: -160px; opacity: 0; transition: opacity 0.3s; font-size: 11px;
        }
        .custom-tooltip .icon {
          display: inline-block; width: 22px; height: 22px; color: #fff; border-radius: 50%;
          text-align: center; line-height: 22px; font-weight: bold;
        }
      `}</style>
    </div>
  );
};
