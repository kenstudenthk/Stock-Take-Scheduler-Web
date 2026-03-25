import React, { useState, useEffect } from "react";
import {
  Modal,
  Tag,
  Space,
  Typography,
  Button,
  Divider,
  Descriptions,
  Spin,
} from "antd";
import {
  ShopOutlined,
  EditOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  BankOutlined,
  ClockCircleOutlined,
  FileProtectOutlined,
  PaperClipOutlined,
  FilePdfOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { Shop, User, hasPermission, InventoryItem } from "../types";
import { ShopFormModal } from "./ShopFormModal";
import { ShopInventoryModal } from "./ShopInventoryModal";
import { API_URLS } from "../constants/config";

const { Title, Text } = Typography;

interface Props {
  visible: boolean;
  shop: Shop | null;
  onCancel: () => void;
  graphToken: string;
  shops: Shop[];
  currentUser: User | null;
  allInventory: InventoryItem[];
  onRefreshShop: () => void;
  loading?: boolean;
  onNavigateToInventory?: (shopName: string) => void;
}

const statusColor = (status: string) => {
  const s = status?.toLowerCase();
  if (s === "planned") return "blue";
  if (s === "completed") return "green";
  if (s === "in-progress") return "gold";
  if (s === "rescheduled") return "orange";
  if (s === "closed") return "default";
  return "cyan";
};

export const ShopDetailModal: React.FC<Props> = ({
  visible,
  shop,
  onCancel,
  graphToken,
  shops,
  currentUser,
  allInventory,
  onRefreshShop,
  loading,
  onNavigateToInventory,
}) => {
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [attachments, setAttachments] = useState<{id: string; name: string; url: string}[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !shop?.sharePointItemId) return;
    setAttachments([]);
    setAttachmentsLoading(true);
    fetch(
      `${API_URLS.shopList}/items/${shop.sharePointItemId}/attachments`,
      { headers: { Authorization: `Bearer ${graphToken}` } }
    )
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(data => setAttachments(data.value ?? []))
      .catch(() => setAttachments([]))
      .finally(() => setAttachmentsLoading(false));
  }, [visible, shop?.sharePointItemId]);

  if (!shop) return null;

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        width={720}
        centered
        footer={
          <div className="flex justify-between items-center">
            <Text type="secondary" className="text-xs font-mono">
              #{shop.id}
            </Text>
            <Space>
              <Button
                icon={<DatabaseOutlined />}
                onClick={() => setInventoryOpen(true)}
                style={{ borderColor: "#0d9488", color: "#0d9488" }}
              >
                View Inventory
              </Button>
              {hasPermission(currentUser, "edit_shop") && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setEditOpen(true)}
                  style={{ background: "#0d9488" }}
                >
                  Edit Shop
                </Button>
              )}
              <Button onClick={onCancel}>Close</Button>
            </Space>
          </div>
        }
        title={
          <div className="flex items-center gap-3">
            <ShopOutlined style={{ color: "#0d9488", fontSize: 20 }} />
            <div>
              <Title level={4} style={{ margin: 0 }}>
                {shop.name}
              </Title>
              <Space size={8} className="mt-0.5">
                <Tag color="blue" className="m-0 text-xs">
                  {shop.brand}
                </Tag>
                {shop.status && (
                  <Tag color={statusColor(shop.status)} className="m-0 text-xs">
                    {shop.status}
                  </Tag>
                )}
                {shop.masterStatus && (
                  <Tag
                    color={shop.masterStatus === "Closed" ? "default" : "green"}
                    className="m-0 text-xs"
                  >
                    {shop.masterStatus}
                  </Tag>
                )}
              </Space>
            </div>
          </div>
        }
      >
        <Divider className="mt-2 mb-4" />

        {/* Location Section */}
        <div className="flex items-center gap-2 mb-2">
          <EnvironmentOutlined style={{ color: "#0d9488" }} />
          <Text strong className="text-sm">
            Location
          </Text>
        </div>
        <Descriptions size="small" column={2} className="mb-4">
          <Descriptions.Item label="Region">
            {shop.region || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="District">
            {shop.district || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Area">{shop.area || "—"}</Descriptions.Item>
          <Descriptions.Item label="MTR">
            {shop.is_mtr ? (
              <Tag color="purple" className="text-xs">
                MTR
              </Tag>
            ) : (
              <Text type="secondary" className="text-xs">
                Non-MTR
              </Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Address" span={2}>
            {shop.address || "—"}
          </Descriptions.Item>
        </Descriptions>

        <Divider className="my-3" />

        {/* Schedule Section */}
        <div className="flex items-center gap-2 mb-2">
          <BankOutlined style={{ color: "#0d9488" }} />
          <Text strong className="text-sm">
            Schedule Info
          </Text>
        </div>
        <Descriptions size="small" column={2} className="mb-4">
          <Descriptions.Item label="Business Unit">
            {shop.businessUnit || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Scheduled Date">
            {shop.scheduledDate || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Schedule Group">
            {shop.groupId ? `Group ${shop.groupId}` : "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Schedule Status">
            {shop.scheduleStatus || "—"}
          </Descriptions.Item>
        </Descriptions>

        {(shop.contactName || shop.phone) && (
          <>
            <Divider className="my-3" />
            <div className="flex items-center gap-2 mb-2">
              <PhoneOutlined style={{ color: "#0d9488" }} />
              <Text strong className="text-sm">
                Contact
              </Text>
            </div>
            <Descriptions size="small" column={2}>
              {shop.contactName && (
                <Descriptions.Item
                  label={
                    <>
                      <UserOutlined /> Name
                    </>
                  }
                >
                  {shop.contactName}
                </Descriptions.Item>
              )}
              {shop.phone && (
                <Descriptions.Item
                  label={
                    <>
                      <PhoneOutlined /> Phone
                    </>
                  }
                >
                  {shop.phone}
                </Descriptions.Item>
              )}
            </Descriptions>
          </>
        )}

        {/* Stock Take Info Section */}
        {(shop.startTime || shop.endTime || shop.timeUse || shop.mainFE || shop.assistantFE) && (
          <>
            <Divider className="my-3" />
            <div className="flex items-center gap-2 mb-2">
              <ClockCircleOutlined style={{ color: "#0d9488" }} />
              <Text strong className="text-sm">Stock Take Info</Text>
            </div>
            <Descriptions size="small" column={2} className="mb-4">
              <Descriptions.Item label="Start Time">{shop.startTime || "—"}</Descriptions.Item>
              <Descriptions.Item label="End Time">{shop.endTime || "—"}</Descriptions.Item>
              <Descriptions.Item label="Time Use">{shop.timeUse || "—"}</Descriptions.Item>
              <Descriptions.Item label="Main FE">{shop.mainFE || "—"}</Descriptions.Item>
              <Descriptions.Item label="Assistant FE">{shop.assistantFE || "—"}</Descriptions.Item>
            </Descriptions>
          </>
        )}

        {/* Stock Take Shop Agreement Section */}
        <Divider className="my-3" />
        <div className="flex items-center gap-2 mb-2">
          <FileProtectOutlined style={{ color: "#0d9488" }} />
          <Text strong className="text-sm">Stock Take Shop Agreement</Text>
        </div>
        <Descriptions size="small" column={2} className="mb-3">
          <Descriptions.Item label="Staff No.">{shop.staffNo || "—"}</Descriptions.Item>
          <Descriptions.Item label="Staff Name">{shop.staffName || "—"}</Descriptions.Item>
        </Descriptions>

        <div className="flex items-center gap-1.5 mb-2">
          <PaperClipOutlined style={{ color: "#6b7280", fontSize: 12 }} />
          <Text type="secondary" className="text-xs">Attachments</Text>
        </div>

        {attachmentsLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            background: "#f9fafb", borderRadius: 6, border: "1px dashed #e5e7eb" }}>
            <Spin size="small" />
            <Text type="secondary" className="text-xs">Loading attachments…</Text>
          </div>
        ) : attachments.length === 0 ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
            background: "#f9fafb", borderRadius: 6, border: "1px dashed #e5e7eb" }}>
            <PaperClipOutlined style={{ color: "#d1d5db" }} />
            <Text type="secondary" className="text-xs italic">No attachments</Text>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {attachments.map(att => (
              <a key={att.id} href={att.url} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px",
                  borderRadius: 6, border: "1px solid #e5e7eb", background: "#fff",
                  color: "#0d9488", fontSize: 13, textDecoration: "none" }}>
                <FilePdfOutlined style={{ color: "#ef4444", fontSize: 15 }} />
                <Text ellipsis={{ tooltip: att.name }}
                  style={{ flex: 1, color: "#0d9488", fontSize: 13 }}>{att.name}</Text>
                <DownloadOutlined style={{ color: "#9ca3af", fontSize: 12 }} />
              </a>
            ))}
          </div>
        )}
      </Modal>

      <ShopInventoryModal
        visible={inventoryOpen}
        shop={shop}
        onCancel={() => setInventoryOpen(false)}
        graphToken={graphToken}
        shops={shops}
        currentUser={currentUser}
        allInventory={allInventory}
        onRefreshShop={() => {
          setInventoryOpen(false);
          onRefreshShop();
        }}
        loading={loading}
        onNavigateToInventory={onNavigateToInventory}
      />

      <ShopFormModal
        visible={editOpen}
        shop={shop}
        onCancel={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          onRefreshShop();
        }}
        graphToken={graphToken}
        shops={shops}
        currentUser={currentUser}
      />
    </>
  );
};
