import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
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
  const { data: forecast = [] } = useQuery({
    queryKey: ["post-detail-weather", weatherServiceSlug, today.getFullYear(), today.getMonth() + 1],
    queryFn: () => customerApi.getAvailability(weatherServiceSlug ?? "", today.getFullYear(), today.getMonth() + 1),
    enabled: Boolean(weatherServiceSlug)
  });

  const upcomingForecast = forecast
    .filter((item) => item.weather_available && new Date(item.date) >= new Date(new Date().toDateString()))
    .slice(0, 7);
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
          <Container>Dang tai bai viet...</Container>
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
                      <Badge>Bo suu tap</Badge>
                      <h3>Hinh anh noi bat</h3>
                    </div>
                    <Link to="/gallery">Xem tat ca</Link>
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
                    <Badge tone="danger">Chua co du lieu weather</Badge>
                    <strong>He thong dang cho du lieu forecast cho thang nay.</strong>
                    <p>Ban van co the xem danh sach goi bay va quay lai sau de chon lich phu hop.</p>
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
