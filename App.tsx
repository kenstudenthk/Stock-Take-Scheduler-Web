import React, { useState, useEffect } from 'react';
import { Layout, Button, Space, Tag, Avatar, message, notification } from 'antd';
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

const { Content, Header, Sider } = Layout;

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [collapsed, setCollapsed] = useState(false);
  
  // --- Token States ---
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(false);

  // --- 監聽 Token 變化並儲存 ---
  useEffect(() => {
    localStorage.setItem('stockTakeToken', graphToken);
  }, [graphToken]);

  useEffect(() => {
    localStorage.setItem('stockTakeInvToken', invToken);
  }, [invToken]);

  // --- 抓取所有資料 (SPO) ---
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
            address: f[SP_FIELDS.ADDRESS_ENG] || '',
            region: f[SP_FIELDS.REGION] || '',
            district: f[SP_FIELDS.DISTRICT] || '',
            area: f[SP_FIELDS.AREA] || '',
            brand: f[SP_FIELDS.BRAND] || '',
            // ✅ 修復：確保 field_23 被正確映射到 brandIcon
            brandIcon: f[SP_FIELDS.BRAND_ICON] || '', 
            latitude: parseFloat(f[SP_FIELDS.LATITUDE] || '0'),
            longitude: parseFloat(f[SP_FIELDS.LONGITUDE] || '0'),
            status: f[SP_FIELDS.STATUS] || 'PLANNED',
            scheduledDate: f[SP_FIELDS.SCHEDULE_DATE] || '',
            groupId: parseInt(f[SP_FIELDS.SCHEDULE_GROUP] || "0"),
            is_mtr: f[SP_FIELDS.MTR] === 'Yes'
          };
        });
        setAllShops(mapped);
      }
    } catch (err) {
      message.error("Failed to fetch data from SharePoint");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (graphToken) fetchAllData(graphToken);
  }, []);

  // --- 更新門市資料的通用函式 ---
  const handleUpdateShop = async (shop: Shop, updates: any) => {
    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${graphToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        }
      );
      if (res.ok) {
        message.success("SPO Synced Successfully");
        fetchAllData(graphToken); // 重新刷資料
      }
    } catch (err) {
      message.error("Update Failed");
    }
  };

  // --- ✨ 自定義圓弧側邊欄渲染 ---
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
      <div className={`navigation ${collapsed ? 'active' : ''}`}>
        <ul>
          <li className="logo-item">
            <a href="#">
              <span className="icon">ST</span>
              {!collapsed && <span className="title" style={{ fontSize: '18px', fontWeight: 800 }}>STOCK PRO</span>}
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
      </div>
    );
  };

  // --- 主內容渲染邏輯 ---
  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD:
        return (
          <Dashboard 
            shops={allShops} 
            onUpdateShop={handleUpdateShop} 
            graphToken={graphToken} 
            onRefresh={() => fetchAllData(graphToken)} 
          />
        );
      case View.SHOP_LIST:
        return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR:
        return <Calendar shops={allShops} />;
      case View.GENERATOR:
        return <Generator shops={allShops} onUpdateShop={handleUpdateShop} />;
      case View.LOCATIONS:
        return <Locations shops={allShops} />;
      case View.INVENTORY:
        return <Inventory invToken={invToken} />;
      case View.SETTINGS:
        return (
          <Settings 
            token={graphToken} 
            setToken={setGraphToken} 
            invToken={invToken} 
            setInvToken={setInvToken} 
          />
        );
      default:
        return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
    }
  };

  return (
    <Layout className="min-h-screen bg-slate-50 flex flex-row">
      {/* 自定義側邊欄 */}
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed} 
        width={260}
        theme="light"
        className="custom-sider"
      >
        {renderSidebar()}
      </Sider>

      <Layout className="flex flex-col overflow-hidden">
        <Header className="bg-white px-8 flex justify-between items-center h-16 border-b border-slate-100">
          <Button 
            type="text" 
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} 
            onClick={() => setCollapsed(!collapsed)} 
            className="text-lg"
          />
          <Space size="large">
             <Button 
               icon={<SyncOutlined spin={loading} />} 
               onClick={() => fetchAllData(graphToken)} 
               className="rounded-lg font-bold"
               loading={loading}
             >
               Refresh
             </Button>
             <Tag color="cyan" className="font-bold rounded-md">POOL: {allShops.length}</Tag>
             <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="border border-slate-200" />
          </Space>
        </Header>

        <Content className="p-8 overflow-y-auto">
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
