import React, { useEffect, useState } from 'react';
import { Modal, message, Row, Col, Typography, Divider, Button, Space, AutoComplete, Input } from 'antd';
import { 
  InfoCircleOutlined, 
  EnvironmentOutlined, 
  PhoneOutlined, 
  PushpinOutlined,
  SearchOutlined,
  CopyOutlined
} from '@ant-design/icons';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Title, Text } = Typography;

// 確保 AMap 的類型定義
declare global {
  interface Window {
    AMap: any;
  }
}

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [formData, setFormData] = useState<any>({});
  
  // --- ✅ 新增：地點搜尋相關狀態 ---
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<{ value: string; location: any }[]>([]);
  const [searchText, setSearchText] = useState('');

  // 當彈窗開啟或 shop 改變時，初始化資料
  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({
          name: shop.name || '',
          code: shop.id || '',
          brand: shop.brand || '',
          region: shop.region || '',
          district: shop.district || '',
          area: shop.area || '',
          addr_en: shop.address || '',
          addr_chi: shop.address_chi || '',
          building: shop.building || '',
          mtr: shop.is_mtr ? 'Yes' : 'No',
          phone: shop.phone || '',
          contact: shop.contactName || '',
          remark: shop.remark || '',
          sys: shop.sys || '',
          bu: shop.businessUnit || '',
          lat: shop.latitude || '',
          lng: shop.longitude || '',
          group: shop.groupId?.toString() || '1'
        });
      } else {
        // 新增模式：預設值
        setFormData({ mtr: 'No', group: '1' });
      }
    }
  }, [shop, visible]);

  // --- ✅ 新增：地點搜尋邏輯 ---

  // 1. 從「English Address」複製地址到搜尋框
  const handleCopyFromAddress = () => {
    const currentAddr = formData.addr_en;
    if (currentAddr) {
      setSearchText(currentAddr);
      handleSearch(currentAddr); // 複製後自動觸發搜尋建議
    } else {
      message.warning("English Address is empty!");
    }
  };

  // 2. 執行 AMap Autocomplete 搜尋
  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value || !window.AMap) return;

    window.AMap.plugin('AMap.Autocomplete', () => {
      const auto = new window.AMap.Autocomplete({ city: 'hongkong' });
      auto.search(value, (status: string, result: any) => {
        if (status === 'complete' && result.tips) {
          const suggestions = result.tips
            .filter((tip: any) => tip.location) // 只保留有坐標的結果
            .map((tip: any) => ({
              value: `${tip.name} (${tip.address || ''})`,
              location: tip.location
            }));
          setSearchOptions(suggestions);
        }
      });
    });
  };

  // 3. 當選中建議地點時，更新座標到主表單
  const onSelectLocation = (value: string, option: any) => {
    const { lng, lat } = option.location;
    setFormData({
      ...formData,
      lat: lat.toString(),
      lng: lng.toString()
    });
    message.success("Latitude & Longitude updated!");
    setSearchModalVisible(false);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code) {
      return message.warning("Shop Name and Code are required!");
    }

    const isEdit = !!shop;
    const url = isEdit 
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;

    const payloadFields = {
      [SP_FIELDS.SHOP_NAME]: formData.name,
      [SP_FIELDS.SHOP_CODE]: formData.code,
      [SP_FIELDS.BRAND]: formData.brand,
      [SP_FIELDS.REGION]: formData.region,
      [SP_FIELDS.DISTRICT]: formData.district,
      [SP_FIELDS.AREA]: formData.area,
      [SP_FIELDS.ADDRESS_ENG]: formData.addr_en,
      [SP_FIELDS.ADDRESS_CHI]: formData.addr_chi,
      [SP_FIELDS.BUILDING]: formData.building,
      [SP_FIELDS.MTR]: formData.mtr,
      [SP_FIELDS.PHONE]: formData.phone,
      [SP_FIELDS.CONTACT]: formData.contact,
      [SP_FIELDS.REMARK]: formData.remark,
      [SP_FIELDS.SYS]: formData.sys,
      [SP_FIELDS.BUSINESS_UNIT]: formData.bu,
      [SP_FIELDS.LATITUDE]: formData.lat?.toString(),
      [SP_FIELDS.LONGITUDE]: formData.lng?.toString(),
      [SP_FIELDS.SCHEDULE_GROUP]: formData.group
    };

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? payloadFields : { fields: payloadFields })
      });
      if (res.ok) {
        message.success(isEdit ? "Shop Updated!" : "New Shop Created!");
        onSuccess();
      } else {
        message.error("SharePoint refused the update.");
      }
    } catch (err) {
      message.error("Network Error: Sync failed");
    }
  };

  // 封裝優化後的輸入框元件
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

  return (
    <>
      <Modal 
        open={visible} 
        onCancel={onCancel} 
        footer={null} 
        width={900} 
        centered 
        bodyStyle={{ padding: '32px', backgroundColor: '#f8fafc' }}
      >
        <div className="flex flex-col gap-2">
          <div className="mb-6">
            <Title level={3} style={{ color: '#0f172a', margin: 0 }}>
              {shop ? 'Store Profile Manager' : 'New Store Registration'}
            </Title>
            <Text type="secondary">Update SharePoint database records for stock take planning.</Text>
          </div>
          
          {/* 分組 1: 基本識別 (保留) */}
          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <InfoCircleOutlined /> BASIC IDENTIFICATION
            </div>
            <Row gutter={20}>
              {renderInput("Official Shop Name", "name", 24)}
              {renderInput("Shop Code", "code", 8)}
              {renderInput("Brand", "brand", 8)}
              {renderInput("Schedule Group", "group", 8)}
              {renderInput("Business Unit", "bu", 12)}
              {renderInput("System ID", "sys", 12)}
            </Row>
          </div>

          {/* 分組 2: 地點與地址 (保留) */}
          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <EnvironmentOutlined /> ADDRESS & LOGISTICS
            </div>
            <Row gutter={20}>
              {renderInput("English Address (Full)", "addr_en", 24)}
              {renderInput("Chinese Address", "addr_chi", 24)}
              {renderInput("Region", "region", 8)}
              {renderInput("District", "district", 8)}
              {renderInput("Area", "area", 8)}
              {renderInput("Building / Landmark", "building", 24)}
            </Row>
          </div>

          {/* 分組 3: 聯絡與坐標 (✅ 修改此部分) */}
          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <PhoneOutlined /> CONTACTS & GEOLOCATION
            </div>
            <Row gutter={20}>
              {renderInput("Store Phone", "phone", 12)}
              {renderInput("Primary Contact", "contact", 12)}
              
              {/* ✅ 修改 Latitude 欄位以加入搜尋按鈕 */}
              <Col span={8}>
                <div className="st-inputBox-pro">
                  <input 
                    type="text" 
                    required 
                    value={formData.lat || ''} 
                    onChange={e => setFormData({...formData, lat: e.target.value})} 
                  />
                  <span>Latitude</span>
                </div>
                {/* 增加 Location Search 按鈕 */}
                <Button 
                  type="dashed" 
                  block 
                  size="small"
                  icon={<SearchOutlined />} 
                  onClick={() => setSearchModalVisible(true)}
                  style={{ 
                    marginTop: -10, 
                    marginBottom: 15, 
                    borderRadius: '8px', 
                    fontSize: '11px', 
                    fontWeight: 'bold',
                    color: '#0d9488',
                    borderColor: '#0d9488'
                  }}
                >
                  Location Search
                </Button>
              </Col>

              {renderInput("Longitude", "lng", 8)}
              {renderInput("MTR Status", "mtr", 8)}
            </Row>
          </div>

          {/* 分組 4: 備註 (保留) */}
          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <PushpinOutlined /> INTERNAL REMARKS
            </div>
            <Row gutter={20}>
              {renderInput("Internal Notes / Planning Remark", "remark", 24)}
            </Row>
          </div>

          {/* 按鈕區域 (保留) */}
          <div className="flex justify-end gap-4 mt-6">
            <button className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition-all" onClick={onCancel}>
              CANCEL
            </button>
            <button className="px-12 py-3 bg-teal-600 text-white rounded-xl font-bold shadow-lg hover:bg-teal-700 hover:scale-105 transition-all" onClick={handleSubmit}>
              {shop ? 'UPDATE RECORDS' : 'CREATE RECORD'}
            </button>
          </div>
        </div>
      </Modal>

      {/* --- ✅ 新增：地點搜尋彈窗 --- */}
      <Modal
        title={<Space><SearchOutlined /> Search Store Location</Space>}
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={500}
        centered
        destroyOnClose
      >
        <div style={{ padding: '10px 0' }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 15 }}>
            Type address or use the button to copy from English Address. Select a suggestion to update coordinates.
          </Text>
          
          <Space.Compact style={{ width: '100%' }}>
            <AutoComplete
              style={{ flex: 1 }}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={onSelectLocation}
              value={searchText}
              onChange={setSearchText}
              placeholder="Search address or shop name..."
            />
            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopyFromAddress}
              title="Copy from Form English Address"
            >
              Copy from Address
            </Button>
          </Space.Compact>
          
          <div style={{ marginTop: 20 }}>
            <Text type="secondary" style={{ fontSize: '11px', fontStyle: 'italic' }}>
              * Suggestions are provided by AMap API. Select an item to automatically update the form.
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};
