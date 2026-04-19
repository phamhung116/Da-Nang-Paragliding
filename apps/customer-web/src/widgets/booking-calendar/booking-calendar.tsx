import { useEffect, useMemo, useState } from "react";
import type { AvailabilityDay, AvailabilitySlot } from "@paragliding/api-client";
import { Button } from "@paragliding/ui";

import {
  ChevronRight,
  ChevronDown,
  Sun,
  X,
} from "lucide-react"

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
};

const monthNames = [
  "Thang 1",
  "Thang 2",
  "Thang 3",
  "Thang 4",
  "Thang 5",
  "Thang 6",
  "Thang 7",
  "Thang 8",
  "Thang 9",
  "Thang 10",
  "Thang 11",
  "Thang 12"
];

const weekdayShort = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromDateKey = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  return new Date(rawYear, rawMonth - 1, rawDay);
};

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const startOfWeek = (date: Date) => addDays(date, -date.getDay());

const endOfWeek = (date: Date) => addDays(startOfWeek(date), 6);

const getAvailableCount = (day: AvailabilityDay) =>
  day.slots.filter((slot) => !slot.is_locked && !slot.is_full).length;

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
  onSelectSlot
}: BookingCalendarProps) => {
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

    if (firstWeekWithAvailability >= 0) {
      setWeekIndex(firstWeekWithAvailability);
      return;
    }

    setWeekIndex(0);
  }, [calendarWeeks, month, pendingWeekEdge, selectedSlot?.date, year]);

  const activeWeek = calendarWeeks[weekIndex] ?? [];

  const previewSlot = hoveredCell
    ? daysByDate.get(hoveredCell.date)?.slots.find((slot) => slot.time === hoveredCell.time) ?? null
    : null;
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
  const weather = weatherSource && hasRealWeather
    ? {
        temp: weatherSource.temperature_c,
        condition: weatherSource.weather_condition || "Thoi tiet",
        flight: weatherSource.flight_condition || "Đang cập nhật",
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
    <div className="space-y-4 max-w-md mx-auto lg:max-w-none">
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <Button onClick={() => moveWeek(-1)} className="p-1 hover:bg-stone-100 rounded-full transition-colors">
            <ChevronRight className="rotate-180 text-stone-400" size={20} />
          </Button>

          <div className="flex gap-2">
            <button
              type="button"
              className="text-sm font-bold text-stone-700 hover:text-brand transition-colors flex items-center gap-1"
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
              className="text-sm font-bold text-stone-700 hover:text-brand transition-colors flex items-center gap-1"
              onClick={() => {
                setShowYearMenu((current) => !current);
                setShowMonthMenu(false);
              }}
            >
              {year}
              <ChevronDown size={14} />
            </button>
          </div>

          <Button onClick={() => moveWeek(1)} className="p-1 hover:bg-stone-100 rounded-full transition-colors">
            <ChevronRight className="text-stone-400" size={20} />
          </Button>
        </div>

        {showMonthMenu ? (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 mt-1">
              <div className="grid grid-cols-3 gap-2">
                {monthNames.map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`text-[10px] py-1 rounded-lg transition-colors ${month === index + 1 ? "is-active bg-brand text-white" : "hover:bg-stone-100"}`}
                    onClick={() => changeMonth(year, index + 1)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              
            </div>
          ) : null}

          {showYearMenu ? (
            <div className="absolute top-full left-0 right-0 z-20 bg-white border border-stone-200 rounded-2xl shadow-xl p-4 mt-1">
              <div className="flex gap-2 justify-center">
                {yearOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`text-[10px] px-4 py-1 rounded-lg transition-colors ${year === option ? "is-active bg-brand text-white" : "hover:bg-stone-100"}`}
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
        <div className="min-w-[300px] max-w-2xl mx-auto">
          {activeWeek.length > 0 ? (
            <div className="overflow-x-auto pb-1" onMouseLeave={() => setHoveredCell(selectedSlot)}>
              <table className="w-full min-w-[300px] table-fixed border-collapse">
                <thead>
                  <tr>
                    <th className="w-14 p-1" aria-label="Khung gio" />
                    {activeWeek.map((day) => {
                      const isSelectedDay = Boolean(selectedSlot?.date && selectedSlot.date === day.isoDate);

                      return (
                        <th key={day.key} className="p-1 text-center">
                          <div className="flex flex-col">
                            <span
                              className={`text-[8px] uppercase font-bold ${
                                isSelectedDay ? "text-brand" : "text-stone-400"
                              }`}
                            >
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
                      <td className="p-1 pr-2 align-middle text-[10px] font-bold leading-none text-stone-400 whitespace-nowrap">
                        {time}
                      </td>
                      {activeWeek.map((day) => {
                        const slot = day.day?.slots.find((item) => item.time === time) ?? null;
                        const isBlocked = Boolean(slot?.is_locked || slot?.is_full);
                        const isSelected = Boolean(
                          slot && selectedSlot?.date === day.isoDate && selectedSlot?.time === time
                        );

                        return (
                          <td key={`${day.key}-${time}`} className="p-0.5">
                            <button
                              type="button"
                              className={`aspect-square w-full rounded-md flex items-center justify-center transition-all border ${
                                !slot || isBlocked
                                  ? "bg-stone-100 border-stone-200 text-stone-400 cursor-default"
                                  : isSelected
                                    ? "bg-brand border-brand text-white font-black shadow-inner cursor-pointer"
                                    : "bg-white border-stone-100 hover:border-brand/50 cursor-pointer"
                              }`}
                              onMouseEnter={() => {
                                if (slot) {
                                  setHoveredCell({ date: day.isoDate, time });
                                }
                              }}
                              onFocus={() => {
                                if (slot) {
                                  setHoveredCell({ date: day.isoDate, time });
                                }
                              }}
                              onClick={() => {
                                if (!slot || isBlocked) {
                                  return;
                                }

                                onSelectSlot({ date: day.isoDate, time });
                                setHoveredCell({ date: day.isoDate, time });
                              }}
                            >
                              {!slot || isBlocked ? (
                                <X size={12} aria-hidden="true" />
                              ) : isSelected ? (
                                <span className="w-1.5 h-1.5 bg-white rounded-full" aria-hidden="true" />
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

          <div className="flex justify-between items-center text-[10px] text-stone-400 pt-2 border-t border-stone-100">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-white border border-stone-200 rounded-sm"></div>
              <span>Trống</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-stone-100 border border-stone-200 rounded-sm flex items-center justify-center">
                <X size={8} />
              </div>
              <span>Đã đầy</span>
            </div>

          </div>

          {weather ? (
            <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-stone-400 uppercase">
                  Dự báo {activeSlot ? activeSlot + ' - ' : ''}Ngày {new Date(activeDate).getDate()}/{new Date(activeDate).getMonth() + 1}
                </span>
                <Sun size={16} className="text-yellow-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-bold">{weather.temp}°C</span>
                  <span className="text-[10px] font-medium text-stone-600 pb-1">{weather.condition}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Điều kiện bay</span>
                  <span className="text-xs font-bold text-emerald-600">{weather.flight}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t border-stone-200/50">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Sức gió</span>
                  <span className="text-xs font-bold">{weather.wind} km/h</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-stone-400 uppercase">Chỉ số UV</span>
                  <span className="text-xs font-bold">{weather.uv} (Trung bình)</span>
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
