/**
 * Hong Kong Public Holidays
 * Multi-year support for schedule generation
 *
 * Sources:
 * - https://www.gov.hk/en/about/abouthk/holiday/
 *
 * Note: Update annually or add years as needed
 */

export const HK_HOLIDAYS: Record<number, string[]> = {
  2025: [
    '2025-01-01', // New Year's Day
    '2025-01-29', // Lunar New Year's Day
    '2025-01-30', // Lunar New Year (2nd day)
    '2025-01-31', // Lunar New Year (3rd day)
    '2025-04-04', // Ching Ming Festival
    '2025-04-18', // Good Friday
    '2025-04-19', // Day after Good Friday
    '2025-04-21', // Easter Monday
    '2025-05-01', // Labour Day
    '2025-05-05', // Birthday of the Buddha
    '2025-05-31', // Tuen Ng Festival
    '2025-07-01', // HKSAR Establishment Day
    '2025-10-01', // National Day
    '2025-10-07', // Day after Mid-Autumn Festival
    '2025-10-29', // Chung Yeung Festival
    '2025-12-25', // Christmas Day
    '2025-12-26', // Boxing Day
  ],
  2026: [
    '2026-01-01', // New Year's Day
    '2026-02-17', // Lunar New Year's Day
    '2026-02-18', // Lunar New Year (2nd day)
    '2026-02-19', // Lunar New Year (3rd day)
    '2026-04-04', // Ching Ming Festival (observed)
    '2026-04-03', // Good Friday
    '2026-04-04', // Day after Good Friday
    '2026-04-06', // Easter Monday
    '2026-05-01', // Labour Day
    '2026-05-24', // Birthday of the Buddha
    '2026-06-19', // Tuen Ng Festival
    '2026-07-01', // HKSAR Establishment Day
    '2026-10-01', // National Day
    '2026-10-26', // Day after Mid-Autumn Festival
    '2026-10-18', // Chung Yeung Festival (observed)
    '2026-12-25', // Christmas Day
    '2026-12-26', // Boxing Day (observed - 28th)
  ],
  2027: [
    '2027-01-01', // New Year's Day
    '2027-02-06', // Lunar New Year's Day (observed - 8th)
    '2027-02-07', // Lunar New Year (2nd day)
    '2027-02-08', // Lunar New Year (3rd day)
    '2027-04-05', // Ching Ming Festival
    '2027-03-26', // Good Friday
    '2027-03-27', // Day after Good Friday
    '2027-03-29', // Easter Monday
    '2027-05-01', // Labour Day
    '2027-05-13', // Birthday of the Buddha
    '2027-06-09', // Tuen Ng Festival
    '2027-07-01', // HKSAR Establishment Day
    '2027-10-01', // National Day
    '2027-10-15', // Day after Mid-Autumn Festival
    '2027-10-08', // Chung Yeung Festival
    '2027-12-25', // Christmas Day (observed - 27th)
    '2027-12-26', // Boxing Day
  ],
  2028: [
    '2028-01-01', // New Year's Day
    '2028-01-26', // Lunar New Year's Day
    '2028-01-27', // Lunar New Year (2nd day)
    '2028-01-28', // Lunar New Year (3rd day)
    '2028-04-04', // Ching Ming Festival
    '2028-04-14', // Good Friday
    '2028-04-15', // Day after Good Friday
    '2028-04-17', // Easter Monday
    '2028-05-01', // Labour Day
    '2028-05-02', // Birthday of the Buddha
    '2028-05-28', // Tuen Ng Festival (observed - 29th)
    '2028-07-01', // HKSAR Establishment Day
    '2028-10-01', // National Day (observed - 2nd)
    '2028-10-04', // Day after Mid-Autumn Festival
    '2028-10-26', // Chung Yeung Festival
    '2028-12-25', // Christmas Day
    '2028-12-26', // Boxing Day
  ],
};

/**
 * Get all holidays for a specific year
 */
export const getHolidaysForYear = (year: number): string[] => {
  return HK_HOLIDAYS[year] || [];
};

/**
 * Get all holidays within a date range
 */
export const getHolidaysInRange = (startYear: number, endYear: number): string[] => {
  const holidays: string[] = [];
  for (let year = startYear; year <= endYear; year++) {
    holidays.push(...getHolidaysForYear(year));
  }
  return holidays;
};

/**
 * Check if a date string is a holiday
 */
export const isHoliday = (dateStr: string): boolean => {
  const year = parseInt(dateStr.substring(0, 4), 10);
  const yearHolidays = getHolidaysForYear(year);
  return yearHolidays.includes(dateStr);
};

/**
 * Get a flat array of all configured holidays
 */
export const getAllHolidays = (): string[] => {
  return Object.values(HK_HOLIDAYS).flat();
};
