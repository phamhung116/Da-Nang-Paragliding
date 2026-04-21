import type { Account, AuthSession } from "@paragliding/api-client";

const CHECKOUT_KEY = "customer_checkout_state";
const TRACKING_LOOKUP_KEY = "customer_tracking_lookup";
const AUTH_ACCOUNT_KEY = "customer_auth_account";
const AUTH_SESSION_KEY = "customer_auth_session";

export const checkoutStorage = {
  get: <T,>() => {
    const raw = sessionStorage.getItem(CHECKOUT_KEY);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  set: (value: unknown) => sessionStorage.setItem(CHECKOUT_KEY, JSON.stringify(value)),
  clear: () => sessionStorage.removeItem(CHECKOUT_KEY)
};

export const trackingLookupStorage = {
  get: () => localStorage.getItem(TRACKING_LOOKUP_KEY) ?? "",
  set: (value: string) => localStorage.setItem(TRACKING_LOOKUP_KEY, value)
};

export const authStorage = {
  getAccount: () => {
    const raw = localStorage.getItem(AUTH_ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  },
  setAccount: (value: Account) => localStorage.setItem(AUTH_ACCOUNT_KEY, JSON.stringify(value)),
  clearAccount: () => localStorage.removeItem(AUTH_ACCOUNT_KEY),
  getSession: () => {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthSession) : null;
  },
  setSession: (value: AuthSession) => localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(value)),
  clearSession: () => localStorage.removeItem(AUTH_SESSION_KEY),
  getToken: () => authStorage.getSession()?.token ?? null,
  clearAll: () => {
    authStorage.clearAccount();
    authStorage.clearSession();
  }
};
