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

// Login.tsx

const handleConfirmSetPassword = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // 基礎檢查
  if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
  if (password !== confirmPassword) return message.error("兩次輸入的密碼不符");

  setLoading(true);
  const hide = message.loading("正在安全加密並更新至 SharePoint...", 0);

  try {
    // ✅ STEP 1: 使用 bcryptjs 加密密碼
    // saltRounds = 10 是平衡安全與速度的最佳設定
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password, salt);

    // ✅ STEP 2: 調用 Service 將加密後的 Hash 傳回 SPO
    const isSuccess = await sharePointService.updatePasswordByEmail(aliasemail, hash);

    if (isSuccess) {
      message.success("密碼設定成功！依家可以登入。");
      
      // 清空欄位並翻轉回登入畫面
      setPassword('');
      setConfirmPassword('');
      setIsFlipped(false);
    } else {
      message.error("更新失敗：找不到帳號 'AliasEmail' 或連線錯誤");
    }
  } catch (err) {
    console.error("Login Component Error:", err);
    message.error("發生系統錯誤，請檢查網路連線");
  } finally {
    hide(); // 關閉 Loading
    setLoading(false);
  }
};

  return (
    <div className="login-viewport-wrapper">
      {/* 右上角連線指示燈 */}
      <div className="status-indicator">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">
            {isConnected ? "Connection: OK" : "Please update token in Settings"}
          </div>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            {/* ✅ 修正：使用更徹底的隱藏方式消除頂部小方塊 */}
            <input 
              type="checkbox" 
              className="hidden-toggle" 
              checked={isFlipped} 
              onChange={() => setIsFlipped(!isFlipped)} 
            />
            <span className="slider-base"></span>
            <span className="side-labels"></span>

            <div className="flip-card-container">
              {/* --- 正面：Log In --- */}
              <div className="flip-card-front-side">
                <form className="inner-form" onSubmit={handleLogin}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Access Dashboard</Text>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="e.g. k.ab.chan@pccw.com" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <button className="main-submit-btn" type="submit" disabled={loading}>Log in</button>
                  <span className="bottom-link" onClick={() => setIsFlipped(true)}>Need to <a>Set Password?</a></span>
                </form>
              </div>

              {/* --- 背面：Set Password (只有 3 個欄位) --- */}
              <div className="flip-card-back-side">
                <form className="inner-form" onSubmit={handleConfirmSetPassword}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title" style={{ color: '#44d8a4' }}>Set Password</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Update Credentials</Text>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="Please enter the email with @pccw.com" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Re-Confirm Password</label>
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>

                  <button className="main-submit-btn confirm-mode" type="submit" disabled={loading}>Confirm!</button>
                  <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        /* ✅ 修正 1：將整體位置移動到紅線處 (頂部 15%) */
        .login-viewport-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: flex-start; /* 改為靠頂部對齊 */
          padding-top: 5vh; /* 從頂部向下 5% 的距離 */
          background-color: transparent;
        }

        .main-login-container {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 400px;
          z-index: 10;
        }

        /* ✅ 修正 2：徹底消除 Checkbox 的渲染小點 */
        .hidden-toggle {
          position: absolute;
          width: 1px;
          height: 1px;
          margin: -1px;
          padding: 0;
          overflow: hidden;
          clip: rect(0,0,0,0);
          border: 0;
          display: none; /* 直接不顯示 */
        }

        /* --- Toggle Switch 修正 --- */
        .card-switch-area {
          margin-bottom: 20px;
          position: relative;
        }

        .switch-label {
          position: relative;
          display: block;
          width: 50px;
          height: 22px;
          cursor: pointer;
          margin: 0 auto 480px auto; /* 底部留白給卡片 */
        }

        .slider-base {
          position: absolute;
          inset: 0;
          background-color: #fff;
          border: 2px solid #323232;
          border-radius: 6px;
          box-shadow: 3px 3px #323232;
          transition: 0.3s;
        }

        .slider-base:before {
          content: "";
          position: absolute;
          height: 18px;
          width: 18px;
          left: -1px;
          bottom: 1px;
          background-color: #fff;
          border: 2px solid #323232;
          border-radius: 4px;
          box-shadow: 0 2px 0 #323232;
          transition: 0.3s;
        }

        .hidden-toggle:checked + .slider-base { background-color: #58bc82; }
        .hidden-toggle:checked + .slider-base:before { transform: translateX(28px); }

        /* 文字標籤定位 */
        .side-labels::before, .side-labels::after {
          position: absolute; color: #323232; font-weight: 800; font-size: 13px; top: 2px; white-space: nowrap;
        }
        .side-labels::before { content: 'Log in'; left: -80px; text-decoration: underline; }
        .side-labels::after { content: 'Set Pass'; left: 65px; }
        .hidden-toggle:checked ~ .side-labels::before { text-decoration: none; }
        .hidden-toggle:checked ~ .side-labels::after { text-decoration: underline; }

        /* --- 卡片主體與翻轉 --- */
        .flip-card-container {
          position: absolute;
          top: 50px;
          left: 50%;
          transform: translateX(-50%);
          width: 360px;
          height: 480px;
          transition: transform 0.8s;
          transform-style: preserve-3d;
        }
        .hidden-toggle:checked ~ .flip-card-container { transform: translateX(-50%) rotateY(180deg); }

        .flip-card-front-side, .flip-card-back-side {
          position: absolute; width: 100%; height: 100%; padding: 30px;
          backface-visibility: hidden; background: white; border-radius: 20px;
          border: 2px solid #323232; box-shadow: 10px 10px #323232;
          display: flex; flex-direction: column; gap: 12px;
        }
        .flip-card-back-side { transform: rotateY(180deg); }

        /* --- UI 元素 --- */
        .inner-form { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; }
        .brand-title { color: #58bc82; font-weight: 800; font-size: 1.5rem; margin: 0; }
        .field-group { display: flex; flex-direction: column; gap: 0.3rem; text-align: left; }
        .field-label { color: #58bc82; font-weight: 700; font-size: 0.8rem; margin-left: 5px; }
        
        .inner-form input {
          border-radius: 0.8rem; padding: 0.8rem; width: 100%; border: none;
          background-color: #f8fafc; outline: 2px solid #323232; transition: all 0.2s;
          font-weight: 600; font-size: 14px;
        }
        .inner-form input:focus { outline: 2px solid #58bc82; background-color: white; }

        .main-submit-btn {
          padding: 0.85rem; width: 100%; border-radius: 3rem; background-color: #323232;
          color: #fff; border: none; cursor: pointer; transition: 0.3s;
          font-weight: 700; font-size: 1rem; margin-top: 10px;
          box-shadow: 4px 4px #323232;
        }
        .main-submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px #323232; background-color: #58bc82; }
        .main-submit-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px #323232; }
        .confirm-mode:hover { background-color: #44d8a4; }

        .bottom-link { margin-top: 8px; font-size: 0.75rem; color: #666; cursor: pointer; text-align: center; }
        .bottom-link a { color: #58bc82; font-weight: 700; text-decoration: underline; }

        /* --- 狀態指示燈 --- */
        .status-indicator { position: absolute; top: 16px; right: 16px; z-index: 100; }
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .tooltiptext {
          visibility: hidden; width: 160px; background-color: #333; color: #fff; text-align: center;
          border-radius: 5px; padding: 8px; position: absolute; z-index: 100; top: 130%; left: 50%;
          margin-left: -140px; opacity: 0; transition: opacity 0.3s; font-size: 10px;
        }
        .custom-tooltip .icon {
          display: inline-block; width: 20px; height: 20px; color: #fff; border-radius: 50%;
          text-align: center; line-height: 20px; font-weight: bold; font-size: 11px;
        }
      `}</style>
    </div>
  );
};
