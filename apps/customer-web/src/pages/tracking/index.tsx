import { useMutation } from "@tanstack/react-query";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Container, Field, Input, Panel } from "@paragliding/ui";
import { ChevronRight } from "lucide-react";
import { customerApi } from "@/shared/config/api";
import { businessInfo } from "@/shared/constants/business";
import { trackingSupportNotes } from "@/shared/constants/customer-content";
import { approvalStatusLabels, flightStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { trackingLookupStorage } from "@/shared/lib/storage";
import { useAuth } from "@/shared/providers/auth-provider";
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
  const currentStepIndex = result
    ? Math.max(0, statusOrder.indexOf(result.booking.flight_status as (typeof statusOrder)[number]))
    : 0;

  useEffect(() => {
    if (isAuthenticated && account?.email && mutation.status === "idle") {
      mutation.mutate({ query: account.email });
    }
  }, [account?.email, isAuthenticated, mutation]);

  return (
    <SiteLayout>
      <section className="section">
        <Container className="stack">
          <div className="stack-sm text-center">
            <Badge>Theo dõi hành trình</Badge>
            <h1>Theo dõi booking và vị trí GPS</h1>
            <p>Khách đã đăng nhập sẽ thấy hành trình gần nhất ngay lập tức.</p>
          </div>

          <div className="info-grid">
            {trackingSupportNotes.map((item) => (
              <Card key={item} className="info-card">
                <Panel className="stack-sm">
                  <strong>Tra cứu tracking</strong>
                  <p>{item}</p>
                </Panel>
              </Card>
            ))}
          </div>

          {!isAuthenticated ? (
            <Card className="tracking-search-card">
              <Panel>
                <form className="tracking-lookup" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
                  <Field label="Email hoặc số điện thoại">
                    <Input
                      className="w-full rounded-2xl border-none bg-stone-100 p-4 outline-none focus:ring-2 focus:ring-brand"
                      placeholder="Nhập email đã đặt lịch..."
                      {...register("query", { required: true })}
                    />
                  </Field>
                  <Button className="btn-primary w-full py-4">
                    {mutation.isPending ? "Đang tra cứu..." : "Tra cứu booking"}
                  </Button>
                </form>
              </Panel>
            </Card>
          ) : null}

          {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

          {!result && mutation.isPending ? (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Đang tra cứu</Badge>
                <strong>Đang tra cứu booking...</strong>
                <p>Hệ thống đang lấy timeline và vị trí GPS mới nhất.</p>
              </Panel>
            </Card>
          ) : null}

          {result ? (
            <>
              <Card>
                <Panel className="space-y-8">
                  <button
                    type="button"
                    onClick={() => mutation.reset()}
                    className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-stone-400 transition-colors hover:text-brand"
                  >
                    <ChevronRight className="rotate-180" size={16} />
                    Quay lại tra cứu
                  </button>

                  <div className="tracking-status-header">
                    <div>
                      <Badge tone="success">{flightStatusLabels[result.booking.flight_status]}</Badge>
                      <h3>{result.booking.service_name}</h3>
                    </div>
                    <div className="tracking-contact-actions">
                      <a href={`mailto:${result.booking.email}`}>Email khách</a>
                      <a href={`tel:${businessInfo.phone.replace(/\s+/g, "")}`}>Liên hệ doanh nghiệp</a>
                    </div>
                  </div>

                  <div className="relative pb-4 pt-8">
                    <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 bg-stone-100" />
                    <div
                      className="absolute left-0 top-1/2 h-1 -translate-y-1/2 bg-brand transition-all duration-1000"
                      style={{ width: `${(currentStepIndex / (statusOrder.length - 1)) * 100}%` }}
                    />
                    <div className="relative flex justify-between gap-2">
                      {statusOrder.map((status, index) => (
                        <div key={status} className="flex flex-1 flex-col items-center gap-2 text-center">
                          <div
                            className={`z-10 h-5 w-5 rounded-full border-4 transition-colors ${
                              index <= currentStepIndex
                                ? "border-white bg-brand shadow-lg shadow-brand/20"
                                : "border-stone-200 bg-white"
                            }`}
                          />
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider ${
                              index <= currentStepIndex ? "text-brand" : "text-stone-400"
                            }`}
                          >
                            {flightStatusLabels[status]}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="tracking-grid">
                    <Card className="tracking-card">
                      <Panel className="stack-sm">
                        <strong>Thông tin booking</strong>
                        <p>Mã booking: {result.booking.code}</p>
                        <p>Phê duyệt: {approvalStatusLabels[result.booking.approval_status]}</p>
                        <p>Thanh toán: {paymentStatusLabels[result.booking.payment_status]}</p>
                        <p>
                          Lịch bay: {result.booking.flight_date} lúc {result.booking.flight_time}
                        </p>
                        <p>Pilot: {result.booking.assigned_pilot_name ?? result.tracking.pilot_name ?? "Đang cập nhật"}</p>
                      </Panel>
                    </Card>

                    <Card className="tracking-card">
                      <Panel className="stack-sm">
                        <strong>Lịch sử hành trình</strong>
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
                    <strong>Bản đồ GPS</strong>
                    <TrackingMap booking={result.booking} tracking={result.tracking} />
                  </Panel>
                </Card>
              ) : (
                <Card>
                  <Panel className="stack-sm">
                    <strong>Bản đồ sẽ hiển thị khi hành trình bắt đầu.</strong>
                    <p>Hiện tại booking vẫn đang chờ xác nhận hoặc chờ tới giờ khởi hành.</p>
                  </Panel>
                </Card>
              )}
            </>
          ) : null}

          {!result && !mutation.isPending ? (
            <Card className="empty-state-card">
              <Panel className="stack-sm">
                <Badge>Sẵn sàng tra cứu</Badge>
                <strong>Nhập thông tin booking để hiển thị timeline và vị trí GPS.</strong>
                <p>Ngay sau khi khách hàng đặt lịch thành công, booking có thể được tra cứu lại từ trang này.</p>
              </Panel>
            </Card>
          ) : null}
        </Container>
      </section>
    </SiteLayout>
  );
};
