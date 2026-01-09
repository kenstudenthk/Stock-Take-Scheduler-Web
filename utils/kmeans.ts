import { Shop, ShopCluster } from '../types';

// ============================================================================
// 🎯 K-means 聚類演算法
// ============================================================================

export const performKmeans = (
  shops: Shop[],
  k: number,
  maxIterations: number = 10
): ShopCluster[] => {
  if (shops.length === 0 || k <= 0) {
    return [];
  }

  const startTime = performance.now();

  // ✅ Step 1: Initialize k centroids randomly
  const centroids: Array<[number, number]> = [];
  for (let i = 0; i < k; i++) {
    const randomShop = shops[Math.floor(Math.random() * shops.length)];
    centroids.push([randomShop.latitude || 0, randomShop.longitude || 0]);
  }

  let iterations = 0;
  let converged = false;

  // ✅ Step 2: K-means iteration
  while (iterations < maxIterations && !converged) {
    const clusters: Array<Shop[]> = centroids.map(() => []);

    shops.forEach(shop => {
      let minDistance = Infinity;
      let closestCluster = 0;

      const shopLat = shop.latitude || 0;
      const shopLng = shop.longitude || 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = calculateDistance(
          shopLat,
          shopLng,
          centroids[i][0],
          centroids[i][1]
        );

        if (distance < minDistance) {
          minDistance = distance;
          closestCluster = i;
        }
      }

      clusters[closestCluster].push(shop);
    });

    const newCentroids: Array<[number, number]> = centroids.map((_, index) => {
      const cluster = clusters[index];
      if (cluster.length === 0) {
        return centroids[index];
      }

      const avgLat =
        cluster.reduce((sum, shop) => sum + (shop.latitude || 0), 0) /
        cluster.length;
      const avgLng =
        cluster.reduce((sum, shop) => sum + (shop.longitude || 0), 0) /
        cluster.length;

      return [avgLat, avgLng];
    });

    converged = hasConverged(centroids, newCentroids);
    centroids.splice(0, centroids.length, ...newCentroids);
    iterations++;
  }

  // ✅ Step 3: Final assignment
  const clusterShopsMap: Array<Shop[]> = centroids.map(() => []);

  shops.forEach(shop => {
    let minDistance = Infinity;
    let closestCluster = 0;

    const shopLat = shop.latitude || 0;
    const shopLng = shop.longitude || 0;

    for (let i = 0; i < centroids.length; i++) {
      const distance = calculateDistance(
        shopLat,
        shopLng,
        centroids[i][0],
        centroids[i][1]
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestCluster = i;
      }
    }

    clusterShopsMap[closestCluster].push(shop);
  });

  const finalClusters: ShopCluster[] = centroids
    .map((centroid, index) => {
      const clusterShops = clusterShopsMap[index];
      const groupLabel = String.fromCharCode(65 + index) as 'A' | 'B' | 'C' | 'D' | 'E';
      
      return {
        groupId: groupLabel,
        groupLabel: groupLabel,
        centerLat: centroid[0],
        centerLng: centroid[1],
        totalShops: clusterShops.length,
        estimatedTime: clusterShops.length * 15,
        shops: clusterShops
      };
    })
    .filter(cluster => cluster.totalShops > 0);

  const endTime = performance.now();
  console.log(`✅ K-means completed in ${(endTime - startTime).toFixed(2)}ms for ${k} clusters`);

  return finalClusters;
};

// ============================================================================
// 🗓️ 日期與商業日期檢查
// ============================================================================

const HK_PUBLIC_HOLIDAYS_2026 = [
  '2026-01-01', '2026-02-17', '2026-02-18', '2026-02-19',
  '2026-04-04', '2026-04-05', '2026-05-01', '2026-05-15',
  '2026-06-10', '2026-07-01', '2026-09-11', '2026-10-11',
  '2026-12-25', '2026-12-26',
];

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  const dateStr = date.toISOString().split('T')[0];
  
  if (day === 0 || day === 6) return false;
  if (HK_PUBLIC_HOLIDAYS_2026.includes(dateStr)) return false;
  
  return true;
}

export function nextBusinessDay(date: Date): Date {
  let d = new Date(date);
  d.setDate(d.getDate() + 1);
  
  while (!isBusinessDay(d)) {
    d.setDate(d.getDate() + 1);
  }
  
  return d;
}

// ============================================================================
// 📅 日期分配邏輯 - 完整版（關鍵邏輯）
// ============================================================================

export interface ScheduleParams {
  startDate: Date;
  shopsPerDay: number;
  groupsPerDay: number;
}

export interface DaySchedule {
  date: string;
  dayOfWeek: string;
  groups: {
    groupNo: number;
    clusterLabel: string;
    shops: Shop[];
    groupDistance: number;
    groupTime: number;
  }[];
  dayTotalShops: number;
  dayTotalDistance: number;
  dayTotalTime: number;
}

/**
 * 核心邏輯：根據聚類結果生成日期排程
 * 這是 Python Streamlit 中 Phase 4 的完整實現
 */
export const generateSchedulesByDate = (
  clusters: ShopCluster[],
  params: ScheduleParams
): DaySchedule[] => {
  const { startDate, shopsPerDay, groupsPerDay } = params;
  const schedules: DaySchedule[] = [];
  
  if (clusters.length === 0) return [];
  
  // ===== 展平所有店舖到一個列表 =====
  const allShops: Array<Shop & { clusterLabel: string }> = [];
  
  clusters.forEach((cluster) => {
    cluster.shops.forEach((shop) => {
      allShops.push({
        ...shop,
        clusterLabel: cluster.groupLabel,
      });
    });
  });
  
  const totalShops = allShops.length;
  let shopIndex = 0;
  let currentDate = new Date(startDate);
  
  // ===== 逐日分配 =====
  while (shopIndex < totalShops) {
    // 跳過非商業日（週末 & 公假）
    while (!isBusinessDay(currentDate)) {
      currentDate = nextBusinessDay(currentDate);
    }
    
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfWeek = currentDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Asia/Hong_Kong'
    });
    
    const groups: DaySchedule['groups'] = [];
    const shopsPerGroup = shopsPerDay / groupsPerDay;
    
    // ===== 該日內建立 N 個小組 =====
    for (let groupNo = 1; groupNo <= groupsPerDay; groupNo++) {
      const groupShops: Array<Shop & { clusterLabel: string }> = [];
      
      for (let i = 0; i < shopsPerGroup && shopIndex < totalShops; i++) {
        groupShops.push(allShops[shopIndex++]);
      }
      
      if (groupShops.length === 0) break;
      
      const groupDistance = calculateGroupDistance(groupShops);
      const groupTime = groupShops.length * 15;
      
      groups.push({
        groupNo,
        clusterLabel: groupShops[0]?.clusterLabel || '',
        shops: groupShops,
        groupDistance,
        groupTime,
      });
    }
    
    if (groups.length > 0) {
      schedules.push({
        date: dateStr,
        dayOfWeek,
        groups,
        dayTotalShops: groups.reduce((sum, g) => sum + g.shops.length, 0),
        dayTotalDistance: groups.reduce((sum, g) => sum + g.groupDistance, 0),
        dayTotalTime: groups.reduce((sum, g) => sum + g.groupTime, 0),
      });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  console.log(`✅ Schedule generated: ${schedules.length} business days, ${totalShops} shops`);
  
  return schedules;
};

// ============================================================================
// 📍 距離計算
// ============================================================================

function calculateGroupDistance(shops: Array<Shop & { clusterLabel?: string }>): number {
  if (shops.length <= 1) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < shops.length - 1; i++) {
    const lat1 = shops[i].latitude || 0;
    const lng1 = shops[i].longitude || 0;
    const lat2 = shops[i + 1].latitude || 0;
    const lng2 = shops[i + 1].longitude || 0;
    
    const dist = calculateDistance(lat1, lng1, lat2, lng2);
    totalDistance += dist;
  }
  
  return totalDistance;
}

export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const toRad = (deg: number): number => (deg * Math.PI) / 180;

// ============================================================================
// 🔍 輔助函數
// ============================================================================

const hasConverged = (
  oldCentroids: Array<[number, number]>,
  newCentroids: Array<[number, number]>,
  threshold: number = 0.0001
): boolean => {
  if (oldCentroids.length !== newCentroids.length) return false;

  for (let i = 0; i < oldCentroids.length; i++) {
    const dist = calculateDistance(
      oldCentroids[i][0],
      oldCentroids[i][1],
      newCentroids[i][0],
      newCentroids[i][1]
    );
    if (dist > threshold) return false;
  }
  return true;
};