import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { getForecastMonthKeys, getUpcomingWeatherDays, WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
import { WeatherShowcase } from "@/widgets/weather-showcase/weather-showcase";
import { motion } from "motion/react";

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
  const galleryImages = useMemo(
    () =>
      services
        .flatMap((service) => [service.hero_image, ...service.gallery_images])
        .filter(Boolean)
        .slice(0, 6),
    [services]
  );

  if (!data) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Đang tải bài viết...</Container>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pb-20"
      > 
        <Banner 
          title={data.title} 
          subtitle={new Date(data.published_at ?? data.created_at ?? "").toLocaleDateString("vi-VN")}
          image={data.cover_image}
        />

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <Container className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="prose prose-stone max-w-none">
                <div className="mb-8 overflow-hidden rounded-[32px] shadow-xl">
                  <img 
                    src={data.cover_image} 
                    alt={data.title} 
                    className="w-full aspect-video object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <h2 className="text-3xl font-bold text-stone-900 mb-6 leading-tight">{data.title}</h2>
                <div className="text-stone-600 leading-relaxed space-y-6 text-lg">
                  {data.content.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-12">
              <Card>
                <Panel className="stack-sm">
                  <div className="post-sidebar-head">
                    <div>
                      <Badge>Bộ sưu tập</Badge>
                      <h3>Hình ảnh nổi bật</h3>
                    </div>
                    <Link to="/gallery">Xem tất cả</Link>
                  </div>
                  <div className="post-gallery-strip">
                    {galleryImages.map((image) => (
                      <img key={image} src={image} alt="Da Nang Paragliding gallery" referrerPolicy="no-referrer" />
                    ))}
                  </div>
                </Panel>
              </Card>

              {upcomingForecast.length > 0 ? (
                <WeatherShowcase days={upcomingForecast} />
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
