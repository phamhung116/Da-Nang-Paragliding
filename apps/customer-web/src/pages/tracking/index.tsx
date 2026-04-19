import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Container, Field, Input, Panel } from "@paragliding/ui";
import { customerApi } from "@/shared/config/api";
import { useAuth } from "@/shared/providers/auth-provider";
import { businessInfo } from "@/shared/constants/business";
import { trackingSupportNotes } from "@/shared/constants/customer-content";
import { approvalStatusLabels, flightStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { trackingLookupStorage } from "@/shared/lib/storage";
import { SiteLayout } from "@/widgets/layout/site-layout";
import { TrackingMap } from "@/widgets/tracking-map/tracking-map";

type LookupForm = { query: string };

const statusOrder = ["WAITING_CONFIRMATION", "WAITING", "PICKING_UP", "EN_ROUTE", "FLYING", "LANDED"] as const;
const mapVisibleStatuses = new Set(["PICKING_UP", "EN_ROUTE", "FLYING", "LANDED"]);

export const TrackingPage = () => {
  const { account, isAuthenticated } = useAuth();
  const { register, handleSubmit } = useForm<LookupForm>({
    defaultValues: {
      query: account?.email ?? trackingLookupStorage.get()
    }
  });

  const mutation = useMutation({
    mutationFn: ({ query }: LookupForm) => customerApi.lookupTracking(query),
    onSuccess: (_, values) => trackingLookupStorage.set(values.query)
  });

  const result = mutation.data;
  const currentStep = result ? statusOrder.indexOf(result.booking.flight_status as (typeof statusOrder)[number]) : -1;

  useEffect(() => {
    if (isAuthenticated && account?.email && mutation.status === "idle") {
      mutation.mutate({ query: account.email });
    }
  }, [account?.email, isAuthenticated, mutation]);

  return (
    <SiteLayout>
      <section className="page-banner page-banner--tracking">
        <div className="page-banner__image">
          <img
            src="https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1800&q=80"
            alt="Tracking banner"
          />
          <div className="page-banner__overlay" />
        </div>
        <Container className="page-banner__content">
          <Badge>Theo doi hanh trinh</Badge>
          <h1>Theo doi booking va vi tri GPS.</h1>
          <p>Khach da dang nhap se thay hanh trinh gan nhat ngay lap tuc.</p>
        </Container>
      </section>

      <section className="section">
        <Container className="stack">
          <div className="info-grid">
            {trackingSupportNotes.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Tra cuu tracking</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>

          {!isAuthenticated ? (
            <Card className="tracking-search-card">
              <Panel>
                <form className="tracking-lookup" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
                  <Field label="Email hoac so dien thoai">
                    <Input {...register("query", { required: true })} />
                  </Field>
                  <Button>{mutation.isPending ? "Đang tra cứu..." : "Tra cứu booking"}</Button>
                </form>
              </Panel>
            </Card>
          ) : null}

          {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

          {result ? (
            <>
              <Card>
                <Panel className="stack">
                  <div className="tracking-status-header">
                    <div>
                      <Badge tone="success">{flightStatusLabels[result.booking.flight_status]}</Badge>
                      <h3>{result.booking.service_name}</h3>
                    </div>
                    <div className="tracking-contact-actions">
                      <a href={`mailto:${result.booking.email}`}>Email khach</a>
                      <a href={`tel:${businessInfo.phone.replace(/\s+/g, "")}`}>Liên hệ doanh nghiệp</a>
                    </div>
                  </div>

                  <div className="status-progress">
                    {statusOrder.map((status, index) => (
                      <div
                        key={status}
                        className={`status-progress__step ${index <= currentStep ? "is-active" : ""}`}
                      >
                        <span>{index + 1}</span>
                        <strong>{flightStatusLabels[status]}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="tracking-grid">
                    <Card className="tracking-card">
                      <Panel className="stack-sm">
                        <strong>Thong tin booking</strong>
                        <p>Code: {result.booking.code}</p>
                        <p>Phe duyet: {approvalStatusLabels[result.booking.approval_status]}</p>
                        <p>Thanh toan: {paymentStatusLabels[result.booking.payment_status]}</p>
                        <p>
                          Lich bay: {result.booking.flight_date} luc {result.booking.flight_time}
                        </p>
                        <p>Pilot: {result.booking.assigned_pilot_name ?? result.tracking.pilot_name ?? "Đang cập nhật"}</p>
                      </Panel>
                    </Card>

                    <Card className="tracking-card">
                      <Panel className="stack-sm">
                        <strong>Timeline</strong>
                        <div className="timeline">
                          {result.tracking.timeline.map((event, index) => (
                            <div className="timeline__item" key={`${String(event.recorded_at)}-${index}`}>
                              <span>{String(event.label)}</span>
                              <small>{String(event.recorded_at)}</small>
                            </div>
                          ))}
                        </div>
                      </Panel>
                    </Card>
                  </div>
                </Panel>
              </Card>

              {mapVisibleStatuses.has(result.booking.flight_status) ? (
                <Card>
                  <Panel className="stack">
                    <strong>Ban do GPS</strong>
                    <TrackingMap booking={result.booking} tracking={result.tracking} />
                  </Panel>
                </Card>
              ) : (
                <Card>
                  <Panel className="stack-sm">
                    <strong>Ban do se hien thi khi hanh trinh bat dau.</strong>
                    <p>Hien tai booking van dang cho xac nhan hoac cho toi gio khoi hanh.</p>
                  </Panel>
                </Card>
              )}
            </>
          ) : (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Tracking ready</Badge>
                <strong>Nhap thong tin booking de hien thi timeline va vi tri GPS.</strong>
                <p>Ngay sau khi customer dat lich thanh cong, booking co the duoc tra cuu lai tu trang nay.</p>
              </Panel>
            </Card>
          )}
        </Container>
      </section>
    </SiteLayout>
  );
};
