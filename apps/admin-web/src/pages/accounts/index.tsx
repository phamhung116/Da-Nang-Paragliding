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

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  PILOT: "Phi công",
  CUSTOMER: "Khách hàng"
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
            <Badge>Quản lý tài khoản</Badge>
            <h1>Tài khoản</h1>
            <p>Danh sách tài khoản được lọc theo vai trò. Bấm vào tài khoản để xem chi tiết.</p>
          </div>
          <div className="portal-heading__note">Trạng thái hoạt động không hiển thị trong giao diện quản trị.</div>
        </div>

        {isCreateOpen ? (
          <Card className="admin-form-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <h3>Thêm tài khoản mới</h3>
                  <p>Quản trị viên tạo trực tiếp tài khoản phi công hoặc quản trị. Khách hàng đăng nhập bằng email từ website.</p>
                </div>
                <Button variant="secondary" onClick={() => setIsCreateOpen(false)}>
                  Đóng
                </Button>
              </div>
              <form className="admin-form admin-form--compact" onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}>
                <div className="inline-field-grid inline-field-grid--three">
                  <Field label="Họ và tên">
                    <Input {...form.register("full_name")} />
                  </Field>
                  <Field label="Email">
                    <Input type="email" {...form.register("email")} />
                  </Field>
                  <Field label="Số điện thoại">
                    <Input {...form.register("phone")} />
                  </Field>
                </div>
                <div className="inline-field-grid inline-field-grid--three">
                  <Field label="Mật khẩu">
                    <Input type="password" {...form.register("password")} />
                  </Field>
                  <Field label="Vai trò">
                    <Select {...form.register("role")}>
                      <option value="PILOT">Phi công</option>
                      <option value="ADMIN">Quản trị viên</option>
                    </Select>
                  </Field>
                  <Field label="Ngôn ngữ">
                    <Select {...form.register("preferred_language")}>
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">Tiếng Anh</option>
                    </Select>
                  </Field>
                </div>
                {createMutation.error instanceof Error ? <p className="form-error">{createMutation.error.message}</p> : null}
                <Button disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Đang tạo..." : "Tạo tài khoản"}
                </Button>
              </form>
            </Panel>
          </Card>
        ) : null}

        <Card className="admin-list-card">
          <Panel className="admin-stack">
            <div className="admin-card__header">
              <div>
                <h3>Danh sách tài khoản</h3>
                <p>Bộ lọc vai trò giúp xem nhanh quản trị viên, phi công hoặc khách hàng.</p>
              </div>
              <div className="table-actions--inline">
                <Select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                  <option value="">Tất cả vai trò</option>
                  <option value="ADMIN">Quản trị viên</option>
                  <option value="PILOT">Phi công</option>
                  <option value="CUSTOMER">Khách hàng</option>
                </Select>
                <Button onClick={() => setIsCreateOpen(true)}>Thêm tài khoản</Button>
              </div>
            </div>

            <DataTable<Account>
              data={data}
              getRowKey={(row) => row.id}
              onRowClick={(row) => navigate(`/accounts/${row.id}`)}
              columns={[
                {
                  key: "account",
                  title: "Tài khoản",
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
                  title: "Vai trò",
                  render: (row) => <Badge>{roleLabels[row.role] ?? row.role}</Badge>
                },
                {
                  key: "created",
                  title: "Ngày tạo",
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
