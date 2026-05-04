import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { approvalStatusLabels, flightStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { formatCurrency, formatDateTime } from "@/shared/lib/format";
import { localizeBookingServiceName } from "@/shared/lib/localized-content";
import { useI18n } from "@/shared/providers/i18n-provider";
import { SiteLayout } from "@/widgets/layout/site-layout";

const cancelledStatuses = new Set(["CANCELLED", "REJECTED"]);

export const AccountBookingDetailPage = () => {
  const { code = "" } = useParams();
  const { isAuthenticated } = useAuth();
  const { locale, tText } = useI18n();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");
  const [refundBank, setRefundBank] = useState("");
  const [refundAccountNumber, setRefundAccountNumber] = useState("");
  const [refundAccountName, setRefundAccountName] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const { data: bookings = [] } = useQuery({
    queryKey: ["my-bookings"],
    queryFn: () => customerApi.getMyBookings(),
    enabled: isAuthenticated
  });

  const booking = bookings.find((item) => item.code === code);
  const serviceName = booking ? localizeBookingServiceName(booking, locale) : "";
  const canRefundDeposit = useMemo(() => {
    if (!booking) {
      return false;
    }
    const flightDate = new Date(`${booking.flight_date}T00:00:00`);
    const diffDays = Math.ceil((flightDate.getTime() - Date.now()) / 86_400_000);
    return diffDays >= 5;
  }, [booking]);

  const cancelMutation = useMutation({
    mutationFn: () =>
      customerApi.cancelMyBooking(code, {
        reason,
        refund_bank: canRefundDeposit ? refundBank : undefined,
        refund_account_number: canRefundDeposit ? refundAccountNumber : undefined,
        refund_account_name: canRefundDeposit ? refundAccountName : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      setCancelModalOpen(false);
      setReason("");
      setRefundBank("");
      setRefundAccountNumber("");
      setRefundAccountName("");
    }
  });

  if (!isAuthenticated) {
    return <Navigate to={routes.login} replace />;
  }

  const cancelBooking = () => {
    if (!reason.trim()) {
      return;
    }
    if (canRefundDeposit && (!refundBank.trim() || !refundAccountNumber.trim() || !refundAccountName.trim())) {
      return;
    }
    cancelMutation.mutate();
  };

  const closeCancelDialog = () => {
    if (cancelMutation.isPending) {
      return;
    }
    setCancelModalOpen(false);
    setReason("");
    setRefundBank("");
    setRefundAccountNumber("");
    setRefundAccountName("");
  };

  return (
    <SiteLayout>
      <section className="section">
        <Container className="stack">
          <div className="section-heading">
            <div>
              <Badge>{tText("Chi tiết đặt lịch")}</Badge>
              <h2>{booking?.code ?? code}</h2>
            </div>
            <Link to={routes.account}>
              <Button variant="secondary">{tText("Quay lại tài khoản")}</Button>
            </Link>
          </div>

          {booking ? (
            <Card>
              <Panel className="stack">
                <div className="tracking-status-header">
                  <div>
                    <Badge tone={cancelledStatuses.has(booking.approval_status) ? "danger" : "success"}>
                      {cancelledStatuses.has(booking.approval_status)
                        ? tText("Đã hủy")
                        : tText(flightStatusLabels[booking.flight_status] ?? booking.flight_status)}
                    </Badge>
                    <h3>{serviceName || booking.service_name}</h3>
                  </div>
                  <Badge>{tText(paymentStatusLabels[booking.payment_status] ?? booking.payment_status)}</Badge>
                </div>

                <div className="detail-list">
                  <div>
                    <span>{tText("Mã đặt lịch")}</span>
                    <strong>{booking.code}</strong>
                  </div>
                  <div>
                    <span>{tText("Trạng thái")}</span>
                    <strong>{tText(approvalStatusLabels[booking.approval_status] ?? booking.approval_status)}</strong>
                  </div>
                  <div>
                    <span>{tText("Thời gian tạo đặt lịch")}</span>
                    <strong>{formatDateTime(booking.created_at)}</strong>
                  </div>
                  <div>
                    <span>{tText("Họ và tên")}</span>
                    <strong>{booking.customer_name}</strong>
                  </div>
                  <div>
                    <span>{tText("Số điện thoại")}</span>
                    <strong>{booking.phone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{booking.email}</strong>
                  </div>
                  <div>
                    <span>{tText("Lịch bay")}</span>
                    <strong>
                      {booking.flight_date} - {booking.flight_time}
                    </strong>
                  </div>
                  <div>
                    <span>{tText("Số người lớn")}</span>
                    <strong>{booking.adults}</strong>
                  </div>
                  <div>
                    <span>{tText("Số trẻ em")}</span>
                    <strong>{booking.children}</strong>
                  </div>
                  <div>
                    <span>{tText("Ghi chú")}</span>
                    <strong>{booking.notes || tText("Không có ghi chú")}</strong>
                  </div>
                  <div>
                    <span>{tText("Phi công phụ trách")}</span>
                    <strong>{booking.assigned_pilot_name ?? tText("Đang cập nhật")}</strong>
                  </div>
                  <div>
                    <span>{tText("Tổng giá trị tour")}</span>
                    <strong>{formatCurrency(booking.final_total)}</strong>
                  </div>
                </div>

                {!cancelledStatuses.has(booking.approval_status) ? (
                  <Button variant="secondary" onClick={() => setCancelModalOpen(true)}>
                    {tText("Hủy lịch đặt")}
                  </Button>
                ) : (
                  <div className="booking-decision-card booking-decision-card--danger">
                    <strong>{tText("Lý do hủy")}</strong>
                    <p>{booking.rejection_reason ?? tText("Không có lý do")}</p>
                  </div>
                )}
              </Panel>
            </Card>
          ) : (
            <Card>
              <Panel>{tText("Đang tải lịch đặt hoặc lịch đặt không tồn tại trong tài khoản này.")}</Panel>
            </Card>
          )}

          <Dialog
            open={cancelModalOpen && Boolean(booking)}
            onOpenChange={(open) => {
              if (open) {
                setCancelModalOpen(true);
              } else {
                closeCancelDialog();
              }
            }}
            title={`${tText("Hủy lịch đặt")} ${booking?.code ?? code}`}
            description={tText("Hủy trước ngày bay 5 ngày: hoàn 100% tiền cọc. Hủy sau mốc 5 ngày: không hoàn cọc.")}
            icon="!"
            footer={
              <>
                <Button type="button" variant="secondary" onClick={closeCancelDialog}>
                  {tText("Đóng")}
                </Button>
                <Button
                  type="button"
                  disabled={
                    cancelMutation.isPending ||
                    !reason.trim() ||
                    (canRefundDeposit && (!refundBank.trim() || !refundAccountNumber.trim() || !refundAccountName.trim()))
                  }
                  onClick={cancelBooking}
                >
                  {cancelMutation.isPending ? tText("Đang hủy...") : tText("Hủy lịch đặt")}
                </Button>
              </>
            }
          >
            <Field label={tText("Lý do hủy")}>
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder={tText("Nhập lý do hủy lịch đặt")} autoFocus />
            </Field>
            {canRefundDeposit ? (
              <div className="inline-field-grid inline-field-grid--three">
                <Field label={tText("Ngân hàng")}>
                  <Input value={refundBank} onChange={(event) => setRefundBank(event.target.value)} />
                </Field>
                <Field label={tText("Số tài khoản")}>
                  <Input value={refundAccountNumber} onChange={(event) => setRefundAccountNumber(event.target.value)} />
                </Field>
                <Field label={tText("Chủ tài khoản")}>
                  <Input value={refundAccountName} onChange={(event) => setRefundAccountName(event.target.value)} />
                </Field>
              </div>
            ) : null}
            {cancelMutation.error instanceof Error ? <p className="form-error">{cancelMutation.error.message}</p> : null}
          </Dialog>
        </Container>
      </section>
    </SiteLayout>
  );
};
