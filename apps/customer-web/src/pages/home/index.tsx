import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { businessInfo } from "@/shared/constants/business";
import { customerExperienceSteps, customerFaqs } from "@/shared/constants/customer-content";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { HomeHero } from "@/widgets/hero/home-hero";
import { ServiceCard } from "@/widgets/service-card/service-card";
import { WeatherShowcase } from "@/widgets/weather-showcase/weather-showcase";

const valueProps = [
  {
    title: "Lich dat de theo doi",
    description: "Khach xem tung khung gio trong, weather theo gio va chon lich ngay tren mot bo cuc ro rang."
  },
  {
    title: "Thong tin gia minh bach",
    description: "Moi goi bay hien ro gia, thoi luong, diem cat canh va dieu kien tham gia truoc khi dat."
  },
  {
    title: "Theo doi sau dat lich",
    description: "Chi can email hoac so dien thoai de xem lai booking, timeline va vi tri GPS."
  },
  {
    title: "Dat lich va thanh toan gon",
    description: "Luot dat lich, dat coc QR va theo doi booking duoc gom lai thanh mot flow de hieu."
  }
];

const experienceGallery = [
  "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1200&q=80"
];

export const HomePage = () => {
  const { data: services = [] } = useQuery({
    queryKey: ["featured-services"],
    queryFn: () => customerApi.listServices(true)
  });
  const { data: posts = [] } = useQuery({
    queryKey: ["home-posts"],
    queryFn: () => customerApi.listPosts()
  });

  const weatherServiceSlug = services[0]?.slug;
  const today = new Date();
  const { data: forecast = [] } = useQuery({
    queryKey: ["home-weather", weatherServiceSlug, today.getFullYear(), today.getMonth() + 1],
    queryFn: () => customerApi.getAvailability(weatherServiceSlug ?? "", today.getFullYear(), today.getMonth() + 1),
    enabled: Boolean(weatherServiceSlug)
  });

  const upcomingForecast = forecast
    .filter((item) => item.weather_available && new Date(item.date) >= new Date(new Date().toDateString()))
    .slice(0, 7);

  return (
    <SiteLayout>
      <HomeHero />

      <section className="section section--tight-top">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>Weather outlook</Badge>
              <h2>Thoi tiet hom nay va 7 ngay toi</h2>
            </div>
            <p>
              Khach co the theo doi nhanh tinh hinh nhiet do, gio, UV va dieu kien bay truoc khi chon lich.
            </p>
          </div>
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
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>Goi dich vu</Badge>
              <h2>Nhung chuyen bay duoc thiet ke cho trai nghiem that su ro rang.</h2>
            </div>
            <p>
              Moi goi deu co thong tin gia, thoi luong, lich dat va note an toan de khach de dang so sanh.
            </p>
          </div>
          {services.length > 0 ? (
            <div className="package-grid">
              {services.map((item) => (
                <ServiceCard key={item.id} item={item} />
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge tone="danger">Tam thoi chua mo ban</Badge>
                <strong>Hien tai chua co goi dich vu active de hien thi.</strong>
                <p>Hay lien he {businessInfo.phone} de duoc tu van lich bay phu hop.</p>
              </Panel>
            </Card>
          )}
          <div className="section-actions">
            <Link to="/services">
              <Button variant="secondary">Xem toan bo goi bay</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="section section--dark-band">
        <Container className="value-grid">
          <div className="value-grid__lead">
            <Badge tone="success">Why SkyNest</Badge>
            <h2>Mot front end co cau truc production-ready cho khach hang dat lich thuc te.</h2>
            <p>
              Hinh lon, typography de doc, card bo tron ro rang va trang thai booking duoc hien thi theo mot
              flow khong bi dut doan.
            </p>
          </div>
          {valueProps.map((item) => (
            <article className="value-card" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.description}</p>
            </article>
          ))}
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>How it works</Badge>
              <h2>Luot dat lich cua customer duoc chia thanh 4 buoc de theo doi de hon.</h2>
            </div>
            <p>Phan nay giup user moi vao web van hieu ngay tu luc chon goi den luc theo doi hanh trinh.</p>
          </div>
          <div className="info-grid">
            {customerExperienceSteps.map((item) => (
              <Card key={item.title} className="info-card">
                <Panel className="stack-sm">
                  <strong>{item.title}</strong>
                  <p>{item.description}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="section">
        <Container className="experience-strip">
          <div className="experience-strip__copy">
            <Badge>Experience flow</Badge>
            <h2>Tu luc xem lich, dat cho den tracking deu giu mot giong visual va nguyen tac hien thi.</h2>
            <p>
              Front end uu tien bo cuc that su dung duoc: thong tin nao quan trong se nam o vung dau, hinh
              anh deu ti le, action ro rang, khong de page trong.
            </p>
            <div className="experience-gallery">
              {experienceGallery.map((image) => (
                <img key={image} src={image} alt="Paragliding experience" />
              ))}
            </div>
          </div>
          <div className="experience-strip__media">
            <img
              src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
              alt="Golden hour flight"
            />
          </div>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>Bai viet moi</Badge>
              <h2>Noi dung huong dan, kinh nghiem va thong bao van hanh.</h2>
            </div>
            <p>User co the doc bai viet de biet them ve weather, chuan bi truoc bay va cac update moi.</p>
          </div>

          {posts.length > 0 ? (
            <div className="post-grid">
              {posts.slice(0, 3).map((post) => (
                <article key={post.slug} className="post-card ui-card">
                  <img className="post-card__image" src={post.cover_image} alt={post.title} />
                  <div className="ui-panel post-card__body">
                    <Badge>{new Date(post.published_at ?? post.created_at ?? "").toLocaleDateString("vi-VN")}</Badge>
                    <h3>{post.title}</h3>
                    <p>{post.excerpt}</p>
                    <Link to={`/posts/${post.slug}`}>
                      <Button variant="secondary">Doc bai viet</Button>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Bai viet</Badge>
                <strong>Blog dang duoc cap nhat.</strong>
                <p>Khi admin dang bai moi, user va pilot se thay noi dung tai day.</p>
              </Panel>
            </Card>
          )}

          <div className="section-actions">
            <Link to="/posts">
              <Button variant="secondary">Xem tat ca bai viet</Button>
            </Link>
          </div>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>FAQ nhanh</Badge>
              <h2>Nhung cau hoi khach hang hay quan tam truoc khi dat lich.</h2>
            </div>
            <p>Phan hoi nhanh de khach khong can roi trang de tim chinh sach co ban.</p>
          </div>
          <div className="faq-grid">
            {customerFaqs.map((item) => (
              <Card key={item.question} className="faq-card">
                <Panel className="stack-sm">
                  <strong>{item.question}</strong>
                  <p>{item.answer}</p>
                </Panel>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className="section">
        <Container className="contact-banner">
          <div>
            <Badge>Contact</Badge>
            <h3>{businessInfo.name}</h3>
            <p>{businessInfo.intro}</p>
          </div>
          <div className="contact-banner__meta">
            <strong>{businessInfo.phone}</strong>
            <span>{businessInfo.email}</span>
            <span>{businessInfo.address}</span>
          </div>
        </Container>
      </section>
    </SiteLayout>
  );
};
