import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Space, Tag, Avatar, message, Typography } from 'antd';
import { 
  HomeOutlined, ShopOutlined, ToolOutlined, CalendarOutlined, 
  SettingOutlined, SyncOutlined, UnorderedListOutlined,
  WarningFilled, BugOutlined
} from '@ant-design/icons';
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
import './index.css';

const [reportModalVisible, setReportModalVisible] = useState(false);
const { Content, Header, Sider } = Layout;
const { Title, Text } = Typography;

// ✅ 貨車通知組件
const TruckFlagNotice: React.FC = () => (
  <div className="truck-header-container">
    <div className="truck-flag-walker">
      <div className="truck-notice-flag">
        <WarningFilled /> TOKEN EXPIRED: PLEASE UPDATE IN SETTINGS
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
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');
  
  // ✅ 初始載入 Token
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasTokenError, setHasTokenError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // ✅ 新增：統一的 Token 更新與持久化函數
  const updateGraphToken = (newToken: string) => {
    setGraphToken(newToken);
    localStorage.setItem('stockTakeToken', newToken);
    if (newToken) setHasTokenError(false);
  };

  const updateInvToken = (newToken: string) => {
    setInvToken(newToken);
    localStorage.setItem('stockTakeInvToken', newToken);
  };

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
              brandIcon: f[SP_FIELDS.BRAND_ICON] || '',
              address: f[SP_FIELDS.ADDRESS_ENG] || '',
              region: f[SP_FIELDS.REGION] || '',
              district: f[SP_FIELDS.DISTRICT] || '',
              brand: f[SP_FIELDS.BRAND] || '',
              businessUnit: f[SP_FIELDS.BUSINESS_UNIT] || '',
              area: f[SP_FIELDS.AREA] || '',
              masterStatus: f[SP_FIELDS.OLD_STATUS] || '',
              status: f[SP_FIELDS.STATUS] || 'Unplanned',
              scheduledDate: f[SP_FIELDS.SCHEDULE_DATE] || '',
              groupId: parseInt(f[SP_FIELDS.SCHEDULE_GROUP] || "0"),
              is_mtr: f[SP_FIELDS.MTR] === 'Yes',
              phone: f[SP_FIELDS.PHONE] || '',
              contactName: f[SP_FIELDS.CONTACT] || '',
              latitude: parseFloat(f[SP_FIELDS.LATITUDE] || '0'),
              longitude: parseFloat(f[SP_FIELDS.LONGITUDE] || '0'),
            };
          });
          setAllShops(mapped);
          setHasTokenError(false);
        }
      }
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setLoading(false);
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  // ✅ 修正 useEffect 觸發邏輯
  useEffect(() => { 
    if (graphToken) {
      fetchAllData(graphToken); 
    } else {
      setHasTokenError(true);
      setIsInitialLoading(false);
    }
  }, [graphToken, fetchAllData]);

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} onUpdateShop={undefined} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.GENERATOR: return <Generator shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.INVENTORY: return <Inventory invToken={invToken} shops={allShops} />;
      case View.SETTINGS: return (
        <Settings 
          token={graphToken} 
          onUpdateToken={updateGraphToken} 
          invToken={invToken} 
          onUpdateInvToken={updateInvToken} 
        />
      );
      default: return null;
    }
  };

  return (
    <Layout className="h-screen flex flex-row theme-transition overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} className="custom-sider h-screen sticky top-0 left-0">
        <div className={`navigation ${collapsed ? 'active' : ''} flex flex-col justify-between h-full pb-4`}>
          <div className="flex flex-col">
            <div className={`flex items-center px-6 py-8 ${collapsed ? 'justify-center flex-col' : 'justify-between'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white shadow-lg">
                  <span style={{ fontWeight: 900, fontSize: '18px' }}>ST</span>
                </div>
                {!collapsed && (
                  <div className="flex flex-col">
                    <h1 className="text-base font-bold leading-none text-white">Stock Take</h1>
                    <p className="text-[10px] font-medium text-teal-400 mt-1 uppercase tracking-widest">Pro</p>
                  </div>
                )}
              </div>
              <div className={`${collapsed ? 'mt-6' : ''}`}>
                <input type="checkbox" id="checkbox" checked={!collapsed} onChange={() => setCollapsed(!collapsed)} />
                <label htmlFor="checkbox" className="toggle" style={{ transform: collapsed ? 'scale(0.5)' : 'scale(0.7)' }}>
                  <div className="bars" id="bar1"></div><div className="bars" id="bar2"></div><div className="bars" id="bar3"></div>
                </label>
              </div>
            </div>
            <ul>
              {[
                { k: View.DASHBOARD, i: <HomeOutlined />, l: 'Dashboard' },
                { k: View.SHOP_LIST, i: <UnorderedListOutlined />, l: 'Master List' },
                { k: View.CALENDAR, i: <CalendarOutlined />, l: 'Schedules' },
                { k: View.GENERATOR, i: <ToolOutlined />, l: 'Generator' },
                { k: View.LOCATIONS, i: <ShopOutlined />, l: 'Map View' },
                { k: View.INVENTORY, i: <UnorderedListOutlined />, l: 'Inventory' },
                { k: View.SETTINGS, i: <SettingOutlined />, l: 'Settings' },
              ].map(item => (
                <li key={item.k} className={`list ${selectedMenuKey === item.k ? 'active' : ''}`} onClick={() => setSelectedMenuKey(item.k)}>
                  <a href="#"><span className="icon">{item.i}</span>{!collapsed && <span className="title">{item.l}</span>}</a>
                </li>
                <li className="list mt-auto" onClick={() => setReportModalVisible(true)}>
  <a href="#">
    <span className="icon text-red-400"><BugOutlined /></span>
    {!collapsed && <span className="title text-red-400">Report Error</span>}
  </a>
</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center items-center px-4">
            <div style={{ transform: collapsed ? 'scale(0.25)' : 'scale(0.35)', transition: '0.3s' }}>
              <ThemeToggle isDark={isDarkMode} onToggle={setIsDarkMode} />
            </div>
          </div>
        </div>
      </Sider>
    <ErrorReport 
  visible={reportModalVisible} 
  onCancel={() => setReportModalVisible(false)} 
  token={graphToken} 
/>
      
      <Layout className="flex flex-1 flex-col overflow-hidden main-content-area">
        <Header className="app-header px-8 flex justify-between items-center h-16 border-b flex-shrink-0 bg-white">
          
          {/* ✅ 關鍵修正：只有在完成初始載入、確認有錯且沒在加載時，貨車才出動 */}
          {!isInitialLoading && hasTokenError && !loading ? <TruckFlagNotice /> : <div className="flex-1" />}

          <Space size="large">
            <Button icon={<SyncOutlined spin={loading} />} onClick={() => fetchAllData(graphToken)} className="refresh-btn">Refresh</Button>
            <Tag color="cyan" className="font-bold rounded-md px-3 py-0.5">POOL: {allShops.length}</Tag>
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="user-avatar" />
          </Space>
        </Header>
        
        <Content className="main-scroll-content p-8 overflow-y-auto h-full">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
