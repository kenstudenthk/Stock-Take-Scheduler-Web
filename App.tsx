import React, { useState, useEffect, useCallback, useMemo } from 'react';
// ✅ Ensure ConfigProvider is included here
import { message, Button, Tag, Avatar, Space, Typography, ConfigProvider } from 'antd'; 
import { 
  SyncOutlined, 
  WarningFilled 
} from '@ant-design/icons';
// ✅ Use your custom Layout instead of Ant Design's Layout
import { Layout } from './components/Layout';
import { SP_FIELDS } from './constants';
import { Dashboard } from './components/Dashboard';
import { Calendar } from './components/Calendar';
import { Locations } from './components/Locations';
import { Settings } from './components/Settings'; 
import { Shop, View } from './types';
import { ShopList } from './components/ShopList';
import { Generator } from './components/Generator';
import { Inventory } from './components/Inventory';
import { ThemeToggle } from './components/ThemeToggle';
import { ErrorReport } from './components/ErrorReport'; 
import { Login } from './components/Login';
import SharePointService from './services/SharePointService';
import './index.css';

//const { Content, Header, Sider } = Layout;
const { Text } = Typography;

// 權限檢查工具
const hasAdminAccess = (user: any) => {
  if (!user) return false;
  const role = user.UserRole;
  return role === 'Admin' || role === 'App Owner';
};

// 貨車通知組件
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
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasTokenError, setHasTokenError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(JSON.parse(sessionStorage.getItem('currentUser') || 'null'));

  const sharePointService = useMemo(() => new SharePointService(graphToken), [graphToken]);

  const fetchAllData = useCallback(async (token: string) => {
    if (!token) {
      setHasTokenError(true);
      setIsInitialLoading(false);
      return;
    }
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.status === 401) {
        setHasTokenError(true);
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
            };
          });
          setAllShops(mapped);
          setHasTokenError(false);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  const updateGraphToken = (token: string) => {
    setGraphToken(token);
    localStorage.setItem('stockTakeToken', token);
    if (token) {
      setHasTokenError(false);
      fetchAllData(token);
    }
  };

  const updateInvToken = (token: string) => {
    setInvToken(token);
    localStorage.setItem('stockTakeInvToken', token);
  };

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => { 
    const savedToken = localStorage.getItem('stockTakeToken');
    if (savedToken) fetchAllData(savedToken); 
    else {
      setHasTokenError(true);
      setIsInitialLoading(false);
    }
  }, [fetchAllData]);

  const handleLogout = () => {
    setCurrentUser(null);
    sessionStorage.removeItem('currentUser');
    message.info("Logged out successfully");
  };

  const renderContent = () => {
    if (selectedMenuKey === View.SETTINGS) {
      return (
        <Settings 
          token={graphToken} 
          onUpdateToken={updateGraphToken} 
          invToken={invToken} 
          onUpdateInvToken={updateInvToken} 
        />
      );
    }

    if (!currentUser) return null; // Logic handled in return block
    
    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} onUpdateShop={undefined} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.GENERATOR: return <Generator shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.INVENTORY: return <Inventory invToken={invToken} shops={allShops} />;
      default: return null;
    }
  };

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#05043e',
          borderRadius: 8,
        },
      }}
    >
      {/* 1. Login Logic: Only show Login if no user and not on Settings page */}
      {!currentUser && selectedMenuKey !== View.SETTINGS ? (
        <Login 
          sharePointService={sharePointService} 
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            sessionStorage.setItem('currentUser', JSON.stringify(user));
          }} 
        />
      ) : (
        /* 2. Main Application: Wrapped in the new Tooltip Sidebar Layout */
        /* ✅ Passing the setSelectedMenuKey allows the sidebar to change views */
        <Layout 
          onLogout={handleLogout} 
          user={currentUser} 
          onViewChange={(key: View) => setSelectedMenuKey(key)}
          currentView={selectedMenuKey}
          onReportError={() => setReportModalVisible(true)}
        >
          
          {/* Top Toolbar: Refactored Header content */}
          <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              {/* Truck Alert for Token Errors */}
              {!isInitialLoading && hasTokenError && !loading && <TruckFlagNotice />}
              
              <Button 
                icon={<SyncOutlined spin={loading} />} 
                onClick={() => fetchAllData(graphToken)}
                className="hover:border-[#05043e] hover:text-[#05043e]"
              >
                Refresh Data
              </Button>
              <Tag color="cyan" className="font-bold">POOL: {allShops.length}</Tag>
            </div>

            <div className="flex items-center gap-3">
              {currentUser ? (
                <>
                  <div className="text-right hidden sm:block">
                    <div className="text-[12px] font-bold text-[#05043e]">{currentUser.Name}</div>
                    <div className="text-[10px] text-gray-400 uppercase">{currentUser.UserRole}</div>
                  </div>
                  <Avatar 
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.Name}`} 
                    className="border border-gray-200"
                  />
                </>
              ) : (
                <Tag color="orange">GUEST (SETUP MODE)</Tag>
              )}
            </div>
          </div>

          {/* Render the selected component */}
          {renderContent()}
        </Layout>
      )}

      <ErrorReport 
        visible={reportModalVisible} 
        onCancel={() => setReportModalVisible(false)} 
        token={graphToken} 
      />
    </ConfigProvider>
  );
}

export default App;

