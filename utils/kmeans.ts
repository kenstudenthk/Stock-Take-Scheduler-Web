import dayjs from 'dayjs';
import { Shop, ShopCluster } from '../types';
import { getNextWorkingDay, generateSchedule } from './scheduleGeneration';

// ============================================================================
// 🎯 K-means 聚類演算法
// ============================================================================

/**
 * Returns true if the shop has usable coordinates.
 * (0, 0) is treated as missing — it is in the Gulf of Guinea, not HK/Macau.
 */
const hasValidCoords = (shop: Shop): boolean =>
  Number.isFinite(shop.latitude) &&
  Number.isFinite(shop.longitude) &&
  !(shop.latitude === 0 && shop.longitude === 0);

export const performKmeans = (
  shops: Shop[],
  k: number,
  maxIterations: number = 10
): ShopCluster[] => {
  // Shops without coordinates would all collapse into a phantom (0,0) cluster
  // and drag centroids far away from HK — exclude them up front.
  const validShops = shops.filter(hasValidCoords);
  const skipped = shops.length - validShops.length;
  if (skipped > 0) {
    console.warn(`⚠️ K-means: skipped ${skipped} shop(s) with missing coordinates`);
  }

  if (validShops.length === 0 || k <= 0) {
    return [];
  }

  const startTime = performance.now();

  // ✅ Step 1: Deterministic centroid initialization.
  // Sort by (lat + lng) and pick k evenly spaced shops so the same input
  // always produces the same schedule, with well-spread starting centroids.
  const sortedByCoord = [...validShops].sort(
    (a, b) => a.latitude + a.longitude - (b.latitude + b.longitude)
  );
  const centroids: Array<[number, number]> = [];
  for (let i = 0; i < k; i++) {
    const pickIndex = Math.min(
      Math.floor((i * sortedByCoord.length) / k),
      sortedByCoord.length - 1
    );
    const seedShop = sortedByCoord[pickIndex];
    centroids.push([seedShop.latitude, seedShop.longitude]);
  }

  let iterations = 0;
  let converged = false;

  // ✅ Step 2: K-means iteration
  while (iterations < maxIterations && !converged) {
    const clusters: Array<Shop[]> = centroids.map(() => []);

    validShops.forEach(shop => {
      let minDistance = Infinity;
      let closestCluster = 0;

      for (let i = 0; i < centroids.length; i++) {
        const distance = calculateDistance(
          shop.latitude,
          shop.longitude,
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
        cluster.reduce((sum, shop) => sum + shop.latitude, 0) / cluster.length;
      const avgLng =
        cluster.reduce((sum, shop) => sum + shop.longitude, 0) / cluster.length;

      return [avgLat, avgLng];
    });

    converged = hasConverged(centroids, newCentroids);
    centroids.splice(0, centroids.length, ...newCentroids);
    iterations++;
  }

  // ✅ Step 3: Final assignment
  const clusterShopsMap: Array<Shop[]> = centroids.map(() => []);

  validShops.forEach(shop => {
    let minDistance = Infinity;
    let closestCluster = 0;

    for (let i = 0; i < centroids.length; i++) {
      const distance = calculateDistance(
        shop.latitude,
        shop.longitude,
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
// 📅 日期分配邏輯 - 完整版（關鍵邏輯）
// ============================================================================
// Working-day rules (weekends + public holidays) come from
// scheduleGeneration.ts / constants/holidays.ts — the single source of truth.

export interface ScheduleParams {
  /** Start date as YYYY-MM-DD. Kept as a string to avoid Date/UTC off-by-one issues. */
  startDate: string;
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

  // ===== 每個 cluster 一條隊列（組不跨 cluster，保持地理純度）=====
  const queues = clusters.map((cluster) => ({
    label: cluster.groupLabel,
    shops: [...cluster.shops],
  }));

  const totalShops = queues.reduce((sum, q) => sum + q.shops.length, 0);
  let remaining = totalShops;
  let currentDate = getNextWorkingDay(dayjs(startDate));

  // ===== 逐日分配 =====
  while (remaining > 0) {
    const dateStr = currentDate.format('YYYY-MM-DD');
    const dayOfWeek = currentDate.format('dddd');

    const groups: DaySchedule['groups'] = [];
    const shopsPerGroup = Math.ceil(shopsPerDay / groupsPerDay);

    // ===== 該日內建立 N 個小組，每組只從一個 cluster 取店 =====
    for (let groupNo = 1; groupNo <= groupsPerDay && remaining > 0; groupNo++) {
      // Pull from the cluster with the most shops left (deterministic on ties)
      const queue = queues.reduce((a, b) =>
        b.shops.length > a.shops.length ? b : a
      );
      if (queue.shops.length === 0) break;

      const take = Math.min(shopsPerGroup, queue.shops.length);
      const groupShops: Array<Shop & { clusterLabel: string }> = queue.shops
        .splice(0, take)
        .map((shop) => ({ ...shop, clusterLabel: queue.label }));
      remaining -= take;

      const groupDistance = calculateGroupDistance(groupShops);
      const groupTime = groupShops.length * 15;

      groups.push({
        groupNo,
        clusterLabel: queue.label,
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

    currentDate = getNextWorkingDay(currentDate.add(1, 'day'));
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
    const dist = calculateDistance(
      shops[i].latitude,
      shops[i].longitude,
      shops[i + 1].latitude,
      shops[i + 1].longitude
    );
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

// ============================================================================
// 🔗 Generator 對接 — 地理排程一條龍
// ============================================================================

export interface GeoScheduleParams {
  pool: Shop[];
  /** YYYY-MM-DD */
  startDate: string;
  shopsPerDay: number;
  groupsPerDay: number;
}

/**
 * Geo-aware drop-in replacement for generateSchedule():
 * 1. K-means clusters the pool by lat/lng (k = groupsPerDay)
 * 2. Assigns working-day dates cluster-by-cluster so same-day groups stay
 *    geographically close
 * 3. Flattens back to the flat Shop[] shape (scheduledDate + groupId) that
 *    the Generator preview table and saveToSharePoint already consume
 *
 * Shops without valid coordinates are skipped by K-means; they are appended
 * sequentially after the geo-scheduled days so no shop is silently dropped.
 */
export function generateGeoSchedule(params: GeoScheduleParams): Shop[] {
  const { pool, startDate, shopsPerDay, groupsPerDay } = params;

  const clusters = performKmeans(pool, groupsPerDay);
  const daySchedules = generateSchedulesByDate(clusters, {
    startDate,
    shopsPerDay,
    groupsPerDay,
  });

  const scheduled: Shop[] = [];
  daySchedules.forEach((day) => {
    day.groups.forEach((group) => {
      group.shops.forEach((shop) => {
        const { clusterLabel: _clusterLabel, ...rest } =
          shop as Shop & { clusterLabel?: string };
        scheduled.push({
          ...rest,
          scheduledDate: day.date,
          groupId: group.groupNo,
        });
      });
    });
  });

  // Shops performKmeans skipped (missing coords) still need dates —
  // continue sequentially from the day after the last geo-scheduled date.
  const scheduledIds = new Set(scheduled.map((s) => s.id));
  const leftovers = pool.filter((s) => !scheduledIds.has(s.id));
  if (leftovers.length > 0) {
    const lastDate = scheduled.length > 0
      ? scheduled[scheduled.length - 1].scheduledDate
      : undefined;
    const resumeDate = lastDate
      ? dayjs(lastDate).add(1, 'day').format('YYYY-MM-DD')
      : startDate;
    scheduled.push(
      ...generateSchedule({
        pool: leftovers,
        startDate: resumeDate,
        shopsPerDay,
        groupsPerDay,
      })
    );
  }

  return scheduled;
}

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
