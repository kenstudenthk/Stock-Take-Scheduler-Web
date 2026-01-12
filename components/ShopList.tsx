import React, { useState, useMemo } from 'react';
import { Table, Input, Card, Typography, Space, Tag, Empty, message, Modal } from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EnvironmentOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined 
} from '@ant-design/icons';
import { Shop } from '../types';
import { ShopFormModal } from './ShopFormModal';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { confirm } = Modal;

interface Props {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
}

export const ShopList: React.FC<Props> = ({ shops, graphToken, onRefresh }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);

  // --- 邏輯：完全複刻 Dashboard 的 Closed 功能 ---
  const handleCloseShop = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to set ${shop.name} to CLOSED?`,
      okText: 'Yes, Close it',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await fetch(
            `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
            {
              method: 'PATCH',
              headers: { 
                'Authorization': `Bearer ${graphToken}`, 
                'Content-Type': 'application/json' 
              },
              body: JSON.stringify({ [SP_FIELDS.STATUS]: 'CLOSED' })
            }
          );
          if (res.ok) {
            message.success("Shop closed successfully");
            onRefresh();
          }
        } catch (err) {
          message.error("Sync failed");
        }
      },
    });
  };

  const filteredData = useMemo(() => {
    return shops.filter(s => 
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.id.toLowerCase().includes(searchText.toLowerCase()) ||
      s.district.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [shops, searchText]);

  // --- 恢復所有表格欄位 ---
  const columns = [
    {
      title: 'Shop & Brand',
      key: 'shopInfo',
      width: '25%',
      render: (record: Shop) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ fontSize: '15px' }}>{record.name}</Text>
          <Space>
            <Tag color="blue" className="rounded-md font-bold">{record.brand}</Tag>
            <Text type="secondary" code>{record.id}</Text>
          </Space>
        </Space>
      ),
    },
    {
      title: 'Location Detail',
      key: 'location',
      width: '35%',
      render: (record: Shop) => (
        <Space direction="vertical" size={0}>
          <Text size="small">
            <EnvironmentOutlined className="text-teal-600" /> {record.region} - {record.district}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.address}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: '12%',
      render: (status: string) => (
        <Tag color={status === 'CLOSED' ? 'red' : 'green'} className="font-bold">
          {status}
        </Tag>
      )
    },
    {
      title: '',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Shop) => (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', alignItems: 'center' }}>
          {selectedRowId === record.id && (
            <>
              {/* ✅ 使用 Dashboard 風格的按鈕 */}
              <button 
                className="dashboard-close-btn"
                onClick={(e) => { e.stopPropagation(); handleCloseShop(record); }}
              >
                <CheckCircleOutlined /> CLOSED
              </button>

              {/* ✅ 原本的 Uiverse Edit 按鈕 */}
              <button 
                className="edit-button" 
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setTargetShop(record);
                  setFormOpen(true);
                }}
              >
                <svg className="edit-svgIcon" viewBox="0 0 512 512">
                  <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                </svg>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Space direction="vertical">
          <Title level={2} style={{ margin: 0 }}>Shop Master List</Title>
          <Text type="secondary">Manage your SPO location database</Text>
          
          <button 
            className="new-shop-btn" 
            style={{ marginTop: '10px' }}
            onClick={() => { setTargetShop(null); setFormOpen(true); }}
          >
            <PlusOutlined /> New Shop
          </button>
        </Space>

        <Input
          placeholder="Search name, code or district..."
          prefix={<SearchOutlined className="text-slate-400" />}
          className="w-80 h-12 rounded-xl shadow-inner bg-slate-50 border-none"
          onChange={e => setSearchText(e.target.value)}
        />
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden st-master-table">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          pagination={{ pageSize: 10, showSizeChanger: false }}
          onRow={(record) => ({
            onClick: () => setSelectedRowId(record.id === selectedRowId ? null : record.id),
          })}
          rowClassName={(record) => record.id === selectedRowId ? 'selected-row cursor-pointer' : 'cursor-pointer'}
          locale={{ emptyText: <Empty description="No Shops Found" /> }}
        />
      </Card>

      <ShopFormModal 
        visible={formOpen}
        shop={targetShop}
        onCancel={() => setFormOpen(false)}
        onSuccess={() => { setFormOpen(false); onRefresh(); }}
        graphToken={graphToken}
      />
    </div>
  );
};
