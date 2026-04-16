import { createCustomerApi, createPilotApi } from "@paragliding/api-client";
import { pilotAuthStorage } from "@/shared/lib/storage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:8000/api/v1/pilot";

export const PUBLIC_API_BASE_URL = API_BASE_URL.replace("/pilot", "");
export const ADMIN_APP_URL =
  import.meta.env.VITE_ADMIN_APP_URL?.toString().trim() || (import.meta.env.DEV ? "http://localhost:5174" : "");

export const pilotApi = createPilotApi(API_BASE_URL, () => pilotAuthStorage.getToken());
export const authApi = createCustomerApi(PUBLIC_API_BASE_URL, () => pilotAuthStorage.getToken());
