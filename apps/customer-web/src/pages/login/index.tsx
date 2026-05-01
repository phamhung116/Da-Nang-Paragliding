import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Button, Card, Field, Input, Panel } from "@paragliding/ui";
import type { EmailAuthStartPayload } from "@paragliding/api-client";
import { useAuth } from "@/shared/providers/auth-provider";
import { routes } from "@/shared/config/routes";
import { SiteLayout } from "@/widgets/layout/site-layout";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const LoginPage = () => {
  const location = useLocation();
  const { startEmailAuth, claimEmailAuth, isAuthenticated } = useAuth();
  const [pollToken, setPollToken] = useState("");
  const [claimNotice, setClaimNotice] = useState("");
  const redirectTo = new URLSearchParams(location.search).get("redirect") ?? routes.home;

  const loginForm = useForm<EmailAuthStartPayload>({
    defaultValues: { email: "" },
    mode: "all",
    reValidateMode: "onChange"
  });

  const loginMutation = useMutation({
    mutationFn: (payload: EmailAuthStartPayload) =>
      startEmailAuth({
        email: normalizeEmail(payload.email)
      }),
    onSuccess: (result) => {
      setPollToken(result.poll_token ?? "");
      setClaimNotice("");
    }
  });

  const claimMutation = useMutation({
    mutationFn: (nextPollToken: string) => claimEmailAuth(nextPollToken),
    onSuccess: (result) => {
      if (!result.ready) {
        return;
      }
      setClaimNotice("Email đã được xác thực. Đang chuyển vào tài khoản...");
    }
  });

  useEffect(() => {
    if (!pollToken || isAuthenticated) {
      return;
    }
    const timer = window.setInterval(() => {
      if (!claimMutation.isPending) {
        claimMutation.mutate(pollToken);
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [claimMutation, isAuthenticated, pollToken]);

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const loginError = loginMutation.error instanceof Error ? loginMutation.error.message : null;
  const claimError = claimMutation.error instanceof Error ? claimMutation.error.message : null;
  const loginSuccess = loginMutation.isSuccess;

  return (
    <SiteLayout>
      <div className="auth-screen">
        <div className="auth-screen__glow auth-screen__glow--left" />
        <div className="auth-screen__glow auth-screen__glow--right" />
        <div className="auth-screen__shell">
          

          <Card className="auth-luxe-card">
            <Panel className="auth-luxe-panel">
              <form className="auth-luxe-form" onSubmit={loginForm.handleSubmit((values) => loginMutation.mutate(values))}>
                <div className="auth-email-sent auth-email-sent--compact">
                  <img
                    src="/media/img/logo.jpg"
                    alt="Logo Dù lượn Đà Nẵng"
                    className="h-30 w-30 object-cover"
                  />
                  <h1>Đăng nhập bằng email</h1>
                  <p>Nhập email, Dù lượn Đà Nẵng sẽ gửi liên kết xác thực. Không cần mật khẩu và không cần đăng ký riêng.</p>
                </div>

                <Field label="Email">
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="khachhang@danangparagliding.vn"
                    {...loginForm.register("email", {
                      required: "Email là bắt buộc.",
                      pattern: {
                        value: emailPattern,
                        message: "Email không hợp lệ."
                      },
                      setValueAs: (value) => normalizeEmail(String(value ?? ""))
                    })}
                  />
                </Field>
                {loginForm.formState.errors.email ? <p className="form-error">{loginForm.formState.errors.email.message}</p> : null}

                {loginError ? <div className="auth-minimal-alert">{loginError}</div> : null}
                {claimError ? <div className="auth-minimal-alert">{claimError}</div> : null}
                {loginSuccess ? (
                  <div className="auth-minimal-alert is-success">
                    Link xac thuc da duoc gui. Neu ban mo link tren dien thoai, man hinh nay se tu dong vao tai khoan sau khi email duoc xac thuc.
                  </div>
                ) : null}
                {claimNotice ? <div className="auth-minimal-alert is-success">{claimNotice}</div> : null}

                <Button className="auth-luxe-submit" disabled={loginMutation.isPending}>
                  {loginMutation.isPending ? "Đang gửi link..." : "Gửi link xác thực"}
                </Button>
              </form>
            </Panel>
          </Card>
        </div>
      </div>
    </SiteLayout>
  );
};
