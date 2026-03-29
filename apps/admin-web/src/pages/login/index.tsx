import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { LoginPayload } from "@paragliding/api-client";
import { useAdminAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/config/routes";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAdminAuth();
  const form = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => navigate(routes.bookingRequests, { replace: true })
  });

  if (isAuthenticated) {
    return <Navigate to={routes.bookingRequests} replace />;
  }

  return (
    <div className="admin-login-shell">
      <Card>
        <Panel className="admin-stack">
          <Badge>ADMIN</Badge>
          <h1>Control room login</h1>
          <p>Secure sign-in for booking review, account control, publishing and flight operations.</p>

          <form className="admin-form" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <Field label="Email">
              <Input
                type="email"
                {...form.register("email", {
                  required: "Email is required.",
                  pattern: {
                    value: emailPattern,
                    message: "Invalid email format."
                  }
                })}
              />
            </Field>
            {form.formState.errors.email ? <p className="form-error">{form.formState.errors.email.message}</p> : null}

            <Field label="Password">
              <Input
                type="password"
                {...form.register("password", {
                  required: "Password is required."
                })}
              />
            </Field>
            {form.formState.errors.password ? (
              <p className="form-error">{form.formState.errors.password.message}</p>
            ) : null}
            {mutation.error instanceof Error ? <p className="form-error">{mutation.error.message}</p> : null}

            <Button disabled={mutation.isPending || !form.formState.isValid}>
              {mutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </Panel>
      </Card>
    </div>
  );
};
