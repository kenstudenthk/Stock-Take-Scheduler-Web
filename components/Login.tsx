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

  const resetFields = () => {
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aliasemail || !password) return message.warning("請輸入 Alias Email 同密碼");
    
    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user && user.PasswordHash) {
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        if (isMatch) {
          message.success(`歡迎回來，${user.Name}`);
          onLoginSuccess(user);
        } else {
          message.error("密碼不正確");
        }
      } else if (user && !user.PasswordHash) {
        message.info("此帳號尚未設定密碼");
        setMode('set');
        setIsFlipped(true);
      } else {
        message.error("搵唔到此帳號");
      }
    } catch (err) {
      message.error("連線失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼");
    if (password !== confirmPassword) return message.error("兩次輸入的新密碼不符");

    setLoading(true);
    const hide = message.loading("正在同步至 SharePoint...", 0);

    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("找不到用戶");

      if (mode === 'change') {
        const isOldMatch = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldMatch) throw new Error("舊密碼驗證失敗");
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "設定成功！" : "更新成功！");
        resetFields();
        setIsFlipped(false);
      } else {
        throw new Error("SPO 寫入失敗");
      }
    } catch (err: any) {
      message.error(err.message || "發生錯誤");
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
          <div className="tooltiptext">{isConnected ? "SPO: OK" : "Token Error"}</div>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            <input type="checkbox" className="hidden-toggle" checked={isFlipped} onChange={() => { setIsFlipped(!isFlipped); setMode('set'); resetFields(); }} />
            <span className="slider-base"></span>
            <span className="side-labels"></span>

            <div className="flip-card-container">
              {/* 正面 */}
              <div className="flip-card-front-side">
                <form className="inner-form" onSubmit={handleLogin}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Inventory Management</Text>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="Alias Email" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <button className="main-submit-btn" type="submit" disabled={loading}>Log in</button>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="bottom-link" onClick={() => { setMode('set'); setIsFlipped(true); resetFields(); }}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={() => { setMode('change'); setIsFlipped(true); resetFields(); }}>Forgot? <a>Change Password</a></span>
                  </div>
                </form>
              </div>

              {/* 背面 */}
              <div className="flip-card-back-side">
                <form className="inner-form" onSubmit={handleConfirmUpdatePassword}>
                  <div className="text-center mb-1">
                    <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
                      {mode === 'change' ? 'Change Password' : 'Set Password'}
                    </h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Verify & Update Credentials</Text>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>
                  {mode === 'change' && (
                    <div className="field-group animate-fade-in">
                      <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
                      <input type="password" placeholder="Current Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ border: '2px solid #3b82f6' }} />
                    </div>
                  )}
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <button className={`main-submit-btn ${mode === 'change' ? 'change-btn' : 'confirm-mode'}`} type="submit">
                    {mode === 'change' ? 'UPDATE NOW' : 'SAVE PASSWORD'}
                  </button>
                  <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        .login-viewport-wrapper { position: relative; width: 100%; height: 100%; display: flex; justify-content: center; align-items: flex-start; padding-top: 5vh; }
        .main-login-container { position: relative; width: 400px; z-index: 10; }
        .hidden-toggle { display: none; }
        .switch-label { position: relative; display: block; width: 50px; height: 22px; cursor: pointer; margin: 0 auto 580px auto; }
        .slider-base { position: absolute; inset: 0; background: #fff; border: 2.5px solid #323232; border-radius: 6px; box-shadow: 4px 4px #323232; transition: 0.3s; }
        .slider-base:before { content: ""; position: absolute; height: 18px; width: 18px; left: -1px; bottom: 1px; background: #fff; border: 2px solid #323232; border-radius: 4px; transition: 0.3s; }
        .hidden-toggle:checked + .slider-base { background: #58bc82; }
        .hidden-toggle:checked + .slider-base:before { transform: translateX(28px); }
        .side-labels::before, .side-labels::after { position: absolute; color: #323232; font-weight: 900; font-size: 13px; top: 2px; }
        .side-labels::before { content: 'Log in'; left: -85px; text-decoration: underline; }
        .side-labels::after { content: 'Security'; left: 68px; }
        .flip-card-container { position: absolute; top: 50px; left: 50%; transform: translateX(-50%); width: 380px; height: 580px; transition: transform 0.8s; transform-style: preserve-3d; }
        .hidden-toggle:checked ~ .flip-card-container { transform: translateX(-50%) rotateY(180deg); }
        .flip-card-front-side, .flip-card-back-side { position: absolute; width: 100%; height: 100%; padding: 35px; backface-visibility: hidden; background: white; border-radius: 25px; border: 2.5px solid #323232; box-shadow: 12px 12px #323232; display: flex; flex-direction: column; gap: 15px; }
        .flip-card-back-side { transform: rotateY(180deg); min-height: 580px; justify-content: space-between; }
        .inner-form { display: flex; flex-direction: column; gap: 0.8rem; width: 100%; }
        .brand-title { color: #58bc82; font-weight: 900; font-size: 1.6rem; margin: 0; text-transform: uppercase; }
        .field-group { display: flex; flex-direction: column; gap: 0.3rem; text-align: left; }
        .field-label { color: #58bc82; font-weight: 800; font-size: 0.85rem; }
        .inner-form input { border-radius: 0.8rem; padding: 0.9rem; width: 100%; border: none; background: #f1f5f9; outline: 2px solid #323232; font-weight: 700; }
        .main-submit-btn { padding: 0.9rem; width: 100%; border-radius: 3rem; background: #323232; color: #fff; border: none; cursor: pointer; font-weight: 800; box-shadow: 4px 4px #323232; margin-top: 10px; }
        .change-btn:hover { background: #3b82f6; }
        .confirm-mode:hover { background: #44d8a4; }
        .bottom-link { font-size: 0.8rem; cursor: pointer; text-align: center; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `}</style>
    </div>
  );
};
