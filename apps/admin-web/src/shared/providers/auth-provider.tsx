import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import type { Account, LoginPayload } from "@paragliding/api-client";
import { authApi } from "@/shared/config/api";
import { adminAuthStorage } from "@/shared/lib/storage";

type AdminAuthContextValue = {
  account: Account | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<Account>;
  logout: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export const AdminAuthProvider = ({ children }: PropsWithChildren) => {
  const [account, setAccount] = useState<Account | null>(() => adminAuthStorage.getAccount());
  const [loading, setLoading] = useState(Boolean(adminAuthStorage.getToken()));

  useEffect(() => {
    if (!adminAuthStorage.getToken()) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((nextAccount) => {
        if (nextAccount.role !== "ADMIN") {
          adminAuthStorage.clear();
          setAccount(null);
          return;
        }
        adminAuthStorage.setAccount(nextAccount);
        setAccount(nextAccount);
      })
      .catch(() => {
        adminAuthStorage.clear();
        setAccount(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AdminAuthContextValue>(
    () => ({
      account,
      loading,
      isAuthenticated: Boolean(account?.role === "ADMIN"),
      async login(payload) {
        const result = await authApi.login(payload);
        if (result.account.role !== "ADMIN") {
          throw new Error("Tai khoan nay khong co quyen admin.");
        }
        adminAuthStorage.setSession(result.session);
        adminAuthStorage.setAccount(result.account);
        setAccount(result.account);
        return result.account;
      },
      async logout() {
        try {
          if (adminAuthStorage.getToken()) {
            await authApi.logout();
          }
        } finally {
          adminAuthStorage.clear();
          setAccount(null);
        }
      }
    }),
    [account, loading]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  }
  return context;
};
