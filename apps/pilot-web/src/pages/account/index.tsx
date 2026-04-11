import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Badge, Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { ChangePasswordPayload } from "@paragliding/api-client";
import { authApi } from "@/shared/config/api";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { PilotLayout } from "@/widgets/layout/pilot-layout";

type PasswordForm = ChangePasswordPayload & {
  confirm_password: string;
};

export const PilotAccountPage = () => {
  const { account } = usePilotAuth();
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
    }
  });

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge tone="success">Account</Badge>
            <h1>Thong tin pilot</h1>
            <p>Cap nhat mat khau dang nhap cho tai khoan pilot.</p>
          </div>
        </div>

        <Card>
          <Panel className="pilot-stack">
            <div className="pilot-account-grid">
              <div>
                <span>Ho va ten</span>
                <strong>{account?.full_name}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{account?.email}</strong>
              </div>
              <div>
                <span>So dien thoai</span>
                <strong>{account?.phone}</strong>
              </div>
              <div>
                <span>Role</span>
                <strong>{account?.role}</strong>
              </div>
            </div>
          </Panel>
        </Card>

        <Card>
          <Panel className="pilot-stack">
            <Badge>Doi mat khau</Badge>
            <form className="pilot-password-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
              <Field label="Mat khau hien tai">
                <Input
                  type="password"
                  {...form.register("current_password", {
                    required: "Nhap mat khau hien tai."
                  })}
                />
              </Field>
              {form.formState.errors.current_password ? (
                <p className="pilot-error">{form.formState.errors.current_password.message}</p>
              ) : null}

              <Field label="Mat khau moi">
                <Input
                  type="password"
                  {...form.register("new_password", {
                    required: "Nhap mat khau moi.",
                    minLength: {
                      value: 8,
                      message: "Mat khau moi phai co it nhat 8 ky tu."
                    },
                    onChange: () => void form.trigger("confirm_password")
                  })}
                />
              </Field>
              {form.formState.errors.new_password ? <p className="pilot-error">{form.formState.errors.new_password.message}</p> : null}

              <Field label="Xac nhan mat khau moi">
                <Input
                  type="password"
                  {...form.register("confirm_password", {
                    required: "Xac nhan mat khau moi.",
                    validate: (value) => value === form.getValues("new_password") || "Mat khau xac nhan khong khop."
                  })}
                />
              </Field>
              {form.formState.errors.confirm_password ? (
                <p className="pilot-error">{form.formState.errors.confirm_password.message}</p>
              ) : null}

              {mutation.isSuccess ? <p className="pilot-success">Da doi mat khau thanh cong.</p> : null}
              {mutation.error instanceof Error ? <p className="pilot-error">{mutation.error.message}</p> : null}

              <Button disabled={mutation.isPending || !form.formState.isValid}>
                {mutation.isPending ? "Dang luu..." : "Luu mat khau moi"}
              </Button>
            </form>
          </Panel>
        </Card>
      </div>
    </PilotLayout>
  );
};
