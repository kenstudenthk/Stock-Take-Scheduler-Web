import React, { useEffect, useState } from 'react';
import { Modal, message, Row, Col, Typography, Button, Space, AutoComplete, Badge } from 'antd';
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
  
  // --- ✅ 地點搜尋相關狀態 ---
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<{ value: string; location: any; label: any }[]>([]);
  const [searchText, setSearchText] = useState('');

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
        setFormData({ mtr: 'No', group: '1' });
      }
    }
  }, [shop, visible]);

  // --- ✅ 地點搜尋邏輯 ---

  const handleCopyFromAddress = () => {
    const currentAddr = formData.addr_en;
    if (currentAddr) {
      console.log("Copying address:", currentAddr);
      setSearchText(currentAddr);
      handleSearch(currentAddr);
    } else {
      message.warning("English Address is empty!");
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    console.log("Searching for:", value); // 診斷日誌 1

    if (!value) {
      setSearchOptions([]);
      return;
    }

    if (!window.AMap) {
      console.error("AMap SDK is not loaded. Please check your index.html script tag.");
      return;
    }

    // ✅ JS API 2.0 強制要求使用 AMap.plugin 異步加載
    window.AMap.plugin('AMap.AutoComplete', () => {
      console.log("AMap.AutoComplete plugin loaded successfully"); // 診斷日誌 2
      
      const autoOptions = {
        city: '香港',
        citylimit: false
      };
      
      const autoComplete = new window.AMap.AutoComplete(autoOptions);
      autoComplete.search(value, (status: string, result: any) => {
        console.log("AMap search status:", status); // 診斷日誌 3
        console.log("AMap search result:", result); // 診斷日誌 4

        if (status === 'complete' && result.tips) {
          const suggestions = result.tips
            .filter((tip: any) => tip.location && tip.id)
            .map((tip: any) => ({
              value: `${tip.name} - ${tip.address || ''}`,
              location: tip.location,
              label: (
                <div style={{ padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '13px' }}>{tip.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{tip.address || 'Address detail unavailable'}</div>
                </div>
              )
            }));
          setSearchOptions(suggestions);
        } else {
          setSearchOptions([]);
        }
      });
    });
  };

  const onSelectLocation = (value: string, option: any) => {
    if (option && option.location) {
      const { lng, lat } = option.location;
      setFormData({
        ...formData,
        lat: lat.toString(),
        lng: lng.toString()
      });
      console.log("Updated Lat/Lng:", lat, lng);
      message.success("Coordinates Updated!");
      setSearchModalVisible(false);
    }
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
        message.error("Sync failed: SharePoint error.");
      }
    } catch (err) {
      message.error("Sync Error: Network connection failed.");
    }
  };

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
            <Text type="secondary">Directly managing SharePoint records for planning.</Text>
          </div>
          
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

          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <GlobalOutlined /> ADDRESS & LOGISTICS
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

          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <PhoneOutlined /> CONTACTS & GEOLOCATION
            </div>
            <Row gutter={20}>
              {renderInput("Store Phone", "phone", 12)}
              {renderInput("Primary Contact", "contact", 12)}
              
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
                {/* Location Search 按鈕樣式優化 */}
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
                    borderColor: '#0d9488',
                    height: '28px'
                  }}
                >
                  Location Search
                </Button>
              </Col>

              {renderInput("Longitude", "lng", 8)}
              {renderInput("MTR Status", "mtr", 8)}
            </Row>
          </div>

          <div className="st-form-section">
            <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
              <EnvironmentOutlined /> INTERNAL REMARKS
            </div>
            <Row gutter={20}>
              {renderInput("Internal Notes / Planning Remark", "remark", 24)}
            </Row>
          </div>

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

      {/* ✅ 地點搜尋彈窗 - 修正 SVG 錯誤與搜尋無響應 */}
      <Modal
        title={<Space><SearchOutlined style={{ color: '#0d9488' }} /> Geocoding Service</Space>}
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={520}
        centered
        destroyOnClose
      >
        <div style={{ padding: '10px 0' }}>
          <Text type="secondary" style={{ fontSize: '12px', display: 'block', marginBottom: 15 }}>
            Select a location from suggestions to sync coordinates.
          </Text>
          
          <Space.Compact style={{ width: '100%' }}>
            <AutoComplete
              style={{ flex: 1 }}
              options={searchOptions}
              onSearch={handleSearch}
              onSelect={onSelectLocation}
              value={searchText}
              onChange={(val) => {
                setSearchText(val);
                // 確保在輸入時清空舊建議，防止誤觸
                if(!val) setSearchOptions([]);
              }}
              placeholder="Search building or street..."
              dropdownMatchSelectWidth={false}
              listHeight={320}
            />
            <Button 
              icon={<CopyOutlined />} 
              onClick={handleCopyFromAddress}
              title="Pull Address from Form"
            >
              Copy
            </Button>
          </Space.Compact>
          
          <div style={{ marginTop: 20, padding: '15px', background: '#f0fdfa', borderRadius: '12px', border: '1px solid #ccfbf1' }}>
            <Text type="secondary" style={{ fontSize: '11px', color: '#0f766e', display: 'block' }}>
              <InfoCircleOutlined /> <b>Pro Tip:</b> If no results appear, ensure your <b>index.html</b> has the AMap script with the correct API Key and Security Code.
            </Text>
          </div>
        </div>
      </Modal>
    </>
  );
};
