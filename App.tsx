import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Tag, Avatar, message } from 'antd';
import { 
  HomeOutlined, ShopOutlined, ToolOutlined, CalendarOutlined, 
  SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  UnorderedListOutlined, SyncOutlined 
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
  
  // --- 🌗 Theme Management ---
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    localStorage.getItem('theme') === 'dark'
  );
  // ✅ Add Auto-Refresh logic (30 mins)
  useEffect(() => {
    const interval = setInterval(() => {
      if (graphToken) {
        console.log("Auto-refreshing data from SharePoint...");
        fetchAllData(graphToken);
      }
    }, 30 * 60 * 1000); // 30 minutes in milliseconds
    
    return () => clearInterval(interval);
  }, [graphToken]);

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // --- 🔑 Token States & Handlers ---
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ 新增：更新 Token 並儲存到本地，同時嘗試抓取新數據
  const handleUpdateGraphToken = (newToken: string) => {
    const cleanedToken = newToken.trim(); // 移除空格防止 401
    setGraphToken(cleanedToken);
    localStorage.setItem('stockTakeToken', cleanedToken);
    if (cleanedToken) {
      fetchAllData(cleanedToken);
    }
  };

  const handleUpdateInvToken = (newToken: string) => {
    const cleanedToken = newToken.trim();
    setInvToken(cleanedToken);
    localStorage.setItem('stockTakeInvToken', cleanedToken);
  };

  const fetchAllData = async (token: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      
      if (res.status === 401) {
        message.error("Access Token is invalid or expired. Please update in Settings.");
        setLoading(false);
        return;
      }

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
            status: f[SP_FIELDS.STATUS] || 'PLANNED',
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
    } catch (err) { 
      message.error("Network Error: Could not connect to SharePoint."); 
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (graphToken) fetchAllData(graphToken); 
  }, []);

  const handleUpdateShop = async (shop: Shop, updates: any) => {
    message.success("Update triggering...");
  };

  const renderSidebar = () => {
    const menuItems = [
      { key: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
      { key: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
      { key: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
      { key: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
      { key: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
      { key: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory' },
      { key: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
    ];

    return (
      <div className={`navigation ${collapsed ? 'active' : ''} flex flex-col justify-between h-full pb-10`}>
        <ul>
          <li className="logo-item">
            <a href="#">
              <span className="icon">ST</span>
              {!collapsed && <span className="title" style={{fontWeight: 800, fontSize: '1.2rem'}}>STOCK PRO</span>}
            </a>
          </li>
          {menuItems.map((item) => (
            <li 
              key={item.key} 
              className={`list ${selectedMenuKey === item.key ? 'active' : ''}`}
              onClick={() => setSelectedMenuKey(item.key as View)}
            >
              <a href="#">
                <span className="icon">{item.icon}</span>
                {!collapsed && <span className="title">{item.label}</span>}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex justify-center items-center px-4">
          <div style={{ transform: collapsed ? 'scale(0.25)' : 'scale(0.35)', transition: '0.3s' }}>
            <ThemeToggle isDark={isDarkMode} onToggle={setIsDarkMode} />
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.GENERATOR: return <Generator shops={allShops} onUpdateShop={handleUpdateShop} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.INVENTORY: return <Inventory invToken={invToken} />;
      // ✅ 修正：傳遞正確的 Prop 名稱 (onUpdateToken 和 onUpdateInvToken)
      case View.SETTINGS: return (
        <Settings 
          token={graphToken} 
          onUpdateToken={handleUpdateGraphToken} 
          invToken={invToken} 
          onUpdateInvToken={handleUpdateInvToken} 
        />
      );
      default: return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
    }
  };

  return (
    <Layout className="h-screen flex flex-row theme-transition overflow-hidden">
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={260} 
        className="custom-sider h-screen sticky top-0 left-0"
      >
        {renderSidebar()}
      </Sider>

      <Layout className="flex flex-1 flex-col overflow-hidden main-content-area">
        <Header className="app-header px-8 flex justify-between items-center h-16 border-b flex-shrink-0">
          <div className="flex items-center gap-6">
            <Button 
              type="text" 
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
              onClick={() => setCollapsed(!collapsed)} 
              className="toggle-sidebar-btn"
            />
          </div>

          <Space size="large">
             <Button 
               icon={<SyncOutlined spin={loading} />} 
               onClick={() => fetchAllData(graphToken)} 
               className="refresh-btn"
               loading={loading}
             >
               Refresh
             </Button>
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
