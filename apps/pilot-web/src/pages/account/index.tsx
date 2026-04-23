import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { ChangePasswordPayload } from "@paragliding/api-client";
import { authApi } from "@/shared/config/api";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { PilotLayout } from "@/widgets/layout/pilot-layout";

type PasswordForm = ChangePasswordPayload & {
  confirm_password: string;
};

const roleLabels: Record<string, string> = {
  PILOT: "Phi công",
  ADMIN: "Quản trị viên",
  CUSTOMER: "Khách hàng"
};

export const PilotAccountPage = () => {
  const navigate = useNavigate();
  const { account, logout } = usePilotAuth();
  const form = useForm<PasswordForm>({
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: ""
    },
    mode: "onChange"
  });

  const mutation = useMutation({
    mutationFn: ({ confirm_password: _, ...payload }: PasswordForm) => authApi.changePassword(payload),
    onSuccess: () => {
      form.reset({
        current_password: "",
        new_password: "",
        confirm_password: ""
      });
      void logout().finally(() => navigate("/login", { replace: true }));
    }
  });

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge tone="success">Tài khoản</Badge>
            <h1>Thông tin phi công</h1>
            <p>Cập nhật mật khẩu đăng nhập cho tài khoản phi công.</p>
          </div>
        </div>

        <Card>
          <Panel className="pilot-stack">
            <div className="pilot-account-grid">
              <div>
                <span>Họ và tên</span>
                <strong>{account?.full_name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{account?.email}</strong>
              </div>
              <div>
                <span>Số điện thoại</span>
                <strong>{account?.phone}</strong>
              </div>
              <div>
                <span>Vai trò</span>
                <strong>{account?.role ? roleLabels[account.role] ?? account.role : "-"}</strong>
              </div>
            </div>
          </Panel>
        </Card>

        <Card>
          <Panel className="pilot-stack">
            <Badge>Đổi mật khẩu</Badge>
            <form className="pilot-password-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Mật khẩu hiện tại">
                <Input
                  type="password"
                  {...form.register("current_password", {
                    required: "Nhập mật khẩu hiện tại."
                  })}
                />
              </Field>
              {form.formState.errors.current_password ? (
                <p className="pilot-error">{form.formState.errors.current_password.message}</p>
              ) : null}

              <Field label="Mật khẩu mới">
                <Input
                  type="password"
                  {...form.register("new_password", {
                    required: "Nhập mật khẩu mới.",
                    minLength: {
                      value: 8,
                      message: "Mật khẩu mới phải có ít nhất 8 ký tự."
                    },
                    onChange: () => void form.trigger("confirm_password")
                  })}
                />
              </Field>
              {form.formState.errors.new_password ? <p className="pilot-error">{form.formState.errors.new_password.message}</p> : null}

              <Field label="Xác nhận mật khẩu mới">
                <Input
                  type="password"
                  {...form.register("confirm_password", {
                    required: "Xác nhận mật khẩu mới.",
                    validate: (value) => value === form.getValues("new_password") || "Mật khẩu xác nhận không khớp."
                  })}
                />
              </Field>
              {form.formState.errors.confirm_password ? (
                <p className="pilot-error">{form.formState.errors.confirm_password.message}</p>
              ) : null}

              {mutation.isSuccess ? <p className="pilot-success">Đã đổi mật khẩu thành công.</p> : null}
              {mutation.error instanceof Error ? <p className="pilot-error">{mutation.error.message}</p> : null}

              <Button disabled={mutation.isPending || !form.formState.isValid}>
                {mutation.isPending ? "Đang lưu..." : "Lưu mật khẩu mới"}
              </Button>
            </form>
          </Panel>
        </Card>
      </div>
    </PilotLayout>
  );
};
