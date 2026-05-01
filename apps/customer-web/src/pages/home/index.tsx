import React, { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { Camera, ChevronRight, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { routes } from "@/shared/config/routes";
import { businessInfo } from "@/shared/constants/business";
import { formatDate } from "@/shared/lib/format";
import { getForecastMonthKeys, getUpcomingWeatherDays, WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { availabilityQueryOptions, postsQueryOptions, servicesQueryOptions } from "@/shared/lib/query-options";
import { HomeHero } from "@/widgets/hero/home-hero";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { ServiceCard } from "@/widgets/service-card/service-card";
import { WeatherShowcase } from "@/widgets/weather-showcase/weather-showcase";

const toYouTubeEmbedUrl = (value: string) => {
  try {
    const url = new URL(value);
    const directId = url.hostname.includes("youtu.be") ? url.pathname.replace(/^\/+/, "") : "";
    const videoId = directId || url.searchParams.get("v") || "";

    if (!videoId) {
      return value;
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
  } catch {
    return value;
  }
};

export const HomePage = () => {
  const video1YoutubeWatchUrl = "https://www.youtube.com/watch?v=r8uhrlAQ-Tk";
  const video1YoutubeEmbedUrl = toYouTubeEmbedUrl(video1YoutubeWatchUrl);
  const { data: services = [] } = useQuery({
    ...servicesQueryOptions()
  });
  const { data: posts = [] } = useQuery({
    ...postsQueryOptions()
  });

  const weatherServiceSlug = services[0]?.slug;
  const today = useMemo(() => new Date(), []);
  const forecastMonthKeys = useMemo(() => getForecastMonthKeys(today, WEATHER_FORECAST_DAYS), [today]);
  const forecastQueries = useQueries({
    queries: forecastMonthKeys.map(({ year, month }) => ({
      ...availabilityQueryOptions(weatherServiceSlug ?? "", year, month),
      enabled: Boolean(weatherServiceSlug)
    }))
  });

  const forecast = useMemo(() => forecastQueries.flatMap((query) => query.data ?? []), [forecastQueries]);
  const upcomingForecast = useMemo(() => getUpcomingWeatherDays(forecast, today), [forecast, today]);

  return (
    <SiteLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-20 pb-20">
        <HomeHero />

        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 z-0">
            <img
              src="/media/img/tour-bay-du-luon-tu-do-paragliding-hon-en-nha-trang-1.webp"
              alt="Phông nền dù lượn"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-stone-900/60" />
          </div>

          <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-[32px] border border-white/10 bg-black/20 p-6 backdrop-blur-lg md:rounded-[40px] md:p-12"
            >
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 md:mb-4 md:text-xs">
                Về chúng tôi
              </h2>
              <p className="mb-3 text-xl font-bold leading-tight text-white md:mb-4 md:text-3xl">
                CHINH PHỤC BẦU TRỜI ĐÀ NẴNG
              </p>
              <p className="mx-auto mb-6 max-w-2xl text-sm font-medium leading-relaxed text-stone-200 md:mb-8 md:text-lg">
                Chúng tôi là đơn vị hàng đầu cung cấp dịch vụ bay dù lượn đôi tại Đà Nẵng. Với sứ mệnh mang đến trải
                nghiệm bay an toàn và đầy cảm xúc, chúng tôi đã đồng hành cùng hàng ngàn du khách chinh phục bầu trời
                Sơn Trà.
              </p>
              <Link to={routes.gallery} className="btn-primary px-6 py-3 text-sm md:px-8 md:py-4 md:text-base">
                Xem chi tiết về chúng tôi
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-3 md:gap-6 lg:grid-cols-4">
            {[
              {
                icon: <Navigation size={24} />,
                title: "Phi công chuyên nghiệp",
                desc: "Đội ngũ phi công có hàng ngàn giờ bay."
              },
              {
                icon: <MapPin size={24} />,
                title: "Miễn phí trung chuyển",
                desc: "Xe đưa đón tận nơi từ điểm tập kết."
              },
              {
                icon: <Camera size={24} />,
                title: "Lưu giữ khoảnh khắc",
                desc: "Quay video GoPro 4K và Flycam."
              },
              {
                icon: <ShieldCheck size={24} />,
                title: "Đảm bảo an toàn",
                desc: "Trang thiết bị hiện đại, bảo hiểm 100tr."
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card flex flex-row items-center gap-3 rounded-2xl border border-stone-100 p-3 transition-all hover:shadow-lg md:gap-4 md:rounded-3xl md:p-8 lg:flex-col lg:text-center"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand md:h-16 md:w-16 md:rounded-2xl">
                  <div className="md:hidden">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 20 })}
                  </div>
                  <div className="hidden md:block">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs font-bold leading-tight text-stone-900 md:text-lg">{feature.title}</h3>
                  <p className="mt-1 hidden text-[10px] leading-tight text-stone-500 md:block md:text-sm">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="section section--tight-top">
          <Container className="stack">
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
          </Container>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="mb-4 text-3xl font-bold text-stone-900 md:mb-6 md:text-5xl">Gói Tour Nổi Bật</h2>
            <p className="mx-auto mb-8 max-w-2xl text-sm md:mb-10 md:text-stone-500">
              Khám phá các lựa chọn bay dù lượn hàng đầu tại Đà Nẵng, được thiết kế để mang lại trải nghiệm tốt nhất.
            </p>
          </div>
          {services.length > 0 ? (
            <div className="mb-10 grid grid-cols-1 gap-6 md:mb-12 md:grid-cols-3 md:gap-8">
              {services.map((item) => (
                <ServiceCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge tone="danger">Tạm thời chưa mở bán</Badge>
                <strong>Hiện tại chưa có gói dịch vụ hoạt động để hiển thị.</strong>
                <p>Hãy liên hệ {businessInfo.phone} để được tư vấn lịch bay phù hợp.</p>
              </Panel>
            </Card>
          )}
          <div className="flex justify-center">
            <Link to="/services">
              <Button className="btn-secondary group flex items-center gap-2 px-6 py-3 text-sm md:px-8 md:py-4 md:text-base">
                Xem tất cả các gói
              </Button>
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-0 pb-12 md:px-4 md:pb-20 sm:px-6 lg:px-8">
          <div className="group relative mx-auto aspect-video max-w-5xl overflow-hidden shadow-2xl md:rounded-[40px]">
            <iframe
              src={video1YoutubeEmbedUrl}
              title="Video trải nghiệm dù lượn"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
              className="h-full w-full transition-transform duration-700 group-hover:scale-105"
            />
            <a
              href={video1YoutubeWatchUrl}
              target="_blank"
              rel="noreferrer"
              className="absolute bottom-4 right-4 rounded-full bg-black/55 px-4 py-2 text-xs font-bold text-white backdrop-blur md:bottom-8 md:right-8"
            >
              Xem trên YouTube
            </a>
            <div className="absolute bottom-4 left-4 text-left text-white md:bottom-8 md:left-8">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80 md:mb-2 md:text-xs">
                Trải nghiệm thực tế
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-stone-900 md:text-5xl">Tin Tức Mới Nhất</h2>
              <p className="text-sm text-stone-500 md:text-base">
                Cập nhật những thông tin, kinh nghiệm và câu chuyện thú vị về dù lượn.
              </p>
            </div>
            <Link to="/posts">
              <Button className="group flex items-center gap-2 font-bold text-white transition-all hover:gap-4 hover:text-white">
                Xem tất cả bài viết
                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {posts.slice(0, 3).map((post) => (
                <article key={post.slug} className="group flex cursor-pointer flex-row gap-4 md:flex-col md:gap-0">
                  <div className="relative mb-0 h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl md:mb-6 md:h-64 md:w-full md:rounded-[32px]">
                    <img
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      src={post.cover_image}
                      alt={post.title}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-brand md:mb-2 md:text-[10px]">
                      {formatDate(post.published_at ?? post.created_at ?? "")}
                    </p>
                    <h3 className="line-clamp-2 text-base font-bold leading-tight text-stone-900 transition-colors group-hover:text-brand md:text-xl">
                      {post.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Bài viết</Badge>
                <strong>Blog đang được cập nhật.</strong>
                <p>Khi quản trị viên đăng bài mới, khách hàng và phi công sẽ thấy nội dung tại đây.</p>
              </Panel>
            </Card>
          )}
        </section>
      </motion.div>
    </SiteLayout>
  );
};
