import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Panel } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { useI18n } from "@/shared/providers/i18n-provider";
import { routes } from "@/shared/config/routes";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { verifyEmail } = useAuth();
  const { tText } = useI18n();
  const token = params.get("token") ?? "";

  const mutation = useMutation({
    mutationFn: (nextToken: string) => verifyEmail(nextToken),
    onSuccess: () => {
      window.setTimeout(() => navigate(routes.home, { replace: true }), 1200);
    }
  });

  useEffect(() => {
    if (token && mutation.status === "idle") {
      mutation.mutate(token);
    }
  }, [mutation, token]);

  const title = tText(!token
    ? "Link xác thực không hợp lệ"
    : mutation.isSuccess
      ? "Email đã được xác thực"
      : mutation.isError
        ? "Không thể xác thực email"
        : "Đang xác thực email");

  return (
    <div className="auth-screen">
      <div className="auth-screen__glow auth-screen__glow--left" />
      <div className="auth-screen__glow auth-screen__glow--right" />
      <div className="auth-screen__shell">
        <div className="auth-screen__topbar">
          <Link to={routes.home} className="auth-screen__brand">
            <span className="auth-screen__brand-icon">SN</span>
            <span className="auth-screen__brand-copy">
              <strong>{tText("Dù lượn Đà Nẵng")}</strong>
              <small>{tText("Dù lượn Đà Nẵng")}</small>
            </span>
          </Link>
        </div>

        <Card className="auth-luxe-card">
          <Panel className="auth-luxe-panel">
            <div className="auth-email-sent">
              <span className="auth-email-sent__icon">{mutation.isSuccess ? "OK" : "SN"}</span>
              <h1>{title}</h1>
              {!token ? (
                <p>{tText("Token xác thực bị thiếu. Hãy mở đúng liên kết mới nhất trong email Dù lượn Đà Nẵng.")}</p>
              ) : mutation.isSuccess ? (
                <p>{tText("Tài khoản của bạn đã sẵn sàng. Hệ thống sẽ chuyển về trang chủ trong giây lát.")}</p>
              ) : mutation.isError ? (
                <p>{mutation.error instanceof Error ? mutation.error.message : tText("Link xác thực đã hết hạn.")}</p>
              ) : (
                <p>{tText("Vui lòng đợi trong khi chúng tôi kích hoạt tài khoản của bạn.")}</p>
              )}

              <div className="auth-luxe-meta">
                <Link to={routes.login}>{tText("Đăng nhập")}</Link>
                <Link to={routes.home}>{tText("Về trang chủ")}</Link>
              </div>

              {mutation.isError || !token ? (
                <Link to={routes.login}>
                  <Button className="auth-luxe-submit">{tText("Gửi lại link xác thực")}</Button>
                </Link>
              ) : null}
            </div>
          </Panel>
        </Card>
      </div>
    </div>
  );
};
