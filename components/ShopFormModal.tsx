import React, { useEffect, useState } from 'react';
import { Modal, message, Row, Col, Divider, Typography } from 'antd';
import { Shop } from '../types';
import { SP_FIELDS } from '../constants';

const { Title } = Typography;

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
}

export const ShopFormModal: React.FC<Props> = ({ visible, shop, onCancel, onSuccess, graphToken }) => {
  const [formData, setFormData] = useState<any>({});

  // 初始化資料映射
  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({
          name: shop.name, code: shop.id, brand: shop.brand,
          region: shop.region, district: shop.district, area: shop.area,
          addr_en: shop.address, addr_chi: shop.address_chi, building: shop.building,
          mtr: shop.is_mtr ? 'Yes' : 'No', phone: shop.phone, contact: shop.contactName,
          remark: shop.remark, sys: shop.sys, bu: shop.businessUnit,
          lat: shop.latitude, lng: shop.longitude, group: shop.groupId?.toString()
        });
      } else {
        setFormData({ mtr: 'No', group: '1' }); // 新增模式的預設值
      }
    }
  }, [shop, visible]);

  const handleSubmit = async () => {
    const isEdit = !!shop;
    const url = isEdit 
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;

    const payload = {
      fields: {
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
      }
    };

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Authorization': `Bearer ${graphToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(isEdit ? payload.fields : payload)
      });
      if (res.ok) {
        message.success(isEdit ? "Updated successfully!" : "Shop created!");
        onSuccess();
      }
    } catch (err) { message.error("Sync failed"); }
  };

  const renderItem = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-full">
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
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={850}
      centered
      bodyStyle={{ padding: 0 }}
    >
      <div className="st-card-full">
        <Title level={3} style={{ color: '#0d9488', marginBottom: 10 }}>
          {shop ? 'EDIT SHOP DETAILS' : 'CREATE NEW SHOP'}
        </Title>
        
        <Row gutter={[20, 20]}>
          {/* 第一排：店名 (佔滿) */}
          {renderItem("Shop Name / Store Name", "name", 24)}
          
          {/* 第二排：Code, Brand, Group (三分) */}
          {renderItem("Shop Code", "code", 8)}
          {renderItem("Brand", "brand", 8)}
          {renderItem("Schedule Group (1-4)", "group", 8)}

          <Divider style={{ margin: '10px 0' }}>Location & Address</Divider>
          
          {/* 第三排：地址 (佔滿) */}
          {renderItem("English Address", "addr_en", 24)}
          {renderItem("Chinese Address", "addr_chi", 24)}

          {/* 第四排：Region, District, Area (三分) */}
          {renderItem("Region", "region", 8)}
          {renderItem("District", "district", 8)}
          {renderItem("Area", "area", 8)}

          <Divider style={{ margin: '10px 0' }}>Coordinates & Technical</Divider>
          
          {/* 第五排：手機, 聯絡人 (各半) */}
          {renderItem("Phone Number", "phone", 12)}
          {renderItem("Contact Person", "contact", 12)}

          {/* 第六排：經緯度, MTR (三分) */}
          {renderItem("Latitude", "lat", 8)}
          {renderItem("Longitude", "lng", 8)}
          {renderItem("MTR Station (Yes/No)", "mtr", 8)}

          {/* 第七排：Remark (佔滿) */}
          {renderItem("Internal Remark / Notes", "remark", 24)}
        </Row>

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
          <button className="st-enter-btn" style={{ width: 200 }} onClick={handleSubmit}>
            {shop ? 'SAVE CHANGES' : 'CONFIRM & CREATE'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
