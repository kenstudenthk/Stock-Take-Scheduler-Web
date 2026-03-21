import React, { useEffect, useState, useMemo } from "react";
import {
  Modal,
  message,
  Row,
  Col,
  Typography,
  Button,
  AutoComplete,
  Select,
  Divider,
  Input,
  Form,
  Card,
} from "antd";
import {
  InfoCircleOutlined,
  SearchOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  GlobalOutlined,
  ExclamationCircleOutlined,
  CheckOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { Shop, User, hasPermission } from "../types";
import { SP_FIELDS } from "../constants";

const { Title, Text } = Typography;
const { Option } = Select;

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
  currentUser: User | null;
}

export const ShopFormModal: React.FC<Props> = ({
  visible,
  shop,
  onCancel,
  onSuccess,
  graphToken,
  shops,
  currentUser,
}) => {
  const [form] = Form.useForm();
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchOptions, setSearchOptions] = useState<any[]>([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessIcon, setShowSuccessIcon] = useState(false);
  const [hoveredSection, setHoveredSection] = useState<string | null>(null);

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
        form.setFieldsValue({
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
        form.resetFields();
        form.setFieldsValue({ mtr: "No", group: "1" });
      }
    }
  }, [shop, visible, form]);

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
                  <div className="py-1 border-b border-slate-100">
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.address}</div>
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
      form.setFieldsValue({
        lat: o.location.lat.toString(),
        lng: o.location.lng.toString(),
      });

      // Enhanced success feedback with animation
      setShowSuccessIcon(true);
      message.success({
        content: "Coordinates updated successfully!",
        icon: <CheckOutlined style={{ color: "#0d9488" }} />,
        duration: 2,
      });

      setTimeout(() => setShowSuccessIcon(false), 2000);
      setSearchModalVisible(false);
    }
  };

  const handleSubmit = async (values: any) => {
    setLoading(true);
    const isEdit = !!shop;
    const url = isEdit
      ? `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items/${shop.sharePointItemId}/fields`
      : `https://graph.microsoft.com/v1.0/sites/pccw0.sharepoint.com:/sites/BonniesTeam:/lists/ce3a752e-7609-4468-81f8-8babaf503ad8/items`;
    const payload = {
      [SP_FIELDS.SHOP_NAME]: values.name,
      [SP_FIELDS.SHOP_CODE]: values.code,
      [SP_FIELDS.BRAND]: values.brand,
      [SP_FIELDS.REGION]: values.region,
      [SP_FIELDS.DISTRICT]: values.district,
      [SP_FIELDS.AREA]: values.area,
      [SP_FIELDS.ADDRESS_ENG]: values.addr_en,
      [SP_FIELDS.ADDRESS_CHI]: values.addr_chi,
      [SP_FIELDS.BUILDING]: values.building,
      [SP_FIELDS.MTR]: values.mtr,
      [SP_FIELDS.PHONE]: values.phone,
      [SP_FIELDS.CONTACT]: values.contact,
      [SP_FIELDS.REMARK]: values.remark,
      [SP_FIELDS.SYS]: values.sys,
      [SP_FIELDS.BUSINESS_UNIT]: values.bu,
      [SP_FIELDS.LATITUDE]: values.lat?.toString(),
      [SP_FIELDS.LONGITUDE]: values.lng?.toString(),
      [SP_FIELDS.SCHEDULE_GROUP]: values.group,
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
        // Enhanced success feedback with animation
        setShowSuccessIcon(true);
        message.success({
          content: isEdit
            ? "Shop profile updated successfully!"
            : "New shop created successfully!",
          icon: <CheckOutlined style={{ color: "#0d9488" }} />,
          duration: 2.5,
        });

        // Haptic feedback simulation with small delay
        setTimeout(() => {
          setShowSuccessIcon(false);
          onSuccess();
        }, 800);
      } else {
        message.error({
          content: "Failed to save - please check permissions",
          duration: 3,
        });
      }
    } catch (e) {
      message.error({
        content: "Network error - please try again",
        duration: 3,
      });
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
            body: JSON.stringify({ [SP_FIELDS.STATUS]: "Closed" }),
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
    shop.masterStatus?.toLowerCase() !== "closed";

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        width={900}
        centered
        footer={null}
        title={
          <div className="flex items-center gap-3">
            <ShopOutlined className="text-teal-600 text-xl" />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {shop ? "Store Profile Manager" : "New Store Registration"}
              </Title>
              <Text type="secondary" className="text-xs">
                Directly managing SharePoint master data
              </Text>
            </div>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <div className="max-h-[70vh] overflow-y-auto px-2">
            {/* Basic Information Section */}
            <Card
              className="mb-4 rounded-xl border-slate-200 shadow-sm shop-form-card"
              size="small"
              onMouseEnter={() => setHoveredSection("basic")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <div className="flex items-center gap-2 mb-4 section-header">
                <InfoCircleOutlined
                  className={`text-teal-600 section-icon ${hoveredSection === "basic" ? "icon-bounce" : ""}`}
                />
                <Text strong className="text-teal-700">
                  Basic Information
                </Text>
              </div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="name"
                    label="Official Shop Name"
                    rules={[
                      { required: true, message: "Shop name is required" },
                    ]}
                  >
                    <Input
                      placeholder="Enter shop name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="code"
                    label="Shop Code"
                    rules={[
                      { required: true, message: "Shop code is required" },
                    ]}
                  >
                    <Input
                      placeholder="e.g. 5110"
                      className="rounded-lg"
                      disabled={!!shop}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="brand" label="Brand">
                    <Select
                      placeholder="Select brand"
                      className="rounded-lg"
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={dynamicOptions.brands}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="group" label="Schedule Group">
                    <Select placeholder="Select group" className="rounded-lg">
                      <Option value="1">Group A</Option>
                      <Option value="2">Group B</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="bu" label="Business Unit">
                    <Select
                      placeholder="Select BU"
                      className="rounded-lg"
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={dynamicOptions.bus}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="sys" label="System ID">
                    <Input placeholder="System ID" className="rounded-lg" />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider className="my-4" />

            {/* Location Details Section */}
            <Card
              className="mb-4 rounded-xl border-slate-200 shadow-sm shop-form-card"
              size="small"
              onMouseEnter={() => setHoveredSection("location")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <div className="flex items-center gap-2 mb-4 section-header">
                <GlobalOutlined
                  className={`text-teal-600 section-icon ${hoveredSection === "location" ? "icon-bounce" : ""}`}
                />
                <Text strong className="text-teal-700">
                  Location Details
                </Text>
              </div>
              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item name="addr_en" label="English Address (Full)">
                    <Input
                      placeholder="Full address in English"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="addr_chi" label="Chinese Address">
                    <Input
                      placeholder="Full address in Chinese"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="region" label="Region">
                    <Select
                      placeholder="Select region"
                      className="rounded-lg"
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={dynamicOptions.regions}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="district" label="District">
                    <Select
                      placeholder="Select district"
                      className="rounded-lg"
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={dynamicOptions.districts}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="area" label="Area">
                    <Select
                      placeholder="Select area"
                      className="rounded-lg"
                      showSearch
                      filterOption={(input, option) =>
                        String(option?.label ?? "")
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                      options={dynamicOptions.areas}
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item name="building" label="Building / Landmark">
                    <Input
                      placeholder="Building or landmark name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Card>

            <Divider className="my-4" />

            {/* Contact & Geolocation Section */}
            <Card
              className="mb-4 rounded-xl border-slate-200 shadow-sm shop-form-card"
              size="small"
              onMouseEnter={() => setHoveredSection("contact")}
              onMouseLeave={() => setHoveredSection(null)}
            >
              <div className="flex items-center gap-2 mb-4 section-header">
                <PhoneOutlined
                  className={`text-teal-600 section-icon ${hoveredSection === "contact" ? "icon-bounce" : ""}`}
                />
                <Text strong className="text-teal-700">
                  Contact & Geolocation
                </Text>
              </div>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="Store Phone">
                    <Input
                      placeholder="Contact number"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="contact" label="Primary Contact">
                    <Input
                      placeholder="Contact person name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="mtr" label="MTR Status">
                    <Select placeholder="Select MTR status">
                      <Option value="Yes">Yes</Option>
                      <Option value="No">No</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lat" label="Latitude">
                    <Input
                      placeholder="Latitude"
                      className="rounded-lg bg-slate-50"
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item name="lng" label="Longitude">
                    <Input
                      placeholder="Longitude"
                      className="rounded-lg bg-slate-50"
                      disabled
                    />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Button
                    type="primary"
                    block
                    icon={<SearchOutlined />}
                    onClick={() => setSearchModalVisible(true)}
                    className="bg-teal-600 rounded-lg h-10 font-medium"
                  >
                    Search Location via AMap
                  </Button>
                </Col>
              </Row>
            </Card>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 mt-4">
            {canClose ? (
              <Button
                danger
                icon={<ExclamationCircleOutlined />}
                onClick={handleMarkClosed}
                disabled={loading}
                className="rounded-lg"
              >
                Mark as Closed
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button
                onClick={onCancel}
                disabled={loading}
                className="rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                icon={<CheckOutlined />}
                loading={loading}
                className="bg-teal-600 rounded-lg shop-save-btn"
              >
                Save Records
              </Button>
            </div>
          </div>
        </Form>
      </Modal>

      {/* Success Icon Overlay */}
      {showSuccessIcon && (
        <div className="success-overlay">
          <div className="success-icon-wrapper">
            <CheckOutlined />
          </div>
        </div>
      )}

      {/* AMap Search Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <EnvironmentOutlined className="text-teal-600" />
            <Text strong>AMap Location Search</Text>
          </div>
        }
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
            placeholder="Search building name or address..."
            enterButton
            className="rounded-lg"
          />
        </AutoComplete>
      </Modal>

      {/* Professional Whimsy Styles */}
      <style>{`
        /* Section Card Animations */
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes iconBounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.1) rotate(-5deg);
          }
          75% {
            transform: scale(1.1) rotate(5deg);
          }
        }

        @keyframes successPop {
          0% {
            transform: scale(0) rotate(-180deg);
            opacity: 0;
          }
          50% {
            transform: scale(1.2) rotate(10deg);
            opacity: 1;
          }
          100% {
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes shimmer {
          0% {
            background-position: -1000px 0;
          }
          100% {
            background-position: 1000px 0;
          }
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(13, 148, 136, 0.4);
          }
          50% {
            box-shadow: 0 0 0 10px rgba(13, 148, 136, 0);
          }
        }

        /* Form Section Cards */
        .shop-form-card {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          animation: fadeSlideIn 0.4s ease-out backwards;
          position: relative;
          overflow: hidden;
        }

        .shop-form-card:nth-child(1) {
          animation-delay: 0.1s;
        }

        .shop-form-card:nth-child(3) {
          animation-delay: 0.2s;
        }

        .shop-form-card:nth-child(5) {
          animation-delay: 0.3s;
        }

        .shop-form-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 3px;
          height: 0;
          background: linear-gradient(180deg, #0d9488, #14b8a6);
          transition: height 0.3s ease;
          border-radius: 0 0 3px 3px;
        }

        .shop-form-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.15) !important;
        }

        .shop-form-card:hover::before {
          height: 100%;
        }

        /* Section Header Icons */
        .section-icon {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 16px;
        }

        .section-icon.icon-bounce {
          animation: iconBounce 0.6s ease-in-out;
        }

        /* Form Input Focus Effects */
        .ant-input:focus,
        .ant-select-focused .ant-select-selector {
          border-color: #0d9488 !important;
          box-shadow: 0 0 0 2px rgba(13, 148, 136, 0.1) !important;
        }

        .ant-form-item-label > label {
          font-weight: 600;
          color: #475569;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Save Button Enhancement */
        .shop-save-btn {
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .shop-save-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg,
            transparent,
            rgba(255, 255, 255, 0.3),
            transparent
          );
          transition: left 0.5s;
        }

        .shop-save-btn:hover:not(:disabled)::before {
          left: 100%;
        }

        .shop-save-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.4) !important;
        }

        .shop-save-btn:active:not(:disabled) {
          transform: translateY(0);
        }

        .shop-save-btn.ant-btn-loading {
          animation: pulse 1.5s infinite;
        }

        /* Success Overlay */
        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          pointer-events: none;
          animation: fadeSlideIn 0.3s ease-out;
        }

        .success-icon-wrapper {
          width: 80px;
          height: 80px;
          background: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 32px rgba(13, 148, 136, 0.3);
          animation: successPop 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .success-icon-wrapper .anticon {
          font-size: 40px;
          color: #0d9488;
        }

        /* Input Hover Effects */
        .ant-input:hover,
        .ant-select:not(.ant-select-disabled):hover .ant-select-selector {
          border-color: #14b8a6 !important;
        }

        /* Divider Enhancement */
        .ant-divider {
          border-color: #e2e8f0;
          margin: 16px 0;
        }

        /* Modal Title Animation */
        .ant-modal-title {
          animation: fadeSlideIn 0.4s ease-out;
        }

        /* Disabled Input Styling */
        .ant-input:disabled {
          background: #f8fafc !important;
          color: #94a3b8 !important;
          cursor: not-allowed;
        }

        /* Form Item Spacing */
        .ant-form-item {
          margin-bottom: 16px;
        }

        /* Button Group Spacing */
        .flex.gap-2 button {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .flex.gap-2 button:hover:not(:disabled) {
          transform: translateY(-1px);
        }

        .flex.gap-2 button:active:not(:disabled) {
          transform: translateY(0);
        }

        /* Mark as Closed Button */
        .ant-btn-dangerous {
          transition: all 0.3s ease;
        }

        .ant-btn-dangerous:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3) !important;
        }

        /* ScrollBar Styling */
        .max-h-\\[70vh\\]::-webkit-scrollbar {
          width: 6px;
        }

        .max-h-\\[70vh\\]::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 3px;
        }

        .max-h-\\[70vh\\]::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 3px;
          transition: background 0.2s;
        }

        .max-h-\\[70vh\\]::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* AMap Search Button Enhancement */
        .bg-teal-600.font-medium {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .bg-teal-600.font-medium:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(13, 148, 136, 0.3) !important;
        }

        .bg-teal-600.font-medium:active {
          transform: translateY(0);
        }

        /* Form Validation Success */
        .ant-form-item-has-success .ant-input,
        .ant-form-item-has-success .ant-select-selector {
          border-color: #10b981 !important;
        }

        /* Form Validation Error Shake */
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        .ant-form-item-has-error {
          animation: shake 0.4s ease-in-out;
        }

        /* Tooltip Enhancements */
        .ant-tooltip-inner {
          background: linear-gradient(135deg, #0d9488, #14b8a6);
          font-weight: 600;
          font-size: 11px;
          letter-spacing: 0.3px;
        }

        .ant-tooltip-arrow-content {
          background: #0d9488;
        }
      `}</style>
    </>
  );
};
