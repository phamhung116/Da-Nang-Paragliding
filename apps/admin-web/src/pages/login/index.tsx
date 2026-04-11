import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Navigate } from "react-router-dom";
import { Badge, Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { AuthResult, LoginPayload } from "@paragliding/api-client";
import { useAdminAuth } from "@/shared/providers/auth-provider";
import { authApi, PILOT_APP_URL } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { adminAuthStorage, pilotAuthBridgeStorage } from "@/shared/lib/storage";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const HANDOFF_PREFIX = "#session=";

const buildHandoffUrl = (baseUrl: string, result: AuthResult) =>
  `${baseUrl.replace(/\/$/, "")}/login${HANDOFF_PREFIX}${encodeURIComponent(JSON.stringify(result))}`;

const readHandoffSession = (): AuthResult | null => {
  if (!window.location.hash.startsWith(HANDOFF_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(decodeURIComponent(window.location.hash.slice(HANDOFF_PREFIX.length))) as AuthResult;
  } catch {
    return null;
  }
};

export const LoginPage = () => {
  const { isAuthenticated } = useAdminAuth();
  const form = useForm<LoginPayload>({
    defaultValues: {
      email: "",
      password: ""
    },
    mode: "onChange"
  });

  useEffect(() => {
    const handoff = readHandoffSession();
    if (!handoff) {
      return;
    }

    window.history.replaceState(null, "", routes.login);
    if (handoff.account.role === "ADMIN") {
      adminAuthStorage.setSession(handoff.session);
      adminAuthStorage.setAccount(handoff.account);
      window.location.replace(routes.bookings);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (payload: LoginPayload) => {
      const result = await authApi.login(payload);
      if (!["ADMIN", "PILOT"].includes(result.account.role)) {
        throw new Error("Tai khoan nay khong co quyen truy cap workspace van hanh.");
      }
      if (result.account.role === "PILOT" && !PILOT_APP_URL) {
        throw new Error("Thieu bien VITE_PILOT_APP_URL tren Vercel admin-web.");
      }
      return result;
    },
    onSuccess: (result) => {
      if (result.account.role === "ADMIN") {
        adminAuthStorage.setSession(result.session);
        adminAuthStorage.setAccount(result.account);
        window.location.replace(routes.bookings);
        return;
      }

      pilotAuthBridgeStorage.setSession(result.session);
      pilotAuthBridgeStorage.setAccount(result.account);
      window.location.href = buildHandoffUrl(PILOT_APP_URL, result);
    }
  });

  if (isAuthenticated) {
    return <Navigate to={routes.bookings} replace />;
  }

  return (
    <div className="admin-login-shell">
      <Card>
        <Panel className="admin-stack">
          <Badge>OPERATIONS</Badge>
          <h1>Workspace login</h1>
          <p>Admin and pilot use the same sign-in. The system routes each role to the right workspace.</p>

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
