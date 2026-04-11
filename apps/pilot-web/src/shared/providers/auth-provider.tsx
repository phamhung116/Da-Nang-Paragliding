import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { Account, AuthResult, LoginPayload } from "@paragliding/api-client";
import { authApi } from "@/shared/config/api";
import { pilotAuthStorage } from "@/shared/lib/storage";

type PilotAuthContextValue = {
  account: Account | null;
  loading: boolean;
  isAuthenticated: boolean;
  completeHandoff: (result: AuthResult) => void;
  login: (payload: LoginPayload) => Promise<Account>;
  logout: () => Promise<void>;
};

const PilotAuthContext = createContext<PilotAuthContextValue | null>(null);

export const PilotAuthProvider = ({ children }: PropsWithChildren) => {
  const [account, setAccount] = useState<Account | null>(() => pilotAuthStorage.getAccount());
  const [loading, setLoading] = useState(Boolean(pilotAuthStorage.getToken()));

  useEffect(() => {
    const token = pilotAuthStorage.getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    authApi
      .getMe()
      .then((nextAccount) => {
        if (pilotAuthStorage.getToken() !== token) {
          return;
        }
        if (nextAccount.role !== "PILOT") {
          pilotAuthStorage.clear();
          setAccount(null);
          return;
        }
        pilotAuthStorage.setAccount(nextAccount);
        setAccount(nextAccount);
      })
      .catch(() => {
        if (pilotAuthStorage.getToken() !== token) {
          return;
        }
        pilotAuthStorage.clear();
        setAccount(null);
      })
      .finally(() => {
        if (pilotAuthStorage.getToken() === token) {
          setLoading(false);
        }
      });
  }, []);

  const value = useMemo<PilotAuthContextValue>(
    () => ({
      account,
      loading,
      isAuthenticated: Boolean(account?.role === "PILOT"),
      completeHandoff(result) {
        if (result.account.role !== "PILOT") {
          throw new Error("Tai khoan nay khong co quyen pilot.");
        }
        pilotAuthStorage.setSession(result.session);
        pilotAuthStorage.setAccount(result.account);
        setAccount(result.account);
        setLoading(false);
      },
      async login(payload) {
        const result = await authApi.login(payload);
        if (result.account.role !== "PILOT") {
          throw new Error("Tai khoan nay khong co quyen pilot.");
        }
        pilotAuthStorage.setSession(result.session);
        pilotAuthStorage.setAccount(result.account);
        setAccount(result.account);
        setLoading(false);
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
