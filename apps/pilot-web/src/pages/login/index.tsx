import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { AuthResult } from "@paragliding/api-client";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { ADMIN_APP_URL } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { pilotAuthStorage } from "@/shared/lib/storage";

const HANDOFF_PREFIX = "#session=";

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
  const { completeHandoff, isAuthenticated, loading } = usePilotAuth();
  const navigate = useNavigate();
  const [configError, setConfigError] = useState("");

  useEffect(() => {
    const handoff = readHandoffSession();
    if (handoff?.account.role === "PILOT") {
      completeHandoff(handoff);
      navigate(routes.home, { replace: true });
      return;
    }

    if (pilotAuthStorage.getToken()) {
      navigate(routes.home, { replace: true });
      return;
    }

    if (!loading && !isAuthenticated) {
      if (!ADMIN_APP_URL) {
        setConfigError("Thieu bien VITE_ADMIN_APP_URL tren Vercel pilot-web.");
        return;
      }
      window.location.replace(`${ADMIN_APP_URL.replace(/\/$/, "")}/login`);
    }
  }, [completeHandoff, isAuthenticated, loading, navigate]);

  if (isAuthenticated) {
    return <Navigate to={routes.home} replace />;
  }

  return (
    <div className="pilot-login-shell">
      <p>{configError || "Dang chuyen den trang dang nhap van hanh..."}</p>
    </div>
  );
};
