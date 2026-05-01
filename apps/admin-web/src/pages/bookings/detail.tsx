import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Panel, Select, Textarea } from "@paragliding/ui";
import type { Account, Booking } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";

const cancelledStatuses = new Set(["CANCELLED", "REJECTED"]);

const flightLabels: Record<string, string> = {
  WAITING_CONFIRMATION: "Chờ xác nhận",
  WAITING: "Đang chờ",
  PICKING_UP: "Phi công đang đến điểm đón",
  EN_ROUTE: "Đang di chuyển",
  FLYING: "Đang bay",
  LANDED: "Đã hạ cánh"
};

const paymentLabels: Record<string, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDED: "Đã hoàn tiền"
};

const statusLabel = (booking: Booking) => {
  if (cancelledStatuses.has(booking.approval_status)) {
    return "Đã hủy";
  }
  return flightLabels[booking.flight_status] ?? booking.flight_status;
};

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "-");

export const BookingDetailPage = () => {
  const { code = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedPilotPhone, setSelectedPilotPhone] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["admin-booking", code],
    queryFn: () => adminApi.getBooking(code),
    enabled: Boolean(code)
  });

  const { data: activePilots = [] } = useQuery({
    queryKey: ["admin-active-pilots"],
    queryFn: () => adminApi.listAccounts({ role: "PILOT", active: "true" })
  });

  const booking = bookingQuery.data;
  const selectedPilot = activePilots.find((pilot) => pilot.phone === selectedPilotPhone);

  useEffect(() => {
    if (booking && !selectedPilotPhone) {
      setSelectedPilotPhone(booking.assigned_pilot_phone ?? "");
    }
  }, [booking, selectedPilotPhone]);

  const reviewMutation = useMutation({
    mutationFn: ({ pilot }: { pilot: Account }) =>
      adminApi.reviewBooking(code, {
        decision: "confirm",
        pilot_name: pilot.full_name,
        pilot_phone: pilot.phone
      }),
    onSuccess: (nextBooking) => {
      queryClient.setQueryData(["admin-booking", code], nextBooking);
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      setCancelModalOpen(false);
      setCancelReason("");
    }
  });

  const assignPilotMutation = useMutation({
    mutationFn: ({ pilot }: { pilot: Account }) =>
      adminApi.assignPilot(code, { pilot_name: pilot.full_name, pilot_phone: pilot.phone }),
    onSuccess: (nextBooking) => {
      queryClient.setQueryData(["admin-booking", code], nextBooking);
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: (reason: string) => adminApi.cancelBooking(code, { reason }),
    onSuccess: (nextBooking) => {
      queryClient.setQueryData(["admin-booking", code], nextBooking);
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  if (!code) {
    return <Navigate to={routes.bookings} replace />;
  }

  const savePilot = () => {
    if (!booking || !selectedPilot) {
      return;
    }
    if (booking.approval_status === "PENDING") {
      reviewMutation.mutate({ pilot: selectedPilot });
      return;
    }
    assignPilotMutation.mutate({ pilot: selectedPilot });
  };

  const cancelBooking = () => {
    const reason = cancelReason.trim();
    if (!reason) {
      return;
    }
    cancelMutation.mutate(reason);
  };

  const closeCancelDialog = () => {
    if (cancelMutation.isPending) {
      return;
    }
    setCancelModalOpen(false);
    setCancelReason("");
  };

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Chi tiết đặt lịch</Badge>
            <h1>{booking?.code ?? code}</h1>
            <p>Trang này hiển thị thông tin của lịch đặt đang chọn.</p>
          </div>
          <Link to={routes.bookings}>
            <Button variant="secondary">Quay lại danh sách</Button>
          </Link>
        </div>

        {bookingQuery.error instanceof Error ? <p className="form-error">{bookingQuery.error.message}</p> : null}

        {booking ? (
          <Card className="admin-detail-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <Badge tone={cancelledStatuses.has(booking.approval_status) ? "danger" : "success"}>
                    {statusLabel(booking)}
                  </Badge>
                  <h3>{booking.service_name}</h3>
                  <p>{formatCurrency(booking.final_total)}</p>
                </div>
                <Badge>{paymentLabels[booking.payment_status] ?? booking.payment_status}</Badge>
              </div>

              <div className="detail-list">
                <div>
                  <span>Mã đặt lịch</span>
                  <strong>{booking.code}</strong>
                </div>
                <div>
                  <span>Trạng thái đặt lịch</span>
                  <strong>{statusLabel(booking)}</strong>
                </div>
                <div>
                  <span>Thời gian tạo đặt lịch</span>
                  <strong>{formatDateTime(booking.created_at)}</strong>
                </div>
                <div>
                  <span>Tên khách hàng</span>
                  <strong>{booking.customer_name}</strong>
                </div>
                <div>
                  <span>Số điện thoại</span>
                  <strong>{booking.phone}</strong>
                </div>
                <div>
                  <span>Email</span>
                  <strong>{booking.email}</strong>
                </div>
                <div>
                  <span>Lịch bay</span>
                  <strong>
                    {booking.flight_date} - {booking.flight_time}
                  </strong>
                </div>
                <div>
                  <span>Số người lớn</span>
                  <strong>{booking.adults}</strong>
                </div>
                <div>
                  <span>Số trẻ em</span>
                  <strong>{booking.children}</strong>
                </div>
                <div>
                  <span>Ghi chú</span>
                  <strong>{booking.notes || "Không có ghi chú"}</strong>
                </div>
                <div>
                  <span>Xe đón</span>
                  <strong>{booking.pickup_option === "pickup" ? "Xe đến đón" : "Khách tự đến"}</strong>
                </div>
                {booking.pickup_option === "pickup" ? (
                  <div>
                    <span>Địa chỉ đón</span>
                    <strong>{booking.pickup_address}</strong>
                  </div>
                ) : null}
              </div>

              {!cancelledStatuses.has(booking.approval_status) ? (
                <div className="booking-decision-card">
                  <div className="admin-card__header">
                    <div>
                      <strong>Phi công phụ trách</strong>
                      <p>Chọn phi công phụ trách lịch đặt này.</p>
                    </div>
                    {booking.assigned_pilot_name ? <Badge>{booking.assigned_pilot_name}</Badge> : null}
                  </div>
                  <Field label="Chọn phi công">
                    <Select value={selectedPilotPhone} onChange={(event) => setSelectedPilotPhone(event.target.value)}>
                      <option value="">Chọn phi công</option>
                      {activePilots.map((pilot) => (
                        <option key={pilot.id} value={pilot.phone}>
                          {pilot.full_name} - {pilot.phone}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    disabled={!selectedPilot || reviewMutation.isPending || assignPilotMutation.isPending}
                    onClick={savePilot}
                  >
                    {booking.approval_status === "PENDING" ? "Xác nhận và gán phi công" : "Lưu phi công"}
                  </Button>
                </div>
              ) : null}

              {!cancelledStatuses.has(booking.approval_status) ? (
                <div className="table-actions--inline">
                  <Button variant="secondary" onClick={() => setCancelModalOpen(true)}>
                    Hủy lịch đặt
                  </Button>
                </div>
              ) : (
                <div className="booking-decision-card booking-decision-card--danger">
                  <strong>Lý do hủy</strong>
                  <p>{booking.rejection_reason ?? "Không có lý do"}</p>
                </div>
              )}

              {reviewMutation.error instanceof Error ? <p className="form-error">{reviewMutation.error.message}</p> : null}
              {assignPilotMutation.error instanceof Error ? <p className="form-error">{assignPilotMutation.error.message}</p> : null}
              {cancelMutation.error instanceof Error ? <p className="form-error">{cancelMutation.error.message}</p> : null}
            </Panel>
          </Card>
        ) : (
          <Card>
            <Panel>Đang tải lịch đặt...</Panel>
          </Card>
        )}

        <Dialog
          open={cancelModalOpen}
          onOpenChange={(open) => {
            if (open) {
              setCancelModalOpen(true);
            } else {
              closeCancelDialog();
            }
          }}
          title={`Hủy lịch đặt ${booking?.code ?? code}`}
          description="Email thông báo hủy lịch đặt sẽ được gửi đến khách hàng sau khi xác nhận."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={closeCancelDialog}>
                Đóng
              </Button>
              <Button type="button" disabled={!cancelReason.trim() || cancelMutation.isPending} onClick={cancelBooking}>
                {cancelMutation.isPending ? "Đang hủy..." : "Hủy lịch đặt"}
              </Button>
            </>
          }
        >
          <Field label="Lý do hủy">
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Nhập lý do hủy lịch đặt"
              autoFocus
            />
          </Field>
          {cancelMutation.error instanceof Error ? <p className="form-error">{cancelMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
