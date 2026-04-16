import { useQueries, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { servicePreparationChecklist } from "@/shared/constants/customer-content";
import { formatCurrency } from "@/shared/lib/format";
import { SiteLayout, Banner } from "@/widgets/layout/site-layout";
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
      <Banner 
        title={servicePackage.name} 
        subtitle="Trải nghiệm bay lượn tuyệt vời nhất tại Đà Nẵng."
        image={servicePackage.hero_image}
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Container className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-start-3 lg:col-span-1 order-first lg:order-last space-y-8">
            <div className="glass-card rounded-[32px] p-6 sticky top-24">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-3xl font-bold text-red-600">{formatCurrency(servicePackage.price)}</h2>
                  {selectedSlot ? (
                  <Link
                    to={`/booking?service=${servicePackage.slug}&date=${selectedSlot.date}&time=${selectedSlot.time}`}
                  >
                    <Button className="btn-primary px-6 py-2 rounded-xl text-sm font-bold shadow-lg shadow-brand/20">
                      Đặt ngay
                    </Button>
                  </Link>
                    ) : (
                  <p className="calendar-selection-note">Lich dat se duoc giu sau khi ban chon mot slot hop le.</p>
                  )}
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
            </div>
          </div >
          <div className="lg:col-span-2 space-y-6 lg:space-y-12">
            <div>
              <div>
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
              </div>
            </div>

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
        </Container>
      </section>
    </SiteLayout>
  );
};
