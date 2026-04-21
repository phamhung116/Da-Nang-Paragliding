import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Dialog, Field, Input, Panel, Select } from "@paragliding/ui";
import type { ManagedAccountPayload } from "@paragliding/api-client";
import { adminApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { useAdminAuth } from "@/shared/providers/auth-provider";
import { AdminLayout } from "@/widgets/layout/admin-layout";

const toPayload = (account: NonNullable<Awaited<ReturnType<typeof adminApi.getAccount>>>): ManagedAccountPayload => ({
  full_name: account.full_name,
  email: account.email,
  phone: account.phone,
  password: "",
  role: account.role,
  preferred_language: account.preferred_language,
  is_active: true
});

export const AccountDetailPage = () => {
  const { accountId = "" } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { account: currentAdmin, logout } = useAdminAuth();
  const [editing, setEditing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const loginChangePendingRef = useRef(false);
  const form = useForm<ManagedAccountPayload>();

  const accountQuery = useQuery({
    queryKey: ["admin-account", accountId],
    queryFn: () => adminApi.getAccount(accountId),
    enabled: Boolean(accountId)
  });

  const account = accountQuery.data;

  useEffect(() => {
    if (account) {
      form.reset(toPayload(account));
    }
  }, [account, form]);

  const updateMutation = useMutation({
    mutationFn: (payload: ManagedAccountPayload) => {
      const currentEmailChanged = currentAdmin?.id === accountId && currentAdmin.email !== payload.email;
      const currentPasswordChanged = currentAdmin?.id === accountId && account?.role === "ADMIN" && Boolean(payload.password);
      loginChangePendingRef.current = Boolean(currentEmailChanged || currentPasswordChanged);
      return adminApi.updateAccount(accountId, {
        ...payload,
        password: account?.role === "ADMIN" ? payload.password : "",
        is_active: true
      });
    },
    onSuccess: (nextAccount) => {
      queryClient.setQueryData(["admin-account", accountId], nextAccount);
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      setEditing(false);
      if (loginChangePendingRef.current) {
        loginChangePendingRef.current = false;
        void logout().finally(() => navigate(routes.login, { replace: true }));
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => adminApi.deleteAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-accounts"] });
      navigate(routes.accounts, { replace: true });
    }
  });

  if (!accountId) {
    return <Navigate to={routes.accounts} replace />;
  }

  const canEdit = account?.role !== "CUSTOMER";
  const canDelete = account?.role !== "CUSTOMER";

  const deleteAccount = () => {
    if (account) {
      deleteMutation.mutate();
    }
  };

  return (
    <AdminLayout>
      <div className="portal-stack">
        <div className="portal-heading">
          <div className="portal-heading__text">
            <Badge>Account detail</Badge>
            <h1>{account?.full_name ?? "Account"}</h1>
            <p>Trang nay chi hien thong tin chi tiet cua account dang chon.</p>
          </div>
          <Link to={routes.accounts}>
            <Button variant="secondary">Quay lai danh sach</Button>
          </Link>
        </div>

        {accountQuery.error instanceof Error ? <p className="form-error">{accountQuery.error.message}</p> : null}

        {account ? (
          <Card className="admin-detail-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <Badge>{account.role}</Badge>
                  <h3>{account.email}</h3>
                  <p>{account.phone}</p>
                </div>
                <div className="table-actions--inline">
                  {canEdit ? (
                    <Button variant="secondary" onClick={() => setEditing((current) => !current)}>
                      {editing ? "Huy sua" : "Chinh sua"}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => setDeleteDialogOpen(true)}>
                      Xoa account
                    </Button>
                  ) : null}
                </div>
              </div>

              {editing && canEdit ? (
                <form className="admin-form admin-form--compact" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
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
                  <div className="inline-field-grid inline-field-grid--two">
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
                  {account.role === "ADMIN" ? (
                    <Field label="Mật khẩu mới">
                      <Input type="password" {...form.register("password")} placeholder="Bỏ trống nếu không đổi" />
                    </Field>
                  ) : null}
                  <p className="row-muted">Khi đổi email hoặc mật khẩu của account đăng nhập, toàn bộ thiết bị sẽ bị đăng xuất và cần đăng nhập lại.</p>
                  {updateMutation.error instanceof Error ? <p className="form-error">{updateMutation.error.message}</p> : null}
                  <Button disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Dang luu..." : "Luu thay doi"}
                  </Button>
                </form>
              ) : (
                <div className="detail-list">
                  <div>
                    <span>Ho va ten</span>
                    <strong>{account.full_name}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{account.email}</strong>
                  </div>
                  <div>
                    <span>So dien thoai</span>
                    <strong>{account.phone}</strong>
                  </div>
                  <div>
                    <span>Role</span>
                    <strong>{account.role}</strong>
                  </div>
                  <div>
                    <span>Ngon ngu</span>
                    <strong>{account.preferred_language}</strong>
                  </div>
                  <div>
                    <span>Ngay tao</span>
                    <strong>{account.created_at ? new Date(account.created_at).toLocaleString("vi-VN") : "-"}</strong>
                  </div>
                </div>
              )}

              {!canEdit ? <p className="row-muted">Account customer chi duoc xem trong admin, khong sua va khong xoa.</p> : null}
              {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
            </Panel>
          </Card>
        ) : (
          <Card>
            <Panel>Dang tai account...</Panel>
          </Card>
        )}

        <Dialog
          open={deleteDialogOpen && Boolean(account)}
          onOpenChange={(open) => {
            if (!deleteMutation.isPending) {
              setDeleteDialogOpen(open);
            }
          }}
          title={`Xoa account ${account?.email ?? ""}`}
          description="Account sau khi xoa se khong con dang nhap duoc vao he thong."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Dong
              </Button>
              <Button type="button" disabled={deleteMutation.isPending} onClick={deleteAccount}>
                {deleteMutation.isPending ? "Dang xoa..." : "Xoa account"}
              </Button>
            </>
          }
        >
          <p className="row-muted">Vui long xac nhan truoc khi xoa. Account customer van chi duoc xem, khong xoa trong admin.</p>
          {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
