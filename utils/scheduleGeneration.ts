import dayjs from "dayjs";
import { isHoliday } from "../constants/holidays";
import { Shop } from "../types";

/**
 * Returns true if the given date is a working day
 * (not Sunday, not Saturday, not a public holiday).
 */
export function isWorkingDay(date: dayjs.Dayjs): boolean {
  const day = date.day();
  if (day === 0 || day === 6) return false;
  return !isHoliday(date.format("YYYY-MM-DD"));
}

/**
 * Returns the first working day on or after the given date.
 */
export function getNextWorkingDay(date: dayjs.Dayjs): dayjs.Dayjs {
  let next = date;
  while (!isWorkingDay(next)) {
    next = next.add(1, "day");
  }
  return next;
}

export interface ScheduleFilter {
  selectedRegions: string[];
  selectedDistricts: string[];
  includeMTR: boolean;
}

/**
 * Filters a pool of shops based on region, district, and MTR selection.
 * Only returns Unplanned shops that match all criteria.
 */
export function filterSchedulePool(
  pool: Shop[],
  filter: ScheduleFilter,
): Shop[] {
  return pool.filter((s) => {
    if (s.status !== "Unplanned") return false;
    const matchRegion =
      filter.selectedRegions.length === 0 ||
      filter.selectedRegions.includes(s.region);
    const matchDistrict =
      filter.selectedDistricts.length === 0 ||
      filter.selectedDistricts.includes(s.district);
    const matchMTR = filter.includeMTR ? true : !s.is_mtr;
    return matchRegion && matchDistrict && matchMTR;
  });
}

export interface GenerateParams {
  pool: Shop[];
  startDate: string;
  shopsPerDay: number;
  groupsPerDay: number;
}

/**
 * Generates a flat schedule array: assigns each shop a scheduledDate and groupId.
 * Shops are distributed across working days, N shops per day, cycling through groups.
 */
export function generateSchedule(params: GenerateParams): Shop[] {
  const { pool, startDate, shopsPerDay, groupsPerDay } = params;
  const scheduled: Shop[] = [];
  let currentDate = getNextWorkingDay(dayjs(startDate));
  let shopIndex = 0;

  while (shopIndex < pool.length) {
    const shopsForDay = pool.slice(shopIndex, shopIndex + shopsPerDay);
    shopsForDay.forEach((shop, idx) => {
      scheduled.push({
        ...shop,
        scheduledDate: currentDate.format("YYYY-MM-DD"),
        groupId: (idx % groupsPerDay) + 1,
      });
    });
    shopIndex += shopsPerDay;
    currentDate = getNextWorkingDay(currentDate.add(1, "day"));
  }

  return scheduled;
}
