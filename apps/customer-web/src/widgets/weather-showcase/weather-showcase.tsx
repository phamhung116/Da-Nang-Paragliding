import { Badge, Button } from "@paragliding/ui";
import type { AvailabilityDay } from "@paragliding/api-client";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSun,
  Eye,
  MoveRight,
  ShieldCheck,
  Sun,
  SunMedium,
  Thermometer,
  Wind
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { routes } from "@/shared/config/routes";
import { formatDate } from "@/shared/lib/format";
import { WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { repairFlightConditionLabel } from "@/shared/lib/flight-condition";
import { useI18n } from "@/shared/providers/i18n-provider";
import { getWeatherKind } from "@/shared/ui/weather-visual";

type WeatherShowcaseProps = {
  days: AvailabilityDay[];
  isDark?: boolean;
};

const FORECAST_PAGE_SIZE = 6;

const normalizeCondition = (condition: string) =>
  condition
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

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

const renderWeatherConditionIcon = (kind: ReturnType<typeof getWeatherKind>) => {
  const iconClass = "text-sky-600";

  switch (kind) {
    case "partly-cloudy":
      return <CloudSun className={iconClass} size={36} />;
    case "cloudy":
      return <Cloud className={iconClass} size={36} />;
    case "rain":
      return <CloudRain className={iconClass} size={36} />;
    case "storm":
      return <CloudLightning className={iconClass} size={36} />;
    case "fog":
      return <CloudFog className={iconClass} size={36} />;
    case "wind":
      return <Wind className={iconClass} size={36} />;
    default:
      return <SunMedium className="text-amber-400" size={36} />;
  }
};

export const WeatherShowcase = ({ days, isDark = false }: WeatherShowcaseProps) => {
  const { locale, tText } = useI18n();
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
  const translatedTodayFlightCondition = tText(todayFlightCondition);
  const todayWeatherKind = getWeatherKind(today);
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
      title: tText("Sức gió"),
      value: `${today.wind_kph} km/h`,
      iconClass: "text-rose-400"
    },
    {
      icon: <Sun size={22} />,
      title: tText("Chỉ số UV"),
      value: `${today.uv_index}`,
      iconClass: "text-amber-400"
    },
    {
      icon: <Thermometer size={22} />,
      title: tText("Nhiệt độ"),
      value: `${today.temperature_c}°C`,
      iconClass: "text-sky-400"
    },
    {
      icon: <Eye size={22} />,
      title: tText("Tầm nhìn"),
      value: `${today.visibility_km} km`,
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
                <h2 className="text-3xl font-extrabold tracking-tight md:text-[2.25rem]">{tText("Thời tiết hôm nay")}</h2>
                <div className={`mt-3 flex flex-wrap items-center gap-3 text-sm font-medium ${displayTheme.muted}`}>
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays size={16} className="text-rose-500" />
                    {formatDate(today.date, {
                      weekday: "long",
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric"
                    }, locale)}
                  </span>
                  <span className="text-2xl font-semibold italic text-[#c66352]">{tText("Sơn Trà")}</span>
                </div>
              </div>

              <div className={`inline-flex rounded-full border px-4 py-3 text-sm font-semibold ${getConditionCardClasses(today.flight_condition)}`}>
                <span>{tText("Điều kiện bay:")} {translatedTodayFlightCondition}</span>
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
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-stone-100 bg-gradient-to-r from-[#eef5ff] via-white to-[#fff8eb] shadow-sm">
              <div className="grid gap-0 md:grid-cols-[260px_1fr]">
                <div className="relative h-52 overflow-hidden md:h-full">
                  <img
                    src="/media/img/anh21.jpg"
                    alt={tText("Bay dù lượn tại Sơn Trà")}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-sky-900/35 via-transparent to-transparent" />
                </div>

                <div className="flex flex-col justify-between gap-5 p-4 md:p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-end gap-3">
                        <strong className="text-4xl font-extrabold leading-none text-stone-900 md:text-5xl">{today.temperature_c}°C</strong>
                        <span className="pb-1 text-lg font-semibold text-stone-800">{today.weather_condition ? tText(today.weather_condition) : tText("Đang cập nhật")}</span>
                      </div>
                      <p className="mt-3 max-w-lg text-base leading-7 text-stone-600">{tText(getConditionSummary(today.flight_condition))}</p>
                    </div>
                    <div className="hidden rounded-2xl bg-white/80 p-3 shadow-sm md:block">
                      {renderWeatherConditionIcon(todayWeatherKind)}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link to={routes.services} className="sm:flex-1">
                      <Button className="btn-primary flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold shadow-lg shadow-brand/20">
                        {tText("Đặt lịch ngay")}
                        <MoveRight size={16} />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className={`mt-5 inline-flex items-center gap-2 text-sm font-medium ${displayTheme.muted}`}>
              <ShieldCheck size={18} className="text-emerald-500" />
              {tText("An toàn là ưu tiên hàng đầu của chúng tôi")}
            </div>
          </div>

          <div className={`p-6 md:p-12 ${isDark ? "bg-stone-800/30" : "bg-stone-50/50"}`}>
            <div
              className="mb-6 flex cursor-pointer items-center justify-between md:mb-8 md:cursor-default"
              onClick={() => setIsForecastOpen(!isForecastOpen)}
            >
              <h3 className="text-lg font-bold md:text-xl">{tText("Dự báo thời tiết")}</h3>
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
                    className={`rounded-xl border-b p-3 transition-colors ${
                      isDark ? "border-white/10 hover:bg-white/5" : "border-stone-200 hover:bg-stone-100"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="shrink-0 text-sm font-bold md:text-base">
                          {formatDate(item.date, {
                            weekday: "long",
                            day: "2-digit",
                            month: "2-digit"
                          }, locale)}
                        </span>
                        <span
                          className={`inline-flex max-w-full items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold leading-none md:text-[11px] ${getConditionCardClasses(item.flight_condition)}`}
                        >
                          {tText(repairFlightConditionLabel(item.flight_condition))}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div className="flex items-center gap-1.5">
                        <Wind size={14} className="shrink-0 text-stone-400 md:h-4 md:w-4" />
                        <span className="whitespace-nowrap text-[13px] font-bold md:text-[14px]">{item.wind_kph} km/h</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Sun size={14} className="shrink-0 text-stone-400 md:h-4 md:w-4" />
                        <span className="whitespace-nowrap text-[13px] font-bold md:text-[14px]">{item.uv_index} UV</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Eye size={14} className="shrink-0 text-stone-400 md:h-4 md:w-4" />
                        <span className="whitespace-nowrap text-[13px] font-bold md:text-[14px]">{item.visibility_km} km</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Thermometer size={14} className="shrink-0 text-stone-400 md:h-4 md:w-4" />
                        <span className="whitespace-nowrap text-[13px] font-bold md:text-[14px]">{item.temperature_c}°C</span>
                      </div>
                    </div>
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
