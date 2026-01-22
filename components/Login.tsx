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
  const [mode, setMode] = useState<'set' | 'change'>('set'); // ✅ 新增模式切換
  
  const [aliasemail, setAliasemail] = useState('');
  const [oldPassword, setOldPassword] = useState(''); // ✅ 新增舊密碼狀態
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

  // --- 登入邏輯 ---
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aliasemail || !password) return message.warning("請輸入 Alias Email 同密碼");
    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user && user.PasswordHash) {
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        if (isMatch) {
          message.success(`歡迎，${user.Name}`);
          onLoginSuccess(user);
        } else { message.error("密碼錯誤"); }
      } else { message.error("搵唔到帳號或未設定密碼"); }
    } catch (err) { message.error("連線失敗"); }
    finally { setLoading(false); }
  };

  // --- 設定 / 更改密碼邏輯 ---
  const handleConfirmUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼");
    if (password !== confirmPassword) return message.error("兩次輸入的新密碼不符");

    setLoading(true);
    const hide = message.loading("正在驗證並更新 SharePoint...", 0);

    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("搵唔到該帳號");

      // ✅ 如果是 Change 模式，先檢查舊密碼
      if (mode === 'change') {
        const isOldMatch = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldMatch) {
          message.error("舊密碼不正確");
          hide();
          setLoading(false);
          return;
        }
      }

      // ✅ 加密新密碼
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);

      // ✅ Patch 回 SharePoint
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "密碼設定成功！" : "密碼已更新！");
        resetFields();
        setIsFlipped(false);
      } else { message.error("SharePoint 更新失敗"); }
    } catch (err: any) {
      message.error(err.message || "系統錯誤");
    } finally {
      hide();
      setLoading(false);
    }
  };

  const resetFields = () => {
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="login-viewport-wrapper">
      <div className="status-indicator">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <div className="tooltiptext">{isConnected ? "Connection: OK" : "Please update token"}</div>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            <input type="checkbox" className="hidden-toggle" checked={isFlipped} onChange={() => { setIsFlipped(!isFlipped); setMode('set'); resetFields(); }} />
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
                  <div className="flex flex-col gap-1 mt-3">
                    <span className="bottom-link" onClick={() => { setMode('set'); setIsFlipped(true); }}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={() => { setMode('change'); setIsFlipped(true); }}>Secure <a>Change Password</a></span>
                  </div>
                </form>
              </div>

              {/* --- 背面：Set / Change Password --- */}
              <div className="flip-card-back-side">
                <form className="inner-form" onSubmit={handleConfirmUpdatePassword}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
                      {mode === 'change' ? 'Change Password' : 'Set Password'}
                    </h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>{mode === 'change' ? 'Verify & Update' : 'New Credentials'}</Text>
                  </div>

                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="Alias Email" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  {/* ✅ 只在 Change 模式顯示 Old Password */}
                  {mode === 'change' && (
                    <div className="field-group">
                      <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
                      <input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} />
                    </div>
                  )}

                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" placeholder="New Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Confirm New Password</label>
                    <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>

                  <button className={`main-submit-btn ${mode === 'change' ? 'change-btn' : 'confirm-mode'}`} type="submit" disabled={loading}>
                    {mode === 'change' ? 'Update Now' : 'Confirm!'}
                  </button>
                  <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        .login-viewport-wrapper { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: flex-start; padding-top: 5vh; background-color: transparent; }
        .main-login-container { position: relative; display: flex; flex-direction: column; align-items: center; width: 400px; z-index: 10; }
        .hidden-toggle { display: none; }
        .switch-label { position: relative; display: block; width: 50px; height: 22px; cursor: pointer; margin: 0 auto 520px auto; }
        .slider-base { position: absolute; inset: 0; background-color: #fff; border: 2px solid #323232; border-radius: 6px; box-shadow: 3px 3px #323232; transition: 0.3s; }
        .slider-base:before { content: ""; position: absolute; height: 18px; width: 18px; left: -1px; bottom: 1px; background-color: #fff; border: 2px solid #323232; border-radius: 4px; box-shadow: 0 2px 0 #323232; transition: 0.3s; }
        .hidden-toggle:checked + .slider-base { background-color: #58bc82; }
        .hidden-toggle:checked + .slider-base:before { transform: translateX(28px); }
        .side-labels::before, .side-labels::after { position: absolute; color: #323232; font-weight: 800; font-size: 13px; top: 2px; white-space: nowrap; }
        .side-labels::before { content: 'Log in'; left: -80px; text-decoration: underline; }
        .side-labels::after { content: 'Security'; left: 65px; }
        .flip-card-container { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); width: 360px; height: 530px; transition: transform 0.8s; transform-style: preserve-3d; }
        .hidden-toggle:checked ~ .flip-card-container { transform: translateX(-50%) rotateY(180deg); }
        .flip-card-front-side, .flip-card-back-side { position: absolute; width: 100%; height: 100%; padding: 30px; backface-visibility: hidden; background: white; border-radius: 20px; border: 2px solid #323232; box-shadow: 10px 10px #323232; display: flex; flex-direction: column; gap: 12px; }
        .flip-card-back-side { transform: rotateY(180deg); }
        .inner-form { display: flex; flex-direction: column; gap: 0.7rem; width: 100%; }
        .brand-title { color: #58bc82; font-weight: 800; font-size: 1.5rem; margin: 0; }
        .field-group { display: flex; flex-direction: column; gap: 0.2rem; text-align: left; }
        .field-label { color: #58bc82; font-weight: 700; font-size: 0.8rem; margin-left: 5px; }
        .inner-form input { border-radius: 0.8rem; padding: 0.7rem; width: 100%; border: none; background-color: #f8fafc; outline: 2px solid #323232; transition: all 0.2s; font-weight: 600; font-size: 14px; }
        .inner-form input:focus { outline: 2px solid #58bc82; background-color: white; }
        .main-submit-btn { padding: 0.85rem; width: 100%; border-radius: 3rem; background-color: #323232; color: #fff; border: none; cursor: pointer; transition: 0.3s; font-weight: 700; font-size: 1rem; margin-top: 10px; box-shadow: 4px 4px #323232; }
        .main-submit-btn:hover { transform: translate(-2px, -2px); box-shadow: 6px 6px #323232; background-color: #58bc82; }
        .main-submit-btn:active { transform: translate(2px, 2px); box-shadow: 0px 0px #323232; }
        .change-btn:hover { background-color: #3b82f6; }
        .bottom-link { margin-top: 4px; font-size: 0.75rem; color: #666; cursor: pointer; text-align: center; }
        .bottom-link a { color: #58bc82; font-weight: 700; text-decoration: underline; }
        .status-indicator { position: absolute; top: 16px; right: 16px; z-index: 100; }
        .custom-tooltip { position: relative; display: inline-block; cursor: pointer; }
        .tooltiptext { visibility: hidden; width: 160px; background-color: #333; color: #fff; text-align: center; border-radius: 5px; padding: 8px; position: absolute; z-index: 100; top: 130%; left: 50%; margin-left: -140px; opacity: 0; transition: opacity 0.3s; font-size: 10px; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; opacity: 1; }
        .custom-tooltip .icon { display: inline-block; width: 20px; height: 20px; color: #fff; border-radius: 50%; text-align: center; line-height: 20px; font-weight: bold; font-size: 11px; }
      `}</style>
    </div>
  );
};
