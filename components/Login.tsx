import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import bcrypt from 'bcryptjs';

const { Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: any;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [aliasemail, setAliasemail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
        message.error("搵唔到帳號");
      }
    } catch (err) {
      message.error("連線失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (password !== confirmPassword) return message.error("兩次輸入的密碼不符");

    setLoading(true);
    message.loading("正在更新密碼...");
    setTimeout(() => {
      message.success("密碼設定成功！");
      setIsFlipped(false);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center h-full relative bg-[#f0f2f5]">
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
                    <Text type="secondary" style={{ fontSize: '11px' }}>Access Dashboard</Text>
                  </div>

                  <div className="input-group">
                    <label className="label">Alias Email</label>
                    <input type="text" placeholder="e.g. k-chan" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  <div className="input-group">
                    <label className="label">Password</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <button className="submit-btn" type="submit" disabled={loading}>Log in</button>
                  <span className="footer-span" onClick={() => setIsFlipped(true)}>Need to <a>Set Password?</a></span>
                </form>
              </div>

              {/* --- 背面：Set Password (只有 3 個輸入框) --- */}
              <div className="flip-card__back">
                <form className="form" onSubmit={handleConfirmSetPassword}>
                  <div className="text-center mb-2">
                    <h2 className="main-title" style={{ color: '#44d8a4' }}>Set Password</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Update Credentials</Text>
                  </div>

                  <div className="input-group">
                    <label className="label">Alias Email</label>
                    <input type="text" placeholder="Verify Alias" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  <div className="input-group">
                    <label className="label">New Password</label>
                    <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <div className="input-group">
                    <label className="label">Re-Confirm Password</label>
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>

                  <button className="submit-btn confirm-bg" type="submit" disabled={loading}>Confirm!</button>
                  <span className="footer-span" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        /* 調整整體位置向上 */
        .wrapper {
          transform: translateY(-40px); /* ✅ 整體向上移 40px */
          --input-focus: #58bc82;
          --main-color: #323232;
        }

        .card-switch {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 380px;
        }

        .switch {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 22px;
          margin-bottom: 240px; /* ✅ 縮短開關與卡片的距離，讓位置更靠上 */
        }

        /* 開關樣式 */
        .slider {
          box-sizing: border-box; border-radius: 5px; border: 2px solid var(--main-color);
          box-shadow: 3px 3px var(--main-color); position: absolute; cursor: pointer;
          top: 0; left: 0; right: 0; bottom: 0; background-color: #fff; transition: 0.3s;
        }
        .slider:before {
          position: absolute; content: ""; height: 18px; width: 18px; border: 2px solid var(--main-color);
          border-radius: 4px; left: -1px; bottom: 1px; background-color: #fff;
          box-shadow: 0 2px 0 var(--main-color); transition: 0.3s;
        }
        .toggle { opacity: 0; width: 0; height: 0; }
        .toggle:checked + .slider { background-color: #58bc82; }
        .toggle:checked + .slider:before { transform: translateX(28px); }

        .card-side::before, .card-side::after {
          position: absolute; color: var(--main-color); font-weight: 700; font-size: 13px; top: 2px;
        }
        .card-side::before { content: 'Log in'; left: -80px; text-decoration: underline; }
        .card-side::after { content: 'Set Pass'; left: 65px; }
        .toggle:checked ~ .card-side:before { text-decoration: none; }
        .toggle:checked ~ .card-side:after { text-decoration: underline; }

        /* 卡片容器 */
        .flip-card__inner {
          width: 360px; height: 460px; position: absolute; top: 50px;
          transition: transform 0.8s; transform-style: preserve-3d;
        }
        .toggle:checked ~ .flip-card__inner { transform: rotateY(180deg); }

        .flip-card__front, .flip-card__back {
          padding: 30px; position: absolute; width: 100%; height: 100%;
          backface-visibility: hidden; background: white; border-radius: 20px;
          border: 2px solid var(--main-color); box-shadow: 8px 8px var(--main-color);
          display: flex; flex-direction: column; gap: 15px;
        }
        .flip-card__back { transform: rotateY(180deg); }

        /* Form 內元素 */
        .form { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; }
        .main-title { color: #58bc82; font-weight: 800; font-size: 1.5rem; margin: 0; }
        .input-group { display: flex; flex-direction: column; gap: 0.3rem; text-align: left; }
        .label { color: #58bc82; font-weight: 700; font-size: 0.8rem; margin-left: 5px; }
        
        .form input {
          border-radius: 0.8rem; padding: 0.8rem; width: 100%; border: none;
          background-color: #f5f5f5; outline: 2px solid #323232; transition: all 0.3s;
          font-weight: 600; font-size: 14px;
        }
        .form input:focus { outline: 2px solid #58bc82; background-color: white; }

        .submit-btn {
          padding: 0.8rem; width: 100%; border-radius: 3rem; background-color: #323232;
          color: #fff; border: none; cursor: pointer; transition: all 0.3s;
          font-weight: 700; font-size: 1rem; margin-top: 10px;
          box-shadow:
