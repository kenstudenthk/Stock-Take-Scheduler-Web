import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Tag, Avatar, message } from 'antd';
import { HomeOutlined, ShopOutlined, ToolOutlined, CalendarOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {Dashboard} from './components/Dashboard';
import { Generator } from './components/Generator';
import { Calendar } from './components/Calendar';
import { Locations } from './components/Locations';
import { Settings } from './components/Settings'; 
import { Shop, View } from './types';
import { UnorderedListOutlined } from '@ant-design/icons';
import { ShopList } from './components/ShopList';

const { Content, Header, Sider } = Layout;

function App() {
  const [selectedMenuKey, setSelectedMenuKey] = useState<View>(View.DASHBOARD);
  const [graphToken, setGraphToken] = useState<string>(localStorage.getItem('stockTakeToken') || '');
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const fetchAllData = async (token: string) => {
    if (!token) return;
    try {
      const res = await fetch(
        'https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items?$expand=fields($select=*)&$top=999', 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // ✅ 新增：手動刷新函式
  const handleRefresh = () => {
    if (graphToken) {
      message.loading({ content: 'Syncing with SharePoint...', key: 'sync' });
      fetchAllData(graphToken).then(() => {
        message.success({ content: 'Data updated!', key: 'sync' });
      });
    }
  };
      const handleUpdateShop = async (shop: Shop, updates: any) => {
  if (!graphToken) {
    message.error("Token 已經過期，請到 Settings 更新！");
    return;
  }

  // 根據你的要求準備資料包
  const fieldMapping: any = {};
  
  if (updates.status === 'Rescheduled') {
    fieldMapping.Status = 'Rescheduled';      // 狀態改為 Rescheduled
    fieldMapping.field_2 = updates.date;      // 更新為選擇的新日期 (Schedule Date)
    if (updates.group) {
      fieldMapping.Schedule_x0020_Group = `Group ${String.fromCharCode(64 + Number(updates.group))}`; // 更新 Group
    }
  }
  
  if (updates.status === 'Closed') {
    fieldMapping.Status = 'Closed';           // 狀態改為 Closed
    fieldMapping.Schedule_x0020_Group = null; // 移除 Group 的值
  }

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${graphToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldMapping)
      }
    );

    if (response.ok) {
      message.success(`${shop.name} 已同步至 SharePoint！`);
      fetchAllData(graphToken); // ✅ 成功後自動刷新 UI
    } else {
      const errorData = await response.json();
      console.error("SPO Error:", errorData);
      message.error("同步失敗，請檢查權限或欄位名稱。");
    }
  } catch (error) {
    message.error("網路連線錯誤，無法連接到 Microsoft Graph。");
  }
};
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
            brandIcon: f.field_23 || '', // ✅ 獲取 SharePoint 中的 Logo 網址
            latitude: parseFloat(f.field_20 || '0'),
            longitude: parseFloat(f.field_21 || '0'),
            is_mtr: f.field_17 === 'Yes' || f.field_17 === 'MTR',
            status: f.Status === 'Done' ? 'completed' : 'pending',
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

  const updateToken = (newToken: string) => {
    setGraphToken(newToken);
    localStorage.setItem('stockTakeToken', newToken);
    fetchAllData(newToken);
  };
const renderContent = () => {
    switch (selectedMenuKey) {
      case View.DASHBOARD:
        return <Dashboard shops={allShops} onNavigate={(v) => setSelectedMenuKey(v)} />;
      case View.LOCATIONS:
        return <Locations shops={allShops} />;
    case View.SHOP_LIST: // ✅ 新增頁面渲染
        return <ShopList shops={allShops} />;
      case View.GENERATOR:
        return <Generator shops={allShops} graphToken={graphToken} />;
      case View.CALENDAR:
        return <Calendar shops={allShops} />;
      case View.SETTINGS:
        return <Settings token={graphToken} onUpdateToken={updateToken} />;
      default:
        return <div className="p-20 text-center text-slate-400">Section Coming Soon</div>;
    }
  };

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="light" width={260} className="border-r border-slate-100">
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="bg-teal-600 p-2 rounded-xl text-white shadow-lg"><ShopOutlined /></div>
          {!collapsed && <span className="font-bold text-slate-800 text-lg">Stock Take</span>}
        </div>
        <Menu 
          mode="inline" selectedKeys={[selectedMenuKey]} onClick={(e) => setSelectedMenuKey(e.key as View)}
          items={[
            { key: View.DASHBOARD, icon: <HomeOutlined />, label: 'Dashboard' },
            { key: View.LOCATIONS, icon: <ShopOutlined />, label: 'Shop Locations' },
            { key: View.GENERATOR, icon: <ToolOutlined />, label: 'Generator' },
            { key: View.CALENDAR, icon: <CalendarOutlined />, label: 'Schedules' },
            { key: View.SETTINGS, icon: <SettingOutlined />, label: 'Settings' },
           { key: View.SHOP_LIST, icon: <UnorderedListOutlined />, label: 'Shop List' },
          ]}
        />
      </Sider>
      <Layout className="bg-slate-50 flex flex-col overflow-hidden">
        <Header className="bg-white px-8 flex justify-between items-center h-16 border-b border-slate-100">
          <Button type="text" icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} onClick={() => setCollapsed(!collapsed)} />
          <Space size="large">
             <Tag color={allShops.length > 0 ? "success" : "error"}>● SPO Pool: {allShops.length}</Tag>
             <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
          </Space>
        </Header>
        <Content className="overflow-y-auto p-8" style={{ height: 'calc(100vh - 64px)' }}>
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </Content>
      </Layout>
    </Layout>
  );
}

const updateSharePointItem = async (shop: Shop, updates: Record<string, any>) => {
  if (!token) {
    message.error("No active token found! Please go to Settings.");
    return;
  }

  // 這裡需要根據你的 SharePoint List 實際的 internal name 修改
  // 假設：field_2 = Date, field_3 = Group, field_10 = Schedule Status
  const fieldMapping: Record<string, any> = {};
  
  if (updates.scheduledDate) fieldMapping.field_2 = updates.scheduledDate;
  if (updates.groupId) fieldMapping.field_3 = `Group ${String.fromCharCode(64 + updates.groupId)}`; // 轉為 "Group A" 等字串
  if (updates.scheduleStatus) fieldMapping.field_10 = updates.scheduleStatus; // 例如 "Rescheduled" 或 "Closed"
  if (updates.clearGroup) fieldMapping.field_3 = null; // 清除 Group

  try {
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(fieldMapping)
      }
    );

    if (response.ok) {
      message.success("SharePoint updated successfully!");
      // 重新抓取資料以同步 UI
      fetchAllData();
    } else {
      throw new Error("Failed to update SharePoint");
    }
  } catch (error) {
    console.error(error);
    message.error("Update failed. Check your token permissions.");
  }
};

export default App;
