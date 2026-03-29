import type { Account, AuthSession } from "@paragliding/api-client";

const ADMIN_ACCOUNT_KEY = "admin_auth_account";
const ADMIN_SESSION_KEY = "admin_auth_session";

export const adminAuthStorage = {
  getAccount: () => {
    const raw = localStorage.getItem(ADMIN_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  },
  setAccount: (value: Account) => localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(value)),
  getSession: () => {
    const raw = localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  },
  setSession: (value: AuthSession) => localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(value)),
  getToken: () => adminAuthStorage.getSession()?.token ?? null,
  clear: () => {
    localStorage.removeItem(ADMIN_ACCOUNT_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};
