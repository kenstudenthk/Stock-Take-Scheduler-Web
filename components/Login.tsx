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
  const [isFlipped, setIsFlipped] = useState(false);
  const [aliasemail, setAliasemail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // 檢查連線狀態 (Tooltip)
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

  // 背面：執行確認更新密碼
  const handleConfirmSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (password !== confirmPassword) return message.error("兩次輸入的密碼不符");

    setLoading(true);
    // 這裡應呼叫 SharePoint 更新密碼的邏輯，目前先模擬成功
    setTimeout(() => {
      message.success("密碼設定成功！現在可以登入了");
      setIsFlipped(false); // 轉回正面
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center h-full relative">
      {/* 右上角指示燈 */}
      <div className="absolute top-4 right-4 z-50">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">
            {isConnected ? "Connection: OK" : "Please update token in Settings"}
          </div>
        </div>
      </div>

      <div className="wrapper">
        <div className="card-switch">
          <label className="switch">
            {/* 隱藏的 Checkbox 控制翻轉 */}
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
                    <h2 className="title-text">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Access Dashboard</Text>
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
                  
                  {/* 使用按鈕樣式的 Footer 分流 */}
                  <div className="footer-links">
                    <span onClick={() => setIsFlipped(true)}>Forgot or <a>Set Password?</a></span>
                  </div>
                </form>
              </div>

              {/* --- 背面：Set Password (3 個輸入框) --- */}
              <div className="flip-card__back">
                <form className="form" onSubmit={handleConfirmSetPassword}>
                  <div className="text-center mb-2">
                    <h2 className="title-text" style={{ color: '#44d8a4' }}>Set Password</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Update Credentials</Text>
                  </div>

                  <div className="input-group">
                    <label className="label">Alias Email</label>
                    <input 
                      type="text" 
                      placeholder="Verify your Alias"
                      value={aliasemail}
                      onChange={(e) => setAliasemail(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">New Password</label>
                    <input 
                      type="password" 
                      placeholder="New Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>

                  <div className="input-group">
                    <label className="label">Re-Confirm Password</label>
                    <input 
                      type="password" 
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>

                  <button className="submit-btn confirm-bg" type="submit" disabled={loading}>
                    {loading ? "Updating..." : "Confirm!"}
                  </button>

                  <div className="footer-links">
                    <span onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                  </div>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        /* 1. 全域變量與位置向上移 */
        .wrapper {
          --input-focus: #58bc82;
          --main-color: #323232;
          transform: translateY(-50px); /* ✅ 整體向上移動 50px */
        }

        .card-switch {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 380px;
        }

        /* 2. 翻轉開關樣式 */
        .switch {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 20px;
          margin-bottom: 220px; /* ✅ 縮短開關與卡片間距，讓位置更靠上 */
        }
        .toggle { opacity: 0; width: 0; height: 0; }
        .slider {
          box-sizing: border-box; border-radius: 5px; border: 2px solid var(--main-color);
          box-shadow: 4px 4px var(--main-color); position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0; background-color: #fff; transition: 0.3s;
        }
        .slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; border: 2px solid var(--main-color);
          border-radius: 4px; left: -1px; bottom: 1px; background-color: #fff;
          box-shadow: 0 2px 0 var(--main-color); transition: 0.3s;
        }
        .toggle:checked + .slider { background-color: var(--input-focus); }
        .toggle:checked + .slider:before { transform: translateX(28px); }

        .card-side::before, .card-side::after {
          position: absolute; color: var(--main-color); font-weight: 700; font-size: 14px; top: -2px; width: 100px;
        }
        .card-side::before { content: 'Log in'; left: -85px; text-decoration: underline; }
        .card-side::after { content: 'Set Pass'; left: 65px; }
        .toggle:checked ~ .card-side:before { text-decoration: none; }
        .toggle:checked ~ .card-side:after { text-decoration: underline; }

        /* 3. 卡片翻轉動畫核心 */
        .flip-card__inner {
          width: 360px; height: 460px; position: absolute; top: 50px;
          transition: transform 0.8s; transform-style: preserve-3d;
        }
        .toggle:checked ~ .flip-card__inner { transform: rotateY(180deg); }

        .flip-card__front, .flip-card__back {
          padding: 30px; position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; background: white; border-radius: 20px;
          border: 2px solid var(--main-color); box-shadow: 8px 8px var(--main-color);
          display: flex; flex-direction: column; gap: 10px;
        }
        .flip-card__back { transform: rotateY(180deg); }

        /* 4. 融合綠色簡約風格 (bociKond) */
        .form { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; }
        .title-text { color: #58bc82; font-weight: 800; font-size: 1.6rem; margin: 0; }
        .input-group { display: flex; flex-direction: column; gap: 0.3rem; text-align: left; }
        .label { color: #58bc82; font-weight: 700; font-size: 0.85rem; margin-left: 5px; }
        
        .form input {
          border-radius: 0.8rem; padding: 0.9rem 0.75rem; width: 100%; border: none;
          background-color: #9c9c9c15; outline: 2px solid #323232; transition: all 0.3s;
          font-weight: 600; font-size: 14px;
        }
        .form input:focus { outline: 2px solid #58bc82; background-color: white; }

        .submit-btn {
          padding: 0.9rem; width: 100%; border-radius: 3rem; background-color: #323232;
          color: #fff; border: none; cursor: pointer; transition: all 0.3s;
          font-weight: 700; font-size: 1rem; margin-top: 10px;
          box-shadow: 4px 4px #323232;
        }
        .submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px #323232; background-color: #58bc82; }
        .submit-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px var(--main-color); }
        .confirm-bg:hover { background-color: #44d8a4; }

        .footer-links { margin-top: 10px; font-size: 0.8rem; color: #666; cursor: pointer; text-align: center; }
        .footer-links a { color: #58bc82; font-weight: 700; text-decoration: underline; }

        /* 5. Tooltip 指示燈 */
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .tooltiptext {
          visibility: hidden; width: 180px; background-color: #333; color: #fff; text-align: center;
          border-radius: 5px; padding: 8px; position: absolute; z-index: 100; top: 150%; left: 50%;
          margin-left: -160px; opacity: 0; transition: opacity 0.3s; font-size: 11px;
        }
        .custom-tooltip .icon {
          display: inline-block; width: 22px; height: 22px; color: #fff; border-radius: 50%;
          text-align: center; line-height: 22px; font-weight: bold; font-size: 12px;
        }
      `}</style>
    </div>
  );
};
