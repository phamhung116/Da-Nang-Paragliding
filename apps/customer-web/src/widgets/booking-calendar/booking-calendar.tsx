import { useEffect, useMemo, useRef, useState } from "react";
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

type CalendarDay = {
  key: string;
  isoDate: string;
  date: Date;
  day: AvailabilityDay | null;
  outsideMonth: boolean;
};

type OverlayAnchor = {
  left: number;
  top: number;
} | null;

type BookingCalendarProps = {
  year: number;
  month: number;
  days: AvailabilityDay[];
  selectedSlot: SelectedSlot;
  onMonthChange: (year: number, month: number) => void;
  onSelectSlot: (slot: { date: string; time: string }) => void;
  weatherAside?: boolean;
};

const PAGE_SIZE = 7;

const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const fromDateKey = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  return new Date(rawYear, (rawMonth || 1) - 1, rawDay || 1);
};

const addDays = (date: Date, amount: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
};

const compareMonth = (left: Date, right: Date) =>
  left.getFullYear() === right.getFullYear() ? left.getMonth() - right.getMonth() : left.getFullYear() - right.getFullYear();

const sortTime = (left: string, right: string) => {
  const [leftHour, leftMinute] = left.split(":").map(Number);
  const [rightHour, rightMinute] = right.split(":").map(Number);
  return leftHour * 60 + leftMinute - (rightHour * 60 + rightMinute);
};

const getAvailableCount = (day: AvailabilityDay) => day.slots.filter((slot) => !slot.is_locked && !slot.is_full).length;

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
  const [pageIndex, setPageIndex] = useState(0);
  const [pendingPageEdge, setPendingPageEdge] = useState<"start" | "end" | null>(null);
  const [overlayAnchor, setOverlayAnchor] = useState<OverlayAnchor>(null);
  const overlayHostRef = useRef<HTMLDivElement | null>(null);

  const today = useMemo(() => new Date(), []);
  const todayKey = useMemo(() => toDateKey(today), [today]);
  const todayMonthStart = useMemo(() => new Date(today.getFullYear(), today.getMonth(), 1), [today]);
  const currentMonthStart = useMemo(() => new Date(year, month - 1, 1), [month, year]);

  useEffect(() => {
    setHoveredCell(selectedSlot);
  }, [selectedSlot]);

  const sortedDays = useMemo(() => [...days].sort((left, right) => left.date.localeCompare(right.date)), [days]);
  const visibleDays = useMemo(() => sortedDays.filter((day) => day.date >= todayKey), [sortedDays, todayKey]);
  const daysByDate = useMemo(() => new Map(visibleDays.map((day) => [day.date, day])), [visibleDays]);

  const timeSlots = useMemo(() => {
    const uniqueTimes = new Set<string>();
    visibleDays.forEach((day) => {
      day.slots.forEach((slot) => uniqueTimes.add(slot.time));
    });
    return Array.from(uniqueTimes).sort(sortTime);
  }, [visibleDays]);

  const monthNames = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(resolveLocaleTag(locale), { month: "long" });
    return Array.from({ length: 12 }, (_unused, index) => formatter.format(new Date(2026, index, 1)));
  }, [locale]);

  const weekdayShort = useMemo(() => {
    const formatter = new Intl.DateTimeFormat(resolveLocaleTag(locale), { weekday: "short" });
    const sunday = new Date(2026, 0, 4);
    return Array.from({ length: 7 }, (_unused, index) => formatter.format(addDays(sunday, index)));
  }, [locale]);

  const yearOptions = useMemo(() => {
    const currentYear = today.getFullYear();
    return Array.from(new Set([currentYear, currentYear + 1, currentYear + 2, year])).sort((left, right) => left - right);
  }, [today, year]);

  const startDate = useMemo(() => {
    if (compareMonth(currentMonthStart, todayMonthStart) <= 0) {
      return today;
    }
    return currentMonthStart;
  }, [currentMonthStart, today, todayMonthStart]);

  const calendarPages = useMemo(() => {
    const monthEnd = new Date(year, month, 0);
    const pages: CalendarDay[][] = [];

    for (let cursor = new Date(startDate); cursor <= monthEnd || pages.length === 0; cursor = addDays(cursor, PAGE_SIZE)) {
      const page: CalendarDay[] = [];

      for (let index = 0; index < PAGE_SIZE; index += 1) {
        const cellDate = addDays(cursor, index);
        const isoDate = toDateKey(cellDate);
        page.push({
          key: `${isoDate}-${index}`,
          isoDate,
          date: cellDate,
          day: daysByDate.get(isoDate) ?? null,
          outsideMonth: cellDate.getMonth() !== month - 1
        });
      }

      pages.push(page);
    }

    return pages;
  }, [daysByDate, month, startDate, year]);

  useEffect(() => {
    if (!calendarPages.length) {
      setPageIndex(0);
      return;
    }

    if (pendingPageEdge) {
      setPageIndex(pendingPageEdge === "end" ? calendarPages.length - 1 : 0);
      setPendingPageEdge(null);
      return;
    }

    if (selectedSlot?.date) {
      const selectedPage = calendarPages.findIndex((page) => page.some((day) => day.isoDate === selectedSlot.date));
      if (selectedPage >= 0) {
        setPageIndex(selectedPage);
        return;
      }
    }

    const firstPageWithAvailability = calendarPages.findIndex((page) => page.some((day) => day.day && getAvailableCount(day.day) > 0));
    setPageIndex(firstPageWithAvailability >= 0 ? firstPageWithAvailability : 0);
  }, [calendarPages, pendingPageEdge, selectedSlot?.date]);

  const activePage = calendarPages[pageIndex] ?? [];
  const previewSlot = hoveredCell ? daysByDate.get(hoveredCell.date)?.slots.find((slot) => slot.time === hoveredCell.time) ?? null : null;
  const selectedWeatherSlot = selectedSlot
    ? daysByDate.get(selectedSlot.date)?.slots.find((slot) => slot.time === selectedSlot.time) ?? null
    : null;
  const fallbackDay = activePage.find((day) => day.day)?.day ?? visibleDays[0] ?? null;
  const weatherSource: AvailabilitySlot | AvailabilityDay | null = previewSlot ?? selectedWeatherSlot ?? fallbackDay;
  const hasRealWeather = Boolean(weatherSource?.weather_available);
  const previewDate = hoveredCell?.date ?? selectedSlot?.date ?? fallbackDay?.date ?? null;
  const previewTime = previewSlot ? hoveredCell?.time ?? null : selectedWeatherSlot ? selectedSlot?.time ?? null : null;
  const activeDate = previewDate ?? fallbackDay?.date ?? todayKey;
  const activeSlot = previewTime;
  const weather =
    weatherSource && hasRealWeather
      ? {
          temp: weatherSource.temperature_c,
          condition: weatherSource.weather_condition || "Thoi tiet",
          flight: repairFlightConditionLabel(weatherSource.flight_condition || "Dang cap nhat"),
          wind: weatherSource.wind_kph,
          uv: weatherSource.uv_index
        }
      : null;

  const updateOverlayAnchor = (element: HTMLElement) => {
    if (!overlayHostRef.current) return;
    const hostRect = overlayHostRef.current.getBoundingClientRect();
    const cellRect = element.getBoundingClientRect();
    setOverlayAnchor({
      left: cellRect.left - hostRect.left + cellRect.width / 2,
      top: cellRect.top - hostRect.top - 10
    });
  };

  const changeMonth = (nextYear: number, nextMonth: number, edge: "start" | "end" = "start") => {
    const requestedMonth = new Date(nextYear, nextMonth - 1, 1);
    const normalizedMonth = compareMonth(requestedMonth, todayMonthStart) < 0 ? todayMonthStart : requestedMonth;

    setPendingPageEdge(edge);
    setHoveredCell(selectedSlot);
    setOverlayAnchor(null);
    setShowMonthMenu(false);
    setShowYearMenu(false);
    onMonthChange(normalizedMonth.getFullYear(), normalizedMonth.getMonth() + 1);
  };

  const movePage = (step: number) => {
    const nextPage = pageIndex + step;
    if (nextPage >= 0 && nextPage < calendarPages.length) {
      setPageIndex(nextPage);
      setHoveredCell(selectedSlot);
      setOverlayAnchor(null);
      return;
    }

    if (step < 0 && compareMonth(currentMonthStart, todayMonthStart) <= 0) {
      return;
    }

    const nextMonthDate = new Date(year, month - 1 + step, 1);
    changeMonth(nextMonthDate.getFullYear(), nextMonthDate.getMonth() + 1, step > 0 ? "start" : "end");
  };

  const weatherCard = (
    <div className="space-y-2 rounded-2xl border border-stone-200 bg-white/95 p-3 shadow-xl backdrop-blur-sm">
      {weather ? (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[10px] font-bold uppercase text-stone-400">
              Dự báo {activeSlot ? `${activeSlot} - ` : ""}Ngày {formatDate(activeDate, { day: "2-digit", month: "2-digit" })}
            </span>
            <Sun size={15} className="text-yellow-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-end gap-2">
              <span className="text-xl font-bold">{weather.temp}°C</span>
              <span className="pb-0.5 text-[10px] font-medium text-stone-600">{weather.condition}</span>
            </div>
            <div className="flex flex-col justify-center">
              <span className="text-[10px] font-bold uppercase text-stone-400">Điều kiện bay</span>
              <span className="text-xs font-bold text-emerald-600">{weather.flight}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-stone-200 pt-2">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-stone-400">Sức gió</span>
              <span className="text-xs font-bold">{weather.wind} km/h</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-stone-400">Chỉ số UV</span>
              <span className="text-xs font-bold">{weather.uv}</span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-xs text-stone-500">Chưa có dữ liệu thời tiết cho lịch bay này</p>
      )}
    </div>
  );

  const tableMinWidth = weatherAside ? "min-w-[300px]" : "min-w-[260px]";
  const wrapperWidth = weatherAside ? "min-w-[300px] max-w-3xl" : "min-w-[260px] mx-auto max-w-xl";
  const timeHeaderWidth = weatherAside ? "w-12 md:w-14" : "w-11 md:w-12";
  const timeLabelClass = weatherAside ? "text-[11px] md:text-[14px]" : "text-[9px] md:text-[11px]";
  const weekdayClass = weatherAside ? "text-[10px] md:text-[13px]" : "text-[8px] md:text-[10px]";
  const dayNumberClass = weatherAside ? "text-[12px] md:text-[15px]" : "text-[10px] md:text-[12px]";
  const monthYearClass = weatherAside ? "flex items-center gap-1 text-[13px] md:text-[15px] font-bold text-stone-700 transition-colors hover:text-brand" : "flex items-center gap-1 text-sm font-bold text-stone-700 transition-colors hover:text-brand";
  const cellPaddingClass = weatherAside ? "p-[5px]" : "p-[2px]";
  const slotSizeClass = weatherAside ? "h-10 w-10 md:h-11 md:w-11" : "h-9 w-9 md:h-10 md:w-10";

  return (
    <div className={`mx-auto ${weatherAside ? "max-w-3xl" : "max-w-sm lg:max-w-none"}`}>
      <div className="space-y-3">
        <div className="space-y-3">
          <div className="relative">
            <div className="mb-3 flex items-center justify-between">
              <Button onClick={() => movePage(-1)} className="rounded-full p-1 transition-colors hover:bg-stone-100">
                <ChevronRight className="rotate-180 text-stone-400" size={18} />
              </Button>

              <div className="flex gap-2">
                <button
                  type="button"
                  className={monthYearClass}
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
                  className={monthYearClass}
                  onClick={() => {
                    setShowYearMenu((current) => !current);
                    setShowMonthMenu(false);
                  }}
                >
                  {year}
                  <ChevronDown size={14} />
                </button>
              </div>

              <Button onClick={() => movePage(1)} className="rounded-full p-1 transition-colors hover:bg-stone-100">
                <ChevronRight className="text-stone-400" size={18} />
              </Button>
            </div>

            {showMonthMenu ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 rounded-2xl border border-stone-200 bg-white p-4 shadow-xl">
                <div className="grid grid-cols-3 gap-2">
                  {monthNames.map((label, index) => {
                    const optionDate = new Date(year, index, 1);
                    const disabled = compareMonth(optionDate, todayMonthStart) < 0;
                    return (
                      <button
                        key={label}
                        type="button"
                        className={`rounded-lg py-1 text-[10px] transition-colors ${
                          month === index + 1 ? "is-active bg-brand text-white" : disabled ? "cursor-not-allowed text-stone-300" : "hover:bg-stone-100"
                        }`}
                        disabled={disabled}
                        onClick={() => changeMonth(year, index + 1)}
                      >
                        {label}
                      </button>
                    );
                  })}
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

          <div className="overflow-visible">
            <div className={wrapperWidth}>
              {activePage.length > 0 ? (
                <div
                  ref={overlayHostRef}
                  className="relative overflow-visible pb-1"
                  onMouseLeave={() => {
                    setHoveredCell(selectedSlot);
                    setOverlayAnchor(null);
                  }}
                >
                  {weatherAside ? (
                    <>
                      <div className="mb-3 lg:hidden">{weatherCard}</div>
                      {overlayAnchor ? (
                        <div
                          className="pointer-events-none absolute z-30 hidden w-72 -translate-x-1/2 -translate-y-full lg:block"
                          style={{ left: overlayAnchor.left, top: overlayAnchor.top }}
                        >
                          {weatherCard}
                        </div>
                      ) : null}
                    </>
                  ) : null}

                  <div className="overflow-x-auto overflow-y-visible">
                    <table className={`w-full table-fixed border-collapse ${tableMinWidth}`}>
                      <thead>
                        <tr>
                          <th className={`${timeHeaderWidth} p-1`} aria-label="Khung gio" />
                          {activePage.map((day) => {
                            const isSelectedDay = Boolean(selectedSlot?.date && selectedSlot.date === day.isoDate);
                            return (
                              <th key={day.key} className="px-1 py-1 text-center">
                                <div className="flex flex-col">
                                  <span className={`${weekdayClass} font-bold uppercase ${isSelectedDay ? "text-brand" : "text-stone-400"}`}>
                                    {weekdayShort[day.date.getDay()]}
                                  </span>
                                  <span
                                    className={`${dayNumberClass} font-bold ${
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
                            <td className={`whitespace-nowrap p-1 pr-2 align-middle font-bold leading-none text-stone-400 ${timeLabelClass}`}>
                              {time}
                            </td>
                            {activePage.map((day) => {
                              const slot = day.day?.slots.find((item) => item.time === time) ?? null;
                              const isBlocked = Boolean(slot?.is_locked || slot?.is_full);
                              const isSelected = Boolean(slot && selectedSlot?.date === day.isoDate && selectedSlot?.time === time);

                              return (
                                <td key={`${day.key}-${time}`} className={cellPaddingClass}>
                                  <button
                                    type="button"
                                    className={`mx-auto flex ${slotSizeClass} items-center justify-center rounded-[10px] border-2 transition-all ${
                                      !slot || isBlocked
                                        ? "cursor-default border-stone-300 bg-stone-100 text-stone-400"
                                        : isSelected
                                          ? "cursor-pointer border-brand bg-brand font-black text-white shadow-inner"
                                          : "cursor-pointer border-stone-300 bg-white hover:border-brand/60"
                                    }`}
                                    onMouseEnter={(event) => {
                                      if (!slot || isBlocked) return;
                                      setHoveredCell({ date: day.isoDate, time });
                                      if (weatherAside) updateOverlayAnchor(event.currentTarget);
                                    }}
                                    onFocus={(event) => {
                                      if (!slot || isBlocked) return;
                                      setHoveredCell({ date: day.isoDate, time });
                                      if (weatherAside) updateOverlayAnchor(event.currentTarget);
                                    }}
                                    onClick={(event) => {
                                      if (!slot || isBlocked) return;
                                      onSelectSlot({ date: day.isoDate, time });
                                      setHoveredCell({ date: day.isoDate, time });
                                      if (weatherAside) updateOverlayAnchor(event.currentTarget);
                                    }}
                                  >
                                    {!slot || isBlocked ? (
                                      <X size={10} aria-hidden="true" />
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
                </div>
              ) : (
                <div className="calendar-empty">Chua co du lieu kha dung cho thang nay.</div>
              )}

              <div className="flex items-center justify-between border-t border-stone-100 pt-2 text-[10px] text-stone-400">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-sm border-2 border-stone-300 bg-white" />
                  <span>Trong</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex h-2 w-2 items-center justify-center rounded-sm border-2 border-stone-300 bg-stone-100">
                    <X size={8} />
                  </div>
                  <span>Da day</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!weatherAside ? weatherCard : null}
      </div>
    </div>
  );
};
