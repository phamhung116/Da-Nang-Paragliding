import { useMemo } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { Badge, Button, Card, Container, Panel } from "@paragliding/ui";
import { useAuth } from "@/app/providers/auth-provider";
import { bookingRules } from "@/shared/constants/customer-content";
import { routes } from "@/shared/config/routes";
import { BookingForm } from "@/features/create-booking/booking-form";
import { SiteLayout } from "@/widgets/layout/site-layout";

export const BookingPage = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const bookingContext = useMemo(
    () => ({
      service: params.get("service") ?? "",
      date: params.get("date") ?? "",
      time: params.get("time") ?? ""
    }),
    [params]
  );

  if (!bookingContext.service || !bookingContext.date || !bookingContext.time) {
    return (
      <SiteLayout>
        <section className="section">
          <Container className="stack">
            <Badge tone="danger">Thieu thong tin dat lich</Badge>
            <h2 className="detail-title">Hay quay lai trang chi tiet dich vu de chon slot truoc.</h2>
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
              He thong se tu dong dien email, so dien thoai va luu lich su booking vao tai khoan cua ban.
            </p>
            <Link
              to={`${routes.login}?redirect=${encodeURIComponent(`${location.pathname}${location.search}`)}`}
            >
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
              <h2>Hoan tat form booking</h2>
            </div>
            <p>Thong tin dang nhap se duoc tu dong su dung cho booking nay. Khach chi can kiem tra lai va xac nhan.</p>
          </div>

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

          <BookingForm
            serviceSlug={bookingContext.service}
            selectedDate={bookingContext.date}
            selectedTime={bookingContext.time}
          />
        </Container>
      </section>
    </SiteLayout>
  );
};
