import { createCustomerApi } from "@paragliding/api-client";
import { authStorage } from "@/shared/lib/storage";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.toString() ?? "http://localhost:8000/api/v1";

export const customerApi = createCustomerApi(API_BASE_URL, () => authStorage.getToken());
