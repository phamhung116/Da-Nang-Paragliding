import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Badge, Button, Card, Panel, Select } from "@paragliding/ui";
import type { Account, Booking } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { formatCurrency } from "@/shared/lib/format";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

const statusOptions = ["WAITING", "EN_ROUTE", "FLYING", "LANDED"] as const;

export const BookingsPage = () => {
  const queryClient = useQueryClient();
  const [pilotSelections, setPilotSelections] = useState<Record<string, string>>({});

  const { data = [] } = useQuery({
    queryKey: ["admin-bookings"],
    queryFn: () => adminApi.listBookings()
  });

  const { data: activePilots = [] } = useQuery({
    queryKey: ["admin-active-pilots"],
    queryFn: () => adminApi.listAccounts({ role: "PILOT", active: "true" })
  });

  const metrics = useMemo(
    () => [
      { label: "Confirmed", value: data.length },
      { label: "Assigned", value: data.filter((item) => item.assigned_pilot_name).length },
      { label: "Flying now", value: data.filter((item) => item.flight_status === "FLYING").length }
    ],
    [data]
  );

  const statusMutation = useMutation({
    mutationFn: ({ code, status }: { code: string; status: string }) => adminApi.updateFlightStatus(code, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  const assignPilotMutation = useMutation({
    mutationFn: ({ code, pilot_name, pilot_phone }: { code: string; pilot_name: string; pilot_phone: string }) =>
      adminApi.assignPilot(code, { pilot_name, pilot_phone }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  const getAvailablePilots = (booking: Booking): Account[] => {
    const busyPhones = new Set(
      data
        .filter(
          (item) =>
            item.code !== booking.code &&
            item.flight_date === booking.flight_date &&
            item.flight_time === booking.flight_time &&
            item.assigned_pilot_phone
        )
        .map((item) => item.assigned_pilot_phone)
    );

    return activePilots.filter((pilot) => !busyPhones.has(pilot.phone) || pilot.phone === booking.assigned_pilot_phone);
  };

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge tone="success">Flight operations</Badge>
            <h1>Confirmed bookings</h1>
            <p>Each booking can only hold one pilot, and one pilot can only serve one booking per slot.</p>
          </div>
          <div className="portal-heading__note">
            Reassignment stays limited to pilots that are still free at the same date and time.
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
                <h3>Ops board</h3>
                <p>Assign free pilots and update live flight status from a single operational table.</p>
              </div>
            </div>

            <DataTable<Booking>
              data={data}
              columns={[
                {
                  key: "booking",
                  title: "Booking",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>{row.code}</strong>
                      <span>{row.customer_name}</span>
                      <small>{row.service_name}</small>
                    </div>
                  )
                },
                {
                  key: "schedule",
                  title: "Schedule",
                  render: (row) => (
                    <div className="row-meta">
                      <strong>
                        {row.flight_date} - {row.flight_time}
                      </strong>
                      <small>{formatCurrency(row.final_total)}</small>
                    </div>
                  )
                },
                {
                  key: "pilot",
                  title: "Pilot",
                  render: (row) => {
                    const availablePilots = getAvailablePilots(row);
                    const selectedPhone = pilotSelections[row.code] ?? row.assigned_pilot_phone ?? "";
                    const selectedPilot = availablePilots.find((pilot) => pilot.phone === selectedPhone);
                    return (
                      <div className="inline-field-grid">
                        <Select
                          value={selectedPhone}
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
                        <div className="table-actions--inline">
                          <Button
                            variant="secondary"
                            disabled={!selectedPilot}
                            onClick={() =>
                              assignPilotMutation.mutate({
                                code: row.code,
                                pilot_name: selectedPilot?.full_name ?? "",
                                pilot_phone: selectedPilot?.phone ?? ""
                              })
                            }
                          >
                            Save pilot
                          </Button>
                          {row.assigned_pilot_name ? <Badge>{row.assigned_pilot_name}</Badge> : null}
                        </div>
                      </div>
                    );
                  }
                },
                {
                  key: "status",
                  title: "Flight status",
                  render: (row) => (
                    <div className="status-stack">
                      <Badge>{row.flight_status}</Badge>
                      <Select
                        defaultValue={row.flight_status}
                        onChange={(event) => statusMutation.mutate({ code: row.code, status: event.target.value })}
                      >
                        {statusOptions.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </Select>
                    </div>
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
