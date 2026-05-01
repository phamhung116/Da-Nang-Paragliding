import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import type { Post } from "@paragliding/api-client";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { Camera, ChevronRight, MapPin, Navigation, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { routes } from "@/shared/config/routes";
import { businessInfo } from "@/shared/constants/business";
import { formatDate } from "@/shared/lib/format";
import { getForecastMonthKeys, getUpcomingWeatherDays, WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { localizePostTitle } from "@/shared/lib/localized-content";
import { availabilityQueryOptions, postsQueryOptions, servicesQueryOptions } from "@/shared/lib/query-options";
import { useTranslatedText } from "@/shared/lib/use-translated-text";
import { useI18n } from "@/shared/providers/i18n-provider";
import { HomeHero } from "@/widgets/hero/home-hero";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { ServiceCard } from "@/widgets/service-card/service-card";
import { WeatherShowcase } from "@/widgets/weather-showcase/weather-showcase";

const homeFeatures = [
  {
    icon: <Navigation size={24} />,
    title: "Phi công chuyên nghiệp",
    desc: "Đội ngũ phi công 500+ giờ bay thực tế tại Sơn Trà, đồng hành an toàn trong suốt hành trình.",
    image: "/media/img/anh24.jpg"
  },
  {
    icon: <MapPin size={24} />,
    title: "Miễn phí trung chuyển",
    desc: "Đón tận nơi trong nội thành Đà Nẵng và đưa đến điểm bay để bạn không phải lo di chuyển.",
    image: "/media/img/anh2.jpg"
  },
  {
    icon: <Camera size={24} />,
    title: "Lưu giữ khoảnh khắc",
    desc: "Quay video GoPro 4K, chụp ảnh flycam và lưu lại trọn vẹn chuyến bay đáng nhớ.",
    image: "/media/img/anh15.jpg"
  },
  {
    icon: <ShieldCheck size={24} />,
    title: "Đảm bảo an toàn",
    desc: "Trang bị hiện đại, quy trình kiểm tra kỹ lưỡng và bảo hiểm cho từng khách hàng.",
    image: "/media/img/anh6.jpg"
  }
];

const toYouTubeEmbedUrl = (value: string) => {
  try {
    const url = new URL(value);
    const directId = url.hostname.includes("youtu.be") ? url.pathname.replace(/^\/+/, "") : "";
    const videoId = directId || url.searchParams.get("v") || "";

    if (!videoId) {
      return value;
    }

    return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1`;
  } catch {
    return value;
  }
};

const HomePostPreview = ({ post }: { post: Post }) => {
  const { locale } = useI18n();
  const sourceTitle = localizePostTitle(post, locale);
  const title = useTranslatedText(sourceTitle);

  return (
    <Link to={`/posts/${post.slug}`}>
      <article key={post.slug} className="group flex cursor-pointer flex-row gap-4 md:flex-col md:gap-0">
        <div className="relative mb-0 h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl md:mb-6 md:h-64 md:w-full md:rounded-[32px]">
          <img
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            referrerPolicy="no-referrer"
            src={post.cover_image}
            alt={title}
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
        <div className="flex flex-1 flex-col justify-center">
          <p className="mb-1 text-[9px] font-bold uppercase tracking-widest text-brand md:mb-2 md:text-[10px]">
            {formatDate(post.published_at ?? post.created_at ?? "", undefined, locale)}
          </p>
          <h3 className="line-clamp-2 text-base font-bold leading-tight text-stone-900 transition-colors group-hover:text-brand md:text-xl">
            {title}
          </h3>
        </div>
      </article>
    </Link>
  );
};

export const HomePage = () => {
  const { tText } = useI18n();
  const videoSectionRef = useRef<HTMLDivElement | null>(null);
  const [videoInView, setVideoInView] = useState(false);
  const video1YoutubeWatchUrl = "https://www.youtube.com/watch?v=r8uhrlAQ-Tk";
  const video1YoutubeEmbedUrl = useMemo(() => {
    const baseUrl = toYouTubeEmbedUrl(video1YoutubeWatchUrl);
    return videoInView ? baseUrl : baseUrl.replace("&autoplay=1", "&autoplay=0");
  }, [video1YoutubeWatchUrl, videoInView]);
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

  useEffect(() => {
    if (!videoSectionRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setVideoInView(entry.isIntersecting && entry.intersectionRatio >= 0.6);
      },
      {
        threshold: [0, 0.25, 0.6, 1]
      }
    );

    observer.observe(videoSectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <SiteLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-20 pb-20">
        <HomeHero />

        <section className="relative overflow-hidden py-20">
          <div className="absolute inset-0 z-0">
            <img
              src="/media/img/tour-bay-du-luon-tu-do-paragliding-hon-en-nha-trang-1.webp"
              alt={tText("Phông nền dù lượn")}
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
              <h2 className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400 md:mb-4 md:text-xs">{tText("Về chúng tôi")}</h2>
              <p className="mb-3 text-xl font-bold leading-tight text-white md:mb-4 md:text-3xl">{tText("CHINH PHỤC BẦU TRỜI ĐÀ NẴNG")}</p>
              <p className="mx-auto mb-6 max-w-2xl text-sm font-medium leading-relaxed text-stone-200 md:mb-8 md:text-lg">
                {tText("Chúng tôi là đơn vị hàng đầu cung cấp dịch vụ bay dù lượn đôi tại Đà Nẵng. Với sứ mệnh mang đến trải nghiệm bay an toàn và đầy cảm xúc, chúng tôi đã đồng hành cùng hàng ngàn du khách chinh phục bầu trời Sơn Trà.")}
              </p>
              <Link to={routes.gallery} className="btn-primary px-6 py-3 text-sm md:px-8 md:py-4 md:text-base">
                {tText("Xem chi tiết về chúng tôi")}
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="relative bg-[#091a2f] pb-24 pt-10 md:pb-28 md:pt-14">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {homeFeatures.map((feature, index) => (
                <motion.article
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[24px] border border-white/10 bg-[#0d1f35] shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:-translate-y-1"
                >
                  <div className="relative px-4 pt-4">
                    <div className="relative h-40 overflow-hidden rounded-[20px] md:h-44">
                      <img
                        src={feature.image}
                        alt={tText(feature.title)}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0d1f35] via-[#0d1f35]/10 to-transparent" />
                    </div>
                    <div className="absolute -bottom-6 left-8 z-10 flex h-14 w-14 items-center justify-center rounded-full border-4 border-[#0d1f35] bg-[#b63c2f] text-white shadow-lg">
                      {React.cloneElement(feature.icon as React.ReactElement, { size: 24 })}
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-10 text-white">
                    <h3 className="text-lg font-bold leading-tight">{tText(feature.title)}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{tText(feature.desc)}</p>
                  </div>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="-mt-14 section section--tight-top md:-mt-20">
          <Container className="stack">
            {upcomingForecast.length > 0 ? (
              <WeatherShowcase days={upcomingForecast} />
            ) : (
              <Card className="empty-state-card">
                <Panel className="stack-sm">
                  <Badge tone="danger">{tText("Chưa có dữ liệu thời tiết")}</Badge>
                  <strong>{tText("Hệ thống đang chờ dữ liệu dự báo cho tháng này.")}</strong>
                  <p>{tText("Bạn vẫn có thể xem danh sách gói bay và quay lại sau để chọn lịch phù hợp.")}</p>
                </Panel>
              </Card>
            )}
          </Container>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          <div className="mb-10 text-center md:mb-12">
            <h2 className="mb-4 text-3xl font-bold text-stone-900 md:mb-6 md:text-5xl">{tText("Gói Tour Nổi Bật")}</h2>
            <p className="mx-auto mb-8 max-w-2xl text-sm md:mb-10 md:text-stone-500">
              {tText("Khám phá các lựa chọn bay dù lượn hàng đầu tại Đà Nẵng, được thiết kế để mang lại trải nghiệm tốt nhất.")}
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
                <Badge tone="danger">{tText("Tạm thời chưa mở bán")}</Badge>
                <strong>{tText("Hiện tại chưa có gói dịch vụ hoạt động để hiển thị.")}</strong>
                <p>{tText("Hãy liên hệ")} {businessInfo.phone} {tText("để được tư vấn lịch bay phù hợp.")}</p>
              </Panel>
            </Card>
          )}
          <div className="flex justify-center">
            <Link to={routes.services}>
              <Button className="btn-secondary group flex items-center gap-2 px-6 py-3 text-sm md:px-8 md:py-4 md:text-base">
                {tText("Xem tất cả các gói")}
              </Button>
            </Link>
          </div>
        </section>

        <section ref={videoSectionRef} className="mx-auto max-w-[96rem] px-0 pb-12 sm:px-4 md:px-6 md:pb-20 lg:px-8">
          <div className="group relative mx-auto aspect-video max-w-7xl overflow-hidden shadow-2xl md:rounded-[40px]">
            <iframe
              src={video1YoutubeEmbedUrl}
              title={tText("Video trải nghiệm dù lượn")}
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
              {tText("Xem trên YouTube")}
            </a>
            <div className="absolute bottom-4 left-4 text-left text-white md:bottom-8 md:left-8">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-widest opacity-80 md:mb-2 md:text-xs">{tText("Trải nghiệm thực tế")}</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 flex flex-col items-end justify-between gap-6 md:flex-row">
            <div className="max-w-2xl">
              <h2 className="mb-4 text-3xl font-bold text-stone-900 md:text-5xl">{tText("Tin Tức Mới Nhất")}</h2>
              <p className="text-sm text-stone-500 md:text-base">{tText("Cập nhật những thông tin, kinh nghiệm và câu chuyện thú vị về dù lượn.")}</p>
            </div>
            <Link to={routes.posts}>
              <Button className="group flex items-center gap-2 font-bold text-white transition-all hover:gap-4 hover:text-white">
                {tText("Xem tất cả bài viết")}
                <ChevronRight size={20} className="transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {posts.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
              {posts.slice(0, 3).map((post) => (
                <HomePostPreview key={post.slug} post={post} />
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>{tText("Bài viết")}</Badge>
                <strong>{tText("Blog đang được cập nhật.")}</strong>
                <p>{tText("Khi quản trị viên đăng bài mới, khách hàng và phi công sẽ thấy nội dung tại đây.")}</p>
              </Panel>
            </Card>
          )}
        </section>
      </motion.div>
    </SiteLayout>
  );
};
