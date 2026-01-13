import React, { useState, useMemo } from 'react';
import { Typography, Empty, Tag } from 'antd';
import { ShopOutlined } from '@ant-design/icons';
import { Shop } from '../types';

const { Title, Text } = Typography;

export const Calendar: React.FC<{ shops: Shop[] }> = ({ shops }) => {
  // 控制哪一個卡片被展開 (null, 1, 2, 3)
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  // 按 Group 分組門市
  const groups = useMemo(() => {
    const map: Record<number, Shop[]> = { 1: [], 2: [], 3: [] };
    shops.forEach(s => {
      if (map[s.groupId]) map[s.groupId].push(s);
    });
    return map;
  }, [shops]);

  const renderGroupCard = (groupId: number) => {
    const groupShops = groups[groupId] || [];
    const isExpanded = expandedGroupId === groupId;
    const groupLetter = String.fromCharCode(64 + groupId); // 1->A, 2->B, 3->C

    return (
      <div 
        className={`trophy-card card-group-${groupId} ${isExpanded ? 'is-expanded' : ''}`}
        onClick={() => setExpandedGroupId(isExpanded ? null : groupId)}
      >
        <div className="outlinePage">
          {/* Trophy SVG */}
          <svg className="trophy" viewBox="0 0 1024 1024" width="100" height="100">
            <path d="M469.333333 682.666667h85.333334v128h-85.333334zM435.2 810.666667h153.6c4.693333 0 8.533333 3.84 8.533333 8.533333v34.133333h-170.666666v-34.133333c0-4.693333 3.84-8.533333 8.533333-8.533333z" fill="currentColor" opacity="0.6"></path>
            <path d="M384 853.333333h256a42.666667 42.666667 0 0 1 42.666667 42.666667v42.666667H341.333333v-42.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="currentColor" opacity="0.8"></path>
            <path d="M213.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256H213.333333zM170.666667 213.333333h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333zM725.333333 256v85.333333a42.666667 42.666667 0 0 0 85.333334 0V256h-85.333334z m-42.666666-42.666667h170.666666v128a85.333333 85.333333 0 1 1-170.666666 0V213.333333z" fill="currentColor"></path>
            <path d="M298.666667 85.333333h426.666666a42.666667 42.666667 0 0 1 42.666667 42.666667v341.333333a256 256 0 1 1-512 0V128a42.666667 42.666667 0 0 1 42.666667-42.666667z" fill="currentColor"></path>
            <path d="M512 469.333333l-100.309333 52.736 19.157333-111.701333-81.152-79.104 112.128-16.298667L512 213.333333l50.176 101.632 112.128 16.298667-81.152 79.104 19.157333 111.701333z" fill="#FFF2A0"></path>
          </svg>

          <p className="ranking_number">
            {groupLetter}<span className="ranking_word">Group</span>
          </p>
          
          <div className="splitLine"></div>
          
          <p className="userName">
            {groupShops.length} Shops Assigned
          </p>
        </div>

        <div className="detailPage">
          <div className="gradesBox">
            <svg className="icon gradesIcon" viewBox="0 0 1024 1024" width="40" height="40">
               <path d="M382.6 805H242.2c-6.7 0-12.2-5.5-12.2-12.2V434.3c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v358.6c0 6.6-5.4 12.1-12.2 12.1z" fill="currentColor"></path>
               <path d="M591.1 805H450.7c-6.7 0-12.2-5.5-12.2-12.2V254.9c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v537.9c0 6.7-5.5 12.2-12.2 12.2z" fill="currentColor" opacity="0.8"></path>
               <path d="M804.4 805H663.9c-6.7 0-12.2-5.5-12.2-12.2v-281c0-6.7 5.5-12.2 12.2-12.2h140.4c6.7 0 12.2 5.5 12.2 12.2v281c0.1 6.7-5.4 12.2-12.1 12.2z" fill="currentColor" opacity="0.6"></path>
            </svg>
            <p className="gradesBoxLabel">CAPACITY</p>
            <p className="gradesBoxNum">{Math.round((groupShops.length / 30) * 100)}%</p>
          </div>
          
          <div className="p-4 w-full" style={{ marginTop: '20px' }}>
             <Text strong className="text-[10px] text-slate-400 uppercase block mb-2">Shop List</Text>
             {groupShops.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} /> : (
               groupShops.slice(0, 5).map(s => (
                 <div key={s.id} className="flex items-center gap-2 mb-1">
                   <ShopOutlined className="text-[10px] text-slate-300" />
                   <Text className="text-[11px] truncate" style={{ flex: 1 }}>{s.name}</Text>
                   <Tag color="blue" style={{ fontSize: '9px', zoom: 0.8 }}>{s.district}</Tag>
                 </div>
               ))
             )}
             {groupShops.length > 5 && <Text type="secondary" style={{ fontSize: '10px' }}>+ {groupShops.length - 5} more shops</Text>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <Title level={2}>Schedules Overview</Title>
        <Text type="secondary">Click each group card to see detailed assignments.</Text>
      </div>

      <div className="group-card-container">
        {renderGroupCard(1)}
        {renderGroupCard(2)}
        {renderGroupCard(3)}
      </div>
    </div>
  );
};
