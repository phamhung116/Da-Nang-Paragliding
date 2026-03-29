import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Panel, Select, Textarea } from "@paragliding/ui";
import type { Account, Booking } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

export const BookingRequestsPage = () => {
  const queryClient = useQueryClient();
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [pilotSelections, setPilotSelections] = useState<Record<string, string>>({});

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-booking-requests"],
    queryFn: () => adminApi.listBookingRequests()
  });

  const { data: confirmedBookings = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminApi.listBookings()
  });

  const { data: activePilots = [] } = useQuery({
    queryKey: ["admin-active-pilots"],
    queryFn: () => adminApi.listAccounts({ role: "PILOT", active: "true" })
  });

  const metrics = useMemo(
    () => [
      { label: "Requests", value: requests.length },
      { label: "Cash", value: requests.filter((item) => item.payment_method === "cash").length },
      { label: "Online", value: requests.filter((item) => item.payment_method !== "cash").length }
    ],
    [requests]
  );

  const reviewMutation = useMutation({
    mutationFn: ({
      code,
      decision,
      reason,
      pilot_name,
      pilot_phone
    }: {
      code: string;
      decision: "confirm" | "reject";
      reason?: string;
      pilot_name?: string;
      pilot_phone?: string;
    }) => adminApi.reviewBooking(code, { decision, reason, pilot_name, pilot_phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-booking-requests"] });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  const getAvailablePilots = (booking: Booking): Account[] => {
    const busyPhones = new Set(
      confirmedBookings
        .filter(
          (item) =>
            item.flight_date === booking.flight_date &&
            item.flight_time === booking.flight_time &&
            item.assigned_pilot_phone
        )
        .map((item) => item.assigned_pilot_phone)
    );

    return activePilots.filter((pilot) => !busyPhones.has(pilot.phone));
  };

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Pending approval</Badge>
            <h1>Booking requests</h1>
            <p>Approve each request only when there is still a free pilot for the selected flight slot.</p>
          </div>
          <div className="portal-heading__note">
            Slot logic now follows pilot capacity. If all pilots are already occupied in one time block, approval is blocked.
          </div>
        </div>

        <div className="portal-metrics">
          {metrics.map((metric) => (
            <Card key={metric.label}>
              <Panel className="portal-metric">
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </Panel>
            </Card>
          ))}
        </div>

        <Card>
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Approval queue</h3>
                <p>Choose a free pilot on approval. Reject requires a reason and releases the reserved slot.</p>
              </div>
            </div>

            <DataTable<Booking>
              data={requests}
              columns={[
                {
                  key: "customer",
                  title: "Customer",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.customer_name}</strong>
                      <span>{row.phone}</span>
                      <small>{row.email}</small>
                    </div>
                  )
                },
                {
                  key: "service",
                  title: "Flight",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.service_name}</strong>
                      <span>
                        {row.flight_date} - {row.flight_time}
                      </span>
                      <small>
                        {row.adults} adults / {row.children} children
                      </small>
                    </div>
                  )
                },
                {
                  key: "pilot",
                  title: "Available pilot",
                  render: (row) => {
                    const availablePilots = getAvailablePilots(row);
                    return (
                      <div className="inline-field-grid">
                        <Select
                          value={pilotSelections[row.code] ?? ""}
                          onChange={(event) =>
                            setPilotSelections((current) => ({
                              ...current,
                              [row.code]: event.target.value
                            }))
                          }
                        >
                          <option value="">Select pilot</option>
                          {availablePilots.map((pilot) => (
                            <option key={pilot.id} value={pilot.phone}>
                              {pilot.full_name}
                            </option>
                          ))}
                        </Select>
                        <small className="portal-heading__note">
                          {availablePilots.length > 0
                            ? `${availablePilots.length} pilot(s) free in this slot`
                            : "No pilot left for this slot"}
                        </small>
                      </div>
                    );
                  }
                },
                {
                  key: "decision",
                  title: "Decision",
                  render: (row) => {
                    const availablePilots = getAvailablePilots(row);
                    const selectedPilot = availablePilots.find((pilot) => pilot.phone === pilotSelections[row.code]);
                    return (
                      <div className="inline-field-grid">
                        <Textarea
                          placeholder="Reason if rejected"
                          value={reasons[row.code] ?? ""}
                          onChange={(event) =>
                            setReasons((current) => ({
                              ...current,
                              [row.code]: event.target.value
                            }))
                          }
                        />
                        <div className="table-actions--inline">
                          <Button
                            variant="secondary"
                            disabled={!selectedPilot}
                            onClick={() =>
                              reviewMutation.mutate({
                                code: row.code,
                                decision: "confirm",
                                pilot_name: selectedPilot?.full_name,
                                pilot_phone: selectedPilot?.phone
                              })
                            }
                          >
                            Approve + assign
                          </Button>
                          <Button
                            onClick={() =>
                              reviewMutation.mutate({
                                code: row.code,
                                decision: "reject",
                                reason: reasons[row.code]
                              })
                            }
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    );
                  }
                }
              ]}
            />
          </Panel>
        </Card>
      </div>
    </AdminLayout>
  );
};
