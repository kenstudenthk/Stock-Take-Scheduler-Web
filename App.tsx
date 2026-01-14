import React, { useState, useEffect, useCallback } from 'react';
import { Layout, Button, Space, Tag, Avatar, message } from 'antd';
import { 
  HomeOutlined, ShopOutlined, ToolOutlined, CalendarOutlined, 
  SettingOutlined, SyncOutlined, UnorderedListOutlined
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

const { Content, Header, Sider } = Layout;

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [collapsed, setCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = useCallback(async (token: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { message.error("Token expired."); setLoading(false); return; }
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
      }
    } catch (err) { message.error("Sync Error"); }
    setLoading(false);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  useEffect(() => { if (graphToken) fetchAllData(graphToken); }, [graphToken, fetchAllData]);

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.GENERATOR: return <Generator shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.INVENTORY: return <Inventory invToken={invToken} />;
      case View.SETTINGS: return <Settings token={graphToken} onUpdateToken={setGraphToken} invToken={invToken} onUpdateInvToken={setInvToken} />;
      default: return null;
    }
  };

  return (
    <Layout className="h-screen flex flex-row theme-transition overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} className="custom-sider h-screen sticky top-0 left-0">
        <div className={`navigation ${collapsed ? 'active' : ''} flex flex-col justify-between h-full pb-4`}>
          <div className="flex flex-col">
            {/* ✅ 左側選單標頭與 Uiverse 切換按鈕 */}
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
                <input 
                  type="checkbox" 
                  id="checkbox" 
                  checked={!collapsed} 
                  onChange={() => setCollapsed(!collapsed)} 
                />
                <label htmlFor="checkbox" className="toggle" style={{ transform: collapsed ? 'scale(0.5)' : 'scale(0.7)' }}>
                  <div className="bars" id="bar1"></div>
                  <div className="bars" id="bar2"></div>
                  <div className="bars" id="bar3"></div>
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
      
      <Layout className="flex flex-1 flex-col overflow-hidden main-content-area">
        <Header className="app-header px-8 flex justify-end items-center h-16 border-b flex-shrink-0">
          <Space size="large">
            <Button icon={<SyncOutlined spin={loading} />} onClick={() => fetchAllData(graphToken)} className="refresh-btn">Refresh</Button>
            <Tag color="cyan" className="font-bold rounded-md">POOL: {allShops.length}</Tag>
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
