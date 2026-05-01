import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
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

const statusOrder = ["WAITING_CONFIRMATION", "WAITING", "EN_ROUTE", "FLYING", "LANDED"] as const;
const mapVisibleStatuses = new Set(["EN_ROUTE", "FLYING", "LANDED"]);
const POLL_INTERVAL_MS = 3000;
const cancelledStatuses = new Set(["CANCELLED", "REJECTED"]);

export const TrackingPage = () => {
  const { account, isAuthenticated } = useAuth();
  const [lookupQuery, setLookupQuery] = useState(account?.email ?? trackingLookupStorage.get() ?? "");
  const [autoLookupDone, setAutoLookupDone] = useState(false);
  const { register, handleSubmit, setValue } = useForm<LookupForm>({
    defaultValues: {
      query: account?.email ?? trackingLookupStorage.get() ?? "",
    },
  });

  const trackingQuery = useQuery({
    queryKey: ["tracking-lookup", lookupQuery],
    queryFn: () => customerApi.lookupTracking(lookupQuery),
    enabled: Boolean(lookupQuery),
    refetchInterval: false,
    staleTime: 0,
  });

  const result = lookupQuery ? trackingQuery.data : undefined;
  const hasTrackingResult = Boolean(result);
  const progressStatus = result?.booking.flight_status === "PICKING_UP" ? "WAITING" : result?.booking.flight_status;
  const currentStepIndex = progressStatus
    ? Math.max(0, statusOrder.indexOf(progressStatus as (typeof statusOrder)[number]))
    : 0;

  const shouldPoll = useMemo(() => {
    if (!result) {
      return false;
    }
    if (cancelledStatuses.has(result.booking.approval_status)) {
      return false;
    }
    return result.booking.flight_status !== "LANDED";
  }, [result]);

  const shouldShowMap = Boolean(
    result &&
      mapVisibleStatuses.has(result.booking.flight_status) &&
      (result.tracking.tracking_active ||
        result.tracking.route_points.length > 0 ||
        result.booking.flight_status === "LANDED")
  );

  useEffect(() => {
    if (!isAuthenticated || !account?.email || autoLookupDone) {
      return;
    }
    const normalized = account.email.trim();
    setValue("query", normalized);
    trackingLookupStorage.set(normalized);
    setLookupQuery(normalized);
    setAutoLookupDone(true);
  }, [account?.email, autoLookupDone, isAuthenticated, setValue]);

  useEffect(() => {
    if (!lookupQuery || !hasTrackingResult || !shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void trackingQuery.refetch();
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [hasTrackingResult, lookupQuery, shouldPoll, trackingQuery.refetch]);

  const handleLookup = (values: LookupForm) => {
    const normalized = values.query.trim();
    if (!normalized) {
      return;
    }
    trackingLookupStorage.set(normalized);
    setLookupQuery(normalized);
  };

  return (
    <SiteLayout>
      <div className="max-w-4xl mx-auto px-4 py-40">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Theo dõi hành trình</h2>
          <p className="text-stone-500">Nhập email của bạn để xem trạng thái chuyến bay hiện tại.</p>
        </div>
        {!isAuthenticated ? (
          <form className="max-w-md mx-auto space-y-4" onSubmit={handleSubmit(handleLookup)}>
            <Field label="Email hoặc số điện thoại">
              <Input
                className="w-full rounded-2xl border-none bg-stone-100 p-4 outline-none focus:ring-2 focus:ring-brand"
                placeholder="Nhập email đã đặt lịch..."
                {...register("query", { required: true })}
              />
            </Field>
            <Button className="btn-primary w-full py-4">
              {trackingQuery.isFetching && !result ? "Đang tra cứu..." : "Tra cứu lịch đặt"}
            </Button>
          </form>
        ) : null}

        {lookupQuery && trackingQuery.error instanceof Error ? <p className="form-error">{trackingQuery.error.message}</p> : null}

        {!result && trackingQuery.isFetching ? (
          <Card className="empty-state-card">
            <Panel className="stack-sm">
              <Badge>Đang tra cứu</Badge>
              <strong>Đang tra cứu lịch đặt...</strong>
              <p>Hệ thống đang lấy dòng thời gian và vị trí GPS mới nhất.</p>
            </Panel>
          </Card>
        ) : null}

        {result ? (
          <>
            <Card>
              <Panel className="space-y-8">
                <button
                  type="button"
                  onClick={() => {
                    setLookupQuery("");
                    setValue("query", "");
                  }}
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
                      <strong>Thông tin đặt lịch</strong>
                      <p>Mã đặt lịch: {result.booking.code}</p>
                      <p>Phê duyệt: {approvalStatusLabels[result.booking.approval_status]}</p>
                      <p>Thanh toán: {paymentStatusLabels[result.booking.payment_status]}</p>
                      <p>
                        Lịch bay: {result.booking.flight_date} lúc {result.booking.flight_time}
                      </p>
                      <p>Điểm đón: {result.booking.pickup_address ?? "Khách tự đến"}</p>
                      <p>Phi công: {result.booking.assigned_pilot_name ?? result.tracking.pilot_name ?? "Đang cập nhật"}</p>
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

            {shouldShowMap ? (
              <Card>
                <Panel className="stack">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <strong>Bản đồ GPS</strong>
                    {shouldPoll ? (
                      <Badge tone="success">
                        {trackingQuery.isFetching ? "Đang đồng bộ GPS..." : "Đang cập nhật tự động"}
                      </Badge>
                    ) : null}
                  </div>
                  <TrackingMap booking={result.booking} tracking={result.tracking} />
                </Panel>
              </Card>
            ) : (
              <Card>
                <Panel className="stack-sm">
                  <strong>Bản đồ sẽ hiển thị khi phi công bắt đầu đưa khách tới điểm bay.</strong>
                  <p>Không còn theo dõi đoạn phi công tự di chuyển tới điểm đón, nên khách chỉ thấy GPS từ lúc đã lên xe.</p>
                </Panel>
              </Card>
            )}
          </>
        ) : null}

        {!result && !trackingQuery.isFetching ? (
          <Card className="empty-state-card">
            <Panel className="stack-sm">
              <strong>Nhập thông tin đặt lịch để hiển thị dòng thời gian và vị trí GPS.</strong>
              <p>Ngay sau khi khách hàng đặt lịch thành công, lịch đặt có thể được tra cứu lại từ trang này.</p>
            </Panel>
          </Card>
        ) : null}
      </div>
    </SiteLayout>
  );
};
