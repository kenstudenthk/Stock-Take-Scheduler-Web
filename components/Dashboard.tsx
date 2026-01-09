import React, { useMemo } from 'react';
import { Card, Tag, Space, Button, Row, Col, Progress, Statistic, Empty } from 'antd';
import { ShopOutlined, CheckCircleOutlined, LockOutlined, HourglassOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { Shop } from '../types';

interface DashboardProps {
  shops: Shop[];
}

export const Dashboard: React.FC<DashboardProps> = ({ shops }) => {
  // 1. 計算數據統計
  const stats = useMemo(() => {
    const total = shops.length;
    const completed = shops.filter(s => s.status === 'completed').length;
    const closed = shops.filter(s => s.status === 'closed').length;
    const pending = total - completed - closed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, closed, pending, percent };
  }, [shops]);

  return (
    <div className="flex flex-col gap-8">
      {/* --- 歡迎英雄區塊 --- */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1">Welcome back, John</h1>
          <p className="text-slate-500 font-medium">Here's the inventory status for your {stats.total} shops.</p>
        </div>
        <Button className="rounded-xl border-slate-200 font-bold px-6">Generate Report</Button>
      </div>

      {/* --- 統計卡片列 --- */}
      <Row gutter={24}>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Total Shop</div>
                <div className="text-3xl font-bold text-slate-800">{stats.total}</div>
                <div className="mt-4 text-emerald-500 text-[10px] font-bold">+ 3 new <span className="text-slate-300">this month</span></div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><ShopOutlined className="text-xl" /></div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <div className="flex justify-between items-start">
              <div className="flex-1 mr-4">
                <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Completed</div>
                <div className="text-3xl font-bold text-slate-800">{stats.completed}</div>
                <Progress percent={stats.percent} size="small" strokeColor="#10b981" className="mt-4" />
                <div className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex justify-between">Percentage <span>{stats.percent}%</span></div>
              </div>
              <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600"><CheckCircleOutlined className="text-xl" /></div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Closed</div>
                <div className="text-3xl font-bold text-slate-800">{stats.closed}</div>
                <div className="mt-6 text-slate-400 text-[10px] font-bold uppercase">● Inactive status</div>
              </div>
              <div className="bg-slate-50 p-3 rounded-2xl text-slate-400"><LockOutlined className="text-xl" /></div>
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card className="rounded-2xl shadow-sm border-slate-100">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-slate-400 text-[10px] font-bold uppercase mb-1 tracking-wider">Remain</div>
                <div className="text-3xl font-bold text-slate-800">{stats.pending}</div>
                <div className="mt-6 text-orange-500 text-[10px] font-bold bg-orange-50 px-2 py-0.5 rounded-lg uppercase">⚠️ Action needed</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-2xl text-orange-400"><HourglassOutlined className="text-xl" /></div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* --- 最近排程列表 (條目式設計) --- */}
      <div className="mt-4">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-bold text-slate-800 m-0">Today's Scheduled Shop</h3>
          <Button type="link" className="text-teal-600 font-bold">View Full Schedule</Button>
        </div>

        {shops.length === 0 ? (
          <Empty description="No data found in SPO pool" />
        ) : (
          <div className="flex flex-col gap-4">
            {shops.slice(0, 5).map(shop => (
              <div key={shop.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between hover:border-teal-100 transition-colors">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400"><ShopOutlined /></div>
                    <div>
                      <h4 className="font-bold text-slate-800 m-0">{shop.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <EnvironmentOutlined className="text-[10px]" /> {shop.address}
                      </div>
                    </div>
                 </div>
                 <div className="flex items-center gap-10">
                    {/* ✅ 顯示 District 和 Area，隱藏 Region */}
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">District</span>
                       <span className="font-bold text-slate-700 text-sm">{shop.district || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">Area</span>
                       <span className="font-bold text-slate-700 text-sm">{shop.area || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                       <span className="text-[10px] text-slate-400 font-bold uppercase">Group</span>
                       <span className="font-bold text-slate-700 text-sm">Retail {shop.groupId ? String.fromCharCode(64 + shop.groupId) : '-'}</span>
                    </div>
                    <Tag color={shop.status === 'completed' ? 'green' : 'blue'} className="rounded-full px-4 border-none font-bold uppercase text-[10px]">
                      {shop.status === 'completed' ? 'Finished' : 'Scheduled'}
                    </Tag>
                    <Space>
                       <Button size="small" className="text-[11px] font-bold border-slate-200">Re-Schedule</Button>
                    </Space>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};