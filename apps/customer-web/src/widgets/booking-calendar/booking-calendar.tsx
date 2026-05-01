import { useEffect, useMemo, useState } from "react";
import type { AvailabilityDay, AvailabilitySlot } from "@paragliding/api-client";
import { Button } from "@paragliding/ui";
import { formatDate, resolveLocaleTag } from "@/shared/lib/format";
import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";
import { useI18n } from "@/shared/providers/i18n-provider";
import { ChevronDown, ChevronRight, Sun, X } from "lucide-react";

type SelectedSlot = {
  date: string;
  time: string;
} | null;

type CalendarWeekDay = {
  key: string;
  isoDate: string;
  date: Date;
  day: AvailabilityDay | null;
  outsideMonth: boolean;
};

type BookingCalendarProps = {
  year: number;
  month: number;
  days: AvailabilityDay[];
  selectedSlot: SelectedSlot;
  onMonthChange: (year: number, month: number) => void;
  onSelectSlot: (slot: { date: string; time: string }) => void;
  weatherAside?: boolean;
};

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const startOfWeek = (date: Date) => addDays(date, -date.getDay());
const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6);

const getAvailableCount = (day: AvailabilityDay) => day.slots.filter((slot) => !slot.is_locked && !slot.is_full).length;

const sortTime = (left: string, right: string) => {
  const [leftHour, leftMinute] = left.split(":").map(Number);
  const [rightHour, rightMinute] = right.split(":").map(Number);
  return leftHour * 60 + leftMinute - (rightHour * 60 + rightMinute);
};

export const BookingCalendar = ({
  year,
  month,
  days,
  selectedSlot,
  onMonthChange,
  onSelectSlot,
  weatherAside = false
}: BookingCalendarProps) => {
  const { locale } = useI18n();
  const [hoveredCell, setHoveredCell] = useState<SelectedSlot>(selectedSlot);
  const [showMonthMenu, setShowMonthMenu] = useState(false);
  const [showYearMenu, setShowYearMenu] = useState(false);
  const [weekIndex, setWeekIndex] = useState(0);
  const [pendingWeekEdge, setPendingWeekEdge] = useState<"start" | "end" | null>(null);

  useEffect(() => {
    setHoveredCell(selectedSlot);
  }, [selectedSlot]);

  const sortedDays = useMemo(() => [...days].sort((left, right) => left.date.localeCompare(right.date)), [days]);
  const daysByDate = useMemo(() => new Map(sortedDays.map((day) => [day.date, day])), [sortedDays]);

  const timeSlots = useMemo(() => {
    const uniqueTimes = new Set<string>();
    sortedDays.forEach((day) => {
      day.slots.forEach((slot) => uniqueTimes.add(slot.time));
    });
    return Array.from(uniqueTimes).sort(sortTime);
  }, [sortedDays]);

  const calendarWeeks = useMemo(() => {
    const firstDayOfMonth = new Date(year, month - 1, 1);
    const lastDayOfMonth = new Date(year, month, 0);
    const firstVisibleDay = startOfWeek(firstDayOfMonth);
    const lastVisibleDay = endOfWeek(lastDayOfMonth);
    const weeks: CalendarWeekDay[][] = [];

    for (let cursor = new Date(firstVisibleDay); cursor <= lastVisibleDay; cursor = addDays(cursor, 7)) {
      const week: CalendarWeekDay[] = [];

      for (let index = 0; index < 7; index += 1) {
        const cellDate = addDays(cursor, index);
        const isoDate = toDateKey(cellDate);
        week.push({
          key: `${isoDate}-${index}`,
          isoDate,
          date: cellDate,
          day: daysByDate.get(isoDate) ?? null,
          outsideMonth: cellDate.getMonth() !== month - 1
        });
      }

      weeks.push(week);
    }

    return weeks;
  }, [daysByDate, month, year]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from(new Set([currentYear - 1, currentYear, currentYear + 1, currentYear + 2, year])).sort(
      (left, right) => left - right
    );
  }, [year]);

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(resolveLocaleTag(locale), { month: "long" });
    return Array.from({ length: 12 }, (_unused, index) => formatter.format(new Date(2026, index, 1)));
  }, [locale]);

  const weekdayShort = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(resolveLocaleTag(locale), { weekday: "short" });
    const sunday = new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_unused, index) => formatter.format(addDays(sunday, index)));
  }, [locale]);

  useEffect(() => {
    if (!calendarWeeks.length) {
      setWeekIndex(0);
      return;
    }

    if (pendingWeekEdge) {
      setWeekIndex(pendingWeekEdge === "end" ? calendarWeeks.length - 1 : 0);
      setPendingWeekEdge(null);
      return;
    }

    if (selectedSlot?.date) {
      const selectedWeek = calendarWeeks.findIndex((week) => week.some((day) => day.isoDate === selectedSlot.date));
      if (selectedWeek >= 0) {
        setWeekIndex(selectedWeek);
        return;
      }
    }

    const today = new Date();
    const todayWeek = calendarWeeks.findIndex((week) => week.some((day) => day.isoDate === toDateKey(today)));
    if (today.getFullYear() === year && today.getMonth() + 1 === month && todayWeek >= 0) {
      setWeekIndex(todayWeek);
      return;
    }

    const firstWeekWithAvailability = calendarWeeks.findIndex((week) =>
      week.some((day) => day.day && getAvailableCount(day.day) > 0)
    );
    setWeekIndex(firstWeekWithAvailability >= 0 ? firstWeekWithAvailability : 0);
  }, [calendarWeeks, month, pendingWeekEdge, selectedSlot?.date, year]);

  const activeWeek = calendarWeeks[weekIndex] ?? [];
  const previewSlot = hoveredCell ? daysByDate.get(hoveredCell.date)?.slots.find((slot) => slot.time === hoveredCell.time) ?? null : null;
  const selectedWeatherSlot = selectedSlot
    ? daysByDate.get(selectedSlot.date)?.slots.find((slot) => slot.time === selectedSlot.time) ?? null
    : null;
  const fallbackDay = activeWeek.find((day) => day.day)?.day ?? sortedDays[0] ?? null;
  const weatherSource: AvailabilitySlot | AvailabilityDay | null = previewSlot ?? selectedWeatherSlot ?? fallbackDay;
  const hasRealWeather = Boolean(weatherSource?.weather_available);
  const previewDate = hoveredCell?.date ?? selectedSlot?.date ?? fallbackDay?.date ?? null;
  const previewTime = previewSlot ? hoveredCell?.time ?? null : selectedWeatherSlot ? selectedSlot?.time ?? null : null;
  const activeDate = previewDate ?? fallbackDay?.date ?? toDateKey(new Date());
  const activeSlot = previewTime;
  const weather =
    weatherSource && hasRealWeather
      ? {
          temp: weatherSource.temperature_c,
          condition: weatherSource.weather_condition || "Thời tiết",
          flight: repairFlightConditionLabel(weatherSource.flight_condition || "Đang cập nhật"),
          wind: weatherSource.wind_kph,
          uv: weatherSource.uv_index
        }
      : null;

  const changeMonth = (nextYear: number, nextMonth: number, edge: "start" | "end" = "start") => {
    setPendingWeekEdge(edge);
    setHoveredCell(selectedSlot);
    setShowMonthMenu(false);
    setShowYearMenu(false);
    onMonthChange(nextYear, nextMonth);
  };

  const moveWeek = (step: number) => {
    const nextWeek = weekIndex + step;
    if (nextWeek >= 0 && nextWeek < calendarWeeks.length) {
      setWeekIndex(nextWeek);
      setHoveredCell(selectedSlot);
      return;
    }

    const nextMonthDate = new Date(year, month - 1 + step, 1);
    changeMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, step > 0 ? "start" : "end");
  };

  return (
    <div className={`mx-auto ${weatherAside ? "max-w-none" : "max-w-md lg:max-w-none"}`}>
      <div className={weatherAside ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start" : "space-y-4"}>
        <div className="space-y-4">
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <Button onClick={() => moveWeek(-1)} className="rounded-full p-1 transition-colors hover:bg-stone-100">
                <ChevronRight className="rotate-180 text-stone-400" size={20} />
              </Button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-brand"
                  onClick={() => {
                    setShowMonthMenu((current) => !current);
                    setShowYearMenu(false);
                  }}
                >
                  {monthNames[month - 1]}
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-brand"
                  onClick={() => {
                    setShowYearMenu((current) => !current);
                    setShowMonthMenu(false);
                  }}
                >
                  {year}
                  <ChevronDown size={14} />
                </button>
              </div>

              <Button onClick={() => moveWeek(1)} className="rounded-full p-1 transition-colors hover:bg-stone-100">
                <ChevronRight className="text-stone-400" size={20} />
              </Button>
            </div>

            {showMonthMenu ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((label, index) => (
                    <button
                      key={label}
                      type="button"
                      className={`rounded-lg py-1 text-[10px] transition-colors ${month === index + 1 ? "is-active bg-brand text-white" : "hover:bg-stone-100"}`}
                      onClick={() => changeMonth(year, index + 1)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {showYearMenu ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
                <div className="flex justify-center gap-2">
                  {yearOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`rounded-lg px-4 py-1 text-[10px] transition-colors ${year === option ? "is-active bg-brand text-white" : "hover:bg-stone-100"}`}
                      onClick={() => changeMonth(option, month)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <div className={`min-w-[300px] ${weatherAside ? "max-w-none" : "mx-auto max-w-2xl"}`}>
              {activeWeek.length > 0 ? (
                <div className="overflow-x-auto pb-1" onMouseLeave={() => setHoveredCell(selectedSlot)}>
                  <table className="w-full min-w-[300px] table-fixed border-collapse">
                    <thead>
                      <tr>
                        <th className="w-14 p-1" aria-label="Khung giờ" />
                        {activeWeek.map((day) => {
                          const isSelectedDay = Boolean(selectedSlot?.date && selectedSlot.date === day.isoDate);
                          return (
                            <th key={day.key} className="p-1 text-center">
                              <div className="flex flex-col">
                                <span className={`text-[8px] font-bold uppercase ${isSelectedDay ? "text-brand" : "text-stone-400"}`}>
                                  {weekdayShort[day.date.getDay()]}
                                </span>
                                <span
                                  className={`text-[10px] font-bold ${
                                    isSelectedDay ? "text-brand" : day.outsideMonth ? "text-stone-300" : "text-stone-500"
                                  }`}
                                >
                                  {day.date.getDate()}
                                </span>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((time) => (
                        <tr key={time}>
                          <td className="whitespace-nowrap p-1 pr-2 align-middle text-[10px] font-bold leading-none text-stone-400">
                            {time}
                          </td>
                          {activeWeek.map((day) => {
                            const slot = day.day?.slots.find((item) => item.time === time) ?? null;
                            const isBlocked = Boolean(slot?.is_locked || slot?.is_full);
                            const isSelected = Boolean(slot && selectedSlot?.date === day.isoDate && selectedSlot?.time === time);

                            return (
                              <td key={`${day.key}-${time}`} className="p-0.5">
                                <button
                                  type="button"
                                  className={`flex aspect-square w-full items-center justify-center rounded-md border transition-all ${
                                    !slot || isBlocked
                                      ? "cursor-default border-stone-200 bg-stone-100 text-stone-400"
                                      : isSelected
                                        ? "cursor-pointer border-brand bg-brand font-black text-white shadow-inner"
                                        : "cursor-pointer border-stone-100 bg-white hover:border-brand/50"
                                  }`}
                                  onMouseEnter={() => {
                                    if (slot) setHoveredCell({ date: day.isoDate, time });
                                  }}
                                  onFocus={() => {
                                    if (slot) setHoveredCell({ date: day.isoDate, time });
                                  }}
                                  onClick={() => {
                                    if (!slot || isBlocked) return;
                                    onSelectSlot({ date: day.isoDate, time });
                                    setHoveredCell({ date: day.isoDate, time });
                                  }}
                                >
                                  {!slot || isBlocked ? (
                                    <X size={12} aria-hidden="true" />
                                  ) : isSelected ? (
                                    <span className="h-1.5 w-1.5 rounded-full bg-white" aria-hidden="true" />
                                  ) : null}
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="calendar-empty">Chưa có dữ liệu khả dụng cho tháng này.</div>
              )}

              <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-400">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-sm border border-stone-200 bg-white" />
                  <span>Trống</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex h-2 w-2 items-center justify-center rounded-sm border border-stone-200 bg-stone-100">
                    <X size={8} />
                  </div>
                  <span>Đã đầy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={weatherAside ? "lg:sticky lg:top-24" : ""}>
          {weather ? (
            <div className="space-y-3 rounded-2xl border border-stone-100 bg-stone-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Dự báo {activeSlot ? `${activeSlot} - ` : ""}Ngày {formatDate(activeDate, { day: "2-digit", month: "2-digit" })}
                </span>
                <Sun size={16} className="text-yellow-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{weather.temp}°C</span>
                  <span className="pb-1 text-[10px] font-medium text-stone-600">{weather.condition}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Điều kiện bay</span>
                  <span className="text-xs font-bold text-emerald-600">{weather.flight}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-stone-200/50 pt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Sức gió</span>
                  <span className="text-xs font-bold">{weather.wind} km/h</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-stone-400">Chỉ số UV</span>
                  <span className="text-xs font-bold">{weather.uv}</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="calendar-selection-note">Chưa có dữ liệu thời tiết thực tế từ API cho lịch bay này.</p>
          )}
        </div>
      </div>
    </div>
  );
};
