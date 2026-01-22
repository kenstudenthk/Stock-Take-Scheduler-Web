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
      } catch (e) { setIsConnected(false); }
    };
    checkConnection();
  }, [sharePointService]);

  const resetFields = () => {
    setOldPassword('');
    setPassword('');
    setConfirmPassword('');
  };

  const handleAction = (targetMode: 'set' | 'change') => {
    setMode(targetMode);
    setIsFlipped(true);
    resetFields();
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user && user.PasswordHash) {
        if (bcrypt.compareSync(password, user.PasswordHash)) {
          message.success(`歡迎回來，${user.Name}`);
          onLoginSuccess(user);
        } else { message.error("密碼錯誤"); }
      } else { message.error("找不到帳號或尚未設定密碼"); }
    } catch (err) { message.error("連線出錯"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼");
    if (password !== confirmPassword) return message.error("新密碼不符");

    setLoading(true);
    const hide = message.loading("更新中...", 0);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (mode === 'change' && (!user || !bcrypt.compareSync(oldPassword, user.PasswordHash))) {
        throw new Error("舊密碼驗證失敗");
      }
      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      const ok = await sharePointService.updatePasswordByEmail(aliasemail, hash);
      if (ok) {
        message.success("操作成功！");
        setIsFlipped(false);
        resetFields();
      } else { throw new Error("SPO 寫入失敗"); }
    } catch (err: any) { message.error(err.message); }
    finally { hide(); setLoading(false); }
  };

  return (
    <div className="login-viewport-wrapper">
      {/* 連線指示燈 - 修正位置 */}
      <div className="status-indicator">
        <div className="custom-tooltip">
          <div className="icon" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}>i</div>
          <span className="tooltiptext">{isConnected ? "SPO Connected" : "Connection Error"}</span>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            <input type="checkbox" className="hidden-toggle" checked={isFlipped} onChange={(e) => { setIsFlipped(e.target.checked); if(!e.target.checked) setMode('set'); }} />
            <span className="slider-base"></span>
            <span className="side-labels"></span>

            <div className="flip-card-container">
              {/* 正面 */}
              <div className="flip-card-front-side">
                <form className="inner-form" onSubmit={handleLogin}>
                  <div className="text-center">
                    <h2 className="brand-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Inventory System</Text>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="Email" value={aliasemail} onChange={e => setAliasemail(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <button className="main-submit-btn" type="submit" disabled={loading}>Log in</button>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="bottom-link" onClick={() => handleAction('set')}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={() => handleAction('change')}>Forgot? <a>Change Password</a></span>
                  </div>
                </form>
              </div>

              {/* 背面 */}
              <div className="flip-card-back-side">
                <form className="inner-form" onSubmit={handleUpdate}>
                  <div className="text-center">
                    <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
                      {mode === 'change' ? 'Change Pass' : 'Set Pass'}
                    </h2>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" value={aliasemail} onChange={e => setAliasemail(e.target.value)} />
                  </div>
                  {mode === 'change' && (
                    <div className="field-group animate-fade-in">
                      <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
                      <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{ border: '2px solid #3b82f6' }} />
                    </div>
                  )}
                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                  <button className={`main-submit-btn ${mode === 'change' ? 'change-btn' : 'confirm-mode'}`} type="submit">SAVE</button>
                  <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>

      <style>{`
        .login-viewport-wrapper { position: fixed; inset: 0; display: flex; justify-content: center; align-items: flex-start; padding-top: 8vh; background: #f8fafc; }
        .status-indicator { position: absolute; top: 20px; right: 20px; z-index: 999; }
        .main-login-container { width: 380px; position: relative; }
        .card-switch-area { width: 100%; position: relative; }
        .hidden-toggle { display: none; }
        .switch-label { display: block; width: 60px; height: 26px; margin: 0 auto; cursor: pointer; position: relative; }
        .slider-base { position: absolute; inset: 0; background: #fff; border: 2px solid #323232; border-radius: 20px; box-shadow: 3px 3px #323232; transition: 0.3s; }
        .hidden-toggle:checked + .slider-base { background: #58bc82; }
        .side-labels::before { content: 'Log in'; position: absolute; left: -75px; top: 2px; font-weight: 800; font-size: 13px; color: #323232; }
        .side-labels::after { content: 'Security'; position: absolute; right: -85px; top: 2px; font-weight: 800; font-size: 13px; color: #323232; }
        
        .flip-card-container { position: absolute; top: 60px; left: 50%; transform: translateX(-50%); width: 360px; height: 560px; transition: 0.6s; transform-style: preserve-3d; }
        .hidden-toggle:checked ~ .flip-card-container { transform: translateX(-50%) rotateY(180deg); }
        
        .flip-card-front-side, .flip-card-back-side { position: absolute; inset: 0; padding: 30px; backface-visibility: hidden; background: white; border: 2.5px solid #323232; border-radius: 20px; box-shadow: 10px 10px #323232; display: flex; flex-direction: column; }
        .flip-card-back-side { transform: rotateY(180deg); }
        
        .inner-form { display: flex; flex-direction: column; gap: 12px; height: 100%; }
        .brand-title { color: #58bc82; font-weight: 900; font-size: 1.5rem; margin: 0; text-align: center; }
        .field-group { display: flex; flex-direction: column; gap: 4px; }
        .field-label { font-weight: 800; font-size: 0.8rem; color: #58bc82; margin-left: 4px; }
        .inner-form input { padding: 12px; border-radius: 10px; border: 2px solid #323232; background: #f1f5f9; font-weight: 700; }
        .main-submit-btn { padding: 14px; border-radius: 30px; background: #323232; color: #fff; border: none; font-weight: 800; cursor: pointer; margin-top: auto; box-shadow: 4px 4px 0 #000; }
        .change-btn:hover { background: #3b82f6; }
        .confirm-mode:hover { background: #44d8a4; }
        .bottom-link { font-size: 0.8rem; text-align: center; cursor: pointer; font-weight: 600; color: #64748b; }
        .bottom-link a { color: #58bc82; font-weight: 800; text-decoration: underline; }
        
        .custom-tooltip .icon { width: 24px; height: 24px; color: #fff; border-radius: 50%; display: flex; justify-content: center; align-items: center; font-weight: 900; font-size: 14px; border: 2px solid #323232; }
        .tooltiptext { visibility: hidden; position: absolute; right: 30px; top: 0; background: #323232; color: #fff; padding: 5px 10px; border-radius: 4px; font-size: 11px; white-space: nowrap; }
        .custom-tooltip:hover .tooltiptext { visibility: visible; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fadeIn 0.3s forwards; }
      `}</style>
    </div>
  );
};
