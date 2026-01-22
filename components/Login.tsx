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
  const [mode, setMode] = useState<'set' | 'change'>('set');

  const [aliasemail, setAliasemail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // 監控連線狀態
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const result = await sharePointService.checkMemberListConnection();
        setIsConnected(result);
      } catch (e) {
        setIsConnected(false);
      }
    };
    checkConnection();
  }, [sharePointService]);

  // 重置欄位內容
  const resetFields = () => {
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  // --- 1. 登入邏輯 ---
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aliasemail || !password) return message.warning("請輸入 Alias Email 同密碼");

    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user && user.PasswordHash) {
        // 使用 bcrypt 驗證密碼
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        if (isMatch) {
          message.success(`歡迎回來，${user.Name}`);
          onLoginSuccess(user);
        } else {
          message.error("密碼不正確，請重試");
        }
      } else if (user && !user.PasswordHash) {
        message.info("此帳號尚未設定密碼，請先點擊下方 Set Password");
        setIsFlipped(true);
        setMode('set');
      } else {
        message.error("搵唔到此 Alias Email 帳號");
      }
    } catch (err) {
      message.error("伺服器連線失敗");
    } finally {
      setLoading(false);
    }
  };

  // --- 2. 設定 / 更改密碼邏輯 (PATCH 回 SPO) ---
  const handleConfirmUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼以驗證身份");
    if (password !== confirmPassword) return message.error("兩次輸入的新密碼不一致");

    setLoading(true);
    const hide = message.loading("正在安全加密並同步至 SharePoint...", 0);

    try {
      // 第一步：先抓取現有用戶資料
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("此 Email 未在成員名單內，請聯絡 Admin");

      // 第二步：若是更改密碼模式，驗證舊密碼
      if (mode === 'change') {
        if (!user.PasswordHash) throw new Error("此帳號從未設定密碼，請使用 Set Password 模式");
        const isOldMatch = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldMatch) {
          throw new Error("舊密碼驗證失敗，請輸入正確密碼");
        }
      }

      // 第三步：產生新 Hash
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);

      // 第四步：PATCH 到 SharePoint 欄位 PasswordHash
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "密碼設定成功！" : "密碼已成功更新！");
        resetFields();
        setIsFlipped(false);
      } else {
        throw new Error("SharePoint 寫入失敗，請檢查 Token 權限");
      }
    } catch (err: any) {
      message.error(err.message || "系統發生錯誤");
    } finally {
      hide();
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport-wrapper">
      <div className="status-indicator">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">{isConnected ? "SPO Connection: OK" : "Connection Error: Check Token"}</div>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            <input 
              type="checkbox" 
              className="hidden-toggle" 
              checked={isFlipped} 
              onChange={() => { 
                setIsFlipped(!isFlipped); 
                setMode('set'); 
                resetFields(); 
              }} 
            />
            <span className="slider-base"></span>
            <span className="side-labels"></span>

            <div className="flip-card-container">
              {/* --- 正面：Log In --- */}
              <div className="flip-card-front-side">
                <form className="inner-form" onSubmit={handleLogin}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Inventory Management System</Text>
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

                  <div className="flex flex-col gap-2 mt-4">
                    <span className="bottom-link" onClick={() => { setMode('set'); setIsFlipped(true); resetFields(); }}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={() => { setMode('change'); setIsFlipped(true); resetFields(); }}>Forgot? <a>Change Password</a></span>
                  </div>
                </form>
              </div>

             {/* --- 背面：Set / Change Password --- */}
<div className="flip-card-back-side">
  <form className="inner-form" onSubmit={handleConfirmUpdatePassword}>
    <div className="text-center mb-1">
      {/* 標題會隨模式動態改變顏色和文字 */}
      <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
        {mode === 'change' ? 'Change Password' : 'Set Password'}
      </h2>
      <Text type="secondary" style={{ fontSize: '11px' }}>
        {mode === 'change' ? 'Identity Verification Required' : 'Create New Credentials'}
      </Text>
    </div>

    <div className="field-group">
      <label className="field-label">Alias Email</label>
      <input 
        type="text" 
        placeholder="Enter Alias Email" 
        value={aliasemail} 
        onChange={(e) => setAliasemail(e.target.value)} 
      />
    </div>

    {/* ✅ 關鍵修復：確保這裡的邏輯能正確渲染 Old Password */}
    {mode === 'change' && (
      <div className="field-group animate-fade-in">
        <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
        <input 
          type="password" 
          placeholder="Verify Current Password" 
          value={oldPassword} 
          style={{ border: '2px solid #3b82f6' }} // 增加視覺區分
          onChange={(e) => setOldPassword(e.target.value)} 
          required={mode === 'change'}
        />
      </div>
    )}

    <div className="field-group">
      <label className="field-label">New Password</label>
      <input 
        type="password" 
        placeholder="Enter New Password" 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
    </div>

    <div className="field-group">
      <label className="field-label">Confirm New Password</label>
      <input 
        type="password" 
        placeholder="Re-enter New Password" 
        value={confirmPassword} 
        onChange={(e) => setConfirmPassword(e.target.value)} 
      />
    </div>

    <button 
      className={`main-submit-btn ${mode === 'change' ? 'change-btn' : 'confirm-mode'}`} 
      type="submit" 
      disabled={loading}
    >
      {mode === 'change' ? 'UPDATE NOW' : 'SAVE PASSWORD'}
    </button>

    <span className="bottom-link" onClick={() => { setIsFlipped(false); resetFields(); }}>
      Back to <a>Log in</a>
    </span>
  </form>
</div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.4s ease-out forwards;
}

/* 確保背面卡片能容納所有欄位 */
.flip-card-back-side {
  min-height: 560px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
        .login-viewport-wrapper { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: flex-start; padding-top: 5vh; background-color: transparent; }
        .main-login-container { position: relative; display: flex; flex-direction: column; align-items: center; width: 400px; z-index: 10; }
        .hidden-toggle { display: none; }
        .switch-label { position: relative; display: block; width: 50px; height: 22px; cursor: pointer; margin: 0 auto 550px auto; }
        .slider-base { position: absolute; inset: 0; background-color: #fff; border: 2.5px solid #323232; border-radius: 6px; box-shadow: 4px 4px #323232; transition: 0.3s; }
        .slider-base:before { content: ""; position: absolute; height: 18px; width: 18px; left: -1px; bottom: 1px; background-color: #fff; border: 2px solid #323232; border-radius: 4px; box-shadow: 0 2px 0 #323232; transition: 0.3s; }
        .hidden-toggle:checked + .slider-base { background-color: #58bc82; }
        .hidden-toggle:checked + .slider-base:before { transform: translateX(28px); }
        .side-labels::before, .side-labels::after { position: absolute; color: #323232; font-weight: 900; font-size: 13px; top: 2px; white-space: nowrap; }
        .side-labels::before { content: 'Log in'; left: -85px; text-decoration: underline; }
        .side-labels::after { content: 'Security'; left: 68px; }
        .flip-card-container { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); width: 380px; height: 560px; transition: transform 0.8s; transform-style: preserve-3d; }
        .hidden-toggle:checked ~ .flip-card-container { transform: translateX(-50%) rotateY(180deg); }
        .flip-card-front-side, .flip-card-back-side { position: absolute; width: 100%; height: 100%; padding: 35px; backface-visibility: hidden; background: white; border-radius: 25px; border: 2.5px solid #323232; box-shadow: 12px 12px #323232; display: flex; flex-direction: column; gap: 15px; }
        .flip-card-back-side { transform: rotateY(180deg); }
        .inner-form { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; }
        .brand-title { color: #58bc82; font-weight: 900; font-size: 1.6rem; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .field-group { display: flex; flex-direction: column; gap: 0.3rem; text-align: left; }
        .field-label { color: #58bc82; font-weight: 800; font-size: 0.85rem; margin-left: 5px; }
        .inner-form input { border-radius: 0.8rem; padding: 0.9rem; width: 100%; border: none; background-color: #f1f5f9; outline: 2px solid #323232; transition: all 0.2s; font-weight: 700; font-size: 14px; }
        .inner-form input:focus { outline: 2.5px solid #58bc82; background-color: white; transform: translateY(-1px); }
        .main-submit-btn { padding: 0.9rem; width: 100%; border-radius: 3rem; background-color: #323232; color: #fff; border: none; cursor: pointer; transition: 0.3s; font-weight: 800; font-size: 1.1rem; margin-top: 15px; box-shadow: 4px 4px #323232; }
        .main-submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 7px 7px #323232; background-color: #58bc82; }
        .main-submit-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px #323232; }
        .change-btn:hover { background-color: #3b82f6; }
        .confirm-mode:hover { background-color: #44d8a4; }
        .bottom-link { margin-top: 5px; font-size: 0.8rem; color: #666; cursor: pointer; text-align: center; font-weight: 600; }
        .bottom-link a { color: #58bc82; font-weight: 900; text-decoration: underline; }
        .status-indicator { position: absolute; top: 16px; right: 16px; z-index: 100; }
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .tooltiptext { visibility: hidden; width: 180px; background-color: #333; color: #fff; text-align: center; border-radius: 8px; padding: 10px; position: absolute; z-index: 100; top: 140%; left: 50%; margin-left: -150px; opacity: 0; transition: opacity 0.3s; font-size: 11px; font-weight: 700; border: 1px solid #58bc82; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .custom-tooltip .icon { display: inline-block; width: 22px; height: 22px; color: #fff; border-radius: 50%; text-align: center; line-height: 22px; font-weight: 900; font-size: 12px; box-shadow: 2px 2px 0 #323232; }
      `}</style>
    </div>
  );
};
