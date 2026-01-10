import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Avatar, message } from 'antd';
import { 
  MenuFoldOutlined, MenuUnfoldOutlined, DashboardOutlined, 
  UnorderedListOutlined, EnvironmentOutlined, CalendarOutlined, 
  SettingOutlined, SyncOutlined 
} from '@ant-design/icons';
import { Dashboard } from './components/Dashboard';
import { ShopList } from './components/ShopList';
import { Locations } from './components/Locations';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings'; 
import { Shop, View } from './types';

const { Content, Header, Sider } = Layout;

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  // --- 1. 從 SharePoint 抓取資料 ---
  const fetchAllData = async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields',
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.value) {
        const mapped: Shop[] = data.value.map((item: any) => {
          const f = item.fields;
          const groupMatch = f.field_3?.match(/Group ([A-C])/);
          return {
            id: f.id || item.id,
            sharePointItemId: item.id,
            name: f.Title,
            brand: f.field_11,
            brandIcon: f.field_23, // 你的 Logo 欄位
            region: f.field_1,
            district: f.field_7,
            area: f.field_8,
            address: f.field_9,
            scheduledDate: f.field_2,
            status: f.field_10 || 'pending',
            groupId: groupMatch ? groupMatch[1].charCodeAt(0) - 64 : 0,
            is_mtr: f.field_12 === 'Yes',
            latitude: parseFloat(f.field_21),
            longitude: parseFloat(f.field_22)
          };
        });
        setAllShops(mapped);
      }
    } catch (err) {
      message.error("Failed to fetch data from SharePoint.");
    }
  };

  useEffect(() => {
    if (graphToken) fetchAllData(graphToken);
  }, [graphToken]);

  // --- 2. 手動刷新按鈕功能 ---
  const handleRefresh = () => {
    if (graphToken) {
      message.loading({ content: 'Syncing with SharePoint...', key: 'sync' });
      fetchAllData(graphToken).then(() => {
        message.success({ content: 'Data Updated!', key: 'sync' });
      });
    } else {
      message.warning("Please set API Token in Settings first.");
    }
  };

  // --- 3. 更新 SharePoint 資料 (Reschedule / Close) ---
  const handleUpdateShop = async (shop: Shop, updates: any) => {
    if (!graphToken) return message.error("Token invalid");

    const fieldMapping: any = {};
    if (updates.scheduleStatus === 'Rescheduled') {
      fieldMapping.field_10 = 'Rescheduled';
      fieldMapping.field_2 = updates.scheduledDate;
      fieldMapping.field_3 = `Group ${String.fromCharCode(64 + updates.groupId)}`;
    }
    if (updates.scheduleStatus === 'Closed') {
      fieldMapping.field_10 = 'Closed';
      fieldMapping.field_3 = null; // 移除 Group
    }

    try {
      const res = await fetch(
        `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
        {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldMapping)
        }
      );
      if (res.ok) {
        message.success("SharePoint Updated!");
        fetchAllData(graphToken);
      }
    } catch (err) {
      message.error("Sync failed");
    }
  };

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD: return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} onNavigate={setSelectedMenuKey} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.SETTINGS: return <Settings token={graphToken} onUpdateToken={(t) => { setGraphToken(t); localStorage.setItem('stockTakeToken', t); }} />;
      default: return <Dashboard shops={allShops} />;
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider trigger={null} collapsible collapsed={collapsed} className="shadow-xl">
        <div className="p-6 text-teal-400 font-black text-xl italic border-b border-slate-800">ST PRO</div>
        <Menu theme="dark" mode="inline" selectedKeys={[selectedMenuKey]} onClick={(e) => setSelectedMenuKey(e.key as View)}
          items={[
            { key: View.DASHBOARD, icon: <DashboardOutlined />, label: 'Dashboard' },
            { key: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Master List' },
            { key: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedule' },
            { key: View.LOCATIONS, icon: <EnvironmentOutlined />, label: 'Map View' },
            { key: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
          ]}
        />
      </Sider>
      <Layout className="bg-slate-50 flex flex-col overflow-hidden">
        <Header className="bg-white px-8 flex justify-between items-center h-16 border-b border-slate-100 shadow-sm">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space size="large">
            <Button icon={<SyncOutlined />} onClick={handleRefresh} className="rounded-xl font-bold border-teal-100 text-teal-600">Refresh Data</Button>
            <Tag color="cyan" className="rounded-full px-4 border-none font-bold">POOL: {allShops.length}</Tag>
            <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" className="border-2 border-teal-50" />
          </Space>
        </Header>
        <Content className="overflow-y-auto p-8">{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}

export default App;
