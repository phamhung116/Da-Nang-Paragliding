import { Badge, Button } from "@paragliding/ui";
import type { AvailabilityDay } from "@paragliding/api-client";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, MoveRight, ShieldCheck, Sun, Thermometer, Wind } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { routes } from "@/shared/config/routes";
import { formatDate } from "@/shared/lib/format";
import { WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";

type WeatherShowcaseProps = {
  days: AvailabilityDay[];
  isDark?: boolean;
};

const FORECAST_PAGE_SIZE = 4;

const normalizeCondition = (condition: string) =>
  condition
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

const getWeatherTone = (condition: string): "default" | "success" | "danger" => {
  const normalized = normalizeCondition(condition);

  if (normalized === "ly tuong" || normalized === "thoi tiet tot") {
    return "success";
  }

  if (normalized === "khong ly tuong" || normalized === "thoi tiet xau") {
    return "danger";
  }

  return "default";
};

const getConditionCardClasses = (condition: string) => {
  const normalized = normalizeCondition(condition);

  if (normalized === "ly tuong" || normalized === "thoi tiet tot") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (normalized === "khong ly tuong" || normalized === "thoi tiet xau") {
    return "border-rose-100 bg-rose-50 text-rose-700";
  }

  return "border-amber-100 bg-amber-50 text-amber-700";
};

const getConditionSummary = (condition: string) => {
  const normalized = normalizeCondition(condition);

  if (normalized === "ly tuong" || normalized === "thoi tiet tot") {
    return "Điều kiện lý tưởng cho một chuyến bay tuyệt vời.";
  }

  if (normalized === "khong ly tuong" || normalized === "thoi tiet xau") {
    return "Nên theo dõi thêm trước khi chốt lịch bay.";
  }

  return "Thời tiết đang ổn định và có thể theo dõi thêm để chọn giờ đẹp.";
};

const getStatDescription = (kind: "wind" | "uv" | "temperature" | "visibility", value: number) => {
  if (kind === "wind") {
    if (value <= 10) return "Gió nhẹ, ổn định";
    if (value <= 18) return "Gió vừa, dễ quan sát";
    return "Gió mạnh hơn, cần theo dõi";
  }

  if (kind === "uv") {
    if (value <= 2) return "Mức thấp";
    if (value <= 5) return "Mức trung bình";
    return "Nắng khá gắt";
  }

  if (kind === "temperature") {
    if (value <= 24) return "Dịu mát";
    if (value <= 30) return "Mát mẻ, dễ chịu";
    return "Khá nóng";
  }

  if (value >= 10) return "Tầm nhìn rất tốt";
  if (value >= 7) return "Quan sát khá rõ";
  return "Tầm nhìn trung bình";
};

const formatWeekday = (date: string) =>
  formatDate(date, {
    weekday: "short"
  }).replace(",", "");

const formatDayMonth = (date: string) =>
  formatDate(date, {
    day: "2-digit",
    month: "2-digit"
  });

export const WeatherShowcase = ({ days, isDark = false }: WeatherShowcaseProps) => {
  const forecast = days.filter((day) => day.weather_available).slice(0, WEATHER_FORECAST_DAYS);
  const today = forecast[0];
  const [forecastPage, setForecastPage] = useState(0);
  const forecastKey = useMemo(() => forecast.map((item) => item.date).join("|"), [forecast]);
  const forecastPageCount = Math.max(1, Math.ceil(forecast.length / FORECAST_PAGE_SIZE));
  const visibleForecast = forecast.slice(
    forecastPage * FORECAST_PAGE_SIZE,
    forecastPage * FORECAST_PAGE_SIZE + FORECAST_PAGE_SIZE
  );

  useEffect(() => {
    setForecastPage(0);
  }, [forecastKey]);

  useEffect(() => {
    if (forecastPage >= forecastPageCount) {
      setForecastPage(forecastPageCount - 1);
    }
  }, [forecastPage, forecastPageCount]);

  if (!today) {
    return null;
  }

  const todayFlightCondition = repairFlightConditionLabel(today.flight_condition);
  const displayTheme = isDark
    ? {
        shell: "border-white/10 bg-stone-900 text-white",
        divider: "border-white/10",
        panel: "bg-white/5",
        muted: "text-stone-300",
        subMuted: "text-stone-400",
        row: "border-white/8 bg-white/5 hover:bg-white/10",
        rowMeta: "text-stone-300",
        button: "border-white/10 text-white hover:bg-white/10 disabled:text-white/30"
      }
    : {
        shell: "border-stone-200 bg-white text-stone-900",
        divider: "border-stone-100",
        panel: "bg-stone-50",
        muted: "text-stone-600",
        subMuted: "text-stone-500",
        row: "border-stone-100 bg-white hover:bg-stone-50",
        rowMeta: "text-stone-500",
        button: "border-stone-200 text-stone-700 hover:bg-stone-100 disabled:text-stone-300"
      };

  const stats = [
    {
      icon: <Wind size={22} />,
      title: "Sức gió",
      value: `${today.wind_kph} km/h`,
      description: getStatDescription("wind", Number(today.wind_kph)),
      iconClass: "text-rose-400"
    },
    {
      icon: <Sun size={22} />,
      title: "Chỉ số UV",
      value: `${today.uv_index}`,
      description: getStatDescription("uv", Number(today.uv_index)),
      iconClass: "text-amber-400"
    },
    {
      icon: <Thermometer size={22} />,
      title: "Nhiệt độ",
      value: `${today.temperature_c}°C`,
      description: getStatDescription("temperature", Number(today.temperature_c)),
      iconClass: "text-sky-400"
    },
    {
      icon: <Eye size={22} />,
      title: "Tầm nhìn",
      value: `${today.visibility_km} km`,
      description: getStatDescription("visibility", Number(today.visibility_km)),
      iconClass: "text-yellow-500"
    }
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className={`overflow-hidden rounded-[32px] border shadow-[0_25px_70px_rgba(15,23,42,0.14)] md:rounded-[36px] ${displayTheme.shell}`}>
        <div className="grid lg:grid-cols-[1.08fr_1fr]">
          <div className={`border-b p-6 md:p-8 lg:border-b-0 lg:border-r xl:p-10 ${displayTheme.divider}`}>
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight md:text-[2.25rem]">Thời tiết hôm nay</h2>
                <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm font-medium ${displayTheme.muted}`}>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-rose-500" />
                    {formatDate(today.date, {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    })}
                  </span>
                  <span className="text-2xl font-semibold italic text-[#c66352]">Sơn Trà</span>
                </div>
              </div>

              <div className={`inline-flex rounded-full border px-4 py-3 text-sm font-semibold ${getConditionCardClasses(today.flight_condition)}`}>
                <span>Điều kiện bay: {todayFlightCondition}</span>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {stats.map((stat) => (
                <article key={stat.title} className={`rounded-[22px] border p-4 shadow-sm ${displayTheme.divider} ${displayTheme.panel}`}>
                  <div className="flex items-start gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-white ${stat.iconClass} shadow-sm`}>
                      {stat.icon}
                    </div>
                    <div>
                      <p className={`text-xs font-bold uppercase tracking-[0.18em] ${displayTheme.subMuted}`}>{stat.title}</p>
                      <p className="mt-2 text-3xl font-extrabold leading-none">{stat.value}</p>
                      <p className={`mt-2 text-sm ${displayTheme.muted}`}>{stat.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-stone-100 bg-gradient-to-r from-[#eef5ff] via-white to-[#fff8eb] shadow-sm">
              <div className="grid gap-6 p-4 md:grid-cols-[220px_1fr] md:p-5">
                <div className="relative h-44 overflow-hidden rounded-[24px] md:h-full">
                  <img
                    src="/media/img/anh21.jpg"
                    alt="Bay dù lượn tại Sơn Trà"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-900/35 via-transparent to-transparent" />
                </div>

                <div className="flex flex-col justify-between gap-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-end gap-3">
                        <strong className="text-4xl font-extrabold leading-none text-stone-900 md:text-5xl">{today.temperature_c}°C</strong>
                        <span className="pb-1 text-lg font-semibold text-stone-800">{today.weather_condition || "Nhiều nắng"}</span>
                      </div>
                      <p className="mt-3 max-w-lg text-base leading-7 text-stone-600">{getConditionSummary(today.flight_condition)}</p>
                    </div>
                    <Sun className="hidden text-amber-400 md:block" size={38} />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to={routes.booking} className="sm:flex-1">
                      <Button className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-brand/20">
                        Đặt lịch ngay
                        <MoveRight size={16} />
                      </Button>
                    </Link>
                    <Link to={routes.services} className="sm:flex-1">
                      <Button className="btn-secondary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold">
                        Xem lịch trống
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-5 inline-flex items-center gap-2 text-sm font-medium ${displayTheme.muted}`}>
              <ShieldCheck size={18} className="text-emerald-500" />
              An toàn là ưu tiên hàng đầu của chúng tôi
            </div>
          </div>

          <div className="p-6 md:p-8 xl:p-10">
            <div className="flex flex-col gap-4 border-b border-stone-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-2xl font-bold tracking-tight">Dự báo thời tiết 4 ngày tới</h3>
              <Link to={routes.services} className="inline-flex items-center gap-2 text-sm font-semibold text-[#c66352] transition-colors hover:text-[#aa4f40]">
                Xem chi tiết
                <MoveRight size={16} />
              </Link>
            </div>

            <div className="mt-6 space-y-4">
              {visibleForecast.map((item) => {
                const condition = repairFlightConditionLabel(item.flight_condition);

                return (
                  <article
                    key={item.date}
                    className={`rounded-[24px] border p-4 shadow-sm transition-colors md:p-5 ${displayTheme.row}`}
                  >
                    <div className="grid gap-4 lg:grid-cols-[88px_132px_repeat(4,minmax(0,1fr))_42px] lg:items-center">
                      <div>
                        <p className="text-lg font-bold text-stone-900">{formatWeekday(item.date)}</p>
                        <p className={`mt-1 text-sm font-medium ${displayTheme.rowMeta}`}>{formatDayMonth(item.date)}</p>
                      </div>

                      <div className="flex">
                        <Badge tone={getWeatherTone(item.flight_condition)}>{condition}</Badge>
                      </div>

                      <div>
                        <p className="text-xl font-bold text-stone-900">{item.wind_kph}</p>
                        <p className={`mt-1 text-sm ${displayTheme.rowMeta}`}>km/h</p>
                      </div>

                      <div>
                        <p className="text-xl font-bold text-stone-900">{item.uv_index}</p>
                        <p className={`mt-1 text-sm ${displayTheme.rowMeta}`}>UV</p>
                      </div>

                      <div>
                        <p className="text-xl font-bold text-stone-900">{item.visibility_km} km</p>
                        <p className={`mt-1 text-sm ${displayTheme.rowMeta}`}>Tầm nhìn</p>
                      </div>

                      <div>
                        <p className="text-xl font-bold text-stone-900">{item.temperature_c}°C</p>
                        <p className={`mt-1 text-sm ${displayTheme.rowMeta}`}>Nhiệt độ</p>
                      </div>

                      <div className="flex justify-start lg:justify-end">
                        <div className={`h-10 w-10 rounded-full border ${getConditionCardClasses(item.flight_condition)} flex items-center justify-center`}>
                          <Sun size={18} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {forecastPageCount > 1 ? (
              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  aria-label="Previous forecast page"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${displayTheme.button}`}
                  disabled={forecastPage === 0}
                  onClick={() => setForecastPage((page) => Math.max(0, page - 1))}
                >
                  <ChevronLeft size={18} />
                </button>
                <span className={`text-sm font-bold ${displayTheme.subMuted}`}>
                  {forecastPage + 1} / {forecastPageCount}
                </span>
                <button
                  type="button"
                  aria-label="Next forecast page"
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${displayTheme.button}`}
                  disabled={forecastPage >= forecastPageCount - 1}
                  onClick={() => setForecastPage((page) => Math.min(forecastPageCount - 1, page + 1))}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};
