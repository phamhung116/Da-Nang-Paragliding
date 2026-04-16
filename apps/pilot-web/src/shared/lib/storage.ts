import type { Account, AuthSession } from "@paragliding/api-client";

const PILOT_ACCOUNT_KEY = "pilot_auth_account";
const PILOT_SESSION_KEY = "pilot_auth_session";
const ADMIN_ACCOUNT_KEY = "admin_auth_account";
const ADMIN_SESSION_KEY = "admin_auth_session";

export const pilotAuthStorage = {
  getAccount: () => {
    const raw = localStorage.getItem(PILOT_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  },
  setAccount: (value: Account) => localStorage.setItem(PILOT_ACCOUNT_KEY, JSON.stringify(value)),
  getSession: () => {
    const raw = localStorage.getItem(PILOT_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  },
  setSession: (value: AuthSession) => localStorage.setItem(PILOT_SESSION_KEY, JSON.stringify(value)),
  getToken: () => pilotAuthStorage.getSession()?.token ?? null,
  clear: () => {
    localStorage.removeItem(PILOT_ACCOUNT_KEY);
    localStorage.removeItem(PILOT_SESSION_KEY);
  }
};

export const adminAuthBridgeStorage = {
  setAccount: (value: Account) => localStorage.setItem(ADMIN_ACCOUNT_KEY, JSON.stringify(value)),
  setSession: (value: AuthSession) => localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(value)),
  clear: () => {
    localStorage.removeItem(ADMIN_ACCOUNT_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};
