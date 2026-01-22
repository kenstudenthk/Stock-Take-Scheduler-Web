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

  // ✅ 修復 1：手動模式切換，避免事件冒泡干擾
const handleModeSwitch = (e: React.MouseEvent, targetMode: 'set' | 'change') => {
  e.preventDefault(); 
  e.stopPropagation(); // 阻止冒泡，防止觸發外層 checkbox
  setMode(targetMode);
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
        message.info("此帳號尚未設定密碼，請先點擊下方 Set Password。");
        setMode('set');
        setIsFlipped(true);
      } else { message.error("找不到此 Alias Email 帳號"); }
    } catch (err) { message.error("連線失敗"); }
    finally { setLoading(false); }
  };

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("請填寫所有欄位");
    if (mode === 'change' && !oldPassword) return message.warning("請輸入舊密碼驗證");
    if (password !== confirmPassword) return message.error("新密碼輸入不一致");

    setLoading(true);
    const hide = message.loading("正在安全同步至 SharePoint...", 0);

    try {
      // 1. 抓取用戶
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("找不到該 Email 帳號，請聯絡 Admin");

      // 2. 驗證舊密碼 (僅 Change 模式)
      if (mode === 'change') {
        if (!user.PasswordHash) throw new Error("此帳號未設定過密碼");
        const isOldValid = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldValid) throw new Error("舊密碼驗證失敗");
      }

      // 3. ✅ 加密並執行 Patch (調用 SharePointService)
      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "密碼設定成功！" : "密碼已更新！");
        resetFields();
        setIsFlipped(false);
      } else {
        throw new Error("SharePoint 寫入失敗");
      }
    } catch (err: any) {
      message.error(err.message || "系統錯誤");
    } finally {
      hide();
      setLoading(false);
    }
  };

 return (
    <div className="login-viewport-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="status-indicator">
        <div 
          className="status-circle" 
          style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }}
        />
        {!isConnected && 
          <span className="status-error-text animate-fade-in">
            Please go Setting update Token
          </span>
        }
      </div>

      <div className="main-login-container">
        <div className="card-switch-area">
          {/* ✅ 修正：移除外層 label 的 cursor:pointer，避免干擾內部點擊 */}
          <label className="switch-label">
            <input 
              type="checkbox" 
              className="hidden-toggle" 
              checked={isFlipped} 
              onChange={(e) => { 
                setIsFlipped(e.target.checked);
                if (!e.target.checked) setMode('set'); 
                resetFields();
              }} 
            />
            <span className="slider-base"></span>
            <span className="side-labels"></span>
            </label>
        </div>

     <div className={`flip-card-container ${isFlipped ? 'is-flipped' : ''}`}>
          {/* --- Front: Log In --- */}
          <div className="flip-card-front-side">
            <form className="inner-form" onSubmit={handleLogin}>
              <div className="text-center">
                <h2 className="brand-title">Team Login</h2>
                <Text type="secondary" style={{ fontSize: '11px' }}>Stock Take Scheduler</Text>
              </div>
                 <div className="form-content-area">
                    <div className="field-group">
                      <label className="field-label">Alias Email</label>
                      <input type="text" placeholder="kilson.km.li@pccw.com" value={aliasemail} onChange={e => setAliasemail(e.target.value)} />
                    </div>
                    <div className="field-group">
                      <label className="field-label">Password</label>
                      <input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                  </div>
                  <button className="main-submit-btn" type="submit" disabled={loading}>LOG IN</button>
                  <div className="bottom-link-group">
                    <span className="bottom-link" onClick={(e) => handleModeSwitch(e, 'set')}>First time? <a>Set Password</a></span>
                    <span className="bottom-link" onClick={(e) => handleModeSwitch(e, 'change')}>Forgot? <a>Change Password</a></span>
                  </div>
                </form>
              </div>

              {/* --- 背面：Security --- */}
              <div className="flip-card-back-side" onClick={(e) => e.stopPropagation()}>
                <form className="inner-form" onSubmit={handleConfirmAction}>
                  <div className="text-center">
                    <h2 className="brand-title" style={{ color: mode === 'change' ? '#3b82f6' : '#44d8a4' }}>
                      {mode === 'change' ? 'Change Password' : 'Set Password'}
                    </h2>
                  </div>
                  <div className="form-content-area">
                    <div className="field-group">
                      <label className="field-label">Alias Email</label>
                      <input type="text" value={aliasemail} onChange={e => setAliasemail(e.target.value)} />
                    </div>

                  {/* ✅ 正確渲染 Old Password */}
                  {mode === 'change' && (
                    <div className="field-group animate-fade-in">
                      <label className="field-label" style={{ color: '#3b82f6' }}>Old Password</label>
                      <input type="password" placeholder="Verify Old Password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} style={{ border: '2px solid #3b82f6' }} />
                    </div>
                  )}

                  <div className="field-group">
                    <label className="field-label">New Password</label>
                    <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  <div className="field-group">
                    <label className="field-label">Confirm New Password</label>
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                  </div>
                    </div>
                  <button className={`main-submit-btn ${mode === 'change' ? 'change-mode-hover' : ''}`} type="submit" disabled={loading}>
                    {mode === 'change' ? 'UPDATE NOW' : 'SAVE CREDENTIALS'}
                  </button>
                  <div className="bottom-link">
                    <span className="bottom-link" onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
                   </div>
                </form>
              </div>
            </div>
          
        </div>
      </div>
   
  );
};
