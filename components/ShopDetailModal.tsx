import React, { useState } from "react";
import {
  Modal,
  Tag,
  Space,
  Typography,
  Button,
  Divider,
  Descriptions,
} from "antd";
import {
  ShopOutlined,
  EditOutlined,
  DatabaseOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  BankOutlined,
} from "@ant-design/icons";
import { Shop, User, hasPermission, InventoryItem } from "../types";
import { ShopFormModal } from "./ShopFormModal";
import { ShopInventoryModal } from "./ShopInventoryModal";

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

  if (!shop) return null;

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        width={680}
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
