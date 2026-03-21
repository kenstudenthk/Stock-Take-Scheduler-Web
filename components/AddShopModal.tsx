// ShopFormModal.tsx - Part 1

import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  message,
  Row,
  Col,
  Typography,
  Select,
  Divider,
  AutoComplete,
  Input,
} from "antd";
import {
  InfoCircleOutlined,
  GlobalOutlined,
  SearchOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  ShopOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
} from "@ant-design/icons";
import { Shop, User, hasPermission } from "../types";

const { Title, Text } = Typography;

export const ShopFormModal: React.FC<{
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  onSuccess: () => void;
  graphToken: string;
  shops: Shop[];
  currentUser: User | null;
}> = ({
  visible,
  shop,
  onCancel,
  onSuccess,
  graphToken,
  shops,
  currentUser,
}) => {
  const [formData, setFormData] = useState<any>({});
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);

  const opts = useMemo(() => {
    const s = shops || [];
    const getU = (k: keyof Shop) =>
      Array.from(new Set(s.map((i) => i[k]).filter(Boolean)))
        .sort()
        .map((v) => ({ label: v, value: v }));
    return {
      bus: getU("businessUnit"),
      brands: getU("brand"),
      regions: getU("region"),
      districts: getU("district"),
      areas: getU("area"),
    };
  }, [shops]);

  const searchOpts = useMemo(() => {
    if (!searchText) return [];
    return shops
      .filter(
        (s) =>
          s.name?.toLowerCase().includes(searchText.toLowerCase()) ||
          s.id?.toLowerCase().includes(searchText.toLowerCase()),
      )
      .map((s) => ({ label: `${s.id} - ${s.name}`, value: s.id, data: s }));
  }, [searchText, shops]);

  const handleSearchSelect = (v: string, o: any) => {
    const s = o.data;
    setFormData({
      ...formData,
      name: s.name,
      code: s.id,
      brand: s.brand,
      region: s.region,
      district: s.district,
      area: s.area,
      addr_en: s.address,
      bu: s.businessUnit,
      sys: s.sys,
    });
    setSearchText("");
  };

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

  const renderInp = (l: string, k: string, s: number = 12) => (
    <Col span={s}>
      <div className="st-inputBox-pro">
        <input
          className="uiverse-input-field"
          type="text"
          required
          value={formData[k] || ""}
          onChange={(e) => setFormData({ ...formData, [k]: e.target.value })}
          placeholder=" "
        />
        <span className="floating-label">{l}</span>
      </div>
    </Col>
  );

  const renderSel = (l: string, k: string, o: any[], s: number = 12) => (
    <Col span={s}>
      <div
        className={`st-inputBox-pro sel-ext-wrapper ${formData[k] ? "has-content" : ""}`}
      >
        <div className="uiverse-input-field mock-box">{formData[k] || ""}</div>
        <Select
          className="uv-hide-sel"
          suffixIcon={
            <div className="ext-btn">
              <DownOutlined />
            </div>
          }
          value={formData[k] || undefined}
          onChange={(v) => setFormData({ ...formData, [k]: v })}
          options={o}
          variant="borderless"
          showSearch
        />
        <span className="floating-label">{l}</span>
      </div>
    </Col>
  );
  const handleSubmit = async () => {
    if (!formData.name || !formData.code) return message.warning("Required!");
    setLoading(true);
    const isEdit = !!shop;
    const url = isEdit
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;
    try {
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: {
          Authorization: `Bearer ${graphToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(isEdit ? formData : { fields: formData }),
      });
      if (res.ok) {
        message.success("Success!");
        onSuccess();
      } else {
        message.error("Failed to save");
      }
    } catch (e) {
      message.error("Error");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkClosed = () => {
    if (!shop) return;

    Modal.confirm({
      title: "Mark Store as Closed?",
      icon: <ExclamationCircleOutlined style={{ color: "#ef4444" }} />,
      content: `This will permanently close "${shop.name}". This action cannot be undone.`,
      okText: "Mark as Closed",
      okType: "danger",
      cancelText: "Cancel",
      onOk: async () => {
        setLoading(true);
        try {
          const url = `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`;
          const res = await fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${graphToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ masterStatus: "Closed" }),
          });
          if (res.ok) {
            message.success("Store marked as closed");
            onSuccess();
          } else {
            message.error("Failed to close store");
          }
        } catch (error) {
          message.error("Network error");
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const canClose =
    shop &&
    hasPermission(currentUser, "close_shop") &&
    shop.status?.toLowerCase() !== "closed";

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={900}
      centered
      bodyStyle={{ padding: "80px 40px 40px", backgroundColor: "#f8fafc" }}
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <Title level={3} style={{ margin: 0, fontWeight: 900 }}>
            STORE PROFILE
          </Title>
          <Text type="secondary">SharePoint Sync</Text>
        </div>
        <div style={{ width: "280px" }}>
          <AutoComplete
            options={searchOpts}
            onSelect={handleSearchSelect}
            onSearch={setSearchText}
            value={searchText}
            style={{ width: "100%" }}
          >
            <Input.Search
              placeholder="Search..."
              enterButton={<SearchOutlined />}
            />
          </AutoComplete>
        </div>
      </div>
      <div className="st-form-section">
        <Divider
          orientation="left"
          style={{ color: "#0d9488", fontWeight: 800 }}
        >
          BASIC
        </Divider>
        <Row gutter={[24, 75]}>
          {renderInp("Name", "name", 24)} {renderInp("Code", "code", 8)}
          {renderSel("Brand", "brand", opts.brands, 8)}{" "}
          {renderSel(
            "Group",
            "group",
            [
              { label: "A", value: "1" },
              { label: "B", value: "2" },
            ],
            8,
          )}
          {renderSel("BU", "bu", opts.bus, 12)}{" "}
          {renderInp("System ID", "sys", 12)}
        </Row>
      </div>
      <div className="st-form-section mt-12">
        <Divider
          orientation="left"
          style={{ color: "#0d9488", fontWeight: 800 }}
        >
          LOCATION
        </Divider>
        <Row gutter={[24, 75]}>
          {renderInp("Address", "addr_en", 24)}{" "}
          {renderSel("Region", "region", opts.regions, 8)}
          {renderSel("District", "district", opts.districts, 8)}{" "}
          {renderSel("Area", "area", opts.areas, 8)}
        </Row>
      </div>
      {/* Enhanced Action Footer */}
      <div className="shop-form-actions">
        <div className="shop-form-actions-left">
          {canClose && (
            <button
              className="shop-form-btn shop-form-btn-close"
              onClick={handleMarkClosed}
              disabled={loading}
            >
              <ExclamationCircleOutlined />
              MARK AS CLOSED
            </button>
          )}
        </div>
        <div className="shop-form-actions-right">
          <button
            className="shop-form-btn shop-form-btn-cancel"
            onClick={onCancel}
            disabled={loading}
          >
            CANCEL
          </button>
          <button
            className="shop-form-btn shop-form-btn-save"
            onClick={handleSubmit}
            disabled={loading}
          >
            <CheckOutlined />
            {loading ? "SAVING..." : "SAVE"}
          </button>
        </div>
      </div>
      <style>{`
        /* Input Box Styling */
        .st-inputBox-pro {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .uiverse-input-field {
          width: 100% !important;
          height: 52px !important;
          background: white !important;
          border: 2.5px solid #000 !important;
          border-radius: 10px !important;
          padding: 0 16px !important;
          font-family: 'Fira Sans', sans-serif;
          font-size: 14px !important;
          font-weight: 600 !important;
          color: #1e293b;
          outline: none !important;
          display: flex !important;
          align-items: center !important;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mock-box {
          cursor: default;
          color: #000;
        }

        .uiverse-input-field:focus,
        .sel-ext-wrapper:focus-within .uiverse-input-field {
          box-shadow: 4px 4px 0 #0d9488 !important;
          border-color: #0d9488 !important;
          transform: translateY(-2px);
        }

        .st-inputBox-pro .floating-label {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-family: 'Fira Code', monospace;
          font-size: 13px !important;
          font-weight: 800 !important;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          z-index: 20;
        }

        .uiverse-input-field:focus ~ .floating-label,
        .uiverse-input-field:not(:placeholder-shown) ~ .floating-label,
        .sel-ext-wrapper.has-content .floating-label,
        .sel-ext-wrapper:focus-within .floating-label {
          transform: translateY(-42px) translateX(-4px) !important;
          font-size: 11px !important;
          color: #0d9488 !important;
          background: #f8fafc;
          padding: 2px 8px;
          border-radius: 4px;
          border: 1.5px solid #0d9488;
          box-shadow: 2px 2px 0 rgba(13, 148, 136, 0.2);
          font-weight: 900 !important;
        }

        .uv-hide-sel {
          position: absolute !important;
          width: 100% !important;
          height: 100% !important;
          top: 0;
          left: 0;
          opacity: 0;
          z-index: 5;
        }

        .ext-btn {
          position: absolute !important;
          right: -32px !important;
          top: 50% !important;
          transform: translateY(-50%) !important;
          width: 32px;
          height: 32px;
          background: #0d9488;
          color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #000;
          box-shadow: 2px 2px 0 #000;
          cursor: pointer;
          transition: all 0.2s ease;
          z-index: 10;
        }

        .ext-btn:hover {
          background: #0f766e;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 3px 3px 0 #000;
        }

        /* Form Section Styling */
        .st-form-section {
          background: white;
          border: 2.5px solid #000;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 4px 4px 0 #000;
          transition: all 0.3s ease;
        }

        .st-form-section:hover {
          box-shadow: 6px 6px 0 #000;
          transform: translateY(-2px);
        }

        /* Action Buttons */
        .shop-form-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 2px dashed #e2e8f0;
          gap: 12px;
        }

        .shop-form-actions-left {
          flex: 0 0 auto;
        }

        .shop-form-actions-right {
          display: flex;
          gap: 12px;
          margin-left: auto;
        }

        .shop-form-btn {
          height: 48px;
          padding: 0 24px;
          font-family: 'Fira Code', monospace;
          font-size: 12px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 2.5px solid #000;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .shop-form-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .shop-form-btn-cancel {
          background: white;
          color: #1e293b;
          box-shadow: 3px 3px 0 #000;
        }

        .shop-form-btn-cancel:hover:not(:disabled) {
          background: #f8fafc;
          transform: translate(-2px, -2px);
          box-shadow: 5px 5px 0 #000;
        }

        .shop-form-btn-save {
          background: #0d9488;
          color: white;
          box-shadow: 4px 4px 0 #000;
        }

        .shop-form-btn-save:hover:not(:disabled) {
          background: #0f766e;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #000;
        }

        .shop-form-btn-close {
          background: #ef4444;
          color: white;
          box-shadow: 4px 4px 0 #000;
        }

        .shop-form-btn-close:hover:not(:disabled) {
          background: #dc2626;
          transform: translate(-2px, -2px);
          box-shadow: 6px 6px 0 #000;
        }

        .shop-form-btn:active:not(:disabled) {
          transform: translate(1px, 1px);
          box-shadow: 2px 2px 0 #000;
        }

        /* Mobile Responsive */
        @media (max-width: 640px) {
          .shop-form-actions {
            flex-direction: column;
            gap: 12px;
          }

          .shop-form-actions-left,
          .shop-form-actions-right {
            width: 100%;
          }

          .shop-form-actions-right {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
          }

          .shop-form-btn-close {
            width: 100%;
          }
        }
      `}</style>
    </Modal>
  );
};
