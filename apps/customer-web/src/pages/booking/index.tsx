import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { bookingRules } from "@/shared/constants/customer-content";
import { routes } from "@/shared/config/routes";
import { BookingForm } from "@/features/create-booking/booking-form";
import { availabilityQueryOptions } from "@/shared/lib/query-options";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { BookingCalendar } from "@/widgets/booking-calendar/booking-calendar";

const parseDateKey = (value: string) => {
  const [rawYear, rawMonth] = value.split("-").map(Number);
  return {
    year: rawYear || new Date().getFullYear(),
    month: rawMonth || new Date().getMonth() + 1
  };
};

export const BookingPage = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const initialService = params.get("service") ?? "";
  const initialDate = params.get("date") ?? "";
  const initialTime = params.get("time") ?? "";
  const initialCalendar = parseDateKey(initialDate);
  const [calendarState, setCalendarState] = useState(initialCalendar);
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(
    initialDate && initialTime ? { date: initialDate, time: initialTime } : null
  );

  const bookingContext = useMemo(
    () => ({
      service: initialService,
      date: selectedSlot?.date ?? "",
      time: selectedSlot?.time ?? ""
    }),
    [initialService, selectedSlot?.date, selectedSlot?.time]
  );

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
      ...availabilityQueryOptions(bookingContext.service, year, month),
      enabled: Boolean(bookingContext.service)
    }))
  });

  const availability = useMemo(() => {
    const merged = availabilityQueries.flatMap((query) => query.data ?? []);
    const uniqueDays = new Map(merged.map((day) => [day.date, day]));
    return Array.from(uniqueDays.values()).sort((left, right) => left.date.localeCompare(right.date));
  }, [availabilityQueries]);

  if (!bookingContext.service) {
    return (
      <SiteLayout>
        <section className="section">
          <Container className="stack">
            <Badge tone="danger">Thieu thong tin dat lich</Badge>
            <h2 className="detail-title">Hay chon mot goi dich vu truoc khi dat lich.</h2>
            <Link to={routes.services}>
              <Button variant="secondary">Quay lai danh sach dich vu</Button>
            </Link>
          </Container>
        </section>
      </SiteLayout>
    );
  }

  if (!isAuthenticated) {
    return (
      <SiteLayout>
        <section className="section">
          <Container className="stack">
            <Badge>Bat buoc dang nhap</Badge>
            <h2 className="detail-title">Dang nhap de tiep tuc dat lich</h2>
            <p className="detail-copy">
              He thong se tu dong dien email, so dien thoai va luu lich su dat lich vao tai khoan cua ban.
            </p>
            <Link to={`${routes.login}?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}>
              <Button>Dang nhap ngay</Button>
            </Link>
          </Container>
        </section>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>Thong tin hanh khach</Badge>
              <h2>Hoan tat bieu mau dat lich</h2>
            </div>
            <p>Khach co the doi ngay, khung gio va xem weather theo gio ngay phia tren khu vuc chon lich.</p>
          </div>

          <Card>
            <Panel className="stack">
              <div className="booking-section-head">
                <div>
                  <Badge>Chon lai lich neu can</Badge>
                  <h3>Lich bay va weather theo gio</h3>
                  <p>O trong co the dat. O X da het phi cong, bi khoa hoac la ngay da qua.</p>
                </div>
              </div>
              <BookingCalendar
                year={calendarState.year}
                month={calendarState.month}
                days={availability}
                selectedSlot={selectedSlot}
                onMonthChange={(year, month) => setCalendarState({ year, month })}
                onSelectSlot={setSelectedSlot}
                weatherAside
              />
            </Panel>
          </Card>

          <div className="info-grid">
            {bookingRules.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Quy tac dat lich</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>

          {bookingContext.date && bookingContext.time ? (
            <BookingForm
              serviceSlug={bookingContext.service}
              selectedDate={bookingContext.date}
              selectedTime={bookingContext.time}
            />
          ) : (
            <Card>
              <Panel className="calendar-selection-card">
                <Badge tone="danger">Chua chon khung gio</Badge>
                <strong>Hay chon mot o con trong tren lich truoc khi dien bieu mau dat lich.</strong>
                <small>Thong tin thoi tiet theo gio se hien ngay phia tren lich khi tro vao tung khung gio.</small>
              </Panel>
            </Card>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
};
