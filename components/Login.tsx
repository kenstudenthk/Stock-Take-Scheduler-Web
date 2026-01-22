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

  // ✅ 核心修正：統一處理翻轉與模式設定，避免狀態競爭
  const switchMode = (newMode: 'set' | 'change') => {
    setMode(newMode);
    setIsFlipped(true);
    resetFields();
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
        } else { message.error("密碼不正確"); }
      } else if (user && !user.PasswordHash) {
        message.info("此帳號尚未設定密碼，請先設定。");
        switchMode('set');
      } else { message.error("搵唔到帳號"); }
    } catch (err) { message.error("連線失敗"); }
    finally { setLoading(false); }
  };

  const handleSecurityAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼");
    if (password !== confirmPassword) return message.error("兩次輸入的新密碼不符");

    setLoading(true);
    const hide = message.loading("正在加密並同步至 SharePoint...", 0);

    try {
      // 1. 先獲取最新的用戶 Hash
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("用戶不存在，請聯絡管理員");

      // 2. 如果是 Change 模式，需比對舊密碼
      if (mode === 'change') {
        const isOldValid = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldValid) throw new Error("舊密碼驗證失敗");
      }

      // 3. ✅ 生成新加密字串 (Patch Back to SPO)
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);
      
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "密碼設定成功！" : "密碼更改成功！");
        setIsFlipped(false);
        resetFields();
      } else {
        throw new Error("SharePoint 寫入失敗");
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
          <div className="tooltiptext">{isConnected ? "SPO Connection: OK" : "Connection Error"}</div>
        </div>
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          <label className="switch-label">
            <input 
              type="checkbox" 
              className="hidden-toggle" 
              checked={isFlipped} 
              onChange={(e) => { 
                setIsFlipped(e.target.checked);
                // ✅ 關鍵：翻回正面時重置為 set，但翻轉動作由按鈕主導
                if(!e.target.checked) setMode('set');
                resetFields();
              }} 
            />
            <span className="slider-base"></span>
            <span className="side-labels"></span>

            <div className="flip-card-container">
              {/* 正面 */}
              <div className="flip-card-front-side">
                <form className="inner-form" onSubmit={handleLogin}>
                  <div className="text-center">
                    <h2 className="brand-title">Team Login</h2>
                    <Text type="secondary" style={{ fontSize: '11px' }}>Inventory Management</Text>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" placeholder="Alias Email" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Password</label>
                    <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <button className="main-submit-btn" type="submit" disabled={loading}>LOG IN</button>
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="bottom-link" onClick={() => switchMode('set')}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={() => switchMode('change')}>Forgot? <a>Change Password</a></span>
                  </div>
                </form>
              </div>

              {/* 背面 */}
              <div className="flip-card-back-side">
                <form className="inner-form" onSubmit={handleSecurityAction}>
                  <div className="text-center">
                    <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
                      {mode === 'change' ? 'Change Password' : 'Set Password'}
                    </h2>
                  </div>
                  <div className="field-group">
                    <label className="field-label">Alias Email</label>
                    <input type="text" value={aliasemail} onChange={(e) => setAliasemail(e.target.value)} />
                  </div>

                  {mode === 'change' && (
                    <div className="field-group animate-fade-in">
                      <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
                      <input type="password" placeholder="Verify Old Password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} style={{ border: '2px solid #3b82f6' }} />
                    </div>
                  )}

                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                  <button className={`main-submit-btn ${mode === 'change' ? 'change-mode-btn' : ''}`} type="submit" disabled={loading}>
                    {mode === 'change' ? 'UPDATE NOW' : 'SAVE CREDENTIALS'}
                  </button>
                  <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                </form>
              </div>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
