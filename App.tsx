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
  const [isDarkMode, setIsDarkMode] = useState<boolean>(localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.body.classList.toggle('dark', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchAllData = async (token: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
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
            // ✅ 關鍵修復：補上經緯度映射，地圖才會有標註點
            latitude: parseFloat(f[SP_FIELDS.LATITUDE] || '0'),
            longitude: parseFloat(f[SP_FIELDS.LONGITUDE] || '0'),
          };
        });
        setAllShops(mapped);
      }
    } catch (err) { message.error("Sync Error"); }
    setLoading(false);
  };

  useEffect(() => { if (graphToken) fetchAllData(graphToken); }, []);

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
            <a href="#"><span className="icon">ST</span>{!collapsed && <span className="title font-extrabold text-lg">STOCK PRO</span>}</a>
          </li>
          {menuItems.map((item) => (
            <li key={item.key} className={`list ${selectedMenuKey === item.key ? 'active' : ''}`} onClick={() => setSelectedMenuKey(item.key as View)}>
              <a href="#"><span className="icon">{item.icon}</span>{!collapsed && <span className="title">{item.label}</span>}</a>
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

  return (
    <Layout className="h-screen flex flex-row theme-transition overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} className="custom-sider h-screen sticky top-0 left-0">
        {renderSidebar()}
      </Sider>
      <Layout className="flex flex-1 flex-col overflow-hidden main-content-area">
        <Header className="app-header px-8 flex justify-between items-center h-16 border-b flex-shrink-0">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} className="toggle-sidebar-btn" />
          <Space size="large">
            <Button icon={<SyncOutlined spin={loading} />} onClick={() => fetchAllData(graphToken)} className="refresh-btn" loading={loading}>Refresh</Button>
            <Tag color="cyan" className="font-bold rounded-md">POOL: {allShops.length}</Tag>
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="user-avatar" />
          </Space>
        </Header>
        <Content className="main-scroll-content p-8 overflow-y-auto h-full">
          {selectedMenuKey === View.DASHBOARD && <Dashboard shops={allShops} onUpdateShop={(s, u) => message.success("Updated")} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />}
          {selectedMenuKey === View.SHOP_LIST && <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />}
          {selectedMenuKey === View.CALENDAR && <Calendar shops={allShops} />}
          {selectedMenuKey === View.GENERATOR && <Generator shops={allShops} onUpdateShop={(s, u) => message.success("Updated")} />}
          {selectedMenuKey === View.LOCATIONS && <Locations shops={allShops} />}
          {selectedMenuKey === View.INVENTORY && <Inventory invToken={invToken} />}
          {selectedMenuKey === View.SETTINGS && <Settings token={graphToken} setToken={setGraphToken} invToken={invToken} setInvToken={setInvToken} />}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
