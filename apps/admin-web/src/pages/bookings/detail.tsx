import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Panel, Select, Textarea } from "@paragliding/ui";
import type { Account, Booking } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { formatCurrency } from "@/shared/lib/format";
import { AdminBookingTrackingMap } from "@/widgets/tracking-map/admin-booking-tracking-map";
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

const bookingStatusBadgeProps = (booking: Booking) => {
  if (booking.flight_status === "LANDED" && !cancelledStatuses.has(booking.approval_status)) {
    return { tone: "success" as const };
  }
  if (booking.flight_status === "WAITING_CONFIRMATION" && !cancelledStatuses.has(booking.approval_status)) {
    return { tone: "danger" as const };
  }
  return { className: "admin-booking-status--warning" };
};

const formatDateTime = (value: string | null) => (value ? new Date(value).toLocaleString("vi-VN") : "-");

export const BookingDetailPage = () => {
  const { code = "" } = useParams();
  const queryClient = useQueryClient();
  const [selectedDriverPhone, setSelectedDriverPhone] = useState("");
  const [selectedPilotPhone, setSelectedPilotPhone] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const bookingQuery = useQuery({
    queryKey: ["admin-booking", code],
    queryFn: () => adminApi.getBooking(code),
    enabled: Boolean(code)
  });

  const trackingQuery = useQuery({
    queryKey: ["admin-booking-tracking", code],
    queryFn: () => adminApi.getBookingTracking(code),
    enabled: Boolean(code)
  });

  const { data: activePilots = [] } = useQuery({
    queryKey: ["admin-active-pilots"],
    queryFn: () => adminApi.listAccounts({ role: "PILOT", active: "true" })
  });
  const { data: activeDrivers = [] } = useQuery({
    queryKey: ["admin-active-drivers"],
    queryFn: () => adminApi.listAccounts({ role: "DRIVER", active: "true" })
  });
  const { data: allBookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminApi.listBookings()
  });

  const booking = bookingQuery.data;
  const driverTripCounts = allBookings.reduce<Record<string, number>>((acc, item) => {
    if (item.assigned_driver_phone && item.flight_status === "LANDED") {
      acc[item.assigned_driver_phone] = (acc[item.assigned_driver_phone] ?? 0) + 1;
    }
    return acc;
  }, {});
  const pilotTripCounts = allBookings.reduce<Record<string, number>>((acc, item) => {
    if (item.assigned_pilot_phone && item.flight_status === "LANDED") {
      acc[item.assigned_pilot_phone] = (acc[item.assigned_pilot_phone] ?? 0) + 1;
    }
    return acc;
  }, {});
  const prioritizedDrivers = [...activeDrivers].sort((a, b) => (driverTripCounts[a.phone] ?? 0) - (driverTripCounts[b.phone] ?? 0));
  const prioritizedPilots = [...activePilots].sort((a, b) => (pilotTripCounts[a.phone] ?? 0) - (pilotTripCounts[b.phone] ?? 0));
  const selectedDriver = activeDrivers.find((driver) => driver.phone === selectedDriverPhone);
  const selectedPilot = activePilots.find((pilot) => pilot.phone === selectedPilotPhone);

  useEffect(() => {
    if (booking && !selectedDriverPhone) {
      setSelectedDriverPhone(booking.assigned_driver_phone ?? "");
    }
    if (booking && !selectedPilotPhone) {
      setSelectedPilotPhone(booking.assigned_pilot_phone ?? "");
    }
  }, [booking, selectedDriverPhone, selectedPilotPhone]);

  const reviewMutation = useMutation({
    mutationFn: ({ driver, pilot }: { driver: Account; pilot: Account }) =>
      adminApi.reviewBooking(code, {
        decision: "confirm",
        driver_name: driver.full_name,
        driver_phone: driver.phone,
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
    mutationFn: ({ driver, pilot }: { driver: Account; pilot: Account }) =>
      adminApi.assignPilot(code, {
        driver_name: driver.full_name,
        driver_phone: driver.phone,
        pilot_name: pilot.full_name,
        pilot_phone: pilot.phone
      }),
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
      setCancelModalOpen(false);
      setCancelReason("");
    }
  });

  if (!code) {
    return <Navigate to={routes.bookings} replace />;
  }

  const savePilot = () => {
    if (!booking || !selectedDriver || !selectedPilot) {
      return;
    }
    if (booking.approval_status === "PENDING") {
      reviewMutation.mutate({ driver: selectedDriver, pilot: selectedPilot });
      return;
    }
    assignPilotMutation.mutate({ driver: selectedDriver, pilot: selectedPilot });
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
                  <Badge {...bookingStatusBadgeProps(booking)}>
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
                  <Field label="Chọn tài xế">
                    <Select value={selectedDriverPhone} onChange={(event) => setSelectedDriverPhone(event.target.value)}>
                      <option value="">Chọn tài xế</option>
                      {prioritizedDrivers.map((driver) => (
                        <option key={driver.id} value={driver.phone}>
                          {driver.full_name} - {driver.phone} ({driverTripCounts[driver.phone] ?? 0} chuyến)
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Chọn phi công">
                    <Select value={selectedPilotPhone} onChange={(event) => setSelectedPilotPhone(event.target.value)}>
                      <option value="">Chọn phi công</option>
                      {prioritizedPilots.map((pilot) => (
                        <option key={pilot.id} value={pilot.phone}>
                          {pilot.full_name} - {pilot.phone} ({pilotTripCounts[pilot.phone] ?? 0} chuyến)
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Button
                    disabled={!selectedDriver || !selectedPilot || reviewMutation.isPending || assignPilotMutation.isPending}
                    onClick={savePilot}
                  >
                    {booking.approval_status === "PENDING" ? "Xác nhận và gán nhân sự" : "Lưu nhân sự"}
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

        {booking ? (
          <Card className="admin-detail-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <Badge>Theo dõi GPS</Badge>
                  <h3>Lộ trình booking</h3>
                  <p>Xem vị trí phi công và lộ trình được cập nhật từ app phi công.</p>
                </div>
                {booking.assigned_pilot_phone ? (
                  <a className="admin-call-pilot-button" href={`tel:${booking.assigned_pilot_phone}`}>
                    Gọi phi công
                  </a>
                ) : null}
              </div>
              {trackingQuery.error instanceof Error ? <p className="form-error">{trackingQuery.error.message}</p> : null}
              <AdminBookingTrackingMap booking={booking} tracking={trackingQuery.data ?? null} />
            </Panel>
          </Card>
        ) : null}

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
