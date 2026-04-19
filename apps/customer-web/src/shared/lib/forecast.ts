import type { AvailabilityDay } from "@paragliding/api-client";

export const WEATHER_FORECAST_DAYS = 14;

export type ForecastMonthKey = {
  year: number;
  month: number;
};

const startOfDay = (value: Date) => new Date(value.getFullYear(), value.getMonth(), value.getDate());

const parseDateKey = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  return new Date(rawYear, rawMonth - 1, rawDay);
};

export const getForecastMonthKeys = (startDate: Date, dayCount = WEATHER_FORECAST_DAYS): ForecastMonthKey[] => {
  const start = startOfDay(startDate);
  const monthMap = new Map<string, ForecastMonthKey>();

  for (let index = 0; index < dayCount; index += 1) {
    const cursor = new Date(start);
    cursor.setDate(start.getDate() + index);
    const monthKey = `${cursor.getFullYear()}-${cursor.getMonth() + 1}`;
    monthMap.set(monthKey, {
      year: cursor.getFullYear(),
      month: cursor.getMonth() + 1
    });
  }

  return Array.from(monthMap.values());
};

export const getUpcomingWeatherDays = (
  days: AvailabilityDay[],
  startDate: Date,
  limit = WEATHER_FORECAST_DAYS
) => {
  const start = startOfDay(startDate);

  return days
    .filter((item) => item.weather_available && parseDateKey(item.date) >= start)
    .sort((left, right) => left.date.localeCompare(right.date))
    .slice(0, limit);
};
