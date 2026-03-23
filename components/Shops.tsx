import React, { useState } from "react";
import { Segmented } from "antd";
import { TableOutlined, EnvironmentOutlined } from "@ant-design/icons";
import { ShopList } from "./ShopList";
import { Locations } from "./Locations";
import { Shop, User, InventoryItem } from "../types";

type ShopsView = "table" | "map";

interface ShopsProps {
  shops: Shop[];
  graphToken: string;
  onRefresh: () => void;
  currentUser: User | null;
  allInventory: InventoryItem[];
  loading?: boolean;
  onNavigateToInventory?: (shopName: string) => void;
}

/**
 * Unified "Shops" page combining Master List (table) and Map View (map)
 * behind a single view toggle. Replaces separate ShopList + Locations nav items.
 */
export const Shops: React.FC<ShopsProps> = ({
  shops,
  graphToken,
  onRefresh,
  currentUser,
  allInventory,
  loading,
  onNavigateToInventory,
}) => {
  const [activeView, setActiveView] = useState<ShopsView>(() => {
    return (sessionStorage.getItem("shops-view") as ShopsView) ?? "table";
  });

  const handleViewChange = (val: string | number) => {
    const v = val as ShopsView;
    setActiveView(v);
    sessionStorage.setItem("shops-view", v);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          padding: "12px 20px 8px",
          borderBottom: "1px solid #f1f5f9",
          background: "#fff",
          flexShrink: 0,
        }}
      >
        <Segmented
          value={activeView}
          onChange={handleViewChange}
          options={[
            { value: "table", icon: <TableOutlined />, label: "Table" },
            { value: "map", icon: <EnvironmentOutlined />, label: "Map" },
          ]}
        />
      </div>

      <div style={{ flex: 1, overflow: "hidden" }}>
        {activeView === "table" ? (
          <ShopList
            shops={shops}
            graphToken={graphToken}
            onRefresh={onRefresh}
            currentUser={currentUser}
            allInventory={allInventory}
            loading={loading}
            onNavigateToInventory={onNavigateToInventory}
          />
        ) : (
          <Locations shops={shops} />
        )}
      </div>
    </div>
  );
};
