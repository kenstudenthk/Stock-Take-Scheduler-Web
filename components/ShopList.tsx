// ShopList.tsx

import React, { useState, useMemo } from 'react';
// 1. ✅ 補全 antd 組件導入
import { Table, Input, Card, Typography, Space, Tag, DatePicker, message, Modal, Select, Row, Col, Divider, Badge, Button, Collapse, Avatar, Popover } from 'antd';
import { 
  SearchOutlined, EnvironmentOutlined, ExclamationCircleOutlined, FilterOutlined,
  PhoneOutlined, UserOutlined, PlusOutlined, MessageOutlined, ClockCircleOutlined,
  ClearOutlined, ShopOutlined, GlobalOutlined, DeploymentUnitOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';
import { ShopFormModal } from './ShopFormModal';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { confirm } = Modal;
const { Option } = Select;
const { Panel } = Collapse; // 2. ✅ 必須定義 Panel

export const ShopList: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  // ... 你的狀態設定 (searchText, filters 等) ...
  const [searchText, setSearchText] = useState('');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    brand: 'All', district: 'All', region: 'All', area: 'All', bu: 'All',
    callStatus: 'All', mtr: 'All', group: 'All', status: 'All'
  });

  // 3. ✅ 級聯過濾邏輯 (你寫得很好)
  const options = useMemo(() => {
    const getAvailableValues = (key: keyof Shop, filterKey: string) => {
      const filteredForThisField = shops.filter(s => {
        return Object.entries(filters).every(([k, v]) => {
          if (k === filterKey || v === 'All') return true;
          if (k === 'bu') return (s as any).businessUnit === v;
          if (k === 'mtr') return (v === 'Yes' ? s.is_mtr : !s.is_mtr);
          if (k === 'group') return s.groupId?.toString() === v;
          if (k === 'status') return s.status?.toLowerCase() === v.toLowerCase();
          return (s as any)[k] === v;
        });
      });
      const uniqueValues = Array.from(new Set(filteredForThisField.map(s => 
        (s as any)[key === 'bu' ? 'businessUnit' : key]).filter(Boolean))).sort();
      return ['All', ...uniqueValues];
    };

    return {
      regions: getAvailableValues('region', 'region'),
      districts: getAvailableValues('district', 'district'),
      areas: getAvailableValues('area', 'area'),
      brands: getAvailableValues('brand', 'brand'),
      bus: getAvailableValues('businessUnit' as any, 'bu'),
      statuses: getAvailableValues('status', 'status'),
      callStatuses: ['All', 'Called', 'No One Pick Up', 'No Contact / Wrong No.'],
      mtrs: ['All', 'Yes', 'No'],
      groups: ['All', '1', '2', '3']
    };
  }, [shops, filters]);

  // --- ✅ 增強：核心過濾邏輯 (整合原有搜尋與所有新過濾器) ---
  const filteredData = useMemo(() => {
    return shops.filter(s => {
      // 1. 原有搜尋與日期
      const matchText = (s.name || '').toLowerCase().includes(searchText.toLowerCase()) || 
                        (s.id || '').toLowerCase().includes(searchText.toLowerCase());
      const matchDate = filterDate ? dayjs(s.scheduledDate).format('YYYY-MM-DD') === filterDate : true;
      
      // 2. 新增各項分類過濾
      const matchBrand = filters.brand === 'All' || s.brand === filters.brand;
      const matchRegion = filters.region === 'All' || s.region === filters.region;
      const matchDistrict = filters.district === 'All' || s.district === filters.district;
      const matchArea = filters.area === 'All' || s.area === filters.area;
      const matchBU = filters.bu === 'All' || (s as any).businessUnit === filters.bu;
      const matchCall = filters.callStatus === 'All' || (s as any).callStatus === filters.callStatus;
      const matchMTR = filters.mtr === 'All' || (filters.mtr === 'Yes' ? s.is_mtr : !s.is_mtr);
      const matchGroup = filters.group === 'All' || s.groupId?.toString() === filters.group;
      const matchStatus = filters.status === 'All' || s.status?.toLowerCase() === filters.status.toLowerCase();

      return matchText && matchDate && matchBrand && matchRegion && matchDistrict && 
             matchArea && matchBU && matchCall && matchMTR && matchGroup && matchStatus;
    });
  }, [shops, searchText, filterDate, filters]);

  const resetAllFilters = () => {
    setSearchText('');
    setFilterDate(null);
    setFilters({
      brand: 'All', district: 'All', region: 'All', area: 'All',
      bu: 'All', callStatus: 'All', mtr: 'All', group: 'All', status: 'All'
    });
  };


  // ✅ 處理狀態、備註並自動設定日期為今天
  const handleCallUpdate = async (shop: Shop, field: 'status' | 'remark', value: string) => {
    // 如果值沒有變動，則不觸發更新
    if (field === 'status' && value === shop.callStatus) return;
    if (field === 'remark' && value === shop.callRemark) return;

    setUpdatingId(shop.id);
    const today = dayjs().format('YYYY-MM-DD');
    
    const updatePayload: any = {
      [SP_FIELDS.CALL_DATE]: today 
    };

    if (field === 'status') updatePayload[SP_FIELDS.CALL_STATUS] = value;
    if (field === 'remark') updatePayload[SP_FIELDS.CALL_REMARK] = value;

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${graphToken}`, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        message.success(`Call info for ${shop.name} updated.`);
        onRefresh();
      } else {
        message.error("Failed to update SharePoint.");
      }
    } catch (err) {
      message.error("Network error during update.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCloseAction = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to set ${shop.name} to CLOSED?`,
      onOk: async () => {
        try {
          const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 
              'Authorization': `Bearer ${graphToken}`, 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify({ [SP_FIELDS.STATUS]: 'CLOSED' })
          });
          if (res.ok) { 
            message.success("Shop status updated successfully."); 
            onRefresh(); 
          }
        } catch (err) { 
          message.error("Update failed"); 
        }
      },
    });
  };

  // ShopList.tsx - Part 2: Advanced Filter UI
// (此部分放置在 Card 內部的 p-8 開頭處)

const renderFilterGroup = () => (
    <div className="accordion-filter-wrapper mb-8">
      <Collapse ghost expandIconPosition="end" className="custom-accordion" defaultActiveKey={['1']}>
        <Panel 
          key="1" 
          header={
            <div className="flex items-center gap-4 py-2">
              <Avatar style={{ backgroundColor: '#f0fdfa', color: '#0d9488' }} icon={<FilterOutlined />} size={48} />
              <div className="flex flex-col text-left">
                <Text strong className="text-[16px] text-slate-800">Advanced Shop Filters</Text>
                <Text className="text-[12px] text-slate-400">
                  Currently showing <Badge status="processing" color="#0d9488" text={<b className="text-teal-600">{filteredData.length}</b>} /> stores
                </Text>
              </div>
            </div>
          }
        >
        <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <Row gutter={[16, 20]}>
            {[
              { label: 'Region', key: 'region', opts: options.regions },
              { label: 'District', key: 'district', opts: options.districts },
              { label: 'Area', key: 'area', opts: options.areas },
              { label: 'Brand', key: 'brand', opts: options.brands },
              { label: 'Business Unit', key: 'bu', opts: options.bus },
              { label: 'Schedule Status', key: 'status', opts: options.statuses },
            ].map(f => (
              <Col span={4} key={f.key}>
                <Text className="filter-label">{f.label}</Text>
                <Select 
                  showSearch
                  className="w-full custom-list-select" 
                  value={filters[f.key as keyof typeof filters]} 
                  onChange={v => setFilters({...filters, [f.key]: v})}
                >
                  {f.opts.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
                </Select>
              </Col>
            ))}

            <Col span={6}>
              <Text className="filter-label">Call Status Tracking</Text>
              <Select className="w-full custom-list-select" value={filters.callStatus} onChange={v => setFilters({...filters, callStatus: v})}>
                {options.callStatuses.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
            </Col>
            <Col span={6}>
              <Text className="filter-label">Stationed In MTR?</Text>
              <Select className="w-full custom-list-select" value={filters.mtr} onChange={v => setFilters({...filters, mtr: v})}>
                {options.mtrs.map(opt => <Option key={opt} value={opt}>{opt}</Option>)}
              </Select>
            </Col>
            <Col span={6}>
              <Text className="filter-label">Schedule Group</Text>
              <Select className="w-full custom-list-select" value={filters.group} onChange={v => setFilters({...filters, group: v})}>
                {options.groups.map(opt => <Option key={opt} value={opt}>{opt === 'All' ? 'All Groups' : `Group ${String.fromCharCode(64 + parseInt(opt))}`}</Option>)}
              </Select>
            </Col>
            <Col span={6} className="flex items-end justify-end">
              <Button 
                type="text" 
                danger 
                icon={<ClearOutlined />} 
                onClick={resetAllFilters}
                className="font-bold tracking-tight hover:bg-red-50 h-10 rounded-lg"
              >
                RESET ALL FILTERS
              </Button>
            </Col>
</Row>
          </div>
        </Panel>
      </Collapse>
    </div>
  );

  const columns = [
  {
    title: 'Shop & Brand',
    key: 'shopInfo',
    width: '34%', // ✅ 再次加寬：給予店名最充足的空間
    render: (record: Shop) => (
      <Space align="center" size={12}>
        {record.brandIcon && (
          <div className="brand-logo-wrapper">
            <img 
              src={record.brandIcon} 
              alt={record.brand} 
              className="compact-brand-logo"
            />
          </div>
        )}
        <div className="flex flex-col min-w-0">
          {/* ✅ 文字變大：使用 text-[14px] 或 15px */}
          <Text strong className={`text-[14px] block truncate ${record.status?.toLowerCase() === 'closed' ? 'line-through opacity-50' : 'text-slate-800'}`}>
            {record.name}
          </Text>
          <div className="flex items-center gap-2 mt-0.5">
            <Tag color="blue" className="m-0 border-none font-bold text-[11px] px-2 leading-5">{record.brand}</Tag>
            <Text type="secondary" className="font-mono text-[11px] opacity-70">#{record.id}</Text>
          </div>
        </div>
      </Space>
    ),
  },
  {
    title: 'Address',
    key: 'address',
    width: '22%', 
    render: (record: Shop) => (
      <div className={`flex items-start gap-1.5 ${record.status?.toLowerCase() === 'closed' ? 'opacity-40' : ''}`}>
        <EnvironmentOutlined className="text-teal-600 mt-1 text-[13px]" />
        <div className="flex flex-col">
          {/* ✅ 區域與地址文字微調大 */}
          <Text strong className="text-[12px] leading-tight">{record.region} · {record.district}</Text>
          <Text type="secondary" className="text-[11px] leading-snug italic line-clamp-1">
            {record.address}
          </Text>
        </div>
      </div>
    ),
  },
  {
    title: 'Contact & Tracking',
    key: 'contact',
    width: '18%',
    render: (record: Shop) => {
      const trackingContent = (
        <div className="p-2 w-[260px]" onClick={(e) => e.stopPropagation()}>
          <Text strong className="text-[11px] uppercase text-slate-400 block mb-2">Tracking Log</Text>
          <Space direction="vertical" className="w-full" size={8}>
            <Select 
              size="small"
              placeholder="Set Status"
              className="w-full"
              value={record.callStatus || undefined}
              onChange={(val) => handleCallUpdate(record, 'status', val)}
            >
              <Option value="Called">Called</Option>
              <Option value="No One Pick Up">No One Pick Up</Option>
              <Option value="No Contact / Wrong No.">No Contact / Wrong No.</Option>
            </Select>
            <Input.TextArea 
              size="small"
              placeholder="Call remark..."
              rows={2}
              defaultValue={record.callRemark}
              onBlur={(e) => handleCallUpdate(record, 'remark', e.target.value)}
              className="text-[12px] rounded-md"
            />
          </Space>
        </div>
      );

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <Popover content={trackingContent} title={<b className="text-sm">Quick Tracking</b>} trigger="click" placement="topRight">
            <div className="contact-cell-compact group cursor-pointer hover:bg-slate-50 transition-all">
              <Text className="text-[13px] font-bold text-slate-700 block">
                <PhoneOutlined className="mr-1 text-teal-500" /> {record.phone || '--'}
              </Text>
              <div className="flex items-center gap-2">
                <Text type="secondary" className="text-[11px]"><UserOutlined /> {record.contactName || 'N/A'}</Text>
                {record.callStatus && (
                  <Badge status={record.callStatus === 'Called' ? 'success' : 'warning'} className="scale-90 origin-left" />
                )}
              </div>
            </div>
          </Popover>
        </div>
      );
    }
  },
  {
    title: 'Schedule',
    key: 'schedule',
    width: '7%', // ✅ 變更薄：縮減至 7%
    render: (record: Shop) => (
      <div className="flex flex-col gap-0.5 items-left"> {/* 置中顯示更薄 */}
        <Text strong className="text-[11px] text-indigo-900 whitespace-nowrap">
           {record.scheduledDate ? dayjs(record.scheduledDate).format('DD MMM') : 'TBD'}
        </Text>
        {record.groupId > 0 && (
          <Tag className={`m-0 border-none font-black text-[9px] px-1.5 leading-4 tag-group-${record.groupId}`}>
            {String.fromCharCode(64 + record.groupId)} {/* 只顯示字母以節省空間 */}
          </Tag>
        )}
      </div>
    )
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    width: '7%', // ✅ 變更薄：縮減至 7%
    align: 'left' as const,
    render: (status: string) => {
      let color = 'blue';
      const s = status?.toLowerCase();
      if (s === 'done') color = 'green';
      if (s === 'closed') color = 'red';
      // ✅ 使用更精簡的 Tag 樣式
      return <Tag color={color} className="font-black text-[9px] uppercase border-none px-1.5 rounded-sm m-0 scale-90">{status}</Tag>
    }
  },
 {
    title: 'Actions',
    key: 'actions',
    align: 'left' as const,
    width: '12%', // ✅ 稍微加寬以容納自定義按鈕
    render: (_: any, record: Shop) => (
      /* ❗ 只有當 selectedRowId 等於目前行的 id 時才會顯示 (即點擊後顯示) */
      selectedRowId === record.id && (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {/* ✅ 恢復您原有的 Close 按鈕樣式 */}
          <button 
            className="Btn close-btn-styled scale-75 origin-right" 
            disabled={record.status?.toLowerCase() === 'closed'} 
            onClick={(e) => { e.stopPropagation(); handleCloseAction(record); }}
          >
            <div className="sign">
              <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="white" d="M 20 10 L 20 12 L 22 12 L 22 10 L 23 10 C 23.328 10.000 23.636 9.839 23.823 9.570 C 24.010 9.300 24.053 8.955 23.937 8.648 L 20.937 0.648 C 20.790 0.258 20.417 -0.000 20 0 L 4 0 C 3.583 -0.000 3.210 0.258 3.063 0.648 L 0.063 8.648 C -0.053 8.955 -0.010 9.300 0.177 9.570 C 0.364 9.839 0.672 10.000 1 10 L 2 10 L 2 12 L 4 12 L 4 10 z M 11 2 L 11 8 L 7.28 8 L 8.78 2 z M 15.22 2 L 16.72 8 L 13 8 L 13 2 z M 21.557 8 L 18.78 8 L 17.28 2 L 19.307 2 z M 4.693 2 L 6.72 2 L 5.22 8 L 2.443 8 z M 2 23 C 2 23.552 2.448 24 3 24 L 21 24 C 21.552 24 22 23.552 22 23 L 22 22 L 2 22 z" /></svg>
            </div>
            <div className="btn-text text-[12px]">Close</div>
          </button>

          {/* ✅ 恢復您原有的 Edit 按鈕樣式 */}
          <button 
            className="Btn edit-btn-styled scale-75 origin-right" 
            disabled={record.status?.toLowerCase() === 'closed'} 
            onClick={(e) => { e.stopPropagation(); setTargetShop(record); setFormOpen(true); }}
          >
            <div className="sign">
              <svg viewBox="0 0 512 512" className="w-4 h-4"><path fill="white" d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231z"/></svg>
            </div>
            <div className="btn-text text-[12px]">Edit</div>
          </button>
        </div>
      )
    ),
  }
];
  return (
    <div className="flex flex-col gap-6 pb-10">
      <div className="flex justify-between items-end mb-2">
        <div>
          <Title level={2} className="m-0 text-slate-800">Shop Master List</Title>
          <Text className="text-slate-400 font-medium">Comprehensive store management and multi-criteria filtering.</Text>
        </div>
        {/* 您原有的搜尋框移至此處更省空間 */}
        <div className="input-group">
            <input 
              required 
              type="text" 
              autoComplete="off" 
              className="custom-search-input" 
              value={searchText} 
              onChange={e => setSearchText(e.target.value)} 
            />
            <label className="user-label">Quick search by name or code...</label>
        </div>
      </div>

      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <button className="Btn new-btn-styled" onClick={() => { setTargetShop(null); setFormOpen(true); }}>
              <div className="sign"><PlusOutlined style={{ color: 'white', fontSize: '18px' }} /></div>
              <div className="btn-text">New Shop</div>
            </button>
            
            <Space size="large" align="center">
              <Space direction="vertical" size={0}>
                <Text className="text-[10px] font-bold text-slate-400 uppercase ml-1">Plan Date</Text>
                <DatePicker 
                    onChange={d => setFilterDate(d?.format('YYYY-MM-DD') || null)} 
                    className="h-11 rounded-xl font-bold border-slate-200 w-44" 
                    placeholder="Filter by Date" 
                />
              </Space>
            </Space>
          </div>

          {/* ✅ 插入新增的過濾器面板 */}
          {renderFilterGroup()}

          <div className="st-master-table">
            <Table 
              columns={columns} 
              dataSource={filteredData} // ✅ 使用過濾後的數據
              rowKey="id" 
              pagination={{ 
                pageSize: 10, 
                showSizeChanger: true, 
                pageSizeOptions: ['10', '20', '50'],
                showTotal: (total) => `Total ${total} shops`
              }} 
              onRow={(record) => ({ 
                onClick: () => setSelectedRowId(record.id === selectedRowId ? null : record.id) 
              })} 
              rowClassName={(record) => record.id === selectedRowId ? 'selected-row cursor-pointer' : 'cursor-pointer'} 
            />
          </div>
        </div>
      </Card>

      <ShopFormModal 
        visible={formOpen} 
        shop={targetShop} 
        onCancel={() => setFormOpen(false)} 
        onSuccess={() => { setFormOpen(false); onRefresh(); }} 
        graphToken={graphToken} 
        shops={shops} 
      />

      {/* 為下拉選單添加微調樣式 */}
<style>{`
.brand-logo-wrapper {
    width: 38px;
    height: 38px;
    background: white;
    border-radius: 8px;
    border: 1px solid #f1f5f9;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 2px 5px rgba(0,0,0,0.03);
  }

  .compact-brand-logo {
    width: 90%;
    height: 90%;
    object-fit: contain;
  }

  .st-master-table .ant-table {
    font-size: 13px !important; 
  }

  /* ✅ 修正 2：極致壓縮表格行高 */
  .st-master-table .ant-table-tbody > tr > td {
    padding: 10px 8px !important; /* ❗ 大幅減少 Padding 使表格更緊湊 */
    height: 58px !important;    /* ❗ 固定行高，確保外觀一致 */
    vertical-align: middle !important;
  }

  /* ✅ 修正 3：表頭文字微調 */
  .st-master-table .ant-table-thead > tr > th {
    padding: 12px 8px !important;
    font-size: 12px !important;
    letter-spacing: 0.5px;
  }

  /* 聯繫人卡片緊湊化 */
  .contact-cell-compact {
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid transparent;
  }
  .contact-cell-compact:hover {
    background: #f0fdfa;
    border-color: #0d9488;
  }

  /* 分組標籤顏色 */
  .tag-group-1 { background-color: #e0f2fe !important; color: #0369a1 !important; }
  .tag-group-2 { background-color: #f3e8ff !important; color: #7e22ce !important; }
  .tag-group-3 { background-color: #ffedd5 !important; color: #c2410c !important; }

  /* 選取行的背景色 */
  .selected-row {
    background-color: #f0fdfa !important;
  }

  /* --- 1. Accordion (Collapse) 整體容器 --- */
  .custom-accordion {
    background: transparent !important;
    border: none !important;
  }

  /* ✅ 修正 1：移除紅線間隙，並加深 Header 陰影 */
  .custom-accordion > .ant-collapse-item > .ant-collapse-header {
    align-items: center !important;
    padding: 16px 24px !important;
    background: white !important;
    border-radius: 20px !important; /* 初始全圓角 */
    border: 1px solid #f1f5f9 !important;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    /* ✅ 加深陰影 (Darker Shadow) */
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08) !important; 
    margin-bottom: 0px !important; /* ❗ 移除間隙，解決紅線問題 */
    position: relative;
    z-index: 2; /* 確保 Header 蓋在 Content 上方 */
  }

  /* ✅ 修正 2：展開時的處理 (滑出效果) */
  .custom-accordion > .ant-collapse-item-active > .ant-collapse-header {
    /* 展開時，Header 下方圓角變直，使其與內容無縫連接 */
    border-bottom-left-radius: 0px !important;
    border-bottom-right-radius: 0px !important;
    border-bottom: none !important;
  }

  /* 內容方塊樣式 (滑出的方塊) */
  .custom-accordion > .ant-collapse-item > .ant-collapse-content {
    border: 1px solid #f1f5f9 !important;
    border-top: none !important;
    background: white !important;
    /* 給內容加上下方圓角與同樣的深陰影 */
    border-bottom-left-radius: 20px !important;
    border-bottom-right-radius: 20px !important;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.08) !important;
    overflow: hidden;
  }

  .custom-accordion .ant-collapse-content-box {
    padding: 0 !important;
  }

  /* --- 2. Filter Label --- */
  .filter-label {
    display: block;
    font-size: 10px;
    font-weight: 900;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
    margin-left: 4px;
  }

  /* --- 3. Select 下拉選單與箭頭修正 --- */
  .custom-list-select.ant-select-single .ant-select-selector {
    height: 44px !important;
    border-radius: 12px !important;
    border: 1.5px solid #f1f5f9 !important;
    display: flex !important;
    align-items: center !important;
    font-weight: 600 !important;
    background-color: #fff !important;
  }

  .custom-list-select.ant-select-single .ant-select-selection-item,
  .custom-list-select.ant-select-single .ant-select-selection-placeholder {
    line-height: 41px !important;
  }

  .custom-list-select .ant-select-arrow {
    top: 50% !important;
    margin-top: 0 !important;
    transform: translateY(-50%) !important;
    right: 12px !important;
  }

  .custom-list-select:hover .ant-select-selector {
    border-color: #0d9488 !important;
  }

  /* 表格選取行樣式 */
  .selected-row {
    background-color: #f0fdfa !important;
  }
`}</style>
</div>
  );
};