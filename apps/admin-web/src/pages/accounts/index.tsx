import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Field, Input, Panel, Select } from "@paragliding/ui";
import type { Account, ManagedAccountPayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { AdminLayout } from "@/widgets/layout/admin-layout";
import { DataTable } from "@/widgets/data-table/data-table";

const blankValues: ManagedAccountPayload = {
  full_name: "",
  email: "",
  phone: "",
  password: "",
  role: "PILOT",
  preferred_language: "vi",
  is_active: true
};

export const AccountsPage = () => {
  const queryClient = useQueryClient();
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [roleFilter, setRoleFilter] = useState("");
  const [activeFilter, setActiveFilter] = useState("true");

  const { data = [] } = useQuery({
    queryKey: ["admin-accounts", roleFilter, activeFilter],
    queryFn: () => adminApi.listAccounts({ role: roleFilter || undefined, active: activeFilter || undefined })
  });

  const metrics = useMemo(
    () => [
      { label: "Accounts", value: data.length },
      { label: "Pilots", value: data.filter((item) => item.role === "PILOT").length },
      { label: "Disabled", value: data.filter((item) => !item.is_active).length }
    ],
    [data]
  );

  const { register, handleSubmit, reset } = useForm<ManagedAccountPayload>({
    defaultValues: blankValues
  });

  useEffect(() => {
    if (!selectedAccount) {
      reset(blankValues);
      return;
    }

    reset({
      full_name: selectedAccount.full_name,
      email: selectedAccount.email,
      phone: selectedAccount.phone,
      password: "",
      role: selectedAccount.role,
      preferred_language: selectedAccount.preferred_language,
      is_active: selectedAccount.is_active
    });
  }, [reset, selectedAccount]);

  const saveMutation = useMutation({
    mutationFn: (payload: ManagedAccountPayload) =>
      selectedAccount ? adminApi.updateAccount(selectedAccount.id, payload) : adminApi.createAccount(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setSelectedAccount(null);
      reset(blankValues);
    }
  });

  const disableMutation = useMutation({
    mutationFn: (accountId: string) => adminApi.disableAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      if (selectedAccount) {
        setSelectedAccount(null);
      }
    }
  });

  const roleOptions = selectedAccount?.role === "CUSTOMER" ? ["CUSTOMER", "PILOT", "ADMIN"] : ["PILOT", "ADMIN"];

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Account management</Badge>
            <h1>Accounts</h1>
            <p>Create admin and pilot accounts, review customer records and control access status.</p>
          </div>
          <div className="portal-heading__note">
            Pilot now covers the old staff role, so the system keeps only three roles: admin, pilot and customer.
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

        <div className="admin-grid">
          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>{selectedAccount ? "Update account" : "Create account"}</h3>
                  <p>Use this panel for admin and pilot access. Customers are created from the public website.</p>
                </div>
                {selectedAccount ? <Badge>{selectedAccount.role}</Badge> : null}
              </div>

              <form className="admin-form" onSubmit={handleSubmit((values) => saveMutation.mutate(values))}>
                <Field label="Full name">
                  <Input {...register("full_name")} />
                </Field>
                <Field label="Email">
                  <Input type="email" {...register("email")} />
                </Field>
                <Field label="Phone">
                  <Input {...register("phone")} />
                </Field>
                <Field
                  label={selectedAccount ? "Password reset" : "Password"}
                  hint={selectedAccount ? "Leave blank to keep the current password." : "Use a strong temporary password."}
                >
                  <Input type="password" {...register("password")} />
                </Field>
                <div className="inline-field-grid inline-field-grid--two">
                  <Field label="Role">
                    <Select {...register("role")}>
                      {roleOptions.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Language">
                    <Select {...register("preferred_language")}>
                      <option value="vi">Vietnamese</option>
                      <option value="en">English</option>
                    </Select>
                  </Field>
                </div>
                <label className="admin-checkbox">
                  <input type="checkbox" {...register("is_active")} />
                  <span>Account is active</span>
                </label>
                {saveMutation.error instanceof Error ? <p className="form-error">{saveMutation.error.message}</p> : null}
                <div className="table-actions--inline">
                  <Button>{selectedAccount ? "Save changes" : "Create account"}</Button>
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => {
                      setSelectedAccount(null);
                      reset(blankValues);
                    }}
                  >
                    Reset
                  </Button>
                </div>
              </form>
            </Panel>
          </Card>

          <Card>
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>Access directory</h3>
                  <p>Filter by role or status and manage each account from a compact action menu.</p>
                </div>
              </div>

              <div className="filter-row">
                <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">All roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PILOT">Pilot</option>
                  <option value="CUSTOMER">Customer</option>
                </Select>
                <Select value={activeFilter} onChange={(event) => setActiveFilter(event.target.value)}>
                  <option value="true">Active</option>
                  <option value="false">Disabled</option>
                </Select>
              </div>

              <DataTable<Account>
                data={data}
                columns={[
                  {
                    key: "account",
                    title: "Account",
                    render: (row) => (
                      <div className="row-meta">
                        <strong>{row.full_name}</strong>
                        <span>{row.email}</span>
                        <small>{row.phone}</small>
                      </div>
                    )
                  },
                  {
                    key: "role",
                    title: "Role",
                    render: (row) => <Badge>{row.role}</Badge>
                  },
                  {
                    key: "status",
                    title: "Status",
                    render: (row) => (
                      <Badge tone={row.is_active ? "success" : "danger"}>
                        {row.is_active ? "ACTIVE" : "DISABLED"}
                      </Badge>
                    )
                  },
                  {
                    key: "actions",
                    title: "Actions",
                    render: (row) => (
                      <details className="action-menu">
                        <summary className="action-menu__trigger">Manage</summary>
                        <div className="action-menu__content">
                          <button
                            className="action-menu__item"
                            type="button"
                            onClick={() => setSelectedAccount(row)}
                          >
                            Edit account
                          </button>
                          {row.is_active ? (
                            <button
                              className="action-menu__item action-menu__item--danger"
                              type="button"
                              onClick={() => disableMutation.mutate(row.id)}
                            >
                              Disable account
                            </button>
                          ) : null}
                        </div>
                      </details>
                    )
                  }
                ]}
              />
            </Panel>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
