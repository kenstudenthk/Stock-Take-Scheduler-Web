import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Progress, Empty, DatePicker, Typography, Radio } from 'antd';
import { 
  ShopOutlined, 
  LockOutlined, 
  HourglassOutlined, 
  EnvironmentOutlined, 
  CalendarOutlined, 
  CloseCircleOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, View } from '../types';

const { Text } = Typography;

interface DashboardProps {
  shops: Shop[];
  onNavigate?: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ shops, onNavigate }) => {
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');

  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, closed, pending, percent };
  }, [shops]);

  const scheduledShops = useMemo(() => {
    return shops.filter(shop => {
      if (!shop.scheduledDate) return false;
      const shopDate = dayjs(shop.scheduledDate).format('YYYY-MM-DD');
      const matchDate = shopDate === selectedDate;
      const matchGroup = groupFilter === 'all' || shop.groupId === groupFilter;
      return matchDate && matchGroup;
    });
  }, [shops, selectedDate, groupFilter]);

  const getGroupStyle = (groupId: number) => {
    const groupName = `Group ${String.fromCharCode(64 + groupId)}`;
    switch (groupId) {
      case 1: return { name: groupName, color: '#e0f2fe', textColor: '#0369a1' }; 
      case 2: return { name: groupName, color: '#f3e8ff', textColor: '#7e22ce' }; 
      case 3: return { name: groupName, color: '#ffedd5', textColor: '#c2410c' }; 
      default: return { name: groupName, color: '#f1f5f9', textColor: '#475569' };
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Stock Take Dashboard</h1>
          <p className="text-slate-500 font-medium">Daily operations for {selectedDate}</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6 h-11 bg-white" onClick={() => window.print()}>
          Generate Report
        </Button>
      </div>

      <Row gutter={24}>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Total Shops</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black">{stats.total}</span>
              <ShopOutlined className="text-teal-600 text-xl opacity-20" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Finished</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-emerald-600">{stats.completed}</span>
              <CheckCircleOutlined className="text-emerald-500 text-xl opacity-20" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Closed</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-400">{stats.closed}</span>
              <LockOutlined className="text-slate-300 text-xl" />
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-none bg-white">
            <div className="text-slate-400 text-[10px] font-bold uppercase mb-1">Remaining</div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-orange-500">{stats.pending}</span>
              <HourglassOutlined className="text-orange-200 text-xl" />
            </div>
          </Card>
        </Col>
      </Row>

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

          <div className="flex flex-col items-end">
            <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest block mb-2">Filter by Group</Text>
            <Radio.Group value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} buttonStyle="solid">
              <Radio.Button value="all">ALL</Radio.Button>
              <Radio.Button value={1}>GROUP A</Radio.Button>
              <Radio.Button value={2}>GROUP B</Radio.Button>
              <Radio.Button value={3}>GROUP C</Radio.Button>
            </Radio.Group>
          </div>
        </div>

        {scheduledShops.length === 0 ? (
          <Empty description={`No shops found for ${selectedDate}`} className="py-10" />
        ) : (
          <div className="flex flex-col gap-4">
            {scheduledShops.map(shop => {
              const style = getGroupStyle(shop.groupId);
              return (
                <div key={shop.id} className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:bg-white transition-all shadow-sm">
                  <div className="flex items-center gap-4 flex-1">
                    {/* ✅ 優化後的 Logo 顯示區域 */}
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center shadow-sm overflow-hidden border border-slate-100">
                      {shop.brandIcon ? (
                        <img 
                          src={shop.brandIcon} 
                          alt={shop.brand} 
                          className="h-full w-full object-contain p-1" // object-contain 確保 Logo 不會變形
                          onError={(e) => {
                            // 如果圖片載入失敗，顯示預設圖示
                            (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/606/606201.png'; 
                          }}
                        />
                      ) : (
                        <ShopOutlined className="text-slate-300 text-xl" />
                      )}
                    </div>
                    
                    <div style={{ maxWidth: '250px' }}>
                      <div className="flex items-center gap-2">
                         <h4 className="font-bold text-slate-800 m-0 truncate">{shop.name}</h4>
                         {/* 加入品牌名稱的小標籤 */}
                         <span className="text-[9px] bg-slate-200 px-1.5 rounded font-black text-slate-500 uppercase">{shop.brand}</span>
                      </div>
                      <Text type="secondary" className="text-[11px] truncate block"><EnvironmentOutlined /> {shop.address}</Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-right" style={{ flex: 2, justifyContent: 'flex-end' }}>
                    {/* ✅ District & Area 欄位 */}
                    <div className="flex flex-col w-28 text-left">
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">District / Area</span>
                      <span className="font-bold text-slate-700 text-xs truncate">{shop.district || 'N/A'}</span>
                      <span className="text-[10px] text-slate-400 truncate">{shop.area || '-'}</span>
                    </div>
                    
                    {/* Group Tag */}
                    <div className="px-3 py-1 rounded-lg text-center min-w-[85px]" style={{ backgroundColor: style.color }}>
                      <span className="font-black text-[11px] block" style={{ color: style.textColor }}>{style.name}</span>
                    </div>

                    {/* Status Tag */}
                    <Tag color={shop.status === 'completed' ? 'green' : 'blue'} className="rounded-full border-none font-bold text-[9px] px-3 m-0">
                      {shop.status === 'completed' ? 'DONE' : 'PLANNED'}
                    </Tag>

                    {/* Actions */}
                    <Space size="small">
                      <Button size="small" className="text-[10px] font-bold rounded-lg border-slate-200">Re-Schedule</Button>
                      <Button size="small" danger icon={<CloseCircleOutlined />} className="text-[10px] font-bold rounded-lg" />
                    </Space>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        <div className="mt-8 text-center">
          <Button type="link" onClick={() => onNavigate?.(View.SHOP_LIST)} className="text-slate-400 font-bold hover:text-teal-600">
            View Full Master Schedule
          </Button>
        </div>
      </div>
    </div>
  );
};
