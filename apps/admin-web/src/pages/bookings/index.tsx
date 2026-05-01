import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Panel, Select, Tabs, TabsList, TabsTrigger } from "@paragliding/ui";
import type { Booking } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

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

const formatDateTime = (booking: Booking) => `${booking.flight_date} - ${booking.flight_time}`;

export const BookingsPage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"active" | "cancelled">("active");
  const [pilotFilter, setPilotFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const { data: bookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminApi.listBookings()
  });
  const { data: pilots = [] } = useQuery({
    queryKey: ["admin-active-pilots"],
    queryFn: () => adminApi.listAccounts({ role: "PILOT", active: "true" })
  });

  const activeBookings = useMemo(
    () => bookings.filter((booking) => !cancelledStatuses.has(booking.approval_status)),
    [bookings]
  );
  const cancelledBookings = useMemo(
    () => bookings.filter((booking) => cancelledStatuses.has(booking.approval_status)),
    [bookings]
  );
  const tabBookings = tab === "active" ? activeBookings : cancelledBookings;
  const visibleBookings = useMemo(
    () =>
      tabBookings.filter((booking) => {
        const matchesPilot =
          !pilotFilter ||
          (pilotFilter === "__unassigned" ? !booking.assigned_pilot_phone : booking.assigned_pilot_phone === pilotFilter);
        const statusValue = cancelledStatuses.has(booking.approval_status) ? "CANCELLED" : booking.flight_status;
        const matchesStatus = !statusFilter || statusValue === statusFilter;
        return matchesPilot && matchesStatus;
      }),
    [pilotFilter, statusFilter, tabBookings]
  );

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge tone="success">Đặt lịch</Badge>
            <h1>Quản lý đặt lịch</h1>
            <p>Bấm vào một lịch đặt để xem chi tiết, gán phi công hoặc hủy.</p>
          </div>
          <div className="portal-heading__note">
            Lịch đặt đã hủy được tách sang tab riêng để danh sách đang vận hành gọn hơn.
          </div>
        </div>

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sách đặt lịch</h3>
                <p>Bảng chỉ hiển thị lịch đặt và trạng thái bay. Thao tác hủy nằm trong trang chi tiết.</p>
              </div>
              <Tabs value={tab} onValueChange={(value) => setTab(value as "active" | "cancelled")}>
                <TabsList className="admin-tabs">
                  <TabsTrigger value="active">
                    Đang hoạt động <span>{activeBookings.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Đã hủy <span>{cancelledBookings.length}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="admin-filter-bar">
              <Field label="Lọc theo phi công">
                <Select value={pilotFilter} onChange={(event) => setPilotFilter(event.target.value)}>
                  <option value="">Tất cả phi công</option>
                  <option value="__unassigned">Chưa gán phi công</option>
                  {pilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.phone}>
                      {pilot.full_name} - {pilot.phone}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Lọc theo trạng thái">
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Tất cả trạng thái</option>
                  <option value="WAITING_CONFIRMATION">Chờ xác nhận</option>
                  <option value="WAITING">Đang chờ</option>
                  <option value="PICKING_UP">Phi công đang đến điểm đón</option>
                  <option value="EN_ROUTE">Đang di chuyển</option>
                  <option value="FLYING">Đang bay</option>
                  <option value="LANDED">Đã hạ cánh</option>
                  <option value="CANCELLED">Đã hủy</option>
                </Select>
              </Field>
            </div>

            <DataTable<Booking>
              data={visibleBookings}
              getRowKey={(row) => row.code}
              onRowClick={(row) => navigate(`/bookings/${row.code}`)}
              columns={[
                {
                  key: "booking",
                  title: "Đặt lịch",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.code}</strong>
                      <span>{row.customer_name}</span>
                      <small>{row.email}</small>
                    </div>
                  )
                },
                {
                  key: "service",
                  title: "Dịch vụ",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.service_name}</strong>
                      <span>{formatDateTime(row)}</span>
                      <small>{row.adults + row.children} khách</small>
                    </div>
                  )
                },
                {
                  key: "flight",
                  title: "Trạng thái",
                  render: (row) => <Badge>{flightLabels[row.flight_status] ?? row.flight_status}</Badge>
                },
                {
                  key: "pilot",
                  title: "Phi công",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.assigned_pilot_name ?? "Chưa gán"}</strong>
                      <span>{row.assigned_pilot_phone ?? "Gán trong chi tiết"}</span>
                    </div>
                  )
                },
                {
                  key: "payment",
                  title: "Thanh toán",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{formatCurrency(row.final_total)}</strong>
                      <span>{paymentLabels[row.payment_status] ?? row.payment_status}</span>
                    </div>
                  )
                },
                {
                  key: "open",
                  title: "",
                  render: (row) => (
                    <Button
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/bookings/${row.code}`);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  )
                }
              ]}
            />
          </Panel>
        </Card>
      </div>
    </AdminLayout>
  );
};
