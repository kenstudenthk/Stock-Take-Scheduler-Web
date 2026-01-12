import React, { useState, useMemo } from 'react';
import { Table, Input, Card, Typography, Space, Tag, Empty, message, Modal } from 'antd';
import { SearchOutlined, PlusOutlined, EnvironmentOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { Shop } from '../types';
import { ShopFormModal } from './ShopFormModal';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { confirm } = Modal;

export const ShopList: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  const [searchText, setSearchText] = useState('');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);

  // 🔴 關閉動作邏輯 (複刻 Dashboard)
  const handleCloseAction = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
      content: `Are you sure you want to set ${shop.name} to CLOSED?`,
      okText: 'Confirm',
      okType: 'danger',
      onOk: async () => {
        try {
          const res = await fetch(
            `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`,
            {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ [SP_FIELDS.STATUS]: 'CLOSED' })
            }
          );
          if (res.ok) {
            message.success("Shop has been closed.");
            onRefresh();
          }
        } catch (err) { message.error("Sync Failed"); }
      },
    });
  };

  const filteredData = useMemo(() => {
    return shops.filter(s => 
      s.name.toLowerCase().includes(searchText.toLowerCase()) ||
      s.id.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [shops, searchText]);

  const columns = [
    {
      title: 'Shop & Brand',
      key: 'shopInfo',
      width: '30%',
      render: (record: Shop) => {
        const isClosed = record.status?.toLowerCase() === 'closed';
        return (
          <Space direction="vertical" size={0}>
            <Text strong className={`${isClosed ? 'line-through decoration-red-500 decoration-2 opacity-50' : ''}`} style={{ fontSize: '15px' }}>
              {record.name}
            </Text>
            <Space>
              <Tag color={isClosed ? 'default' : 'blue'}>{record.brand}</Tag>
              <Text type="secondary" code>{record.id}</Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Location Detail',
      key: 'location',
      render: (record: Shop) => (
        <Space direction="vertical" size={0} className={record.status?.toLowerCase() === 'closed' ? 'opacity-40' : ''}>
          <Text size="small"><EnvironmentOutlined className="text-teal-600" /> {record.region} - {record.district}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}>{record.address}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={status?.toLowerCase() === 'closed' ? 'red' : 'green'} className="font-bold">{status}</Tag>
      )
    },
    {
      title: '',
      key: 'actions',
      align: 'right' as const,
      render: (_: any, record: Shop) => {
        const isClosed = record.status?.toLowerCase() === 'closed';
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', alignItems: 'center' }}>
            {selectedRowId === record.id && (
              <>
                {/* 🔴 Dashboard 同款 Bin Button */}
                <button 
                  className="bin-button" 
                  disabled={isClosed} 
                  onClick={(e) => { e.stopPropagation(); handleCloseAction(record); }}
                >
                  <svg viewBox="0 0 448 512" className="bin-svgIcon">
                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                  </svg>
                </button>

                {/* 🔵 Edit Button */}
                <button 
                  className="edit-button" 
                  disabled={isClosed}
                  onClick={(e) => { e.stopPropagation(); setTargetShop(record); setFormOpen(true); }}
                >
                  <svg className="edit-svgIcon" viewBox="0 0 512 512">
                    <path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path>
                  </svg>
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <Space direction="vertical">
          <Title level={2} style={{ margin: 0 }}>Shop Master List</Title>
          <Text type="secondary">Total {filteredData.length} active and closed locations</Text>
          <button className="new-shop-btn" style={{ marginTop: '10px' }} onClick={() => { setTargetShop(null); setFormOpen(true); }}>
            <PlusOutlined /> New Shop
          </button>
        </Space>
        <Input placeholder="Search shop..." prefix={<SearchOutlined />} className="w-80 h-12 rounded-xl bg-slate-50 border-none" onChange={e => setSearchText(e.target.value)} />
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-100 overflow-hidden st-master-table">
        <Table 
          columns={columns} 
          dataSource={filteredData} 
          rowKey="id"
          onRow={(record) => ({ onClick: () => setSelectedRowId(record.id === selectedRowId ? null : record.id) })}
          rowClassName={(record) => {
            let cls = 'cursor-pointer ';
            if (record.id === selectedRowId) cls += 'selected-row ';
            if (record.status?.toLowerCase() === 'closed') cls += 'opacity-60 bg-slate-50 ';
            return cls;
          }}
        />
      </Card>

      <ShopFormModal visible={formOpen} shop={targetShop} onCancel={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); onRefresh(); }} graphToken={graphToken} />
    </div>
  );
};
