import { Fragment, type CSSProperties, useEffect, useMemo, useState } from "react";
import type { AvailabilityDay, AvailabilitySlot } from "@paragliding/api-client";
import { Badge, Button, Card, Panel } from "@paragliding/ui";

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

const getDayAvailabilityLabel = (count: number) => {
  if (count === 0) {
    return "Closed";
  }

  if (count <= 2) {
    return "Limited";
  }

  return "Open";
};

const sortTime = (left: string, right: string) => {
  const [leftHour, leftMinute] = left.split(":").map(Number);
  const [rightHour, rightMinute] = right.split(":").map(Number);
  return leftHour * 60 + leftMinute - (rightHour * 60 + rightMinute);
};

const formatDayLabel = (date: Date) =>
  date.toLocaleDateString("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });

const formatWeekRange = (week: CalendarWeekDay[]) => {
  const firstDay = week[0];
  const lastDay = week[week.length - 1];

  if (!firstDay || !lastDay) {
    return "";
  }

  if (firstDay.date.getMonth() === lastDay.date.getMonth()) {
    return `${firstDay.date.getDate()} - ${lastDay.date.getDate()} ${monthNames[lastDay.date.getMonth()]}, ${lastDay.date.getFullYear()}`;
  }

  return `${firstDay.date.getDate()}/${firstDay.date.getMonth() + 1} - ${lastDay.date.getDate()}/${lastDay.date.getMonth() + 1}, ${lastDay.date.getFullYear()}`;
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
  const weekRangeLabel = formatWeekRange(activeWeek);
  const weekBoardStyle = useMemo(
    () =>
      ({
        gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))"
      }) satisfies CSSProperties,
    []
  );

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
    <div className="calendar-shell">
      <Card className="calendar-card">
        <Panel className="calendar-panel">
          <div className="calendar-toolbar">
            <div className="calendar-toolbar__group">
              <Button variant="ghost" className="calendar-nav-button" onClick={() => moveWeek(-1)}>
                Prev week
              </Button>

              <div className="calendar-picker">
                <button
                  type="button"
                  className="calendar-picker__button"
                  onClick={() => {
                    setShowMonthMenu((current) => !current);
                    setShowYearMenu(false);
                  }}
                >
                  {monthNames[month - 1]}
                </button>
                <button
                  type="button"
                  className="calendar-picker__button"
                  onClick={() => {
                    setShowYearMenu((current) => !current);
                    setShowMonthMenu(false);
                  }}
                >
                  {year}
                </button>
              </div>

              <Button variant="ghost" className="calendar-nav-button" onClick={() => moveWeek(1)}>
                Next week
              </Button>
            </div>

            <Badge>Tuan {weekIndex + 1}</Badge>
          </div>

          {showMonthMenu ? (
            <div className="calendar-menu calendar-menu--months">
              {monthNames.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`calendar-menu__option ${month === index + 1 ? "is-active" : ""}`}
                  onClick={() => changeMonth(year, index + 1)}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : null}

          {showYearMenu ? (
            <div className="calendar-menu calendar-menu--years">
              {yearOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  className={`calendar-menu__option ${year === option ? "is-active" : ""}`}
                  onClick={() => changeMonth(option, month)}
                >
                  {option}
                </button>
              ))}
            </div>
          ) : null}

          {activeWeek.length > 0 ? (
            <>
              <div className="calendar-week-summary">
                <div>
                  <Badge tone="success">Lich theo tuan</Badge>
                  <h4>{weekRangeLabel}</h4>
                </div>
                {selectedSlot ? (
                  <div className="calendar-week-summary__chip">
                    {selectedSlot.time}, {fromDateKey(selectedSlot.date).toLocaleDateString("vi-VN")}
                  </div>
                ) : (
                  <div className="calendar-week-summary__chip">Chon mot slot</div>
                )}
              </div>

              <div className="calendar-week-board-wrap" onMouseLeave={() => setHoveredCell(selectedSlot)}>
                <div className="calendar-week-board" style={weekBoardStyle}>
                  <div className="calendar-week-board__corner">
                    <span>Gio</span>
                  </div>

                  {activeWeek.map((day) => {
                    const availableCount = day.day ? getAvailableCount(day.day) : 0;
                    const isSelectedDay = Boolean(selectedSlot?.date && selectedSlot.date === day.isoDate);

                    return (
                      <div
                        key={day.key}
                        className={`calendar-week-board__day ${day.outsideMonth ? "is-outside" : ""} ${
                          isSelectedDay ? "is-selected" : ""
                        }`}
                      >
                        <small>{weekdayShort[day.date.getDay()]}</small>
                        <strong>{day.date.getDate()}</strong>
                        <span>{getDayAvailabilityLabel(availableCount)}</span>
                      </div>
                    );
                  })}

                  {timeSlots.map((time) => (
                    <Fragment key={time}>
                      <div className="calendar-week-board__time">{time}</div>

                      {activeWeek.map((day) => {
                        const slot = day.day?.slots.find((item) => item.time === time) ?? null;
                        const isBlocked = Boolean(slot?.is_locked || slot?.is_full);
                        const isSelected = Boolean(
                          slot && selectedSlot?.date === day.isoDate && selectedSlot?.time === time
                        );
                        return (
                          <button
                            key={`${day.key}-${time}`}
                            type="button"
                            className={`calendar-week-slot ${!slot ? "is-muted" : ""} ${day.outsideMonth ? "is-outside" : ""} ${
                              isBlocked ? "is-blocked" : ""
                            } ${isSelected ? "is-selected" : ""}`}
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
                              <span className="calendar-week-slot__cross">X</span>
                            ) : (
                              <span className="calendar-week-slot__empty" aria-hidden="true" />
                            )}
                          </button>
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="calendar-empty">Chua co du lieu kha dung cho thang nay.</div>
          )}

          <div className="calendar-legend">
            <span>
              <i className="calendar-legend__swatch" />
              Con trong
            </span>
            <span>
              <i className="calendar-legend__swatch is-full" />
              Day / khoa
            </span>
            <span>
              <i className="calendar-legend__swatch is-selected" />
              Da chon
            </span>
          </div>

          <section className="calendar-weather-inline">
            <div className="calendar-weather-inline__top">
              <div className="stack-sm">
                <Badge tone="success">Weather theo gio</Badge>
                <h3 className="calendar-weather-card__title">
                  {previewDate ? formatDayLabel(fromDateKey(previewDate)) : "Chon mot ngay"}
                  {previewTime ? ` - ${previewTime}` : ""}
                </h3>
              </div>

              <div className="calendar-week-summary__chip">
                {selectedSlot
                  ? `${selectedSlot.time}, ${fromDateKey(selectedSlot.date).toLocaleDateString("vi-VN")}`
                  : "Hover vao slot de xem weather"}
              </div>
            </div>

            {weatherSource && hasRealWeather ? (
              <div className="calendar-weather-inline__body">
                <div className="calendar-weather-hero">
                  <strong>{weatherSource.temperature_c} deg C</strong>
                  <span>{weatherSource.flight_condition}</span>
                </div>

                <div className="weather-metrics calendar-weather-inline__metrics">
                  <article>
                    <span>Nhiet do</span>
                    <strong>{weatherSource.temperature_c} deg C</strong>
                  </article>
                  <article>
                    <span>Gio</span>
                    <strong>{weatherSource.wind_kph} km/h</strong>
                  </article>
                  <article>
                    <span>UV</span>
                    <strong>{weatherSource.uv_index}</strong>
                  </article>
                  <article>
                    <span>Tam nhin</span>
                    <strong>{weatherSource.visibility_km} km</strong>
                  </article>
                  <article>
                    <span>Danh gia thoi tiet</span>
                    <strong>{weatherSource.flight_condition}</strong>
                  </article>
                </div>
              </div>
            ) : (
              <p className="calendar-selection-note">Chua co du lieu thoi tiet thuc te tu API cho lich bay nay.</p>
            )}
          </section>
        </Panel>
      </Card>
    </div>
  );
};
