import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, Panel } from "@paragliding/ui";
import { useAuth } from "@/shared/providers/auth-provider";
import { routes } from "@/shared/config/routes";

export const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { verifyEmail } = useAuth();
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

  const title = !token
    ? "Link xac thuc khong hop le"
    : mutation.isSuccess
      ? "Email da duoc xac thuc"
      : mutation.isError
        ? "Khong the xac thuc email"
        : "Dang xac thuc email";

  return (
    <div className="auth-screen">
      <div className="auth-screen__glow auth-screen__glow--left" />
      <div className="auth-screen__glow auth-screen__glow--right" />
      <div className="auth-screen__shell">
        <div className="auth-screen__topbar">
          <Link to={routes.home} className="auth-screen__brand">
            <span className="auth-screen__brand-icon">SN</span>
            <span className="auth-screen__brand-copy">
              <strong>Da Nang Paragliding</strong>
              <small>Da Nang Paragliding</small>
            </span>
          </Link>
        </div>

        <Card className="auth-luxe-card">
          <Panel className="auth-luxe-panel">
            <div className="auth-email-sent">
              <span className="auth-email-sent__icon">{mutation.isSuccess ? "OK" : "SN"}</span>
              <h1>{title}</h1>
              {!token ? (
                <p>Token xac thuc bi thieu. Hay mo dung link moi nhat trong email Da Nang Paragliding.</p>
              ) : mutation.isSuccess ? (
                <p>Tai khoan cua ban da san sang. He thong se chuyen ve trang chu trong giay lat.</p>
              ) : mutation.isError ? (
                <p>{mutation.error instanceof Error ? mutation.error.message : "Link xac thuc da het han."}</p>
              ) : (
                <p>Vui long doi trong khi chung toi kich hoat tai khoan cua ban.</p>
              )}

              <div className="auth-luxe-meta">
                <Link to={routes.login}>Dang nhap</Link>
                <Link to={routes.home}>Ve trang chu</Link>
              </div>

              {mutation.isError || !token ? (
                <Link to={routes.login}>
                  <Button className="auth-luxe-submit">Gui lai link xac thuc</Button>
                </Link>
              ) : null}
            </div>
          </Panel>
        </Card>
      </div>
    </div>
  );
};
