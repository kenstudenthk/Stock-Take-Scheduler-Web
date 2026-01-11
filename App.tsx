import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Avatar, message, notification, Alert } from 'antd';
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

const { Content, Header, Sider } = Layout;

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [collapsed, setCollapsed] = useState(false);
  
  // --- Token States ---
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [invToken, setInvToken] = useState<string>(localStorage.getItem('stockTakeInvToken') || '');
  
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [isTokenExpired, setIsTokenExpired] = useState(false);

  const showTokenWarning = () => {
    notification.error({
      message: 'Access Token Expired',
      description: 'Your Microsoft Graph session has expired. Please update the token in Settings.',
      duration: 0,
      key: 'tokenExpiry',
      placement: 'topRight',
    });
  };

  const fetchAllData = async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999', 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        setIsTokenExpired(true);
        showTokenWarning();
        return;
      }

      const data = await res.json();
      if (data.value) {
        setIsTokenExpired(false);
        notification.destroy('tokenExpiry');
        const mapped = data.value.map((item: any) => {
          const f = item.fields || {};
          return {
            sharePointItemId: item.id,
            id: f[SP_FIELDS.SHOP_CODE] || item.id,
            name: f[SP_FIELDS.SHOP_NAME] || '',
            address: f[SP_FIELDS.ADDRESS_ENG] || '',
            address_chi: f[SP_FIELDS.ADDRESS_CHI] || '',
            region: f[SP_FIELDS.REGION] || '',
            district: f[SP_FIELDS.DISTRICT] || '',
            area: f[SP_FIELDS.AREA] || '',
            brand: f[SP_FIELDS.BRAND] || '',
            latitude: parseFloat(f[SP_FIELDS.LATITUDE] || '0'),
            longitude: parseFloat(f[SP_FIELDS.LONGITUDE] || '0'),
            status: f.Status || f[SP_FIELDS.STATUS] || 'PLANNED', 
            scheduledDate: f[SP_FIELDS.SCHEDULE_DATE] || '',
            groupId: parseInt(f[SP_FIELDS.SCHEDULE_GROUP] || "0"),
            sys: f[SP_FIELDS.SYS] || '',
            businessUnit: f[SP_FIELDS.BUSINESS_UNIT] || '',
            phone: f[SP_FIELDS.PHONE] || '',
            contactName: f[SP_FIELDS.CONTACT] || '',
            remark: f[SP_FIELDS.REMARK] || '',
            is_mtr: f[SP_FIELDS.MTR] === 'Yes',
            building: f[SP_FIELDS.BUILDING] || ''
          };
        });
        setAllShops(mapped);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    if (graphToken) fetchAllData(graphToken);
  }, [graphToken]);

  const handleUpdateShop = async (shop: Shop, updates: any) => {
    if (!graphToken) return message.error("No Token");
    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );
      if (res.ok) {
        message.success("Updated!");
        fetchAllData(graphToken);
      }
    } catch (err) {
      message.error("Failed");
    }
  };

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD:
        return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} onNavigate={(v) => setSelectedMenuKey(v)} />;
      case View.LOCATIONS: 
        return <Locations shops={allShops} />;
      case View.SHOP_LIST: 
        return <ShopList shops={allShops} graphToken={graphToken} onRefresh={() => fetchAllData(graphToken)} />;
      case View.CALENDAR: 
        return <Calendar shops={allShops} />;
      case View.SETTINGS: 
        return (
          <Settings 
            token={graphToken} 
            onUpdateToken={(t) => { 
              setGraphToken(t); 
              localStorage.setItem('stockTakeToken', t); 
              fetchAllData(t); 
            }} 
            invToken={invToken}
            onUpdateInvToken={(t) => {
              setInvToken(t);
              localStorage.setItem('stockTakeInvToken', t);
            }}
          />
        ); // ✅ 這裡原本多了一個 ); 導致報錯
      case 'generator': 
        return <Generator shops={allShops} />;
      default: 
        return <div className="p-20 text-center text-slate-400">Section Coming Soon</div>;
      case View.INVENTORY:
        return <Inventory invToken={invToken} />;
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={260} className="border-r border-slate-100">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg font-bold">ST PRO</div>
        </div>
        <Menu 
          mode="inline" selectedKeys={[selectedMenuKey]} onClick={(e) => setSelectedMenuKey(e.key as View)}
          items={[
            { key: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
            { key: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
            { key: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
            { key: 'generator', icon: <ToolOutlined />, label: 'Schedule Generator' },
            { key: View.LOCATIONS, icon: <ShopOutlined />, label: 'Map View' },
            { key: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
            { key: View.INVENTORY, icon: <UnorderedListOutlined />, label: 'Inventory List' },
          ]}
        />
      </Sider>
      <Layout className="bg-slate-50 flex flex-col overflow-hidden">
        <Header className="bg-white px-8 flex justify-between items-center h-16 border-b border-slate-100">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space size="large">
             <Button icon={<SyncOutlined />} onClick={() => fetchAllData(graphToken)} className="rounded-lg font-bold">Refresh</Button>
             <Tag color={isTokenExpired ? "error" : "cyan"}>{isTokenExpired ? "EXPIRED" : `POOL: ${allShops.length}`}</Tag>
             <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
          </Space>
        </Header>
        <Content className="overflow-y-auto p-8 h-full">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
