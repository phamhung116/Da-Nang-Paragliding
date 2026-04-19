import { Badge } from "@paragliding/ui";
import type { AvailabilityDay } from "@paragliding/api-client";
import { WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { useEffect, useMemo, useState } from "react";

import { 
  Wind, 
  ShieldCheck, 
  Clock,
  Sun,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
} from 'lucide-react';

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

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className={`${isDark ? 'bg-stone-900 text-white' : 'bg-white text-stone-900 border border-stone-100'} rounded-[32px] md:rounded-[40px] overflow-hidden shadow-2xl flex flex-col lg:flex-row`}>
        {/* Today's Weather */}
        <div className={`lg:w-1/2 p-6 md:p-12 border-b lg:border-b-0 lg:border-r ${isDark ? 'border-white/10' : 'border-stone-100'}`}>
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 md:mb-10 gap-4">
            <div>
              <h2 className="text-xl md:text-3xl font-bold mb-1 md:mb-2">Thời tiết hôm nay</h2>
              <p className={`${isDark ? 'text-stone-400' : 'text-stone-500'} text-sm md:text-base hidden md:block`}>
                {new Date(today.date).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  day: "2-digit",
                  month: "2-digit"
                })}
              </p>
            </div>
            <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1.5 md:px-4 md:py-2 rounded-full text-[10px] md:text-sm font-bold border border-emerald-500/30">
              <Badge tone={getWeatherTone(today.flight_condition)}>Điều kiện bay: {today.flight_condition}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 md:gap-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${isDark ? 'bg-white/5' : 'bg-stone-50'} rounded-xl flex items-center justify-center text-brand-light`}>
                <Wind size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[10px] md:text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'} uppercase tracking-wider`}>Sức gió</p>
                <p className="text-base md:text-xl font-bold">{today.wind_kph} km/h</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${isDark ? 'bg-white/5' : 'bg-stone-50'} rounded-xl flex items-center justify-center text-orange-400`}>
                <Sun size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[10px] md:text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'} uppercase tracking-wider`}>Chỉ số UV</p>
                <p className="text-base md:text-xl font-bold">{today.uv_index}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${isDark ? 'bg-white/5' : 'bg-stone-50'} rounded-xl flex items-center justify-center text-blue-400`}>
                <Clock size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[10px] md:text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'} uppercase tracking-wider`}>Nhiệt độ</p>
                <p className="text-base md:text-xl font-bold">{today.temperature_c}°C</p>
              </div>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
              <div className={`w-10 h-10 md:w-12 md:h-12 ${isDark ? 'bg-white/5' : 'bg-stone-50'} rounded-xl flex items-center justify-center text-yellow-400`}>
                <ShieldCheck size={20} className="md:w-6 md:h-6" />
              </div>
              <div>
                <p className={`text-[10px] md:text-xs ${isDark ? 'text-stone-400' : 'text-stone-500'} uppercase tracking-wider`}>Tầm nhìn</p>
                <p className="text-base md:text-xl font-bold">&gt;{today.visibility_km} km</p>
              </div>
            </div>
          </div>

          <div className={`mt-6 md:mt-10 p-3 md:p-6 ${isDark ? 'bg-white/5 border-white/5' : 'bg-stone-50 border-stone-100'} rounded-2xl border flex items-center gap-4 md:gap-6`}>
             <div className="text-2xl md:text-5xl font-bold">{today.temperature_c}°C</div>
             <div className="flex flex-col">
               <span className="text-sm md:text-lg font-medium">{today.weather_condition || "Đang cập nhật"}</span>
               <span className={`${isDark ? 'text-stone-400' : 'text-stone-500'} text-[10px] md:text-sm`}>
                 Tam nhin: {today.visibility_km} km
               </span>
             </div>
             <Sun size={24} className="ml-auto text-yellow-400 md:w-12 md:h-12" />
          </div>
        </div>

        {/* 14-Day Summary */}
        <div className={`lg:w-1/2 p-6 md:p-12 ${isDark ? 'bg-stone-800/30' : 'bg-stone-50/50'}`}>
          <div 
            className="flex items-center justify-between mb-6 md:mb-8 cursor-pointer md:cursor-default"
            onClick={() => setIsForecastOpen(!isForecastOpen)}
          >
            <h3 className="text-lg md:text-xl font-bold">Dự báo thời tiết</h3>
            <ChevronDown 
              size={20} 
              className={`md:hidden transition-transform duration-300 ${isForecastOpen ? 'rotate-180' : ''} text-stone-400`} 
            />
          </div>
          
          <div className={`${isForecastOpen ? 'max-h-[1000px] opacity-100 mt-0' : 'max-h-0 opacity-0 -mt-4'} md:max-h-none md:opacity-100 md:mt-0 overflow-hidden transition-all duration-500 space-y-3 md:space-y-4`}>
            {visibleForecast.map((item) => (
              <article key={item.date} className={`flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-xl ${isDark ? 'hover:bg-white/5' : 'hover:bg-stone-100'} transition-colors`}>
                <span className="w-14 md:w-16 font-medium text-[10px] md:text-sm">
                  {new Date(item.date).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      day: "2-digit",
                      month: "2-digit"
                    })}
                </span>
                <Badge tone={getWeatherTone(item.flight_condition)}>{item.flight_condition}</Badge>
                <div className="flex-1 grid grid-cols-3 gap-1 md:gap-2">
                  <div className="flex items-center gap-1">
                    <Wind size={10} className="text-stone-400" />
                    <span className="text-[9px] md:text-[11px] font-bold">{item.wind_kph} km/h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sun size={10} className="text-stone-400" />
                    <span className="text-[9px] md:text-[11px] font-bold">{item.uv_index}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye size={10} className="text-stone-400" />
                    <span className="text-[9px] md:text-[11px] font-bold">{item.visibility_km} km</span>
                  </div>
                </div>

                <span className="font-bold text-[10px] md:text-sm">{item.temperature_c}°C</span>
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
    </section>
  );
};
