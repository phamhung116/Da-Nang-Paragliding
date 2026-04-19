import { useMemo, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { bookingRules } from "@/shared/constants/customer-content";
import { routes } from "@/shared/config/routes";
import { customerApi } from "@/shared/config/api";
import { BookingForm } from "@/features/create-booking/booking-form";
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
      queryKey: ["availability", bookingContext.service, year, month],
      queryFn: () => customerApi.getAvailability(bookingContext.service, year, month),
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
            <h2 className="detail-title">Hãy chọn một gói dịch vụ trước khi đặt lịch.</h2>
            <Link to={routes.services}>
              <Button variant="secondary">Quay lại danh sách dịch vụ</Button>
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
            <h2 className="detail-title">Đăng nhập để tiếp tục đặt lịch</h2>
            <p className="detail-copy">
              He thong se tu dong dien email, so dien thoai va luu lich su booking vao tai khoan cua ban.
            </p>
            <Link to={`${routes.login}?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}>
              <Button>Đăng nhập ngay</Button>
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
              <h2>Hoan tat form booking</h2>
            </div>
            <p>Khach co the doi ngay, khung gio va xem weather theo gio ngay tren man hinh dat lich.</p>
          </div>

          <Card>
            <Panel className="stack">
              <div className="booking-section-head">
                <div>
                  <Badge>Chon lai lich neu can</Badge>
                  <h3>Lich bay va weather theo gio</h3>
                  <p>O trong co the dat. O X da het pilot hoac bi khoa do dieu kien bay.</p>
                </div>
              </div>
              <BookingCalendar
                year={calendarState.year}
                month={calendarState.month}
                days={availability}
                selectedSlot={selectedSlot}
                onMonthChange={(year, month) => setCalendarState({ year, month })}
                onSelectSlot={setSelectedSlot}
              />
            </Panel>
          </Card>

          <div className="info-grid">
            {bookingRules.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Booking rule</strong>
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
                <Badge tone="danger">Chưa chọn khung giờ</Badge>
                <strong>Hãy chọn một ô còn trống trên lịch trước khi điền form đặt lịch.</strong>
                <small>Thong tin thoi tiet theo gio se hien ngay ben duoi lich khi hover vao tung slot.</small>
              </Panel>
            </Card>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
};
