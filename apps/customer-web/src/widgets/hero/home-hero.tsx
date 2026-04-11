import { Link } from "react-router-dom";
import { Button, Container } from "@paragliding/ui";
import { useI18n } from "@/shared/providers/i18n-provider";
import { businessInfo } from "@/shared/constants/business";
import { routes } from "@/shared/config/routes";

const heroMetrics = [
  { value: "1,200+", label: "Safe flights" },
  { value: "7 days", label: "Weather preview" },
  { value: "GPS Live", label: "Flight tracking" }
];

const heroHighlights = [
  "Lich theo tung khung gio va weather theo gio",
  "QR dat coc va noi dung chuyen khoan ro rang",
  "Theo doi hanh trinh bay sau khi booking"
];

export const HomeHero = () => {
  const { t } = useI18n();

  return (
    <section className="hero-shell">
      <div className="hero-shell__backdrop">
        <img
          src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1800&q=80"
          alt="Paragliding in Da Nang"
        />
        <div className="hero-shell__overlay" />
      </div>
      <Container className="hero-shell__content">
        <div className="hero-copy-card">
          <span className="hero-kicker">{t("hero_kicker")}</span>
          <h1 className="hero-title">
            {t("hero_title_line_1")}
            <br />
            {t("hero_title_line_2")}
          </h1>
          <p className="hero-copy">
            {businessInfo.intro} Lich booking, QR dat coc va tracking duoc trinh bay gon, de theo doi va
            phu hop cho khach hang dat lich tren web.
          </p>
          <div className="hero-proof-list">
            {heroHighlights.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="hero-actions">
            <Link to={routes.services}>
              <Button>{t("hero_services")}</Button>
            </Link>
            <Link to={routes.tracking}>
              <Button variant="secondary">{t("hero_tracking")}</Button>
            </Link>
          </div>
        </div>
        <div className="hero-info-card">
          <div className="hero-info-card__top">
            <span>Meeting point</span>
            <strong>{businessInfo.meetingPoint}</strong>
          </div>
          <div className="hero-metrics">
            {heroMetrics.map((metric) => (
              <article key={metric.label} className="hero-metric">
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};
