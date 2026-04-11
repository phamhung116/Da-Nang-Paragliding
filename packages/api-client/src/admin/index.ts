import { createHttpClient } from "../http";
import type {
  Account,
  Booking,
  BookingCancelPayload,
  ManagedAccountPayload,
  Post,
  PostWritePayload,
  ServicePackage,
  ServicePackageWritePayload
} from "../types";

export const createAdminApi = (baseUrl: string, getAccessToken?: () => string | null) => {
  const http = createHttpClient(baseUrl, { getAccessToken });

  return {
    reviewBooking: (
      code: string,
      payload: { decision: "confirm" | "reject"; reason?: string; pilot_name?: string; pilot_phone?: string }
    ) =>
      http.request<Booking>(`/bookings/${code}/review/`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    listBookings: () => http.request<Booking[]>("/bookings/"),
    getBooking: (code: string) => http.request<Booking>(`/bookings/${code}/`),
    cancelBooking: (code: string, payload: BookingCancelPayload) =>
      http.request<Booking>(`/bookings/${code}/cancel/`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    assignPilot: (code: string, payload: { pilot_name: string; pilot_phone: string }) =>
      http.request<Booking>(`/bookings/${code}/pilot/`, {
        method: "PATCH",
        body: JSON.stringify(payload)
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
    getAccount: (accountId: string) => http.request<Account>(`/accounts/${accountId}/`),
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
      }),
    deleteAccount: (accountId: string) =>
      http.request<{ id: string }>(`/accounts/${accountId}/`, {
        method: "DELETE"
      })
  };
};
