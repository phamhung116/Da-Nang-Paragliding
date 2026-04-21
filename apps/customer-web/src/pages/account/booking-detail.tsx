import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Container, Dialog, Field, Input, Panel, Textarea } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { customerApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { approvalStatusLabels, flightStatusLabels, paymentStatusLabels } from "@/shared/constants/status";
import { formatCurrency } from "@/shared/lib/format";
import { SiteLayout } from "@/widgets/layout/site-layout";

const cancelledStatuses = new Set(["CANCELLED", "REJECTED"]);

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "-");

export const AccountBookingDetailPage = () => {
  const { code = "" } = useParams();
  const { isAuthenticated } = useAuth();
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
              <Badge>Chi tiet booking</Badge>
              <h2>{booking?.code ?? code}</h2>
            </div>
            <Link to={routes.account}>
              <Button variant="secondary">Quay lai tai khoan</Button>
            </Link>
          </div>

          {booking ? (
            <Card>
              <Panel className="stack">
                <div className="tracking-status-header">
                  <div>
                    <Badge tone={cancelledStatuses.has(booking.approval_status) ? "danger" : "success"}>
                      {cancelledStatuses.has(booking.approval_status)
                        ? "Da huy"
                        : flightStatusLabels[booking.flight_status] ?? booking.flight_status}
                    </Badge>
                    <h3>{booking.service_name}</h3>
                  </div>
                  <Badge>{paymentStatusLabels[booking.payment_status] ?? booking.payment_status}</Badge>
                </div>

                <div className="detail-list">
                  <div>
                    <span>Ma booking</span>
                    <strong>{booking.code}</strong>
                  </div>
                  <div>
                    <span>Trang thai</span>
                    <strong>{approvalStatusLabels[booking.approval_status] ?? booking.approval_status}</strong>
                  </div>
                  <div>
                    <span>Thoi gian tao booking</span>
                    <strong>{formatDateTime(booking.created_at)}</strong>
                  </div>
                  <div>
                    <span>Ho va ten</span>
                    <strong>{booking.customer_name}</strong>
                  </div>
                  <div>
                    <span>So dien thoai</span>
                    <strong>{booking.phone}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{booking.email}</strong>
                  </div>
                  <div>
                    <span>Lich bay</span>
                    <strong>
                      {booking.flight_date} - {booking.flight_time}
                    </strong>
                  </div>
                  <div>
                    <span>So nguoi lon</span>
                    <strong>{booking.adults}</strong>
                  </div>
                  <div>
                    <span>So tre em</span>
                    <strong>{booking.children}</strong>
                  </div>
                  <div>
                    <span>Ghi chu</span>
                    <strong>{booking.notes || "Không có ghi chú"}</strong>
                  </div>
                  <div>
                    <span>Pilot phu trach</span>
                    <strong>{booking.assigned_pilot_name ?? "Đang cập nhật"}</strong>
                  </div>
                  <div>
                    <span>Tong gia tri tour</span>
                    <strong>{formatCurrency(booking.final_total)}</strong>
                  </div>
                </div>

                {!cancelledStatuses.has(booking.approval_status) ? (
                  <Button variant="secondary" onClick={() => setCancelModalOpen(true)}>
                    Huy booking
                  </Button>
                ) : (
                  <div className="booking-decision-card booking-decision-card--danger">
                    <strong>Ly do huy</strong>
                    <p>{booking.rejection_reason ?? "Không có lý do"}</p>
                  </div>
                )}
              </Panel>
            </Card>
          ) : (
            <Card>
              <Panel>Đang tải booking hoặc booking không tồn tại trong tài khoản này.</Panel>
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
            title={`Huy booking ${booking?.code ?? code}`}
            description="Huy truoc ngay bay 5 ngay: hoan 100% tien coc. Huy sau moc 5 ngay: khong hoan coc."
            icon="!"
            footer={
              <>
                <Button type="button" variant="secondary" onClick={closeCancelDialog}>
                  Dong
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
                  {cancelMutation.isPending ? "Đang hủy..." : "Hủy booking"}
                </Button>
              </>
            }
          >
            <Field label="Ly do huy">
              <Textarea value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Nhap ly do huy booking" autoFocus />
            </Field>
            {canRefundDeposit ? (
              <div className="inline-field-grid inline-field-grid--three">
                <Field label="Ngan hang">
                  <Input value={refundBank} onChange={(event) => setRefundBank(event.target.value)} />
                </Field>
                <Field label="So tai khoan">
                  <Input value={refundAccountNumber} onChange={(event) => setRefundAccountNumber(event.target.value)} />
                </Field>
                <Field label="Chu tai khoan">
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
