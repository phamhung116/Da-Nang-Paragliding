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

import {
  ChevronRight,
} from "lucide-react"

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
      <div className="max-w-4xl mx-auto px-4 py-40">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter">Theo dõi hành trình</h2>
          <p className="text-stone-500">Nhập email của bạn để xem trạng thái chuyến bay hiện tại.</p>
        </div>
        {!isAuthenticated ? (
            <form className="max-w-md mx-auto space-y-4" onSubmit={handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Email hoac so dien thoai">
                <Input
                  className="w-full bg-stone-100 border-none rounded-2xl p-4 focus:ring-2 focus:ring-brand outline-none"
                  placeholder="Nhập email đã đặt lịch..." 
                  {...register("query", { required: true })} />
              </Field>
              <Button className="btn-primary w-full py-4">{mutation.isPending ? "Đang tra cứu..." : "Tra cứu booking"}</Button>
            </form>
          ) : null}
        
        <Container className="stack">

          {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

          {result ? (
            <>
              <Card>
                <Panel className="space-y-8">
                  <button 
                    type="button"
                    onClick={() => mutation.reset()}
                    className="flex items-center gap-2 text-stone-400 hover:text-brand transition-colors text-xs font-bold uppercase tracking-wider">
                    
                      <ChevronRight className="rotate-180" size={16} />
                      Quay lại tra cứu
                  </button>

                  <div className="tracking-status-header">
                    <div>
                      <Badge tone="success">{flightStatusLabels[result.booking.flight_status]}</Badge>
                      <h3>{result.booking.service_name}</h3>
                    </div>
                    <div className="tracking-contact-actions">
                      <p>{result.booking.email}</p>
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
          ) : null}
        </Container>
      </div>
    </SiteLayout>
  );
};
