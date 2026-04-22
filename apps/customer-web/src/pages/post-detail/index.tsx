import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Clock, Eye, Sun, Wind } from "lucide-react";
import { Badge, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { formatDate } from "@/shared/lib/format";
import { getForecastMonthKeys, getUpcomingWeatherDays, WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { localizePostContent, localizePostTitle, repairFlightConditionLabel } from "@/shared/lib/localized-content";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { motion } from "motion/react";

const POST_SIDEBAR_GALLERY_IMAGES = Array.from({ length: 8 }, (_, index) => `/media/img/anh${index + 1}.jpg`);

const getWeatherIcon = (windKph: number, visibilityKm: number) => {
  if (windKph >= 20) {
    return <Wind size={16} className="text-blue-300" />;
  }

  if (visibilityKm <= 8) {
    return <Clock size={16} className="text-stone-400" />;
  }

  return <Sun size={16} className="text-yellow-400" />;
};

export const PostDetailPage = () => {
  const { slug = "" } = useParams();
  const { data } = useQuery({
    queryKey: ["post", slug],
    queryFn: () => customerApi.getPost(slug),
    enabled: Boolean(slug)
  });

  const { data: services = [] } = useQuery({
    queryKey: ["post-detail-services"],
    queryFn: () => customerApi.listServices()
  });
  const weatherServiceSlug = services[0]?.slug;
  const today = useMemo(() => new Date(), []);
  const forecastMonthKeys = useMemo(() => getForecastMonthKeys(today, WEATHER_FORECAST_DAYS), [today]);
  const forecastQueries = useQueries({
    queries: forecastMonthKeys.map(({ year, month }) => ({
      queryKey: ["post-detail-weather", weatherServiceSlug, year, month],
      queryFn: () => customerApi.getAvailability(weatherServiceSlug ?? "", year, month),
      enabled: Boolean(weatherServiceSlug)
    }))
  });

  const forecast = useMemo(() => forecastQueries.flatMap((query) => query.data ?? []), [forecastQueries]);
  const upcomingForecast = useMemo(() => getUpcomingWeatherDays(forecast, today), [forecast, today]);
  const todayWeather = upcomingForecast[0];
  const weatherRows = upcomingForecast.slice(0, 7);

  if (!data) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Đang tải bài viết...</Container>
        </section>
      </SiteLayout>
    );
  }

  const postTitle = localizePostTitle(data);
  const postContent = localizePostContent(data);

  return (
    <SiteLayout>
      <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20"
      > 
        <Banner 
          title={postTitle} 
          subtitle={formatDate(data.published_at ?? data.created_at ?? "")}
          image={data.cover_image}
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <Container className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose prose-stone max-w-none">
                <div className="mb-8 overflow-hidden rounded-[32px] shadow-xl">
                  <img 
                    src={data.cover_image} 
                    alt={postTitle} 
                    className="w-full aspect-video object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-3xl font-bold text-stone-900 mb-6 leading-tight">{postTitle}</h2>
                <div
                  className="post-detail__content text-stone-600 leading-relaxed space-y-6 text-lg"
                  dangerouslySetInnerHTML={{ __html: postContent }}
                />
              </div>
            </div>
            <div className="space-y-12">
              <Card>
                <Panel className="stack-sm">
                  <div className="post-sidebar-head">
                    <div>
                      <Badge>Bộ sưu tập</Badge>
                    </div>
                    <Link to="/gallery">Xem tất cả</Link>
                  </div>
                  <div className="post-gallery-strip">
                    {POST_SIDEBAR_GALLERY_IMAGES.map((image) => (
                      <img key={image} src={image} alt="Da Nang Paragliding gallery" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                </Panel>
              </Card>

              {todayWeather ? (
                <section className="bg-stone-900 rounded-[32px] p-8 text-white shadow-xl">
                  <div className="flex items-center justify-between mb-8 gap-4">
                    <h3 className="text-lg font-bold">Thời tiết hôm nay</h3>
                    <div className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-500/30">
                      Bay: {repairFlightConditionLabel(todayWeather.flight_condition)}
                    </div>
                  </div>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="text-4xl font-bold">{todayWeather.temperature_c}°C</div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{todayWeather.weather_condition || "Trời nắng nhẹ"}</span>
                      <span className="text-stone-400 text-xs">Độ ẩm: --</span>
                    </div>
                    <Sun size={32} className="ml-auto text-yellow-400" />
                  </div>

                  <div className="space-y-3">
                    {weatherRows.map((item) => (
                      <div
                        key={item.date}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors"
                      >
                        <span className="w-10 font-medium text-[10px]">
                          {formatDate(item.date, { weekday: "short" })}
                        </span>

                        <div className="flex items-center gap-1.5 w-12">
                          {getWeatherIcon(item.wind_kph, item.visibility_km)}
                        </div>

                        <div className="flex-1 grid grid-cols-3 gap-1">
                          <div className="flex items-center gap-1">
                            <Wind size={10} className="text-stone-400" />
                            <span className="text-[9px] font-bold">{item.wind_kph}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Sun size={10} className="text-stone-400" />
                            <span className="text-[9px] font-bold">{item.uv_index}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye size={10} className="text-stone-400" />
                            <span className="text-[9px] font-bold">{item.visibility_km}</span>
                          </div>
                        </div>

                        <span className="font-bold text-[10px]">{item.temperature_c}°C</span>
                      </div>
                    ))}
                  </div>
                </section>
              ) : (
                <Card className="empty-state-card">
                  <Panel className="stack-sm">
                    <Badge tone="danger">Chưa có dữ liệu thời tiết</Badge>
                    <strong>Hệ thống đang chờ dữ liệu dự báo cho tháng này.</strong>
                    <p>Bạn vẫn có thể xem danh sách gói bay và quay lại sau để chọn lịch phù hợp.</p>
                  </Panel>
                </Card>
              )}
            </div>
          </Container>
        </section>
      </motion.div>
    </SiteLayout>
  );
};
