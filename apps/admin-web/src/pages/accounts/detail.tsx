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

const roleLabels: Record<string, string> = {
  ADMIN: "Quản trị viên",
  PILOT: "Phi công",
  CUSTOMER: "Khách hàng"
};

const languageLabels: Record<string, string> = {
  vi: "Tiếng Việt",
  en: "Tiếng Anh"
};

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
            <Badge>Chi tiết tài khoản</Badge>
            <h1>{account?.full_name ?? "Tài khoản"}</h1>
            <p>Trang này hiển thị thông tin chi tiết của tài khoản đang chọn.</p>
          </div>
          <Link to={routes.accounts}>
            <Button variant="secondary">Quay lại danh sách</Button>
          </Link>
        </div>

        {accountQuery.error instanceof Error ? <p className="form-error">{accountQuery.error.message}</p> : null}

        {account ? (
          <Card className="admin-detail-card">
            <Panel className="admin-stack">
              <div className="admin-card__header">
                <div>
                  <Badge>{roleLabels[account.role] ?? account.role}</Badge>
                  <h3>{account.email}</h3>
                  <p>{account.phone}</p>
                </div>
                <div className="table-actions--inline">
                  {canEdit ? (
                    <Button variant="secondary" onClick={() => setEditing((current) => !current)}>
                      {editing ? "Hủy sửa" : "Chỉnh sửa"}
                    </Button>
                  ) : null}
                  {canDelete ? (
                    <Button variant="secondary" disabled={deleteMutation.isPending} onClick={() => setDeleteDialogOpen(true)}>
                      Xóa tài khoản
                    </Button>
                  ) : null}
                </div>
              </div>

              {editing && canEdit ? (
                <form className="admin-form admin-form--compact" onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}>
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
                  <div className="inline-field-grid inline-field-grid--two">
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
                  {account.role === "ADMIN" ? (
                    <Field label="Mật khẩu mới">
                      <Input type="password" {...form.register("password")} placeholder="Bỏ trống nếu không đổi" />
                    </Field>
                  ) : null}
                  <p className="row-muted">Khi đổi email hoặc mật khẩu của account đăng nhập, toàn bộ thiết bị sẽ bị đăng xuất và cần đăng nhập lại.</p>
                  {updateMutation.error instanceof Error ? <p className="form-error">{updateMutation.error.message}</p> : null}
                  <Button disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Đang lưu..." : "Lưu thay đổi"}
                  </Button>
                </form>
              ) : (
                <div className="detail-list">
                  <div>
                    <span>Họ và tên</span>
                    <strong>{account.full_name}</strong>
                  </div>
                  <div>
                    <span>Email</span>
                    <strong>{account.email}</strong>
                  </div>
                  <div>
                    <span>Số điện thoại</span>
                    <strong>{account.phone}</strong>
                  </div>
                  <div>
                    <span>Vai trò</span>
                    <strong>{roleLabels[account.role] ?? account.role}</strong>
                  </div>
                  <div>
                    <span>Ngôn ngữ</span>
                    <strong>{languageLabels[account.preferred_language] ?? account.preferred_language}</strong>
                  </div>
                  <div>
                    <span>Ngày tạo</span>
                    <strong>{account.created_at ? new Date(account.created_at).toLocaleString("vi-VN") : "-"}</strong>
                  </div>
                </div>
              )}

              {!canEdit ? <p className="row-muted">Tài khoản khách hàng chỉ được xem trong khu vực quản trị, không sửa và không xóa.</p> : null}
              {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
            </Panel>
          </Card>
        ) : (
          <Card>
            <Panel>Đang tải tài khoản...</Panel>
          </Card>
        )}

        <Dialog
          open={deleteDialogOpen && Boolean(account)}
          onOpenChange={(open) => {
            if (!deleteMutation.isPending) {
              setDeleteDialogOpen(open);
            }
          }}
          title={`Xóa tài khoản ${account?.email ?? ""}`}
          description="Tài khoản sau khi xóa sẽ không còn đăng nhập được vào hệ thống."
          icon="!"
          footer={
            <>
              <Button type="button" variant="secondary" onClick={() => setDeleteDialogOpen(false)}>
                Đóng
              </Button>
              <Button type="button" disabled={deleteMutation.isPending} onClick={deleteAccount}>
                {deleteMutation.isPending ? "Đang xóa..." : "Xóa tài khoản"}
              </Button>
            </>
          }
        >
          <p className="row-muted">Vui lòng xác nhận trước khi xóa. Tài khoản khách hàng vẫn chỉ được xem, không xóa trong khu vực quản trị.</p>
          {deleteMutation.error instanceof Error ? <p className="form-error">{deleteMutation.error.message}</p> : null}
        </Dialog>
      </div>
    </AdminLayout>
  );
};
