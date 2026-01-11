import React, { useState, useMemo } from 'react';
import { Table, Card, Row, Col, Statistic, Select, Input, Button, Space, Tag, Typography, Badge, DatePicker, Divider, Avatar } from 'antd';
import { 
  SearchOutlined, 
  FileExcelOutlined, 
  FilterOutlined, 
  ShopOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  StopOutlined,
  PlusOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop } from '../types';

const { Text, Title } = Typography;

export const ShopList: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  const [searchText, setSearchText] = useState('');
  const [filterRegion, setFilterRegion] = useState('all');
  const [filterDistrict, setFilterDistrict] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterGroup, setFilterGroup] = useState<number | 'all'>('all');
  const [filterDate, setFilterDate] = useState<string | null>(null);

  // ✅ Helper for Group Row Coloring
  const getGroupRowStyle = (groupId: number) => {
    switch (groupId) {
      case 1: return { backgroundColor: '#f0f9ff' }; // Group A
      case 2: return { backgroundColor: '#faf5ff' }; // Group B
      case 3: return { backgroundColor: '#fff7ed' }; // Group C
      default: return {};
    }
  };

  const filteredData = useMemo(() => {
    return shops.filter(shop => {
      const search = searchText.toLowerCase();
      const matchSearch = (shop.name || '').toLowerCase().includes(search) || (shop.id || '').toLowerCase().includes(search);
      const matchRegion = filterRegion === 'all' || shop.region === filterRegion;
      const matchDistrict = filterDistrict === 'all' || shop.district === filterDistrict;
      const matchStatus = filterStatus === 'all' || shop.status === filterStatus;
      const matchGroup = filterGroup === 'all' || shop.groupId === filterGroup;
      const matchDate = !filterDate || (shop.scheduledDate && dayjs(shop.scheduledDate).format('YYYY-MM-DD') === filterDate);

      return matchSearch && matchRegion && matchDistrict && matchStatus && matchGroup && matchDate;
    });
  }, [shops, searchText, filterRegion, filterDistrict, filterStatus, filterGroup, filterDate]);

  const stats = useMemo(() => ({
    total: filteredData.length,
    completed: filteredData.filter(s => s.status === 'completed').length,
    pending: filteredData.filter(s => s.status === 'pending').length,
    closed: filteredData.filter(s => s.status === 'closed').length,
  }), [filteredData]);

  // --- 3. 表格欄位定義 (Updated as per request) ---
  const columns = [
    { 
      title: '', 
      dataIndex: 'brandIcon', 
      width: 60, 
      render: (src: string) => <Avatar src={src} shape="square" className="border border-slate-100 bg-white" /> 
    },
    { 
      title: 'Shop Name', 
      dataIndex: 'name', 
      className: 'font-bold text-slate-800' 
    },
    { 
      title: 'Area', 
      dataIndex: 'area', 
      render: (t: string) => <Text className="text-xs font-semibold">{t}</Text>
    },
    { 
      title: 'Location Details', 
      render: (_: any, r: Shop) => (
        <div className="flex flex-col gap-0.5">
          <Text strong style={{ fontSize: '12px' }} className="text-slate-500">{r.district}</Text>
          <Text type="secondary" style={{ fontSize: '10px' }} className="uppercase tracking-widest">{r.region}</Text>
        </div>
      )
    },
    { 
      title: 'Schedule Date', 
      dataIndex: 'scheduledDate', 
      render: (d: string) => d ? <span className="font-mono text-blue-600 font-bold">{dayjs(d).format('YYYY-MM-DD')}</span> : <Text type="secondary">Not Set</Text> 
    },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      render: (s: string) => (
        <Tag color={s === 'completed' ? 'green' : s === 'closed' ? 'red' : 'blue'} className="rounded-full px-4 border-none font-bold uppercase text-[9px]">
          {s}
        </Tag>
      )
    },
    { 
      title: 'Group', 
      dataIndex: 'groupId', 
      width: 120,
      render: (g: number) => {
        const labels: Record<number, string> = { 1: 'Group A', 2: 'Group B', 3: 'Group C' };
        return g > 0 ? <Badge status="processing" color={g === 1 ? 'blue' : g === 2 ? 'purple' : 'orange'} text={labels[g]} /> : '-';
      }
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-10">
      <style>{`
        /* ✅ New Shop Button CSS */
        .new-shop-btn {
          padding: 1.1em 2.5em;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          font-weight: 700;
          color: #000;
          background-color: #fff;
          border: none;
          border-radius: 45px;
          box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease 0s;
          cursor: pointer;
          outline: none;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .new-shop-btn:hover {
          background-color: #23c483;
          box-shadow: 0px 15px 20px rgba(46, 229, 157, 0.4);
          color: #fff;
          transform: translateY(-7px);
        }
        .new-shop-btn:active { transform: translateY(-1px); }

        /* ✅ Table Custom Styling */
        .st-master-table .ant-table-thead > tr > th {
          background-color: #0d9488 !important;
          color: white !important;
          font-weight: 800 !important;
          text-transform: uppercase;
          font-size: 11px;
          padding: 16px !important;
        }
      `}</style>

      <div className="flex justify-between items-end">
        <div>
          <Title level={2} className="m-0 text-slate-900">Shop Master List</Title>
          <p className="text-slate-500 font-medium mb-6">Manage across {shops.length} stores with advanced filters.</p>
          
          {/* ✅ New Shop Button */}
          <button className="new-shop-btn">
            <PlusOutlined /> New Shop
          </button>
        </div>
        <Button 
          type="primary" 
          icon={<FileExcelOutlined />} 
          className="bg-emerald-600 hover:bg-emerald-700 border-none h-12 px-8 rounded-2xl font
