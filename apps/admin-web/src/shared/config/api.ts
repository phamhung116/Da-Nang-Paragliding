import { createAdminApi, createCustomerApi } from "@paragliding/api-client";
import { adminAuthStorage } from "@/shared/lib/storage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:8000/api/v1/admin";

export const PUBLIC_API_BASE_URL = API_BASE_URL.replace("/admin", "");
export const PILOT_APP_URL =
  import.meta.env.VITE_PILOT_APP_URL?.toString().trim() || (import.meta.env.DEV ? "http://localhost:5175" : "");

export const adminApi = createAdminApi(API_BASE_URL, () => adminAuthStorage.getToken());
export const authApi = createCustomerApi(PUBLIC_API_BASE_URL, () => adminAuthStorage.getToken());
