import React, { useEffect, useState, useMemo } from 'react';
import { Modal, message, Row, Col, Typography, Button, Space, AutoComplete, Select, Divider } from 'antd';
import { 
  InfoCircleOutlined, 
  SearchOutlined, 
  PhoneOutlined, 
  EnvironmentOutlined,
  CopyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';
const { Title, Text } = Typography;
interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
  shops: Shop[]; // 接收所有門市資料以動態提取選項
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken, shops }) => {
  const [formData, setFormData] = useState<any>({});
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState('');

  // ✅ 1. 動態提取唯一選項，並加入安全檢查防止 map 報錯
  const dynamicOptions = useMemo(() => {
    const safeShops = shops || []; // 確保 shops 不為空

    const getUnique = (key: keyof Shop) => 
      Array.from(new Set(safeShops.map(s => s[key]).filter(Boolean)))
        .sort()
    };
  }, [shops]);

  // ✅ 2. 初始資料載入 (編輯或新增)
  useEffect(() => {
    if (visible) {
      if (shop) {
    }
  }, [shop, visible]);

  // ✅ 3. 渲染原本的 Input 樣式
  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input 
          type="text" 
          required 
          value={formData[key] || ''} 
          onChange={e => setFormData({...formData, [key]: e.target.value})} 
        />
        <span>{label}</span>
      </div>
    </Col>
  );

  // ✅ 4. 使用原本樣式包裝的 Select 組件
  const renderSelect = (label: string, key: string, options: any[], span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <Select
          className="st-input-select-wrapper"
          variant="borderless"
          showSearch
          placeholder=" "

        <div className="st-form-section">
          <Divider orientation="left" style={{ color: '#0d9488' }}><InfoCircleOutlined /> BASIC IDENTIFICATION</Divider>
          <Row gutter={[20, 10]}>
            {renderInput("Official Shop Name", "name", 24)}
            {renderInput("Shop Code", "code", 8)}
            {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
          </Row>
        </div>

        <div className="st-form-section">
          <Divider orientation="left" style={{ color: '#0d9488' }}><GlobalOutlined /> ADDRESS & LOGISTICS</Divider>
          <Row gutter={[20, 10]}>
            {renderInput("English Address (Full)", "addr_en", 24)}
            {renderInput("Chinese Address", "addr_chi", 24)}
            {renderSelect("Region", "region", dynamicOptions.regions, 8)}
            {renderSelect("District", "district", dynamicOptions.districts, 8)}
            {renderSelect("Area", "area", dynamicOptions.areas, 8)}
            {renderInput("Building / Landmark", "building", 24)}
          </Row>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all" onClick={onCancel}>
            CANCEL
          </button>
          <button className="px-12 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 hover:scale-105 transition-all" onClick={handleSubmit}>
            {shop ? 'UPDATE RECORDS' : 'CREATE RECORD'}
          </button>
        </div>
      </Modal>
    </>
  );
};
