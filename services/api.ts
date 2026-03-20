import axios from "axios";
import { Shop, Schedule, ShopCluster, ShopStatus } from "../types";

// 根據環境變數決定使用真實 API 還是 Mock
const API_URL = process.env.VITE_POWER_AUTOMATE_URL;
const MOCK_MODE = !API_URL;

// Mock 數據生成函數
const generateMockShops = (count: number): Shop[] => {
  const districts = [
    "Central",
    "Wan Chai",
    "Kowloon Tong",
    "Mong Kok",
    "Sha Tin",
    "Tuen Mun",
  ];
  const regions = ["Hong Kong Island", "Kowloon", "New Territories"];
  const statuses: ShopStatus[] = [
    "Done",
    "Planned",
    "Pending",
    "Closed",
  ];
  const brands = ["Brand A", "Brand B", "Brand C", "Luxury", "Premium"];
  const shops: Shop[] = [];
  for (let i = 1; i <= count; i++) {
    shops.push({
      id: `SHOP-${String(i).padStart(4, "0")}`,
      name: `Store ${i}`,
      address: `${districts[i % districts.length]}, Hong Kong`,
      latitude: 22.2829 + Math.random() * 0.15,
      longitude: 114.1615 + Math.random() * 0.15,
      district: districts[i % districts.length],
      region: regions[i % regions.length],
      area: districts[i % districts.length],
      brand: brands[i % brands.length],
      is_mtr: i % 3 === 0,
      status: statuses[i % statuses.length],
      masterStatus: "Active",
      groupId: (i % 3) + 1,
    });
  }
  return shops;
};

export const apiService = {
  // 1. 獲取門市列表
  getShops: async (filters?: {
    regions?: string[];
    districts?: string[];
    includeArchived?: boolean;
  }): Promise<Shop[]> => {
    if (MOCK_MODE) {
      console.log("🟡 Mock Mode: Using mock data");
      return generateMockShops(100);
    }

    try {
      const response = await axios.post(API_URL, {
        action: "getShops",
        filters: filters || {},
        timestamp: new Date().toISOString(),
      });
      return response.data.data || [];
    } catch (error) {
      console.error("❌ Failed to fetch shops:", error);
      // Fallback to mock data
      return generateMockShops(50);
    }
  },

  // 2. 提交排期
  submitSchedule: async (schedules: Schedule[]) => {
    if (MOCK_MODE) {
      console.log("🟡 Mock Mode: Simulating schedule submission");
      return {
        scheduledCount: schedules.reduce((sum, s) => sum + s.totalShops, 0),
        message: "Schedule submitted successfully (Mock Mode)",
      };
    }

    try {
      const response = await axios.post(API_URL, {
        action: "submitSchedule",
        schedules,
        totalShops: schedules.reduce((sum, s) => sum + s.totalShops, 0),
        submittedAt: new Date().toISOString(),
      });
      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to submit schedule:", error);
      throw error;
    }
  },

  // 3. 匯出 Excel
  exportSchedule: async (schedules: Schedule[]) => {
    if (MOCK_MODE) {
      console.log("🟡 Mock Mode: Simulating Excel export");
      // 簡單的 CSV 匯出
      downloadCSV(schedules);
      return { success: true };
    }

    try {
      const response = await axios.post(API_URL, {
        action: "exportSchedule",
        schedules,
        format: "xlsx",
        timestamp: new Date().toISOString(),
      });
      window.open(response.data.data.downloadUrl);
      return response.data.data;
    } catch (error) {
      console.error("❌ Failed to export schedule:", error);
      // Fallback to CSV
      downloadCSV(schedules);
    }
  },
};

// 輔助：CSV 匯出
const downloadCSV = (schedules: Schedule[]) => {
  let csv = "Date,Day,Total Shops,Group A,Group B,Group C,Group D,Group E\n";
  schedules.forEach((schedule) => {
    const groupCounts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    schedule.clusters.forEach((cluster) => {
      groupCounts[cluster.groupLabel] = cluster.shops.length;
    });
    csv += `${schedule.date},${schedule.dayOfWeek},${schedule.totalShops},${groupCounts.A},${groupCounts.B},${groupCounts.C},${groupCounts.D},${groupCounts.E}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `schedule_${new Date().toISOString().split("T")}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
};
