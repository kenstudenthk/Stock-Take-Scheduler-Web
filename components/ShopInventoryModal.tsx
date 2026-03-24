import React, { useState, useMemo } from "react";
import {
  Modal,
  Table,
  Tag,
  Space,
  Typography,
  Button,
  Divider,
  Empty,
  Spin,
} from "antd";
import {
  ShopOutlined,
  DatabaseOutlined,
  SyncOutlined,
} from "@ant-design/icons";
import { Shop, InventoryItem, User } from "../types";
import { ShopFormModal } from "./ShopFormModal";

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

export const ShopInventoryModal: React.FC<Props> = ({
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
  const [editFormOpen, setEditFormOpen] = useState(false);

  const items = useMemo(() => {
    const sid = (shop?.id ?? "").trim().toLowerCase();
    const sname = (shop?.name ?? "").trim().toLowerCase();
    const namePrefix = sname.split("-")[0]?.trim();

    const byId = allInventory.filter(
      (i) => i.shopCode.trim().toLowerCase() === sid,
    );
    const byPrefix = allInventory.filter(
      (i) => i.shopCode.trim().toLowerCase() === namePrefix,
    );
    const byName = allInventory.filter(
      (i) => i.shopName.trim().toLowerCase() === sname,
    );
    // Fallback: shopName contains the shop code
    const byContains = allInventory.filter(
      (i) => sid && i.shopName.trim().toLowerCase().includes(sid),
    );

    console.log(
      `[ShopInventory] sid:"${sid}" prefix:"${namePrefix}" byId:${byId.length} byPrefix:${byPrefix.length} byName:${byName.length} byContains:${byContains.length} total:${allInventory.length}`,
    );
    if (byId.length) return byId;
    if (byPrefix.length) return byPrefix;
    if (byName.length) return byName;
    return byContains;
  }, [allInventory, shop?.id, shop?.name]);

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "verified") return "green";
    if (s === "unverified") return "orange";
    if (s === "n/a") return "default";
    return "blue";
  };

  const columns = [
    {
      title: "Asset Name",
      dataIndex: "assetName",
      key: "assetName",
      width: "22%",
      render: (v: string) => (
        <Text strong className="text-[13px]">
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "Product Type",
      dataIndex: "productTypeEng",
      key: "productTypeEng",
      width: "18%",
      render: (v: string) => <Text className="text-[12px]">{v || "—"}</Text>,
    },
    {
      title: "Asset ID",
      dataIndex: "assetItemId",
      key: "assetItemId",
      width: "12%",
      render: (v: string) => (
        <Text code className="text-[11px]">
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "Serial No.",
      dataIndex: "serialNo",
      key: "serialNo",
      width: "14%",
      render: (v: string) => (
        <Text code className="text-[11px]">
          {v || "—"}
        </Text>
      ),
    },
    {
      title: "CMDB",
      dataIndex: "cmdb",
      key: "cmdb",
      width: "10%",
      render: (v: string) => (
        <Text className="text-[11px] text-slate-500">{v || "—"}</Text>
      ),
    },
    {
      title: "Status",
      dataIndex: "stockTakeStatus",
      key: "stockTakeStatus",
      width: "12%",
      render: (v: string) => (
        <Tag
          color={statusColor(v)}
          className="text-[11px] font-semibold border-none"
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "In Use",
      dataIndex: "inUseStatus",
      key: "inUseStatus",
      width: "10%",
      render: (v: string) => <Tag className="text-[11px] border-none">{v}</Tag>,
    },
  ];

  return (
    <>
      <Modal
        open={visible}
        onCancel={onCancel}
        width={960}
        centered
        footer={
          <div className="flex justify-between items-center">
            <Text type="secondary" className="text-xs">
              {items.length} inventory item{items.length !== 1 ? "s" : ""}
            </Text>
            <Space>
              {shop && onNavigateToInventory && (
                <Button
                  type="primary"
                  icon={<DatabaseOutlined />}
                  onClick={() => {
                    onNavigateToInventory(shop.name);
                    onCancel();
                  }}
                  style={{ background: "#0d9488" }}
                >
                  Inventory Detail
                </Button>
              )}
              <Button onClick={onCancel}>Close</Button>
            </Space>
          </div>
        }
        title={
          shop && (
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
                  <Text type="secondary" className="text-xs font-mono">
                    #{shop.id}
                  </Text>
                  {shop.region && (
                    <Text type="secondary" className="text-xs">
                      {shop.region} · {shop.district}
                    </Text>
                  )}
                </Space>
              </div>
            </div>
          )
        }
      >
        <Divider className="mt-2 mb-3" />
        <div className="flex items-center gap-2 mb-3">
          <DatabaseOutlined style={{ color: "#0d9488" }} />
          <Text strong>Inventory Items</Text>
          <Tag color="cyan" className="border-none font-bold">
            {items.length}
          </Tag>
          {loading && (
            <Spin
              indicator={<SyncOutlined spin style={{ color: "#0d9488" }} />}
              size="small"
            />
          )}
        </div>
        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          size="small"
          pagination={{
            pageSize: 10,
            showTotal: (t) => `Total ${t} items`,
            showSizeChanger: false,
          }}
          locale={{
            emptyText: (
              <Empty
                description="No inventory items found for this shop"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            ),
          }}
        />
      </Modal>

      <ShopFormModal
        visible={editFormOpen}
        shop={shop}
        onCancel={() => setEditFormOpen(false)}
        onSuccess={() => {
          setEditFormOpen(false);
          onRefreshShop();
        }}
        graphToken={graphToken}
        shops={shops}
        currentUser={currentUser}
      />
    </>
  );
};
