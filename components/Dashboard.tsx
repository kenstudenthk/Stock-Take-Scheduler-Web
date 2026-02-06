import React, { useMemo, useState } from 'react';
import { Card, Tag, Space, Button, Row, Col, Empty, DatePicker, Typography, Modal, message } from 'antd';
import { 
  ShopOutlined, HourglassOutlined, CheckCircleOutlined, 
  PrinterOutlined, EnvironmentOutlined, CalendarOutlined,
  CloseCircleOutlined, ExclamationCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { Shop, User, hasPermission } from '../types';
import { SP_FIELDS } from '../constants';

const { Text, Title } = Typography;
const { confirm } = Modal;

const HK_HOLIDAYS_2026 = [
  "2026-01-01", "2026-02-17", "2026-02-18", "2026-02-19", 
  "2026-04-03", "2026-04-04", "2026-04-05", "2026-04-06", "2026-04-07",
  "2026-05-01", "2026-05-24", "2026-05-25", "2026-06-19", 
  "2026-07-01", "2026-09-26", "2026-10-01", "2026-10-19", 
  "2026-12-25", "2026-12-26"
];

interface SummaryCardProps {
  label: string;
  value: number;
  subtext: string;
  type: 'total' | 'completed' | 'closed' | 'remain';
  icon: React.ReactNode;
  isPulsing?: boolean;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  label,
  value,
  subtext,
  type,
  icon,
  isPulsing = false
}) => (
  <div
    className={`summary-card-item ${isPulsing ? 'status-pulse status-pulse--danger' : ''}`}
    data-type={type}
    tabIndex={0}
    role="button"
    aria-label={`${label}: ${value} ${subtext}`}
  >
    <div className="summary-card-icon-area">
      {icon}
    </div>
    <div className="summary-card-body">
      <div className="summary-card-header">
        <div className="summary-card-title">{label}</div>
        <div className="summary-card-menu">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
      <div className="summary-card-value">{value}</div>
      <p className="summary-card-subtext">{subtext}</p>
    </div>
  </div>
);

export const Dashboard: React.FC<{
  shops: Shop[],
  onUpdateShop: any,
  graphToken: string,
  onRefresh: () => void,
  currentUser: User | null
}> = ({ shops, onUpdateShop, graphToken, onRefresh, currentUser }) => {
  
  const [selectedDate, setSelectedDate] = useState<string>(dayjs().format('YYYY-MM-DD'));
  const [groupFilter, setGroupFilter] = useState<number | 'all'>('all');
  
  const [isReschedOpen, setIsReschedOpen] = useState(false);
  const [targetShop, setTargetShop] = useState<Shop | null>(null);
  const [reschedDate, setReschedDate] = useState<dayjs.Dayjs | null>(null);

  const activeShops = useMemo(() => shops.filter(s => s.masterStatus !== 'Closed'), [shops]);

  const stats = useMemo(() => {
    const total = activeShops.length;
    const completed = activeShops.filter(s => s.status === 'Done' || s.status === 'Re-Open').length;
    const closedThisYear = activeShops.filter(s => s.status === 'Closed').length;
    return { total, completed, closed: closedThisYear, remain: total - completed - closedThisYear };
  }, [activeShops]);

  // ✅ 修正 checkDateAvailability: 加入 isDayMtrOnly 定義
  const checkDateAvailability = (date: dayjs.Dayjs, shop: Shop) => {
    const dateStr = date.format('YYYY-MM-DD');
    const dayOfWeek = date.day();

    // 1. 基礎限制：跳過週日與公眾假期
    if (dayOfWeek === 0) return { valid: false, reason: "Sunday" };
    if (HK_HOLIDAYS_2026.includes(dateStr)) return { valid: false, reason: "Holiday" };

    // A. 獲取該日已排程的活跃門市
    const shopsOnDay = activeShops.filter(s => s.scheduledDate === dateStr);

    // B. 每日上限：不能超過 9 間店
    if (shopsOnDay.length >= 9) return { valid: false, reason: "Full" };

    // ✅ 加入判斷邏輯，僅在日期內已有門市時執行校驗
    if (shopsOnDay.length > 0) {
      // 定義該日期是否為地鐵店專場
      const isDayMtrOnly = shopsOnDay.some(s => s.is_mtr); 

      // C. MTR 邏輯：類型必須一致
      if (shop.is_mtr !== isDayMtrOnly) {
        return { valid: false, reason: isDayMtrOnly ? "MTR Day Only" : "Street Shops Only" };
      }

      // D. 區域限制：必須同區域
      if (!shopsOnDay.some(s => s.region === shop.region)) {
        return { valid: false, reason: "Different Region" };
      }
    }

    return { valid: true };
  };

  const fastestDate = useMemo(() => {
    if (!targetShop) return null;
    let current = dayjs().add(1, 'day');
    for (let i = 0; i < 60; i++) {
      if (checkDateAvailability(current, targetShop).valid) return current;
      current = current.add(1, 'day');
    }
    return null;
  }, [targetShop, activeShops]);

  const handleConfirmReschedule = async () => {
    if (!targetShop || !reschedDate) return;
    const formattedDate = reschedDate.format('YYYY-MM-DD');
    const shopsOnNewDay = activeShops.filter(s => s.scheduledDate === formattedDate);
    const newGroupId = shopsOnNewDay.length > 0 ? shopsOnNewDay[0].groupId : targetShop.groupId;

    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${targetShop.sharePointItemId}/fields`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [SP_FIELDS.STATUS]: 'Rescheduled',
          [SP_FIELDS.SCHEDULE_DATE]: formattedDate,
          [SP_FIELDS.SCHEDULE_GROUP]: newGroupId.toString()
        })
      });
      if (res.ok) {
        message.success(`${targetShop.name} moved to ${formattedDate}`);
        setIsReschedOpen(false);
        onRefresh();
      }
    } catch (err) { message.error("Sync Error"); }
  };

  const handleCloseShop = (shop: Shop) => {
    confirm({
      title: 'Confirm Closing Shop',
      icon: <ExclamationCircleOutlined />,
      content: `Mark "${shop.name}" as CLOSED?`,
      okText: 'Yes, Close', okType: 'danger',
      onOk: async () => {
        try {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.STATUS]: 'Closed' })
          });
          message.success("Shop marked as CLOSED.");
          onRefresh();
        } catch (err) { message.error("Update failed"); }
      },
    });
  };

  const handleResumeShop = (shop: Shop) => {
    confirm({
      title: 'Resume Closed Shop',
      icon: <ExclamationCircleOutlined />,
      content: `Re-open "${shop.name}" and set status to Pending?`,
      okText: 'Yes, Resume',
      onOk: async () => {
        try {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ [SP_FIELDS.STATUS]: 'Pending' })
          });
          message.success(`${shop.name} has been resumed.`);
          onRefresh();
        } catch (err) { message.error("Resume failed"); }
      },
    });
  };

  const handleMoveToPool = (shop: Shop) => {
    confirm({
      title: 'Move to Reschedule Pool',
      icon: <ExclamationCircleOutlined />,
      content: `Move "${shop.name}" to the reschedule pool? The scheduled date will be cleared.`,
      okText: 'Yes, Move to Pool',
      onOk: async () => {
        try {
          await fetch(`https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              [SP_FIELDS.STATUS]: 'Rescheduled',
              [SP_FIELDS.SCHEDULE_DATE]: null,
              [SP_FIELDS.SCHEDULE_GROUP]: null
            })
          });
          message.success(`${shop.name} moved to reschedule pool.`);
          onRefresh();
        } catch (err) { message.error("Move to pool failed"); }
      },
    });
  };

  const filteredShops = useMemo(() => {
    return activeShops
      .filter(s => 
        dayjs(s.scheduledDate).format('YYYY-MM-DD') === selectedDate && 
        (groupFilter === 'all' || s.groupId === groupFilter)
      )
      .sort((a, b) => (a.groupId || 0) - (b.groupId || 0)); // 👈 這裡實施按組別排序
  }, [activeShops, selectedDate, groupFilter]);

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0">
        <div>
          <Title level={2} className="m-0 text-slate-800 dark:text-slate-100" style={{ fontFamily: "'Fira Code', monospace" }}>
            Hello Admin,
          </Title>
          <Text className="text-slate-400 font-medium" style={{ fontFamily: "'Fira Sans', sans-serif" }}>
            Manage daily schedule (Active Shops Only).
          </Text>
        </div>
        <Button
          icon={<PrinterOutlined />}
          className="rounded-xl font-bold h-11 bg-slate-900 text-white border-none px-6 hover:bg-slate-800 transition-all duration-200"
          style={{ fontFamily: "'Fira Sans', sans-serif" }}
          onClick={() => window.print()}
        >
          Generate Report
        </Button>
      </div>

      <Row gutter={[24, 24]}>
  <Col xs={12} sm={12} md={6} lg={6}>
    <SummaryCard
      label="Total Shop"
      value={stats.total}
      subtext="Active Master List"
      type="total"
      icon={<ShopOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.85)' }} />}
    />
  </Col>
  <Col xs={12} sm={12} md={6} lg={6}>
    <SummaryCard
      label="Completed"
      value={stats.completed}
      subtext="Done this year"
      type="completed"
      icon={<CheckCircleOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.85)' }} />}
    />
  </Col>
  <Col xs={12} sm={12} md={6} lg={6}>
    <SummaryCard
      label="Closed"
      value={stats.closed}
      subtext="Closed this year"
      type="closed"
      isPulsing={stats.closed > 0}
      icon={<CloseCircleOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.85)' }} />}
    />
  </Col>
  <Col xs={12} sm={12} md={6} lg={6}>
    <SummaryCard
      label="Remain"
      value={stats.remain}
      subtext="Pending action"
      type="remain"
      isPulsing={stats.remain > 10}
      icon={<HourglassOutlined style={{ fontSize: '40px', color: 'rgba(255,255,255,0.85)' }} />}
    />
  </Col>
</Row>

      <Card className="rounded-[32px] border-none shadow-sm overflow-hidden bg-white" bodyStyle={{ padding: 0 }}>
        {/* ✅ 加入日期與 Group Filter Tabs */}
       <div className="p-8 flex items-center justify-between border-b border-slate-50 dashboard-header-stack">
  
  {/* ✅ 加入標題與新樣式的 DatePicker */}
  <div className="flex flex-col gap-2">
    <Text strong className="text-[10px] text-slate-400 uppercase tracking-widest ml-1">
      Schedule Date
    </Text>
    <DatePicker 
      value={dayjs(selectedDate)} 
      onChange={d => setSelectedDate(d?.format('YYYY-MM-DD') || '')} 
      className="custom-date-input font-bold"
      allowClear={false}
      suffixIcon={<CalendarOutlined style={{ color: '#4a9dec' }} />}
    />
  </div>
          
          <div className="customCheckBoxHolder">
            {[
              { id: 'all', label: 'ALL', value: 'all' },
              { id: 'groupA', label: 'A', value: 1 },
              { id: 'groupB', label: 'B', value: 2 },
              { id: 'groupC', label: 'C', value: 3 },
            ].map((item) => (
              <React.Fragment key={item.id}>
                <input className="customCheckBoxInput" id={item.id} type="radio" name="groupFilter" checked={groupFilter === item.value} onChange={() => setGroupFilter(item.value as any)} />
                <label className="customCheckBoxWrapper" htmlFor={item.id}><div className="customCheckBox"><div className="inner">{item.label}</div></div></label>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-2">
          {filteredShops.length === 0 ? <Empty className="py-20" /> : filteredShops.map(shop => {
            const isClosed = shop.status?.toLowerCase() === 'closed';
            return (
              <div key={shop.id} className={`p-4 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 transition-all ${isClosed ? 'opacity-40 grayscale bg-slate-50' : 'bg-white hover:bg-slate-50/80 shadow-sm'}`}>
                {/* 1. Shop Info & Brand */}
                <div className="flex items-center gap-4 w-full md:flex-1">
                  <img src={shop.brandIcon} alt={shop.brand} className="h-10 w-10 object-contain rounded-lg border border-slate-100 p-1 bg-white" />
                  <div className="flex flex-col min-w-0">
                    <h4 className={`m-0 font-bold text-slate-800 text-[15px] truncate ${isClosed ? 'line-through decoration-red-500' : ''}`}>{shop.name}</h4>
                    <div className="flex items-center gap-2">
                       <Text className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">{shop.brand}</Text>
                       {shop.is_mtr && <Tag color="purple" className="m-0 text-[9px] font-bold border-none px-1">MTR</Tag>}
                    </div>
                  </div>
                </div>

                {/* 2. Address (Full on mobile, fixed on desktop) */}
                <div className="w-full md:w-[300px]">
                  <div className="flex items-start gap-1.5 opacity-60">
                     <EnvironmentOutlined className="mt-0.5 text-[10px]" />
                     <Text className="text-xs text-slate-500 italic leading-snug break-words line-clamp-2 md:line-clamp-1">{shop.address}</Text>
                  </div>
                </div>

                {/* 3. Group Tag */}
                <div className="w-full md:w-[120px] flex md:justify-center">
                  <Tag className={`m-0 border-none font-black text-[10px] px-3 py-0.5 rounded-md w-fit tag-group-${shop.groupId}`}>
                    GROUP {String.fromCharCode(64 + shop.groupId)}
                  </Tag>
                </div>

                {/* 4. Action Buttons (Right align desktop, End align mobile) */}
                <div className="w-full md:w-[220px] flex justify-end gap-3 pt-2 md:pt-0 mt-1 md:mt-0 border-t border-slate-100 md:border-t-0">
                  {isClosed ? (
                    /* Resume button - only visible for closed shops */
                    hasPermission(currentUser, 'close_shop') && (
                    <button className="resume-button" onClick={() => handleResumeShop(shop)}>
                      <svg className="resume-svgIcon" viewBox="0 0 24 24" fill="none"><path d="M3 12a9 9 0 1 1 2.636 6.364M3 12V18M3 12H9" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                    </button>
                    )
                  ) : (
                    <>
                      {/* Re-Schedule button - only visible for Admin/App Owner */}
                      {hasPermission(currentUser, 'reschedule_shop') && (
                      <button className="resched-button" onClick={() => { setTargetShop(shop); setReschedDate(null); setIsReschedOpen(true); }}>
                        <svg className="resched-svgIcon" viewBox="-2.4 -2.4 28.80 28.80" fill="none"><path d="M10 21H6.2C5.0799 21 4.51984 21 4.09202 20.782C3.71569 20.5903 3.40973 20.2843 3.21799 19.908C3 19.4802 3 18.9201 3 17.8V8.2C3 7.0799 3 6.51984 3.21799 6.09202C3.40973 5.71569 3.71569 5.40973 4.09202 5.21799C4.51984 5 5.0799 5 6.2 5H17.8C18.9201 5 19.4802 5 19.908 5.21799C20.2843 5.40973 20.5903 5.71569 20.782 6.09202C21 6.51984 21 7.0799 21 8.2V10M7 3V5M17 3V5M3 9H21M13.5 13.0001L7 13M10 17.0001L7 17M14 21L16.025 20.595C16.2015 20.5597 16.2898 20.542 16.3721 20.5097C16.4452 20.4811 16.5147 20.4439 16.579 20.399C16.6516 20.3484 16.7152 20.2848 16.8426 20.1574L21 16C21.5523 15.4477 21.5523 14.5523 21 14C20.4477 13.4477 19.5523 13.4477 19 14L14.8426 18.1574C14.7152 18.2848 14.6516 18.3484 14.601 18.421C14.5561 18.4853 14.5189 18.5548 14.4903 18.6279C14.458 18.7102 14.4403 18.7985 14.4403 18.7985 14.405 18.975L14 21Z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                      </button>
                      )}
                      {/* Move to Reschedule Pool - only visible for Admin/App Owner */}
                      {hasPermission(currentUser, 'reschedule_shop') && (
                      <button className="pool-button" onClick={() => handleMoveToPool(shop)}>
                        <svg className="pool-svgIcon" viewBox="0 0 24 24"><path d="M20 7H4a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM4 5h16M6 19h12" stroke="#D97706" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/></svg>
                      </button>
                      )}
                      {/* Close button - only visible for Admin/App Owner */}
                      {hasPermission(currentUser, 'close_shop') && (
                      <button className="bin-button" onClick={() => handleCloseShop(shop)}>
                        <svg viewBox="0 0 448 512" className="bin-svgIcon"><path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path></svg>
                      </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal title={<Space><CalendarOutlined className="text-indigo-600" /><span>Smart Reschedule</span></Space>} open={isReschedOpen} onOk={handleConfirmReschedule} onCancel={() => setIsReschedOpen(false)} okText="Confirm New Date" width={450} centered>
        <div className="py-4">
          <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100"><Text type="secondary" className="text-xs uppercase font-bold block mb-1">Target Shop</Text><Text strong className="text-lg text-indigo-900">{targetShop?.name}</Text></div>
          <DatePicker className="w-full h-12 rounded-xl" disabledDate={d => (d && d < dayjs().startOf('day')) || !checkDateAvailability(d, targetShop!).valid} value={reschedDate} onChange={val => setReschedDate(val)} />
          {fastestDate && (
            <div className="mt-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center justify-between">
              <div><Text className="text-green-700 text-xs block">Fastest Suggest Reschedule Date</Text><Text className="text-green-800 font-bold">{fastestDate.format('YYYY-MM-DD (dddd)')}</Text></div>
              <Button type="link" size="small" onClick={() => setReschedDate(fastestDate)}>Use This</Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
