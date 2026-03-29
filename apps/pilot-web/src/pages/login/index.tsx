import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Navigate, useNavigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { LoginPayload } from "@paragliding/api-client";
import { usePilotAuth } from "@/app/providers/auth-provider";
import { routes } from "@/shared/config/routes";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated } = usePilotAuth();
  const form = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });

  const mutation = useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: () => navigate(routes.home, { replace: true })
  });

  if (isAuthenticated) {
    return <Navigate to={routes.home} replace />;
  }

  return (
    <div className="pilot-login-shell">
      <Card>
        <Panel className="pilot-stack">
          <Badge tone="success">PILOT</Badge>
          <h1>Pilot sign in</h1>
          <p>Access assigned flights, update progress and read operational posts from this workspace.</p>

          <form className="pilot-stack" onSubmit={form.handleSubmit((values) => mutation.mutate(values))}>
            <Field label="Email">
              <Input type="email" {...form.register("email", { required: true })} />
            </Field>
            <Field label="Password">
              <Input type="password" {...form.register("password", { required: true })} />
            </Field>
            {mutation.error instanceof Error ? <p className="pilot-error">{mutation.error.message}</p> : null}
            <Button>{mutation.isPending ? "Signing in..." : "Sign in"}</Button>
          </form>
        </Panel>
      </Card>
    </div>
  );
};
