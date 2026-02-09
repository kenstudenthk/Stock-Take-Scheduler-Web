import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { message, Button, Tag, Avatar, Space, Typography, ConfigProvider } from 'antd'; 
import { 
  SyncOutlined, 
  WarningFilled,
  KeyOutlined 
} from '@ant-design/icons';

import { Layout } from './components/Layout';
import { SP_FIELDS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { Locations } from './components/Locations';
import { Settings } from './components/Settings';
import { Shop, View, User, hasAdminAccess } from './types';
import { ShopList } from './components/ShopList';
import { Generator } from './components/Generator';
import { Inventory } from './components/Inventory';
import { Permission } from './components/Permission';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorReport } from './components/ErrorReport';
import { Login } from './components/Login';
import SharePointService from './services/SharePointService';
import { TokenService } from './services/TokenService';

// ✅ 使用你的 config.ts，避免硬編碼 URL
import { API_URLS, TOKEN_CONFIG } from './constants/config'; 
import './index.css';

const { Text } = Typography;

// 貨車通知組件 (保留你原始的設計)
const TruckFlagNotice: React.FC = () => (
  <div className="truck-header-container">
    <div className="truck-flag-walker">
      <div className="truck-notice-flag">
        <WarningFilled /> TOKEN EXPIRED: UPDATE IN SETTINGS
      </div>
      <div className="truck-wrapper-mini">
        <div className="truckBody-anim">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 198 93" style={{ width: '130px' }}>
            <path strokeWidth="3" stroke="#282828" fill="#F83D3D" d="M135 22.5H177.264C178.295 22.5 179.22 23.133 179.594 24.0939L192.33 56.8443C192.442 57.1332 192.5 57.4404 192.5 57.7504V89C192.5 90.3807 191.381 91.5 190 91.5H135C133.619 91.5 132.5 90.3807 132.5 89V25C132.5 23.6193 133.619 22.5 135 22.5Z"></path>
            <path strokeWidth="3" stroke="#282828" fill="#7D7C7C" d="M146 33.5H181.741C182.779 33.5 183.709 34.1415 184.078 35.112L190.538 52.112C191.16 53.748 189.951 55.5 188.201 55.5H146C144.619 55.5 143.5 54.3807 143.5 53V36C143.5 34.6193 144.619 33.5 146 33.5Z"></path>
            <rect strokeWidth="3" stroke="#282828" fill="#DFDFDF" rx="2.5" height="90" width="121" y="1.5" x="6.5"></rect>
          </svg>
        </div>
        <div className="flex justify-between w-[130px] px-4 absolute bottom-0">
           <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#282828" stroke="#282828" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="#DFDFDF"/></svg>
           <svg width="24" height="24"><circle cx="12" cy="12" r="10" fill="#282828" stroke="#282828" strokeWidth="2"/><circle cx="12" cy="12" r="5" fill="#DFDFDF"/></svg>
        </div>
        <div className="truck-road"></div>
      </div>
    </div>
  </div>
);

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');
  
  // ✅ 修正：統一使用 config.ts 中的 Storage Keys
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem(TOKEN_CONFIG.storageKeys.graphToken) || '');
  
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasTokenError, setHasTokenError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  
  // ✅ 使用 User 型別
  const [currentUser, setCurrentUser] = useState<User | null>(JSON.parse(sessionStorage.getItem('currentUser') || 'null'));

  const sharePointService = useMemo(() => new SharePointService(graphToken), [graphToken]);

  // Cloudflare Token Auto-Sync
  useEffect(() => {
    const syncToken = async () => {
      const remoteToken = await TokenService.fetchRemoteToken();
      if (remoteToken && remoteToken !== graphToken) {
        console.log("🔄 Syncing token from cloud...");
        updateGraphToken(remoteToken, false); // Don't broadcast again if fetching from remote
      }
    };
    
    // Initial sync
    syncToken();

    // Optional: Poll every 5 minutes to keep token fresh if updated by someone else
    const interval = setInterval(syncToken, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []); // Run once on mount

  // 核心抓取資料函式
  const fetchAllData = useCallback(async (token: string) => {
    if (!token) {
      setHasTokenError(true);
      setIsInitialLoading(false);
      return;
    }
    setLoading(true);
    try {
      // ✅ 使用 API_URLS
      const url = `${API_URLS.shopList}/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { 
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Prefer': 'HonorNonIndexedQueriesWarningMayFail' 
        } 
      });

      if (res.status === 401) {
        setHasTokenError(true);
        message.error("Session expired. Please update Token in Settings.");
      } else if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      } else {
        const data = await res.json();
        if (data.value) {
          const mapped = data.value.map((item: any) => {
            const f = item.fields || {};
            return {
              sharePointItemId: item.id,
              id: f[SP_FIELDS.SHOP_CODE] || item.id,
              name: f[SP_FIELDS.SHOP_NAME] || '',
              brand: f[SP_FIELDS.BRAND] || '',
              address: f[SP_FIELDS.ADDRESS_ENG] || '',
              region: f[SP_FIELDS.REGION] || '',
              district: f[SP_FIELDS.DISTRICT] || '',
              area: f[SP_FIELDS.AREA] || '',
              status: f[SP_FIELDS.STATUS] || 'Unplanned',
              masterStatus: f[SP_FIELDS.OLD_STATUS] || '', 
              scheduledDate: f[SP_FIELDS.SCHEDULE_DATE] || '',
              groupId: parseInt(f[SP_FIELDS.SCHEDULE_GROUP] || "0"),
              is_mtr: f[SP_FIELDS.MTR] === 'Yes',
              latitude: parseFloat(f[SP_FIELDS.LATITUDE] || '0'),
              longitude: parseFloat(f[SP_FIELDS.LONGITUDE] || '0'),
              businessUnit: f[SP_FIELDS.BUSINESS_UNIT] || '',
              brandIcon: f[SP_FIELDS.BRAND_ICON] || '',
              phone: f[SP_FIELDS.PHONE] || '',
              contactName: f[SP_FIELDS.CONTACT] || '',
            } as Shop;
          });
          setAllShops(mapped);
          setHasTokenError(false); // ✅ 成功後務必清除錯誤狀態
        }
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setHasTokenError(true);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  // ✅ 核心修正：更新 Token 後「立即」使用傳入的值呼叫 fetch
  const updateGraphToken = async (token: string, broadcast = true) => {
    const trimmedToken = token.trim();
    setGraphToken(trimmedToken);
    localStorage.setItem(TOKEN_CONFIG.storageKeys.graphToken, trimmedToken);
    
    if (trimmedToken) {
      // Broadcast to Cloudflare if user manually updated it
      if (broadcast) {
        await TokenService.broadcastToken(trimmedToken);
        message.success("Token updated & synced to cloud!");
      }

      setHasTokenError(false); // ✅ 先隱藏卡車警告
      fetchAllData(trimmedToken); // ✅ 立即刷新
    } else {
      setHasTokenError(true);
      setAllShops([]);
    }
  };

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // 初次載入與 currentUser 變更時刷新
  useEffect(() => { 
    if (graphToken) {
      fetchAllData(graphToken); 
    } else {
      setHasTokenError(true);
      setIsInitialLoading(false);
    }
  }, [fetchAllData, graphToken]); // ✅ 加入 graphToken 作為依賴

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    message.info("Logged out successfully");
  };

  const renderContent = () => {
    if (selectedMenuKey === View.SETTINGS) {
      return <Settings token={graphToken} onUpdateToken={updateGraphToken} onLogout={handleLogout} />;
    }

    if (!currentUser) return null;

    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} onUpdateShop={undefined} currentUser={currentUser} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} currentUser={currentUser} />;
      case View.CALENDAR: return (
        <Calendar
          shops={allShops}
          graphToken={graphToken}
          onRefresh={() => fetchAllData(graphToken)}
        />
      );
      case View.GENERATOR: return <Generator shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} currentUser={currentUser} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.INVENTORY: return <Inventory token={graphToken} shops={allShops} />;
      case View.PERMISSION: return <Permission graphToken={graphToken} currentUser={currentUser} />;
      default: return null;
    }
  };

return (
  <ConfigProvider theme={{ token: { colorPrimary: '#05043e', borderRadius: 8 } }}>
    <Layout 
      onLogout={handleLogout} 
      user={currentUser} 
      onViewChange={(key: View) => setSelectedMenuKey(key)}
      currentView={selectedMenuKey}
      onReportError={() => setReportModalVisible(true)}
    >
      {!currentUser && selectedMenuKey !== View.SETTINGS ? (
        <Login 
          sharePointService={sharePointService} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
            // ✅ 登入成功後再次檢查資料
            if (graphToken) fetchAllData(graphToken);
          }}
          onNavigateToSettings={() => setSelectedMenuKey(View.SETTINGS)}
        />
      ) : (
        <>
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100 mobile-header-stack">
            <div className="flex items-center gap-4">
              {!isInitialLoading && hasTokenError && !loading && <TruckFlagNotice />}
              <Button 
                icon={<SyncOutlined spin={loading} />} 
                onClick={() => fetchAllData(graphToken)}
                className="hover:border-[#05043e] hover:text-[#05043e]"
                loading={loading}
              >
                Refresh Data
              </Button>
              <Tag color="cyan" className="font-bold">POOL: {allShops.length}</Tag>
            </div>

            <div className="flex items-center gap-3">
              <ThemeToggle isDark={isDarkMode} onToggle={setIsDarkMode} />
              {currentUser ? (
                <Space>
                  <div className="text-right hidden sm:block">
                    <div className="text-[12px] font-bold text-[#05043e]">{currentUser.Name}</div>
                    <div className="text-[10px] text-gray-400 uppercase">{currentUser.UserRole}</div>
                  </div>
                  <Avatar src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.Name}`} />
                </Space>
              ) : (
                <Tag color="orange">GUEST (SETUP MODE)</Tag>
              )}
            </div>
          </div>
          {renderContent()}
        </>
      )}
    </Layout>
    <ErrorReport visible={reportModalVisible} onCancel={() => setReportModalVisible(false)} token={graphToken} />
  </ConfigProvider>
);
}

export default App;