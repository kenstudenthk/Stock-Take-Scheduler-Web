import React, { useState, useEffect } from 'react';
import { message, Typography } from 'antd';
import bcrypt from 'bcryptjs';

const { Text } = Typography;

interface LoginProps {
  onLoginSuccess: (user: any) => void;
  sharePointService: any;
  onNavigateToSettings: () => void;
}

type Mode = 'set' | 'change' | 'register';

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, sharePointService, onNavigateToSettings }) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [mode, setMode] = useState<Mode>('set');

  // --- 基礎狀態 (登入與密碼變更) ---
  const [aliasemail, setAliasemail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // --- 🆕 註冊專用狀態 ---
  const [name, setName] = useState('');
  const [userEmailPrefix, setUserEmailPrefix] = useState('');
  const [aliasEmailPrefix, setAliasEmailPrefix] = useState('');

  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  // 檢查 SharePoint 連線狀態
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
    setName('');
    setUserEmailPrefix('');
    setAliasEmailPrefix('');
  };

  const handleModeSwitch = (e: React.MouseEvent, targetMode: Mode) => {
    e.preventDefault();
    e.stopPropagation();
    setMode(targetMode);
    setIsFlipped(true);
    resetFields();
  };

  // --- 處理登入 ---
  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aliasemail || !password) return message.warning("Please input Alias Email and Password");

    setLoading(true);
    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (user && user.PasswordHash) {
        const isMatch = bcrypt.compareSync(password, user.PasswordHash);
        if (isMatch) {
          message.success(`Welcome back, ${user.Name}`);
          onLoginSuccess(user);
        } else {
          message.error("Incorrect password");
        }
      } else if (user && !user.PasswordHash) {
        message.info("Account found, but no password set. Please use 'Set Password'.");
        setMode('set');
        setIsFlipped(true);
      } else {
        message.error("Account not found. Please register first.");
      }
    } catch (err) {
      message.error("Connection failed");
    } finally {
      setLoading(false);
    }
  };

  // --- 🆕 處理註冊帳號 ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !userEmailPrefix || !aliasEmailPrefix || !password || !confirmPassword) {
      return message.warning("Please fill in all registration fields");
    }
    if (password !== confirmPassword) {
      return message.error("New passwords do not match");
    }

    setLoading(true);
    const hide = message.loading("Creating your account...", 0);

    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      
      const fullUserEmail = `${userEmailPrefix}@corpq.hk.pccw.com`;
      const fullAliasEmail = `${aliasEmailPrefix}@pccw.com`;

      const success = await sharePointService.registerNewMember({
        name,
        userEmail: fullUserEmail,
        aliasEmail: fullAliasEmail,
        passwordHash: hash
      });

      if (success) {
        message.success("Account created successfully! You can now log in.");
        setIsFlipped(false);
        setAliasemail(fullAliasEmail); // 自動填入註冊後的 ID
      } else {
        message.error("Registration failed. Email might already exist.");
      }
    } catch (err) {
      message.error("System error during registration");
    } finally {
      hide();
      setLoading(false);
    }
  };

  // --- 處理設置/更改密碼 ---
  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aliasemail || !password || !confirmPassword) return message.warning("Please fill all fields");
    if (password !== confirmPassword) return message.error("New passwords do not match");

    setLoading(true);
    const hide = message.loading("Syncing with SharePoint...", 0);

    try {
      const user = await sharePointService.getUserByAliasEmail(aliasemail);
      if (!user) throw new Error("Account not found");

      if (mode === 'change') {
        if (!user.PasswordHash) throw new Error("No password previously set");
        const isOldValid = bcrypt.compareSync(oldPassword, user.PasswordHash);
        if (!isOldValid) throw new Error("Old password verification failed");
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(password, salt);
      const success = await sharePointService.updatePasswordByEmail(aliasemail, newHash);

      if (success) {
        message.success(mode === 'set' ? "Password set successfully!" : "Password updated!");
        resetFields();
        setIsFlipped(false);
      } else {
        throw new Error("SharePoint update failed");
      }
    } catch (err: any) {
      message.error(err.message || "System error");
    } finally {
      hide();
      setLoading(false);
    }
  };

  // --- 背面表單渲染 (Register / Set / Change) ---
  const renderBackSideForm = () => {
    if (mode === 'register') {
      return (
        <form className="inner-form" onSubmit={handleRegister}>
          <div className="text-center">
            <h2 className="brand-title" style={{ color: '#0d9488' }}>Account Create</h2>
            <Text type="secondary" style={{ fontSize: '10px' }}>Join Bonnie's Team members</Text>
          </div>
          <div className="form-content-area" style={{ gap: '6px', marginTop: '10px' }}>
            <div className="field-group">
              <label className="field-label">Full Name</label>
              <input type="text" placeholder="e.g. Kilson Li" value={name} onChange={e => setName(e.target.value)} />
            </div>
            
            <div className="field-group">
              <label className="field-label">User Email (@corpq.hk.pccw.com)</label>
              <div className="flex items-center gap-1">
                <input style={{ flex: 1 }} type="text" placeholder="0200XXXX" value={userEmailPrefix} onChange={e => setUserEmailPrefix(e.target.value)} />
                <span className="text-[9px] font-bold text-slate-400">@corpq...</span>
              </div>
            </div>

            <div className="field-group">
              <label className="field-label">Alias Email (Login ID)</label>
              <div className="flex items-center gap-1">
                <input style={{ flex: 1 }} type="text" placeholder="kilson.km.li" value={aliasEmailPrefix} onChange={e => setAliasEmailPrefix(e.target.value)} />
                <span className="text-[9px] font-bold text-slate-400">@pccw.com</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="field-group">
                <label className="field-label">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="field-group">
                <label className="field-label">Confirm</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
              </div>
            </div>
          </div>
          <button className="main-submit-btn" type="submit" disabled={loading} style={{ background: '#0d9488', marginTop: '15px' }}>
            CREATE ACCOUNT
          </button>
          <div className="bottom-link">
            <span onClick={() => setIsFlipped(false)}>Already a member? <a>Log in</a></span>
          </div>
        </form>
      );
    }

    return (
      <form className="inner-form" onSubmit={handleConfirmAction}>
        <div className="text-center">
          <h2 className="brand-title">{mode === 'set' ? 'Set Password' : 'Change Password'}</h2>
        </div>
        <div className="form-content-area">
          <div className="field-group">
            <label className="field-label">Alias Email</label>
            <input type="text" placeholder="kilson.km.li@pccw.com" value={aliasemail} onChange={e => setAliasemail(e.target.value)} />
          </div>

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
          <span onClick={() => setIsFlipped(false)}>Back to <a>Log in</a></span>
        </div>
      </form>
    );
  };

  return (
    <div className="login-viewport-wrapper" onClick={(e) => e.stopPropagation()}>
      <div className="status-indicator">
        <div className="status-circle" style={{ backgroundColor: isConnected ? '#4caf50' : '#f44336' }} />
        {!isConnected && (
          <span className="status-error-text animate-fade-in cursor-pointer" onClick={onNavigateToSettings}>
            Please update Token in Settings
          </span>
        )}
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
                <div className="flex justify-between w-full px-2">
                  <span className="bottom-link text-[10px]" onClick={(e) => handleModeSwitch(e, 'set')}>First time? <a>Set Password</a></span>
                  <span className="bottom-link text-[10px]" onClick={(e) => handleModeSwitch(e, 'change')}>Forgot? <a>Change Password</a></span>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 w-full text-center">
                  <span className="bottom-link" onClick={(e) => handleModeSwitch(e, 'register')}>
                    Not Bonnie's Team members? <a>Create Account</a>
                  </span>
                </div>
              </div>
            </form>
          </div>

          {/* --- Back: Security / Register --- */}
          <div className="flip-card-back-side">
            {renderBackSideForm()}
          </div>
        </div>
      </div>
    </div>
  );
};