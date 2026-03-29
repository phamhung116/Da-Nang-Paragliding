import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { Account, LoginPayload } from "@paragliding/api-client";
import { authApi } from "@/shared/config/api";
import { pilotAuthStorage } from "@/shared/lib/storage";

type PilotAuthContextValue = {
  account: Account | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<Account>;
  logout: () => Promise<void>;
};

const PilotAuthContext = createContext<PilotAuthContextValue | null>(null);

export const PilotAuthProvider = ({ children }: PropsWithChildren) => {
  const [account, setAccount] = useState<Account | null>(() => pilotAuthStorage.getAccount());
  const [loading, setLoading] = useState(Boolean(pilotAuthStorage.getToken()));

  useEffect(() => {
    if (!pilotAuthStorage.getToken()) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((nextAccount) => {
        if (nextAccount.role !== "PILOT") {
          pilotAuthStorage.clear();
          startTransition(() => setAccount(null));
          return;
        }
        pilotAuthStorage.setAccount(nextAccount);
        startTransition(() => setAccount(nextAccount));
      })
      .catch(() => {
        pilotAuthStorage.clear();
        startTransition(() => setAccount(null));
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<PilotAuthContextValue>(
    () => ({
      account,
      loading,
      isAuthenticated: Boolean(account?.role === "PILOT"),
      async login(payload) {
        const result = await authApi.login(payload);
        if (result.account.role !== "PILOT") {
          throw new Error("Tai khoan nay khong co quyen pilot.");
        }
        pilotAuthStorage.setSession(result.session);
        pilotAuthStorage.setAccount(result.account);
        setAccount(result.account);
        return result.account;
      },
      async logout() {
        try {
          if (pilotAuthStorage.getToken()) {
            await authApi.logout();
          }
        } finally {
          pilotAuthStorage.clear();
          setAccount(null);
        }
      }
    }),
    [account, loading]
  );

  return <PilotAuthContext.Provider value={value}>{children}</PilotAuthContext.Provider>;
};

export const usePilotAuth = () => {
  const context = useContext(PilotAuthContext);
  if (!context) {
    throw new Error("usePilotAuth must be used inside PilotAuthProvider");
  }
  return context;
};
