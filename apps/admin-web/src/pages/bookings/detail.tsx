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
  WAITING_CONFIRMATION: "Cho xac nhan",
  WAITING: "Dang cho",
  PICKING_UP: "Dang di chuyen den diem don",
  EN_ROUTE: "Dang di chuyen",
  FLYING: "Dang bay",
  LANDED: "Da ha canh"
};

const statusLabel = (booking: Booking) => {
  if (cancelledStatuses.has(booking.approval_status)) {
    return "Da huy";
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
            <Badge>Booking detail</Badge>
            <h1>{booking?.code ?? code}</h1>
            <p>Trang nay chi hien thong tin cua booking dang chon.</p>
          </div>
          <Link to={routes.bookings}>
            <Button variant="secondary">Quay lai danh sach</Button>
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
                <Badge>{booking.payment_status}</Badge>
              </div>

              <div className="detail-list">
                <div>
                  <span>Ma booking</span>
                  <strong>{booking.code}</strong>
                </div>
                <div>
                  <span>Trang thai booking</span>
                  <strong>{statusLabel(booking)}</strong>
                </div>
                <div>
                  <span>Thoi gian tao booking</span>
                  <strong>{formatDateTime(booking.created_at)}</strong>
                </div>
                <div>
                  <span>Ten khach hang</span>
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
                  <strong>{booking.notes || "Khong co ghi chu"}</strong>
                </div>
                <div>
                  <span>Xe don</span>
                  <strong>{booking.pickup_option === "pickup" ? "Xe den don" : "Khach tu den"}</strong>
                </div>
                {booking.pickup_option === "pickup" ? (
                  <div>
                    <span>Dia chi don</span>
                    <strong>{booking.pickup_address}</strong>
                  </div>
                ) : null}
              </div>

              {!cancelledStatuses.has(booking.approval_status) ? (
                <div className="booking-decision-card">
                  <div className="admin-card__header">
                    <div>
                      <strong>Pilot phu trach</strong>
                      <p>Chon pilot phu trach booking nay.</p>
                    </div>
                    {booking.assigned_pilot_name ? <Badge>{booking.assigned_pilot_name}</Badge> : null}
                  </div>
                  <Field label="Chon pilot">
                    <Select value={selectedPilotPhone} onChange={(event) => setSelectedPilotPhone(event.target.value)}>
                      <option value="">Chon pilot</option>
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
                    {booking.approval_status === "PENDING" ? "Xac nhan va gan pilot" : "Luu pilot"}
                  </Button>
                </div>
              ) : null}

              {!cancelledStatuses.has(booking.approval_status) ? (
                <div className="table-actions--inline">
                  <Button variant="secondary" onClick={() => setCancelModalOpen(true)}>
                    Huy booking
                  </Button>
                </div>
              ) : (
                <div className="booking-decision-card booking-decision-card--danger">
                  <strong>Ly do huy</strong>
                  <p>{booking.rejection_reason ?? "Khong co ly do"}</p>
                </div>
              )}

              {reviewMutation.error instanceof Error ? <p className="form-error">{reviewMutation.error.message}</p> : null}
              {assignPilotMutation.error instanceof Error ? <p className="form-error">{assignPilotMutation.error.message}</p> : null}
              {cancelMutation.error instanceof Error ? <p className="form-error">{cancelMutation.error.message}</p> : null}
            </Panel>
          </Card>
        ) : (
          <Card>
            <Panel>Dang tai booking...</Panel>
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
          title={`Huy booking ${booking?.code ?? code}`}
          description="Email thong bao huy booking se duoc gui den khach hang sau khi xac nhan."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={closeCancelDialog}>
                Dong
              </Button>
              <Button type="button" disabled={!cancelReason.trim() || cancelMutation.isPending} onClick={cancelBooking}>
                {cancelMutation.isPending ? "Dang huy..." : "Huy booking"}
              </Button>
            </>
          }
        >
          <Field label="Ly do huy">
            <Textarea
              value={cancelReason}
              onChange={(event) => setCancelReason(event.target.value)}
              placeholder="Nhap ly do huy booking"
              autoFocus
            />
          </Field>
          {cancelMutation.error instanceof Error ? <p className="form-error">{cancelMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
