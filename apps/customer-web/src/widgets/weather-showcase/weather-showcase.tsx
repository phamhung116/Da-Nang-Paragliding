import { Badge, Button } from "@paragliding/ui";
import type { AvailabilityDay } from "@paragliding/api-client";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Eye, MoveRight, ShieldCheck, Sun, Thermometer, Wind } from "lucide-react";
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

export const WeatherShowcase = ({ days, isDark = false }: WeatherShowcaseProps) => {
  const forecast = days.filter((day) => day.weather_available).slice(0, WEATHER_FORECAST_DAYS);
  const today = forecast[0];
  const [isForecastOpen, setIsForecastOpen] = useState(false);
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
        subMuted: "text-stone-400"
      }
    : {
        shell: "border-stone-200 bg-white text-stone-900",
        divider: "border-stone-100",
        panel: "bg-stone-50",
        muted: "text-stone-600",
        subMuted: "text-stone-500"
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

          <div className={`p-6 md:p-12 ${isDark ? "bg-stone-800/30" : "bg-stone-50/50"}`}>
            <div
              className="mb-6 flex cursor-pointer items-center justify-between md:mb-8 md:cursor-default"
              onClick={() => setIsForecastOpen(!isForecastOpen)}
            >
              <h3 className="text-lg font-bold md:text-xl">Dự báo thời tiết</h3>
              <ChevronDown
                size={20}
                className={`text-stone-400 transition-transform duration-300 md:hidden ${isForecastOpen ? "rotate-180" : ""}`}
              />
            </div>

            <div
              className={`${isForecastOpen ? "mt-0 max-h-[1000px] opacity-100" : "-mt-4 max-h-0 opacity-0"} overflow-hidden transition-all duration-500 md:mt-0 md:max-h-none md:opacity-100`}
            >
              <div className="space-y-3 md:space-y-4">
                {visibleForecast.map((item) => (
                  <article
                    key={item.date}
                    className={`grid grid-cols-[64px_minmax(0,1fr)] gap-x-3 gap-y-2 rounded-xl p-3 transition-colors md:grid-cols-[72px_110px_minmax(76px,1fr)_minmax(52px,0.7fr)_minmax(92px,1fr)_70px] md:items-center md:gap-x-4 ${
                      isDark ? "hover:bg-white/5" : "hover:bg-stone-100"
                    }`}
                  >
                    <span className="text-[11px] font-medium leading-4 md:text-sm">
                      {formatDate(item.date, {
                        weekday: "short",
                        day: "2-digit",
                        month: "2-digit"
                      })}
                    </span>
                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none md:text-[11px] ${getConditionCardClasses(item.flight_condition)}`}
                    >
                      {repairFlightConditionLabel(item.flight_condition)}
                    </span>
                    <div className="flex items-center gap-1.5 md:min-w-0">
                      <Wind size={13} className="shrink-0 text-stone-400 md:h-[15px] md:w-[15px]" />
                      <span className="whitespace-nowrap text-[12px] font-bold md:text-[13px]">{item.wind_kph} km/h</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:min-w-0">
                      <Sun size={13} className="shrink-0 text-stone-400 md:h-[15px] md:w-[15px]" />
                      <span className="whitespace-nowrap text-[12px] font-bold md:text-[13px]">{item.uv_index}</span>
                    </div>
                    <div className="flex items-center gap-1.5 md:min-w-0">
                      <Eye size={13} className="shrink-0 text-stone-400 md:h-[15px] md:w-[15px]" />
                      <span className="whitespace-nowrap text-[12px] font-bold md:text-[13px]">{item.visibility_km} km</span>
                    </div>
                    <span className="text-[12px] font-bold md:text-[13px]">{item.temperature_c}°C</span>
                  </article>
                ))}

                {forecastPageCount > 1 ? (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      aria-label="Previous forecast page"
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                          ? "border-white/10 text-white hover:bg-white/10 disabled:text-white/30"
                          : "border-stone-200 text-stone-700 hover:bg-stone-100 disabled:text-stone-300"
                      }`}
                      disabled={forecastPage === 0}
                      onClick={() => setForecastPage((page) => Math.max(0, page - 1))}
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className={`text-xs font-bold ${isDark ? "text-stone-400" : "text-stone-500"}`}>
                      {forecastPage + 1} / {forecastPageCount}
                    </span>
                    <button
                      type="button"
                      aria-label="Next forecast page"
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors ${
                        isDark
                          ? "border-white/10 text-white hover:bg-white/10 disabled:text-white/30"
                          : "border-stone-200 text-stone-700 hover:bg-stone-100 disabled:text-stone-300"
                      }`}
                      disabled={forecastPage >= forecastPageCount - 1}
                      onClick={() => setForecastPage((page) => Math.min(forecastPageCount - 1, page + 1))}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
