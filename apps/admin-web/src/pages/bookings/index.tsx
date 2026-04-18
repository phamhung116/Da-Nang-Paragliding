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
  WAITING_CONFIRMATION: "Cho xac nhan",
  WAITING: "Dang cho",
  PICKING_UP: "Dang di chuyen den diem don",
  EN_ROUTE: "Dang di chuyen",
  FLYING: "Dang bay",
  LANDED: "Da ha canh"
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
            <Badge tone="success">Bookings</Badge>
            <h1>Booking operations</h1>
            <p>Click vao mot booking de xem chi tiet, gan pilot hoac huy booking.</p>
          </div>
          <div className="portal-heading__note">
            Booking da huy duoc tach sang tab rieng de danh sach dang van hanh gon hon.
          </div>
        </div>

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sach booking</h3>
                <p>Bang chi hien booking va trang thai bay. Thao tac huy nam trong trang chi tiet.</p>
              </div>
              <Tabs value={tab} onValueChange={(value) => setTab(value as "active" | "cancelled")}>
                <TabsList className="admin-tabs">
                  <TabsTrigger value="active">
                    Danh sach bookings <span>{activeBookings.length}</span>
                  </TabsTrigger>
                  <TabsTrigger value="cancelled">
                    Bookings da huy <span>{cancelledBookings.length}</span>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="admin-filter-bar">
              <Field label="Loc theo pilot">
                <Select value={pilotFilter} onChange={(event) => setPilotFilter(event.target.value)}>
                  <option value="">Tat ca pilot</option>
                  <option value="__unassigned">Chua gan pilot</option>
                  {pilots.map((pilot) => (
                    <option key={pilot.id} value={pilot.phone}>
                      {pilot.full_name} - {pilot.phone}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Loc theo trang thai">
                <Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  <option value="">Tat ca trang thai</option>
                  <option value="WAITING_CONFIRMATION">Cho xac nhan</option>
                  <option value="WAITING">Dang cho</option>
                  <option value="PICKING_UP">Dang di chuyen den diem don</option>
                  <option value="EN_ROUTE">Dang di chuyen</option>
                  <option value="FLYING">Dang bay</option>
                  <option value="LANDED">Da ha canh</option>
                  <option value="CANCELLED">Da huy</option>
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
                  title: "Booking",
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
                  title: "Dich vu",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.service_name}</strong>
                      <span>{formatDateTime(row)}</span>
                      <small>{row.adults + row.children} khach</small>
                    </div>
                  )
                },
                {
                  key: "flight",
                  title: "Trang thai",
                  render: (row) => <Badge>{flightLabels[row.flight_status] ?? row.flight_status}</Badge>
                },
                {
                  key: "pilot",
                  title: "Pilot",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.assigned_pilot_name ?? "Chua gan"}</strong>
                      <span>{row.assigned_pilot_phone ?? "Gan trong chi tiet"}</span>
                    </div>
                  )
                },
                {
                  key: "payment",
                  title: "Thanh toan",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{formatCurrency(row.final_total)}</strong>
                      <span>{row.payment_status}</span>
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
                      Xem chi tiet
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
