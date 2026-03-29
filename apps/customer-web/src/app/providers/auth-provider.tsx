import {
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from "react";
import type { Account, LoginPayload, RegisterPayload, UpdateProfilePayload } from "@paragliding/api-client";
import { customerApi } from "@/shared/config/api";
import { authStorage } from "@/shared/lib/storage";

type AuthContextValue = {
  account: Account | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<Account>;
  register: (payload: RegisterPayload) => Promise<Account>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<Account>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const ensureCustomerRole = (account: Account) => {
  if (account.role !== "CUSTOMER") {
    throw new Error("Tai khoan nay khong duoc phep dang nhap customer portal.");
  }
  return account;
};

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [account, setAccount] = useState<Account | null>(() => authStorage.getAccount());
  const [loading, setLoading] = useState(Boolean(authStorage.getToken()));

  useEffect(() => {
    if (!authStorage.getToken()) {
      setLoading(false);
      return;
    }

    customerApi
      .getMe()
      .then((nextAccount) => {
        authStorage.setAccount(ensureCustomerRole(nextAccount));
        startTransition(() => setAccount(nextAccount));
      })
      .catch(() => {
        authStorage.clearAll();
        startTransition(() => setAccount(null));
      })
      .finally(() => setLoading(false));
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      account,
      loading,
      isAuthenticated: Boolean(account?.role === "CUSTOMER"),
      async login(payload) {
        const result = await customerApi.login(payload);
        const nextAccount = ensureCustomerRole(result.account);
        authStorage.setSession(result.session);
        authStorage.setAccount(nextAccount);
        setAccount(nextAccount);
        return nextAccount;
      },
      async register(payload) {
        const result = await customerApi.register(payload);
        const nextAccount = ensureCustomerRole(result.account);
        authStorage.setSession(result.session);
        authStorage.setAccount(nextAccount);
        setAccount(nextAccount);
        return nextAccount;
      },
      async logout() {
        try {
          if (authStorage.getToken()) {
            await customerApi.logout();
          }
        } finally {
          authStorage.clearAll();
          setAccount(null);
        }
      },
      async refresh() {
        const nextAccount = ensureCustomerRole(await customerApi.getMe());
        authStorage.setAccount(nextAccount);
        setAccount(nextAccount);
      },
      async updateProfile(payload) {
        const nextAccount = ensureCustomerRole(await customerApi.updateMe(payload));
        authStorage.setAccount(nextAccount);
        setAccount(nextAccount);
        return nextAccount;
      }
    }),
    [account, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
