import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Avatar, message } from 'antd';
import { 
  HomeOutlined, ShopOutlined, ToolOutlined, CalendarOutlined, 
  SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  UnorderedListOutlined, SyncOutlined 
} from '@ant-design/icons';
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
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  // --- 1. 從 SharePoint 抓取資料 ---
  const fetchAllData = async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999', 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.value) {
        const mapped = data.value.map((item: any) => {
          const f = item.fields || {};
          return {
            id: f.field_6 || item.id,
            sharePointItemId: item.id,
            name: f.field_7 || '',
            address: f.field_14 || '',
            region: f.field_9 || '',   
            district: f.field_16 || '', 
            area: f.field_10 || '',    
            brand: f.field_11 || '',
            brandIcon: f.field_23 || '',
            latitude: parseFloat(f.field_20 || '0'),
            longitude: parseFloat(f.field_21 || '0'),
            is_mtr: f.field_17 === 'Yes' || f.field_17 === 'MTR',
            status: f.Status || 'PLANNED', // 直接使用 SPO 的 Status 欄位
            groupId: parseInt(f.Schedule_x0020_Group || "0"),
            scheduledDate: f.field_2 || ''
          };
        });
        setAllShops(mapped);
      }
    } catch (err) {
      message.error("SPO Sync Failed");
    }
  };

  useEffect(() => { if (graphToken) fetchAllData(graphToken); }, [graphToken]);

  // --- 2. 手動刷新功能 ---
  const handleRefresh = () => {
    if (graphToken) {
      message.loading({ content: 'Syncing...', key: 'refresh' });
      fetchAllData(graphToken).then(() => message.success({ content: 'Data updated!', key: 'refresh' }));
    }
  };

  // --- 3. 更新 SharePoint 資料 ---
  const handleUpdateShop = async (shop: Shop, updates: any) => {
    if (!graphToken) return message.error("Token invalid");

    const fieldMapping: any = {};
    if (updates.scheduleStatus === 'Rescheduled') {
      fieldMapping.Status = 'Rescheduled';
      fieldMapping.field_2 = updates.scheduledDate;
      fieldMapping.Schedule_x0020_Group = String(updates.groupId);
    }
    if (updates.scheduleStatus === 'Closed') {
      fieldMapping.Status = 'Closed';
      fieldMapping.Schedule_x0020_Group = null; 
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
        message.success(`${shop.name} updated!`);
        fetchAllData(graphToken);
      }
    } catch (err) {
      message.error("SPO Update Failed");
    }
  };

  const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD:
        return <Dashboard shops={allShops} onUpdateShop={handleUpdateShop} onNavigate={(v) => setSelectedMenuKey(v)} />;
      case View.LOCATIONS: return <Locations shops={allShops} />;
      case View.SHOP_LIST: return <ShopList shops={allShops} />;
      case View.CALENDAR: return <Calendar shops={allShops} />;
      case View.SETTINGS: return <Settings token={graphToken} onUpdateToken={(t) => { setGraphToken(t); localStorage.setItem('stockTakeToken', t); fetchAllData(t); }} />;
        case 'generator':
  return <Generator shops={allShops} />
      default: return <div className="p-20 text-center text-slate-400">Section Coming Soon</div>;
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
          ]}
        />
      </Sider>
      <Layout className="bg-slate-50 flex flex-col overflow-hidden">
        <Header className="bg-white px-8 flex justify-between items-center h-16 border-b border-slate-100">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space size="large">
             <Button icon={<SyncOutlined />} onClick={handleRefresh} className="rounded-lg font-bold">Refresh Data</Button>
             <Tag color="cyan" className="font-bold">POOL: {allShops.length}</Tag>
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
