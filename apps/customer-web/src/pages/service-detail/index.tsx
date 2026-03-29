import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { servicePreparationChecklist } from "@/shared/constants/customer-content";
import { formatCurrency } from "@/shared/lib/format";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { BookingCalendar } from "@/widgets/booking-calendar/booking-calendar";

const serviceFlowNotes = [
  "Khach se duoc brief an toan truoc gio bay va xac nhan suc khoe tai diem tap ket.",
  "Anh va video se duoc doi ngu media ho tro ban giao sau chuyen bay theo goi dich vu.",
  "Lich bay thuc te co the duoc dieu chinh nhe neu weather thay doi sat gio cat canh."
];

const parseDateKey = (value: string) => {
  const [rawYear, rawMonth, rawDay] = value.split("-").map(Number);
  return new Date(rawYear, rawMonth - 1, rawDay);
};

const formatSelectedSlotLabel = (value: { date: string; time: string } | null) => {
  if (!value) {
    return "Chua chon khung gio";
  }

  return `${value.time} - ${parseDateKey(value.date).toLocaleDateString("vi-VN")}`;
};

export const ServiceDetailPage = () => {
  const { slug = "" } = useParams();
  const currentDate = useMemo(() => new Date(), []);
  const [calendarState, setCalendarState] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth() + 1
  });
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);

  const { data: servicePackage } = useQuery({
    queryKey: ["service", slug],
    queryFn: () => customerApi.getService(slug),
    enabled: Boolean(slug)
  });

  const availabilityMonths = useMemo(() => {
    const currentDate = new Date(calendarState.year, calendarState.month - 1, 1);
    const prevDate = new Date(calendarState.year, calendarState.month - 2, 1);
    const nextDate = new Date(calendarState.year, calendarState.month, 1);

    return [prevDate, currentDate, nextDate].map((date) => ({
      year: date.getFullYear(),
      month: date.getMonth() + 1
    }));
  }, [calendarState.month, calendarState.year]);

  const availabilityQueries = useQueries({
    queries: availabilityMonths.map(({ year, month }) => ({
      queryKey: ["availability", slug, year, month],
      queryFn: () => customerApi.getAvailability(slug, year, month),
      enabled: Boolean(slug)
    }))
  });

  const availability = useMemo(() => {
    const merged = availabilityQueries.flatMap((query) => query.data ?? []);
    const uniqueDays = new Map(merged.map((day) => [day.date, day]));
    return Array.from(uniqueDays.values()).sort((left, right) => left.date.localeCompare(right.date));
  }, [availabilityQueries]);

  if (!servicePackage) {
    return (
      <SiteLayout>
        <section className="section">
          <Container>Dang tai goi dich vu...</Container>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="page-banner page-banner--service">
        <div className="page-banner__image">
          <img src={servicePackage.hero_image} alt={servicePackage.name} />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>{servicePackage.launch_site_name}</Badge>
          <h1>{servicePackage.name}</h1>
          <p>{servicePackage.short_description}</p>
        </Container>
      </section>

      <section className="section">
        <Container className="detail-layout">
          <div className="detail-main-column">
            <Card className="detail-copy-card">
              <Panel className="stack">
                <div className="detail-chip-row">
                  <Badge>{formatCurrency(servicePackage.price)}</Badge>
                  <Badge tone="success">{servicePackage.active ? "Dang mo ban" : "Tam khoa"}</Badge>
                </div>
                <h2 className="detail-title">Tong quan goi bay</h2>
                <p className="detail-copy">{servicePackage.description}</p>
                <div className="detail-highlight-grid">
                  <article>
                    <span>Flight duration</span>
                    <strong>{servicePackage.flight_duration_minutes} phut</strong>
                  </article>
                  <article>
                    <span>Meeting point</span>
                    <strong>{servicePackage.launch_site_name}</strong>
                  </article>
                  <article>
                    <span>Landing point</span>
                    <strong>{servicePackage.landing_site_name}</strong>
                  </article>
                  <article>
                    <span>Kid minimum age</span>
                    <strong>{servicePackage.min_child_age}+ tuoi</strong>
                  </article>
                </div>
              </Panel>
            </Card>

            <section className="detail-booking-section">
              <div className="detail-booking-section__head">
                <div className="stack-sm">
                  <Badge>Dat lich bay</Badge>
                  <h2 className="detail-title">Chon ngay va khung gio</h2>
                </div>
              </div>

              {availability.length > 0 ? (
                <BookingCalendar
                  year={calendarState.year}
                  month={calendarState.month}
                  days={availability}
                  selectedSlot={selectedSlot}
                  onMonthChange={(year, month) => setCalendarState({ year, month })}
                  onSelectSlot={setSelectedSlot}
                />
              ) : (
                <Card className="empty-state-card">
                  <Panel className="stack-sm">
                    <Badge tone="danger">Chua mo lich</Badge>
                    <strong>Thang nay chua co slot kha dung cho goi bay nay.</strong>
                    <p>Ban co the doi sang thang khac hoac lien he doanh nghiep de duoc ho tro.</p>
                  </Panel>
                </Card>
              )}
            </section>

            <div className="detail-section-grid">
              <Card className="detail-section-card">
                <Panel className="stack-sm">
                  <Badge>Dich vu di kem</Badge>
                  <h3>Nhung gi da co trong goi</h3>
                  <ul className="detail-list">
                    {servicePackage.included_services.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Panel>
              </Card>

              <Card className="detail-section-card">
                <Panel className="stack-sm">
                  <Badge tone="success">Luu y</Badge>
                  <h3>Dieu kien tham gia</h3>
                  <ul className="detail-list">
                    {servicePackage.participation_requirements.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </Panel>
              </Card>
            </div>

            <div className="info-grid">
              {serviceFlowNotes.map((item) => (
                <Card key={item} className="info-card">
                  <Panel className="stack-sm">
                    <strong>Van hanh trong ngay bay</strong>
                    <p>{item}</p>
                  </Panel>
                </Card>
              ))}
            </div>

            <Card className="detail-section-card">
              <Panel className="stack-sm">
                <Badge>Chuan bi truoc bay</Badge>
                <h3>Checklist danh cho khach hang</h3>
                <ul className="detail-list">
                  {servicePreparationChecklist.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Panel>
            </Card>

            <div className="detail-gallery detail-gallery--mosaic">
              {servicePackage.gallery_images.map((image, index) => (
                <img key={`${image}-${index}`} src={image} alt={`${servicePackage.name} ${index + 1}`} />
              ))}
            </div>
          </div>

          <aside className="detail-booking-column">
            <Card className="detail-booking-sticky">
              <Panel className="stack">
                <div className="detail-price-card">
                  <div className="detail-price-card__copy">
                    <span>Gia dich vu</span>
                    <strong>{formatCurrency(servicePackage.price)}</strong>
                  </div>
                </div>

                <div className="detail-fact-list">
                  <article>
                    <span>Diem cat canh</span>
                    <strong>{servicePackage.launch_site_name}</strong>
                  </article>
                  <article>
                    <span>Diem ha canh</span>
                    <strong>{servicePackage.landing_site_name}</strong>
                  </article>
                  <article>
                    <span>Tre em toi thieu</span>
                    <strong>{servicePackage.min_child_age}+ tuoi</strong>
                  </article>
                </div>

                <div className="detail-booking-selection">
                  <span>Khung gio da chon</span>
                  <strong>{formatSelectedSlotLabel(selectedSlot)}</strong>
                  <small>Chon mot o con trong tren lich de tiep tuc dat lich.</small>
                </div>

                {selectedSlot ? (
                  <Link
                    to={`/booking?service=${servicePackage.slug}&date=${selectedSlot.date}&time=${selectedSlot.time}`}
                  >
                    <Button>Tiep tuc dat lich</Button>
                  </Link>
                ) : (
                  <p className="calendar-selection-note">Lich dat se duoc giu sau khi ban chon mot slot hop le.</p>
                )}
              </Panel>
            </Card>
          </aside>
        </Container>
      </section>
    </SiteLayout>
  );
};
