import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Progress, Empty, Select, DatePicker, Typography } from 'antd';
import { 
  ShopOutlined, CheckCircleOutlined, LockOutlined, 
  HourglassOutlined, EnvironmentOutlined, FilterOutlined,
  CalendarOutlined, CloseCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text } = Typography;

interface DashboardProps {
  shops: Shop[];
  onNavigate?: (view: View) => void; // 用於跳轉頁面
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  // 1. 頂部統計數據 (基於全部數據)
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, closed, pending, percent };
  }, [shops]);

  // 2. 獲取特定日期與小組的排程列表
  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      const matchDate = shop.scheduledDate === selectedDate;
      const matchGroup = groupFilter === 'all' || shop.groupId === groupFilter;
      return matchDate && matchGroup;
    });
  }, [shops, selectedDate, groupFilter]);

  // 3. 定義 Group 的專屬顏色
  const getGroupStyle = (groupId: number) => {
    const groupName = `Group ${String.fromCharCode(64 + groupId)}`;
    switch (groupId) {
      case 1: return { name: groupName, color: '#e0f2fe', textColor: '#0369a1', tag: 'blue' }; // A - 藍
      case 2: return { name: groupName, color: '#f3e8ff', textColor: '#7e22ce', tag: 'purple' }; // B - 紫
      case 3: return { name: groupName, color: '#ffedd5', textColor: '#c2410c', tag: 'orange' }; // C - 橙
      default: return { name: groupName, color: '#f1f5f9', textColor: '#475569', tag: 'default' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      {/* --- 1. 歡迎區塊 --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Monitoring inventory status for {stats.total} total shops.</p>
        </div>
        <Button 
          className="rounded-xl border-slate-200 font-bold px-6 h-11"
          onClick={() => window.print()} // ✅ 先設為打印當前頁面
        >
          Generate Report
        </Button>
      </div>

      {/* --- 2. 統計卡片 (略，維持原樣) --- */}
      <Row gutter={24}>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-slate-100">
          <StatisticCard label="Total Shop" value={stats.total} icon={<ShopOutlined />} color="emerald" />
        </Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-slate-100 p-0">
          <div className="flex flex-col h-full">
            <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">Completed</span>
            <span className="text-3xl font-bold">{stats.completed}</span>
            <Progress percent={stats.percent} size="small" strokeColor="#10b981" className="mt-4" />
          </div>
        </Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-slate-100"><StatisticCard label="Closed" value={stats.closed} icon={<LockOutlined />} color="slate" /></Card></Col>
        <Col span={6}><Card className="rounded-2xl shadow-sm border-slate-100"><StatisticCard label="Remain" value={stats.pending} icon={<HourglassOutlined />} color="orange" /></Card></Col>
      </Row>

      {/* --- 3. 列表控制列 (Date Picker & Group Filter) --- */}
      <div className="mt-4">
        <div className="flex justify-between items-center mb-6">
          <Space size="middle">
            <h3 className="text-xl font-bold text-slate-800 m-0">Daily Schedule</h3>
            <div className="bg-white p-1 rounded-xl border border-slate-100 flex items-center gap-2 px-3">
              <CalendarOutlined className="text-teal-600" />
              <DatePicker 
                variant="borderless" 
                defaultValue={dayjs()} 
                onChange={(date) => setSelectedDate(date?.format('YYYY-MM-DD') || '')}
                allowClear={false}
                className="font-bold text-slate-600"
              />
            </div>
            <div className="bg-white p-1 rounded-xl border border-slate-100 flex items-center gap-2 px-3">
              <FilterOutlined className="text-teal-600" />
              <Select
                variant="borderless"
                defaultValue="all"
                className="font-bold w-32"
                onChange={setGroupFilter}
                options={[
                  { value: 'all', label: 'All Groups' },
                  { value: 1, label: 'Group A' },
                  { value: 2, label: 'Group B' },
                  { value: 3, label: 'Group C' },
                ]}
              />
            </div>
          </Space>
          <Button 
            type="link" 
            className="text-teal-600 font-bold"
            onClick={() => onNavigate?.(View.SHOP_LIST)} // ✅ 連結到 Shop List
          >
            View Full Schedule
          </Button>
        </div>

        {/* --- 4. 列表展示 --- */}
        {scheduledShops.length === 0 ? (
          <Card className="rounded-3xl border-dashed border-2 border-slate-100 bg-slate-50/50">
            <Empty description={`No shops scheduled for ${selectedDate}`} />
          </Card>
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const groupStyle = getGroupStyle(shop.groupId);
              return (
                <div key={shop.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-teal-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><ShopOutlined /></div>
                    <div>
                      <h4 className="font-bold text-slate-800 m-0">{shop.name}</h4>
                      <Text type="secondary" className="text-[11px]"><EnvironmentOutlined /> {shop.address}</Text>
                    </div>
                  </div>
                  <div className="flex items-center gap-10">
                    <div className="flex flex-col w-20">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">District</span>
                      <span className="font-bold text-slate-700 text-sm">{shop.district || 'N/A'}</span>
                    </div>
                    {/* ✅ Group 顏色優化 */}
                    <div 
                      className="px-4 py-1.5 rounded-lg flex flex-col items-center min-w-[80px]" 
                      style={{ backgroundColor: groupStyle.color }}
                    >
                      <span className="text-[9px] font-bold uppercase" style={{ color: groupStyle.textColor }}>Team</span>
                      <span className="font-black text-sm" style={{ color: groupStyle.textColor }}>{groupStyle.name}</span>
                    </div>
                    <Tag color={shop.status === 'completed' ? 'green' : 'blue'} className="rounded-full px-4 border-none font-bold uppercase text-[10px]">
                      {shop.status === 'completed' ? 'Finished' : 'Scheduled'}
                    </Tag>
                    {/* ✅ 按鈕組更新 */}
                    <Space>
                      <Button size="small" className="text-[11px] font-bold border-slate-200">Re-Schedule</Button>
                      <Button size="small" danger icon={<CloseCircleOutlined />} className="text-[11px] font-bold">Closed</Button>
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// 輔助組件：統計卡片內的小標籤
const StatisticCard = ({ label, value, icon, color }: any) => (
  <div className="flex justify-between items-start">
    <div>
      <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">{label}</div>
      <div className="text-3xl font-bold text-slate-800">{value}</div>
    </div>
    <div className={`bg-${color}-50 p-3 rounded-2xl text-${color}-600`}>{icon}</div>
  </div>
);
