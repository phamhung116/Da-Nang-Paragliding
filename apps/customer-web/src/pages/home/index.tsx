import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import React, { useMemo } from "react";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { businessInfo } from "@/shared/constants/business";
import { getForecastMonthKeys, getUpcomingWeatherDays, WEATHER_FORECAST_DAYS } from "@/shared/lib/forecast";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { HomeHero } from "@/widgets/hero/home-hero";
import { ServiceCard } from "@/widgets/service-card/service-card";
import { WeatherShowcase } from "@/widgets/weather-showcase/weather-showcase";
import { routes } from "@/shared/config/routes";
import { motion } from 'motion/react';

import { 
  MapPin, 
  ShieldCheck, 
  Camera, 
  Navigation,
  ChevronRight
} from 'lucide-react';

export const HomePage = () => {
  const { data: services = [] } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => customerApi.listServices()
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["home-posts"],
    queryFn: () => customerApi.listPosts()
  });

  const weatherServiceSlug = services[0]?.slug;
  const today = useMemo(() => new Date(), []);
  const forecastMonthKeys = useMemo(() => getForecastMonthKeys(today, WEATHER_FORECAST_DAYS), [today]);
  const forecastQueries = useQueries({
    queries: forecastMonthKeys.map(({ year, month }) => ({
      queryKey: ["home-weather", weatherServiceSlug, year, month],
      queryFn: () => customerApi.getAvailability(weatherServiceSlug ?? "", year, month),
      enabled: Boolean(weatherServiceSlug)
    }))
  });

  const forecast = useMemo(() => forecastQueries.flatMap((query) => query.data ?? []), [forecastQueries]);
  const upcomingForecast = useMemo(() => getUpcomingWeatherDays(forecast, today), [forecast, today]);

  return (
    <SiteLayout>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="space-y-20 pb-20"
      >
        <HomeHero />

        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <img 
              src="https://images.unsplash.com/photo-1544625344-63189df1e401?auto=format&fit=crop&q=80&w=1920" 
              alt="Paragliding Background" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-stone-900/60" />
          </div>
          
          <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="p-6 md:p-12 rounded-[32px] md:rounded-[40px] bg-black/20 backdrop-blur-lg border border-white/10"
            >
              <h2 className="text-emerald-400 font-bold uppercase tracking-[0.2em] text-[10px] md:text-xs mb-3 md:mb-4">Về chúng tôi</h2>
              <p className="text-xl md:text-3xl text-white font-bold leading-tight mb-3 md:mb-4">
                CHINH PHỤC BẦU TRỜI ĐÀ NẴNG
              </p>
              <p className="text-sm md:text-lg text-stone-200 font-medium leading-relaxed max-w-2xl mx-auto mb-6 md:mb-8">
                Chúng tôi là đơn vị hàng đầu cung cấp dịch vụ bay dù lượn đôi tại Đà Nẵng. 
                Với sứ mệnh mang đến trải nghiệm bay an toàn và đầy cảm xúc, 
                chúng tôi đã đồng hành cùng hàng ngàn du khách chinh phục bầu trời Sơn Trà.
              </p>
              <Link to={routes.about} className="btn-primary text-sm md:text-base px-6 py-3 md:px-8 md:py-4">
                Xem chi tiết về chúng tôi
              </Link>
            </motion.div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
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
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card p-3 md:p-8 rounded-2xl md:rounded-3xl flex flex-row lg:flex-col items-center lg:text-center gap-3 md:gap-4 hover:shadow-lg transition-all border border-stone-100"
              >
                <div className="w-10 h-10 md:w-16 md:h-16 bg-brand/10 rounded-xl md:rounded-2xl flex-shrink-0 flex items-center justify-center text-brand">
                  <div className="md:hidden">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 20 })}
                  </div>
                  <div className="hidden md:block">
                    {React.cloneElement(feature.icon as React.ReactElement, { size: 32 })}
                  </div>
                </div>
                <div className="flex flex-col">
                  <h3 className="text-xs md:text-lg font-bold text-stone-900 leading-tight">{feature.title}</h3>
                  <p className="text-stone-500 text-[10px] md:text-sm leading-tight mt-1 hidden md:block">{feature.desc}</p>
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

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4 md:mb-6 text-stone-900">Gói Tour Nổi Bật</h2>
            <p className="text-sm md:text-stone-500 max-w-2xl mx-auto mb-8 md:mb-10">Khám phá các lựa chọn bay dù lượn hàng đầu tại Đà Nẵng, được thiết kế để mang lại trải nghiệm tốt nhất.</p>
          </div>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-10 md:mb-12">
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
              <Button className="btn-secondary flex items-center gap-2 group px-6 py-3 md:px-8 md:py-4 text-sm md:text-base">Xem tất cả các gói</Button>
            </Link>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-0 md:px-4 sm:px-6 lg:px-8 pb-12 md:pb-20">
          <div className="relative aspect-video md:rounded-[40px] overflow-hidden shadow-2xl max-w-5xl mx-auto group">
            <img 
              src="https://images.unsplash.com/photo-1596263576925-d90d63691097?auto=format&fit=crop&q=80&w=1920" 
              alt="Paragliding Video Thumbnail" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
              <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform cursor-pointer">
                <div className="w-0 h-0 border-t-[8px] md:border-t-[12px] border-t-transparent border-l-[14px] md:border-l-[20px] border-l-white border-b-[8px] md:border-b-[12px] border-b-transparent ml-1 md:ml-2" />
              </div>
            </div>
            <div className="absolute bottom-4 left-4 md:bottom-8 md:left-8 text-white text-left">
              <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest mb-1 md:mb-2 opacity-80">Trải nghiệm thực tế</p>
              <h3 className="text-lg md:text-2xl font-bold">Hành trình chinh phục đỉnh Sơn Trà</h3>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
              <div className="max-w-2xl">
                <h2 className="text-3xl md:text-5xl font-bold mb-4 text-stone-900">Tin Tức Mới Nhất</h2>
                <p className="text-sm md:text-base text-stone-500">Cập nhật những thông tin, kinh nghiệm và câu chuyện thú vị về dù lượn.</p>
              </div>
              <Link to="/posts">
                <Button className="text-brand font-bold flex items-center gap-2 hover:gap-4 transition-all group">
                  Xem tất cả bài viết
                  <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>

            {posts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {posts.slice(0, 3).map((post) => (
                  <article key={post.slug} className="group cursor-pointer flex flex-row md:flex-col gap-4 md:gap-0">
                    <div className="w-24 h-24 md:w-full md:h-64 rounded-2xl md:rounded-[32px] overflow-hidden mb-0 md:mb-6 relative flex-shrink-0">
                      <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer"
                        src={post.cover_image} alt={post.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-brand font-bold text-[9px] md:text-[10px] uppercase tracking-widest mb-1 md:mb-2">
                          {new Date(post.published_at ?? post.created_at ?? "").toLocaleDateString("vi-VN")}
                        </p>
                        <h3 className="text-base md:text-xl font-bold text-stone-900 leading-tight group-hover:text-brand transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                      </div>
                    </div>
                    
                  </article>
                ))}
              </div>
            ) : (
              <Card className="empty-state-card">
                <Panel className="stack-sm">
                  <Badge>Bài viết</Badge>
                  <strong>Blog đang được cập nhật.</strong>
                  <p>Khi admin đăng bài mới, khách hàng và pilot sẽ thấy nội dung tại đây.</p>
                </Panel>
              </Card>
            )}

            <div className="section-actions">
              <Link to="/posts">
                <Button variant="secondary">Xem tất cả bài viết</Button>
              </Link>
            </div>
        </section>

      </motion.div>
      
    </SiteLayout>
  );
};
