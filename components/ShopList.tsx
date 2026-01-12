import React, { useState, useMemo } from 'react';
import { Table, Input, Card, Typography, Space, Tag, DatePicker, message, Modal } from 'antd';
import { 
  SearchOutlined, 
  EnvironmentOutlined, 
  ExclamationCircleOutlined,
  PhoneOutlined,
  UserOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';
import { ShopFormModal } from './ShopFormModal';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;
const { confirm } = Modal;

export const ShopList: React.FC<{ shops: Shop[], graphToken: string, onRefresh: () => void }> = ({ shops, graphToken, onRefresh }) => {
  const [searchText, setSearchText] = useState('');
  const [filterDate, setFilterDate] = useState<string | null>(null);
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);

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
            message.success("Status updated to CLOSED.");
            onRefresh();
          }
        } catch (err) { message.error("Update failed"); }
      },
    });
  };

  const filteredData = useMemo(() => {
    return shops.filter(s => {
      const matchText = (s.name || '').toLowerCase().includes(searchText.toLowerCase()) || (s.id || '').toLowerCase().includes(searchText.toLowerCase());
      const matchDate = filterDate ? dayjs(s.scheduledDate).format('YYYY-MM-DD') === filterDate : true;
      return matchText && matchDate;
    });
  }, [shops, searchText, filterDate]);

  const columns = [
    {
      title: 'Shop & Brand',
      key: 'shopInfo',
      width: '25%',
      render: (record: Shop) => {
        const isClosed = record.status?.toLowerCase() === 'closed';
        return (
          <Space direction="vertical" size={0}>
            <Text strong className={isClosed ? 'line-through opacity-50' : ''} style={{ fontSize: '15px' }}>
              {record.name}
            </Text>
            <Space>
              <Tag color={isClosed ? 'default' : 'blue'}>{record.brand}</Tag>
              <Text type="secondary" code style={{ fontSize: '10px' }}>{record.id}</Text>
            </Space>
          </Space>
        );
      },
    },
    {
      title: 'Location & Address',
      key: 'location',
      width: '30%',
      render: (record: Shop) => (
        <Space direction="vertical" size={0} className={record.status?.toLowerCase() === 'closed' ? 'opacity-40' : ''}>
          <Text size="small" strong><EnvironmentOutlined className="text-teal-600" /> {record.region} - {record.district}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{record.address}</Text>
        </Space>
      ),
    },
    {
      title: 'Contact Info', // ✅ 正確對接 field_37 & field_38
      key: 'contact',
      width: '20%',
      render: (record: Shop) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: '13px' }}><PhoneOutlined className="text-slate-400" /> {record.phone || '--'}</Text>
          <Text type="secondary" style={{ fontSize: '11px' }}><UserOutlined /> {record.contactName || 'N/A'}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
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
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', alignItems: 'center' }}>
            {selectedRowId === record.id && (
              <>
                <button className="Btn close-btn-styled" disabled={isClosed} onClick={(e) => { e.stopPropagation(); handleCloseAction(record); }}>
                  <div className="sign">
                    <svg viewBox="0 0 24 24"><path d="M 20 10 L 20 12 L 22 12 L 22 10 L 23 10 C 23.328 10.000 23.636 9.839 23.823 9.570 C 24.010 9.300 24.053 8.955 23.937 8.648 L 20.937 0.648 C 20.790 0.258 20.417 -0.000 20 0 L 4 0 C 3.583 -0.000 3.210 0.258 3.063 0.648 L 0.063 8.648 C -0.053 8.955 -0.010 9.300 0.177 9.570 C 0.364 9.839 0.672 10.000 1 10 L 2 10 L 2 12 L 4 12 L 4 10 z M 11 2 L 11 8 L 7.28 8 L 8.78 2 z M 15.22 2 L 16.72 8 L 13 8 L 13 2 z M 21.557 8 L 18.78 8 L 17.28 2 L 19.307 2 z M 4.693 2 L 6.72 2 L 5.22 8 L 2.443 8 z M 2 23 C 2 23.552 2.448 24 3 24 L 21 24 C 21.552 24 22 23.552 22 23 L 22 22 L 2 22 z M 4 18.659 L 1.341 18.659 L 1.341 15.341 L 4 15.341 L 4 14 L 0.671 14 C 0.301 14.000 0.001 14.300 0 14.67 L 0 19.33 C 0.001 19.700 0.301 20.000 0.671 20 L 4 20 z M 10.265 14 C 9.895 14.000 9.595 14.300 9.594 14.67 L 9.594 19.33 C 9.595 19.700 9.895 20.000 10.265 20 L 13.33 20 C 13.700 19.999 13.999 19.700 14 19.33 L 14 14.67 C 13.999 14.300 13.700 14.001 13.33 14 z M 12.659 18.659 L 10.935 18.659 L 10.935 15.341 L 12.659 15.341 z M 5.265 14 L 5.265 19.33 C 5.266 19.700 5.565 19.999 5.935 20 L 8 20 L 8 18.659 L 6.606 18.659 L 6.606 14 z M 24 15.341 L 24 14 L 20.935 14 C 20.565 14.001 20.266 14.300 20.265 14.67 L 20.265 19.33 C 20.266 19.700 20.565 19.999 20.935 20 L 24 20 L 24 18.659 L 21.606 18.659 L 21.606 17.641 L 23.234 17.641 L 23.234 16.3 L 21.606 16.3 L 21.606 15.341 z M 17.787 18.659 L 15.305 18.659 L 15.305 20 L 17.787 20 C 18.792 19.999 19.606 19.185 19.607 18.18 C 19.611 17.163 18.803 16.329 17.787 16.3 L 17.021 16.3 C 16.765 16.288 16.563 16.077 16.563 15.821 C 16.563 15.564 16.765 15.353 17.021 15.341 L 19.5 15.341 L 19.5 14 L 17.021 14 C 16.032 14.023 15.243 14.831 15.243 15.821 C 15.243 16.810 16.032 17.618 17.021 17.641 L 17.787 17.641 C 18.062 17.670 18.270 17.904 18.266 18.18 C 18.265 18.444 18.051 18.658 17.787 18.659 z" /></svg>
                  </div>
                  <div className="btn-text">Close</div>
                </button>

                <button className="Btn edit-btn-styled" disabled={isClosed} onClick={(e) => { e.stopPropagation(); setTargetShop(record); setFormOpen(true); }}>
                  <div className="sign">
                    <svg viewBox="0 0 512 512"><path d="M410.3 231l11.3-11.3-33.9-33.9-62.1-62.1L291.7 89.8l-11.3 11.3-22.6 22.6L58.6 322.9c-10.4 10.4-18 23.3-22.2 37.4L1 480.7c-2.5 8.4-.2 17.5 6.1 23.7s15.3 8.5 23.7 6.1l120.3-35.4c14.1-4.2 27-11.8 37.4-22.2L387.7 253.7 410.3 231zM160 399.4l-9.1 22.7c-4 3.1-8.5 5.4-13.3 6.9L59.4 452l23-78.1c1.4-4.9 3.8-9.4 6.9-13.3l22.7-9.1v32c0 8.8 7.2 16 16 16h32zM362.7 18.7L348.3 33.2 325.7 55.8 314.3 67.1l33.9 33.9 62.1 62.1 33.9 33.9 11.3-11.3 22.6-22.6 14.5-14.5c25-25 25-65.5 0-90.5L453.3 18.7c-25-25-65.5-25-90.5 0zm-47.4 168l-144 144c-6.2 6.2-16.4 6.2-22.6 0s-6.2-16.4 0-22.6l144-144c6.2-6.2 16.4-6.2 22.6 0s6.2 16.4 0 22.6z"></path></svg>
                  </div>
                  <div className="btn-text">Edit</div>
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-6 pb-10">
      {/* 標題與副標題移出容器 */}
      <div className="mb-2">
        <Title level={2} className="m-0 text-slate-800">Shop Master List</Title>
        <Text className="text-slate-400 font-medium">Manage and filter all store locations across regions.</Text>
      </div>

      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white">
        <div className="p-8">
          <div className="flex justify-between items-center">
            {/* 左側：New Shop 伸縮按鈕 */}
            <button className="Btn new-btn-styled" onClick={() => { setTargetShop(null); setFormOpen(true); }}>
              <div className="sign">
                 <PlusOutlined style={{ color: 'white', fontSize: '18px' }} />
              </div>
              <div className="btn-text">New Shop</div>
            </button>

            {/* 右側：搜尋框與日期篩選併排 */}
            <Space size="middle">
              <Input 
                placeholder="Search shop..." 
                prefix={<SearchOutlined />} 
                className="w-72 h-11 rounded-xl bg-slate-50 border-none" 
                onChange={e => setSearchText(e.target.value)} 
              />
              
              <DatePicker 
                onChange={d => setFilterDate(d?.format('YYYY-MM-DD') || null)} 
                className="h-11 rounded-xl font-bold border-slate-200 w-44"
                placeholder="Schedule Date"
              />
            </Space>
          </div>

          <div className="mt-8 st-master-table">
            <Table 
              columns={columns} 
              dataSource={filteredData} 
              rowKey="id"
              pagination={{ pageSize: 10 }}
              onRow={(record) => ({ onClick: () => setSelectedRowId(record.id === selectedRowId ? null : record.id) })}
              rowClassName={(record) => record.id === selectedRowId ? 'selected-row cursor-pointer' : 'cursor-pointer'}
            />
          </div>
        </div>
      </Card>

      <ShopFormModal visible={formOpen} shop={targetShop} onCancel={() => setFormOpen(false)} onSuccess={() => { setFormOpen(false); onRefresh(); }} graphToken={graphToken} />
    </div>
  );
};
