import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Progress, Empty, DatePicker, Typography, Radio } from 'antd';
import { 
  ShopOutlined, LockOutlined, HourglassOutlined, 
  EnvironmentOutlined, CalendarOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text } = Typography;

export const Dashboard: React.FC<{ shops: Shop[], onNavigate?: (v: View) => void }> = ({ shops, onNavigate }) => {
  // 1. 狀態管理
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // 2. 頂部數據統計
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, closed, pending, percent };
  }, [shops]);

  // 3. 核心過濾邏輯 (修復日期匹配)
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      // 確保格式統一為 YYYY-MM-DD 再比對
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      const matchDate = shopDate === selectedDate;
      const matchGroup = groupFilter === 'all' || shop.groupId === groupFilter;
      return matchDate && matchGroup;
    });
  }, [shops, selectedDate, groupFilter]);

  // 4. Group 樣式設定
  const getGroupStyle = (groupId: number) => {
    const groupName = `Group ${String.fromCharCode(64 + groupId)}`;
    switch (groupId) {
      case 1: return { name: groupName, color: '#e0f2fe', textColor: '#0369a1' }; // Group A - Blue
      case 2: return { name: groupName, color: '#f3e8ff', textColor: '#7e22ce' }; // Group B - Purple
      case 3: return { name: groupName, color: '#ffedd5', textColor: '#c2410c' }; // Group C - Orange
      default: return { name: groupName, color: '#f1f5f9', textColor: '#475569' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Daily inventory operations</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>
          Generate Report
        </Button>
      </div>

      {/* 統計卡片區域 */}
      <Row gutter={24}>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Total" value={stats.total} icon={<ShopOutlined />} color="teal" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Finished" value={stats.completed} icon={<CheckCircleOutlined />} color="emerald" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl border-none shadow-sm"><StatisticCard label="Remaining" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Card></Col>
      </Row>

      {/* 列表與過濾器 */}
      <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-50">
        <div className="flex justify-between items-end mb-8">
          <div>
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Schedule Date</Text>
            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
              <CalendarOutlined className="text-teal-600" />
              <DatePicker 
                variant="borderless" 
                value={dayjs(selectedDate)}
                onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || '')}
                allowClear={false}
                className="font-bold p-0"
              />
            </div>
          </div>

          {/* ✅ Group Filter 移至右上方 */}
          <div className="flex flex-col items-end">
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Group Filter</Text>
            <Radio.Group 
              value={groupFilter} 
              onChange={(e) => setGroupFilter(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="all">ALL</Radio.Button>
              <Radio.Button value={1}>GROUP A</Radio.Button>
              <Radio.Button value={2}>GROUP B</Radio.Button>
              <Radio.Button value={3}>GROUP C</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {scheduledShops.length === 0 ? (
          <Empty description={`No shops scheduled for ${selectedDate}`} className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const style = getGroupStyle(shop.groupId);
              return (
                <div key={shop.id} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:bg-white transition-all">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-slate-400 shadow-sm"><ShopOutlined /></div>
                    <div>
                      <h4 className="font-bold text-slate-800 m-0">{shop.name}</h4>
                      <Text type="secondary" className="text-[11px]">{shop.address}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">District</span>
                      <span className="font-bold text-slate-700 text-xs">{shop.district}</span>
                    </div>
                    {/* ✅ Group 顯示優化 */}
                    <div className="px-4 py-1 rounded-lg text-center" style={{ backgroundColor: style.color }}>
                      <span className="font-black text-xs block" style={{ color: style.textColor }}>{style.name}</span>
                    </div>
                    <Tag color={shop.status === 'completed' ? 'green' : 'blue'} className="rounded-full border-none font-bold text-[10px]">
                      {shop.status === 'completed' ? 'DONE' : 'PLANNED'}
                    </Tag>
                    <Space>
                      <Button size="small" className="text-[11px] font-bold rounded-lg">Re-Schedule</Button>
                      <Button size="small" danger icon={<CloseCircleOutlined />} className="text-[11px] font-bold rounded-lg">Closed</Button>
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-6 text-center">
          <Button type="link" onClick={() => onNavigate?.(View.SHOP_LIST)} className="text-slate-400 font-bold">View Full Master Schedule</Button>
        </div>
      </div>
    </div>
  );
};

const StatisticCard = ({ label, value, icon, color }: any) => (
  <div className="flex justify-between items-start">
    <div><Text strong className="text-[10px] text-slate-400 uppercase block mb-1">{label}</Text><div className="text-2xl font-black">{value}</div></div>
    <div className={`text-${color}-600 bg-${color}-50 p-2 rounded-lg text-xl`}>{icon}</div>
  </div>
);
