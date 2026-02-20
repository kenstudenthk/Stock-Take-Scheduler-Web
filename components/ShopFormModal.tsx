// ShopFormModal.tsx - Part 1

import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  message,
  Row,
  Col,
  Typography,
  Button,
  Space,
  AutoComplete,
  Select,
  Divider,
  Input,
} from "antd";
import {
  InfoCircleOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CopyOutlined,
  GlobalOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Shop } from "../types";
import { SP_FIELDS } from "../constants";

const { Title, Text } = Typography;

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
  shops: Shop[];
}

export const ShopFormModal: React.FC<Props> = ({
  visible,
  shop,
  onCancel,
  onSuccess,
  graphToken,
  shops,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");

  const dynamicOptions = useMemo(() => {
    const s = shops || [];
    const getU = (k: keyof Shop) =>
      Array.from(new Set(s.map((i) => i[k]).filter(Boolean)))
        .sort()
        .map((val) => ({ label: val, value: val }));
    return {
      brands: getU("brand"),
      regions: getU("region"),
      districts: getU("district"),
      areas: getU("area"),
      bus: getU("businessUnit"),
    };
  }, [shops]);

  useEffect(() => {
    if (visible) {
      if (shop) {
        setFormData({
          name: shop.name || "",
          code: shop.id || "",
          brand: shop.brand || "",
          region: shop.region || "",
          district: shop.district || "",
          area: shop.area || "",
          addr_en: shop.address || "",
          addr_chi: (shop as any).address_chi || "",
          building: (shop as any).building || "",
          mtr: shop.is_mtr ? "Yes" : "No",
          phone: shop.phone || "",
          contact: shop.contactName || "",
          remark: (shop as any).remark || "",
          sys: (shop as any).sys || "",
          bu: shop.businessUnit || "",
          lat: shop.latitude || "",
          lng: shop.longitude || "",
          group: shop.groupId?.toString() || "1",
        });
      } else {
        setFormData({ mtr: "No", group: "1" });
      }
    }
  }, [shop, visible]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (!value || !window.AMap) return;
    window.AMap.plugin("AMap.AutoComplete", () => {
      const auto = new window.AMap.AutoComplete({ city: "香港" });
      auto.search(value, (status: string, result: any) => {
        if (status === "complete" && result.tips) {
          setSearchOptions(
            result.tips
              .filter((t: any) => t.location)
              .map((t: any) => ({
                value: `${t.name} - ${t.address || ""}`,
                location: t.location,
                label: (
                  <div
                    style={{
                      padding: "4px 0",
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div style={{ fontWeight: "bold", fontSize: "13px" }}>
                      {t.name}
                    </div>
                    <div style={{ fontSize: "11px", color: "#64748b" }}>
                      {t.address}
                    </div>
                  </div>
                ),
              })),
          );
        }
      });
    });
  };

  const onSelectLocation = (v: string, o: any) => {
    if (o?.location) {
      setFormData({
        ...formData,
        lat: o.location.lat.toString(),
        lng: o.location.lng.toString(),
      });
      message.success("Coordinates Updated!");
      setSearchModalVisible(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.code)
      return message.warning("Name and Code required!");
    const isEdit = !!shop;
    const url = isEdit
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;
    const payload = {
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
      [SP_FIELDS.SCHEDULE_GROUP]: formData.group,
    };
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEdit ? payload : { fields: payload }),
      });
      if (res.ok) {
        message.success("Shop Saved!");
        onSuccess();
      }
    } catch (e) {
      message.error("Sync Error");
    }
  };

  const renderInput = (label: string, key: string, span: number = 12) => (
    <Col span={span}>
      <div className="st-inputBox-pro">
        <input
          type="text"
          required
          value={formData[key] || ""}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          placeholder=" "
        />
        <span>{label}</span>
      </div>
    </Col>
  );

  const renderSelect = (
    label: string,
    key: string,
    options: any[],
    span: number = 12,
  ) => (
    <Col span={span}>
      <div
        className={`st-inputBox-pro sel-ext-box ${formData[key] ? "has-val" : ""}`}
      >
        <div className="uiverse-mock-input">{formData[key] || ""}</div>
        <Select
          className="uv-hide-sel"
          suffixIcon={
            <div className="ext-trigger">
              <DownOutlined />
            </div>
          }
          value={formData[key] || undefined}
          onChange={(v) => setFormData({ ...formData, [key]: v })}
          options={options}
          variant="borderless"
          showSearch
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
        bodyStyle={{ padding: "32px", backgroundColor: "#f8fafc" }}
      >
        <div className="mb-6">
          <Title level={3} style={{ margin: 0 }}>
            {shop ? "Store Profile Manager" : "New Store Registration"}
          </Title>
          <Text type="secondary">
            Directly managing SharePoint master data.
          </Text>
        </div>

        <div className="st-form-section">
          <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
            <InfoCircleOutlined /> BASIC IDENTIFICATION
          </div>
          <Row gutter={[20, 32]}>
            {renderInput("Official Shop Name", "name", 24)}
            {renderInput("Shop Code", "code", 8)}
            {renderSelect("Brand", "brand", dynamicOptions.brands, 8)}
            {renderSelect("Business Unit", "bu", dynamicOptions.bus, 8)}
            {renderSelect(
              "Schedule Group",
              "group",
              [
                { label: "Group A", value: "1" },
                { label: "Group B", value: "2" },
              ],
              8,
            )}
            {renderInput("System ID", "sys", 16)}
          </Row>
        </div>

        <div className="st-form-section mt-4">
          <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
            <GlobalOutlined /> ADDRESS & LOGISTICS
          </div>
          <Row gutter={[20, 32]}>
            {renderInput("English Address (Full)", "addr_en", 24)}
            {renderInput("Chinese Address", "addr_chi", 24)}
            {renderSelect("Region", "region", dynamicOptions.regions, 8)}
            {renderSelect("District", "district", dynamicOptions.districts, 8)}
            {renderSelect("Area", "area", dynamicOptions.areas, 8)}
            {renderInput("Building / Landmark", "building", 24)}
          </Row>
        </div>

        <div className="st-form-section mt-4">
          <div className="flex items-center gap-2 mb-6 text-teal-600 font-bold border-b border-teal-100 pb-2">
            <PhoneOutlined /> CONTACTS & GEOLOCATION
          </div>
          <Row gutter={[20, 32]}>
            {renderInput("Store Phone", "phone", 12)}
            {renderInput("Primary Contact", "contact", 12)}
            {renderSelect(
              "MTR Status",
              "mtr",
              [
                { label: "Yes", value: "Yes" },
                { label: "No", value: "No" },
              ],
              8,
            )}
            {renderInput("Latitude", "lat", 8)}
            {renderInput("Longitude", "lng", 8)}
            <Col span={24}>
              <Button
                type="primary"
                block
                icon={<SearchOutlined />}
                onClick={() => setSearchModalVisible(true)}
                style={{
                  height: "45px",
                  borderRadius: "10px",
                  background: "#0d9488",
                  fontWeight: "bold",
                }}
              >
                AMAP LOCATION SEARCH
              </Button>
            </Col>
          </Row>
        </div>

        <div className="flex justify-end gap-4 mt-8">
          <button
            className="px-8 py-3 bg-white border-2 border-black rounded-xl font-bold shadow-[2px_2px_0_#000]"
            onClick={onCancel}
          >
            CANCEL
          </button>
          <button
            className="px-12 py-3 bg-teal-600 text-white border-2 border-black rounded-xl font-bold shadow-[4px_4px_0_#000]"
            onClick={handleSubmit}
          >
            SAVE RECORDS
          </button>
        </div>
      </Modal>

      <Modal
        title="Amap Search"
        open={searchModalVisible}
        onCancel={() => setSearchModalVisible(false)}
        footer={null}
        width={500}
        centered
      >
        <AutoComplete
          style={{ width: "100%" }}
          options={searchOptions}
          onSearch={handleSearch}
          onSelect={onSelectLocation}
          value={searchText}
        >
          <Input.Search
            size="large"
            placeholder="Search building name..."
            enterButton
          />
        </AutoComplete>
      </Modal>

      <style>{`
        .st-inputBox-pro { position: relative; width: 100%; display: flex; align-items: center; }
        .st-inputBox-pro input, .uiverse-mock-input {
          width: 100% !important; height: 50px !important; background: white !important; border: 2px solid #000 !important;
          border-radius: 0.6rem !important; padding: 0 15px !important; font-size: 14px !important; font-weight: 700 !important;
          outline: none !important; transition: 0.2s; display: flex; align-items: center;
        }
        .st-inputBox-pro input:focus, .sel-ext-box:focus-within .uiverse-mock-input { box-shadow: 3px 3px 0 #000 !important; border-color: #0d9488 !important; }
        .st-inputBox-pro span { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); pointer-events: none; transition: 0.3s; font-size: 14px; font-weight: 800; color: #64748b; text-transform: uppercase; }
        .st-inputBox-pro input:focus ~ span, .st-inputBox-pro input:not(:placeholder-shown) ~ span, .sel-ext-box.has-val span, .sel-ext-box:focus-within span {
          transform: translateY(-40px) translateX(-5px) !important; font-size: 12px !important; color: #0d9488 !important; background: #f8fafc; padding: 0 5px;
        }
        .uv-hide-sel { position: absolute !important; width: 100% !important; height: 100% !important; top: 0; left: 0; opacity: 0; z-index: 5; }
        .ext-trigger { position: absolute !important; right: -30px !important; top: 50% !important; transform: translateY(-50%) !important; width: 28px; height: 28px; background: #0d9488; color: white; border-radius: 6px; display: flex; align-items: center; justify-content: center; border: 1.5px solid #000; z-index: 10; }
      `}</style>
    </>
  );
};
