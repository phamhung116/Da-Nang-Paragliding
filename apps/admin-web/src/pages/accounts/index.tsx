import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [roleFilter, setRoleFilter] = useState("");
  const form = useForm<ManagedAccountPayload>({ defaultValues: blankValues });

  const { data = [] } = useQuery({
    queryKey: ["admin-accounts", roleFilter],
    queryFn: () => adminApi.listAccounts({ role: roleFilter || undefined })
  });

  const createMutation = useMutation({
    mutationFn: (payload: ManagedAccountPayload) => adminApi.createAccount({ ...payload, is_active: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      form.reset(blankValues);
      setIsCreateOpen(false);
    }
  });

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Account management</Badge>
            <h1>Accounts</h1>
            <p>Danh sach account chi loc theo role. Click vao account de xem chi tiet.</p>
          </div>
          <div className="portal-heading__note">Account khong hien trang thai hoat dong trong UI quan tri.</div>
        </div>

        {isCreateOpen ? (
          <Card className="admin-form-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>Them tai khoan moi</h3>
                  <p>Admin tao truc tiep tai khoan pilot hoac admin. Customer dang nhap bang email tu website.</p>
                </div>
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Dong
                </Button>
              </div>
              <form className="admin-form admin-form--compact" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="inline-field-grid inline-field-grid--three">
                  <Field label="Ho va ten">
                    <Input {...form.register("full_name")} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" {...form.register("email")} />
                  </Field>
                  <Field label="So dien thoai">
                    <Input {...form.register("phone")} />
                  </Field>
                </div>
                <div className="inline-field-grid inline-field-grid--three">
                  <Field label="Mat khau">
                    <Input type="password" {...form.register("password")} />
                  </Field>
                  <Field label="Role">
                    <Select {...form.register("role")}>
                      <option value="PILOT">Pilot</option>
                      <option value="ADMIN">Admin</option>
                    </Select>
                  </Field>
                  <Field label="Ngon ngu">
                    <Select {...form.register("preferred_language")}>
                      <option value="vi">Vietnamese</option>
                      <option value="en">English</option>
                    </Select>
                  </Field>
                </div>
                {createMutation.error instanceof Error ? <p className="form-error">{createMutation.error.message}</p> : null}
                <Button disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Dang tao..." : "Tao tai khoan"}
                </Button>
              </form>
            </Panel>
          </Card>
        ) : null}

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sach tai khoan</h3>
                <p>Bo loc role giup xem nhanh admin, pilot hoac customer.</p>
              </div>
              <div className="table-actions--inline">
                <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">Tat ca role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="PILOT">Pilot</option>
                  <option value="CUSTOMER">Customer</option>
                </Select>
                <Button onClick={() => setIsCreateOpen(true)}>Them tai khoan</Button>
              </div>
            </div>

            <DataTable<Account>
              data={data}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/accounts/${row.id}`)}
              columns={[
                {
                  key: "account",
                  title: "Tai khoan",
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
                  key: "created",
                  title: "Ngay tao",
                  render: (row) => (row.created_at ? new Date(row.created_at).toLocaleDateString("vi-VN") : "-")
                },
                {
                  key: "open",
                  title: "",
                  render: (row) => (
                    <Button
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/accounts/${row.id}`);
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
