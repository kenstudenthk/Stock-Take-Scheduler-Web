import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Avatar, message, notification, Alert } from 'antd'; // ✅ 加入 notification, Alert
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
  const [isTokenExpired, setIsTokenExpired] = useState(false); // ✅ 新增：追蹤 Token 狀態

  // ✅ 新增：顯示 Token 過期通知函式
  const showTokenWarning = () => {
    notification.error({
      message: 'Access Token Expired',
      description: 'Your Microsoft Graph session has expired. Please update the token in Settings to resume data sync.',
      duration: 0, // 除非手動關閉否則一直顯示
      key: 'tokenExpiry',
      placement: 'topRight',
      btn: (
        <Button type="primary" size="small" onClick={() => setSelectedMenuKey(View.SETTINGS)}>
          Go to Settings
        </Button>
      ),
    });
  };

  // --- 1. 從 SharePoint 抓取資料 ---
  const fetchAllData = async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999', 
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // ✅ 偵測 401 Unauthorized
      if (res.status === 401) {
        setIsTokenExpired(true);
        showTokenWarning();
        return;
      }

      const data = await res.json();
      if (data.value) {
        setIsTokenExpired(false); // 成功則重置狀態
        notification.destroy('tokenExpiry'); // 關閉過期通知
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
            status: f.Status || 'PLANNED',
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

  useEffect(() => {
    if (graphToken) fetchAllData(graphToken);
  }, [graphToken]);

  useEffect(() => {
    const REFRESH_INTERVAL = 30 * 60 * 1000;
    const autoRefresh = setInterval(() => {
      if (graphToken && !isTokenExpired) { // ✅ Token 過期就不再背景刷新
        console.log("Auto-syncing with SharePoint...");
        message.info({ content: 'Auto-syncing data...', key: 'autoSync', duration: 2 });
        fetchAllData(graphToken);
      }
    }, REFRESH_INTERVAL);
    return () => clearInterval(autoRefresh);
  }, [graphToken, isTokenExpired]);

  const handleRefresh = () => {
    if (graphToken) {
      message.loading({ content: 'Syncing...', key: 'refresh' });
      fetchAllData(graphToken).then(() => {
        if (!isTokenExpired) message.success({ content: 'Data updated!', key: 'refresh' });
      });
    }
  };

  const handleUpdateShop = async (shop: Shop, updates: any) => {
    if (!graphToken || isTokenExpired) return message.error("Please update Token first");

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
      if (res.status === 401) {
        setIsTokenExpired(true);
        showTokenWarning();
        return;
      }
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
      case View.SETTINGS: 
        return <Settings token={graphToken} onUpdateToken={(t) => { 
          setGraphToken(t); 
          localStorage.setItem('stockTakeToken', t); 
          setIsTokenExpired(false); // ✅ 更新 Token 時重置狀態
          notification.destroy('tokenExpiry'); // ✅ 移除通知
          fetchAllData(t); 
        }} />;
      case 'generator':
        return <Generator shops={allShops} />;
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
             <Tag color={isTokenExpired ? "error" : "cyan"} className="font-bold">
               {isTokenExpired ? "TOKEN EXPIRED" : `POOL: ${allShops.length}`}
             </Tag>
             <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bonnie" />
          </Space>
        </Header>
        
        {/* ✅ ✅ ✅ 在內容區上方加入警告橫幅 ✅ ✅ ✅ */}
        {isTokenExpired && (
          <Alert
            message="Attention: Session Expired"
            description="Your Microsoft Graph access token has expired. Please update it in Settings to continue syncing data."
            type="error"
            showIcon
            closable={false}
            action={
              <Button size="small" danger onClick={() => setSelectedMenuKey(View.SETTINGS)}>
                Fix Now
              </Button>
            }
          />
        )}

        <Content className="overflow-y-auto p-8 h-full">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
