import { createHttpClient } from "../http";
import type {
  Account,
  Booking,
  ManagedAccountPayload,
  Post,
  PostWritePayload,
  ServicePackage,
  ServicePackageWritePayload,
  Tracking
} from "../types";

export const createAdminApi = (baseUrl: string, getAccessToken?: () => string | null) => {
  const http = createHttpClient(baseUrl, { getAccessToken });

  return {
    listBookingRequests: () => http.request<Booking[]>("/booking-requests/"),
    reviewBooking: (
      code: string,
      payload: { decision: "confirm" | "reject"; reason?: string; pilot_name?: string; pilot_phone?: string }
    ) =>
      http.request<Booking>(`/booking-requests/${code}/review/`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    listBookings: () => http.request<Booking[]>("/bookings/"),
    assignPilot: (code: string, payload: { pilot_name: string; pilot_phone: string }) =>
      http.request<Booking>(`/bookings/${code}/pilot/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    updateFlightStatus: (code: string, status: string) =>
      http.request<{ booking: Booking; tracking: Tracking }>(`/bookings/${code}/flight-status/`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }),
    listPosts: () => http.request<Post[]>("/posts/"),
    getPost: (slug: string) => http.request<Post>(`/posts/${slug}/`),
    createPost: (payload: PostWritePayload) =>
      http.request<Post>("/posts/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    updatePost: (slug: string, payload: PostWritePayload) =>
      http.request<Post>(`/posts/${slug}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    deletePost: (slug: string) =>
      http.request<{ slug: string }>(`/posts/${slug}/`, {
        method: "DELETE"
      }),
    listServices: () => http.request<ServicePackage[]>("/services/"),
    getService: (slug: string) => http.request<ServicePackage>(`/services/${slug}/`),
    createService: (payload: ServicePackageWritePayload) =>
      http.request<ServicePackage>("/services/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    updateService: (slug: string, payload: ServicePackageWritePayload) =>
      http.request<ServicePackage>(`/services/${slug}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    deleteService: (slug: string) =>
      http.request<{ slug: string }>(`/services/${slug}/`, {
        method: "DELETE"
      }),
    listAccounts: (filters?: { role?: string; active?: string }) =>
      http.request<Account[]>(
        `/accounts/?${new URLSearchParams(
          Object.entries(filters ?? {}).reduce<Record<string, string>>((acc, [key, value]) => {
            if (value) {
              acc[key] = value;
            }
            return acc;
          }, {})
        ).toString()}`
      ),
    createAccount: (payload: ManagedAccountPayload) =>
      http.request<Account>("/accounts/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    updateAccount: (accountId: string, payload: ManagedAccountPayload) =>
      http.request<Account>(`/accounts/${accountId}/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    disableAccount: (accountId: string) =>
      http.request<Account>(`/accounts/${accountId}/disable/`, {
        method: "POST"
      })
  };
};
