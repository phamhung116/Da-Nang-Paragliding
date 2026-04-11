import { Link } from "react-router-dom";
import { Badge, Button, Container } from "@paragliding/ui";
import { routes } from "@/shared/config/routes";
import { businessInfo } from "@/shared/constants/business";
import { SiteLayout } from "@/widgets/layout/site-layout";

const normalizedPhone = businessInfo.phone.replace(/\s+/g, "");
const mapEmbedUrl =
  "https://www.openstreetmap.org/export/embed.html?bbox=108.2400%2C16.0637%2C108.2500%2C16.0737&layer=mapnik&marker=16.0687%2C108.2450";

const contactMethods = [
  {
    label: "Hotline",
    value: businessInfo.phone,
    href: `tel:${normalizedPhone}`,
    action: "Goi ngay"
  },
  {
    label: "Dien thoai van phong",
    value: businessInfo.secondaryPhone,
    href: `tel:${businessInfo.secondaryPhone.replace(/\s+/g, "")}`,
    action: "Goi van phong"
  },
  {
    label: "Email",
    value: businessInfo.email,
    href: `mailto:${businessInfo.email}`,
    action: "Gui email"
  }
];

const supportNotes = [
  "Tu van goi bay, lich trong va chinh sach dat coc.",
  "Ho tro doi lich khi weather tai Son Tra khong phu hop.",
  "Cap nhat trang thai booking va thong tin pilot phu trach."
];

export const ContactPage = () => (
  <SiteLayout>
    <section className="page-banner contact-page-banner">
      <div className="page-banner__image">
        <img
          src="https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1800&q=80"
          alt="Da Nang coastline"
        />
        <div className="page-banner__overlay" />
      </div>
      <Container className="page-banner__content">
        <Badge>Lien he</Badge>
        <h1>Ket noi voi SkyNest de chon gio bay phu hop tai Da Nang.</h1>
        <p>Hotline, email, dia chi van phong va ban do duoc cap nhat de khach den dung diem hen.</p>
      </Container>
    </section>

    <section className="section">
      <Container className="contact-page">
        <div className="contact-page__grid">
          <div className="contact-page__content">
            <div className="contact-section-heading">
              <Badge tone="success">Thong tin lien he</Badge>
              <h2>Ho tro booking va dieu phoi lich bay moi ngay.</h2>
              <p>
                Doi dieu phoi tiep nhan yeu cau dat lich, doi lich, hoan coc va theo doi hanh trinh trong gio
                hoat dong.
              </p>
            </div>

            <div className="contact-method-grid">
              {contactMethods.map((method) => (
                <article key={method.label} className="contact-method">
                  <span>{method.label}</span>
                  <strong>{method.value}</strong>
                  <a href={method.href}>{method.action}</a>
                </article>
              ))}
            </div>

            <div className="contact-info-panel">
              <div>
                <span>Dia chi doanh nghiep</span>
                <strong>{businessInfo.address}</strong>
              </div>
              <div>
                <span>Diem hen bay</span>
                <strong>{businessInfo.meetingPoint}</strong>
              </div>
              <div>
                <span>Gio ho tro</span>
                <strong>{businessInfo.supportHours}</strong>
              </div>
            </div>

            <div className="contact-support-list">
              {supportNotes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </div>

            <div className="contact-actions">
              <a href={`tel:${normalizedPhone}`}>
                <Button>Goi hotline</Button>
              </a>
              <Link to={routes.services}>
                <Button variant="secondary">Xem goi bay</Button>
              </Link>
            </div>
          </div>

          <div className="contact-map-panel">
            <div className="contact-map-panel__header">
              <div>
                <Badge>Ban do</Badge>
                <h2>Cong vien Bien Dong, Son Tra</h2>
              </div>
              <a href={businessInfo.googleMapsUrl} target="_blank" rel="noreferrer">
                Mo Google Maps
              </a>
            </div>

            <div className="contact-map">
              <iframe
                title="SkyNest contact map"
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>

            <div className="contact-map-panel__meta">
              <span>Toa do</span>
              <strong>
                {businessInfo.mapLatitude}, {businessInfo.mapLongitude}
              </strong>
            </div>
          </div>
        </div>
      </Container>
    </section>
  </SiteLayout>
);
