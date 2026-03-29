import { createHttpClient } from "../http";
import type {
  Account,
  AuthResult,
  AvailabilityDay,
  Booking,
  BookingCreatePayload,
  LoginPayload,
  PaymentSession,
  PaymentTransaction,
  Post,
  RegisterPayload,
  ServicePackage,
  Tracking,
  UpdateProfilePayload
} from "../types";

export const createCustomerApi = (baseUrl: string, getAccessToken?: () => string | null) => {
  const http = createHttpClient(baseUrl, { getAccessToken });

  return {
    register: (payload: RegisterPayload) =>
      http.request<AuthResult>("/auth/register/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    login: (payload: LoginPayload) =>
      http.request<AuthResult>("/auth/login/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    logout: () =>
      http.request<{ logged_out: boolean }>("/auth/logout/", {
        method: "POST"
      }),
    getMe: () => http.request<Account>("/auth/me/"),
    updateMe: (payload: UpdateProfilePayload) =>
      http.request<Account>("/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(payload)
      }),
    getMyBookings: () => http.request<Booking[]>("/auth/bookings/"),
    listServices: (featured = false) =>
      http.request<ServicePackage[]>(`/services/${featured ? "?featured=true" : ""}`),
    getService: (slug: string) => http.request<ServicePackage>(`/services/${slug}/`),
    listPosts: () => http.request<Post[]>("/posts/"),
    getPost: (slug: string) => http.request<Post>(`/posts/${slug}/`),
    getAvailability: (slug: string, year: number, month: number) =>
      http.request<AvailabilityDay[]>(`/services/${slug}/availability/?year=${year}&month=${month}`),
    createBooking: (payload: BookingCreatePayload) =>
      http.request<{ booking: Booking; payment_session: PaymentSession }>("/bookings/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    completePayment: (code: string) =>
      http.request<{ booking: Booking; transaction: PaymentTransaction | null }>(
        `/bookings/${code}/payment/complete/`,
        {
          method: "POST"
        }
      ),
    lookupBookings: (query: string) =>
      http.request<Booking[]>(`/bookings/lookup/?query=${encodeURIComponent(query)}`),
    lookupTracking: (query: string) =>
      http.request<{ booking: Booking; tracking: Tracking }>(
        `/tracking/lookup/?query=${encodeURIComponent(query)}`
      )
  };
};
