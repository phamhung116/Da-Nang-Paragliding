import { createHttpClient } from "../http";
import type {
  Account,
  AuthResult,
  AvailabilityDay,
  Booking,
  BookingCancelPayload,
  BookingCreatePayload,
  ChangePasswordPayload,
  EmailAuthStartPayload,
  EmailAuthStartResult,
  EmailAuthClaimResult,
  LoginPayload,
  PaymentSession,
  PaymentTransaction,
  Post,
  ResendVerificationResult,
  ServicePackage,
  Tracking,
  UpdateProfilePayload
} from "../types";

export const createCustomerApi = (baseUrl: string, getAccessToken?: () => string | null) => {
  const http = createHttpClient(baseUrl, { getAccessToken });

  return {
    verifyEmail: (token: string) =>
      http.request<AuthResult>("/auth/verify-email/", {
        method: "POST",
        body: JSON.stringify({ token })
      }),
    resendVerificationEmail: (email: string) =>
      http.request<ResendVerificationResult>("/auth/resend-verification/", {
        method: "POST",
        body: JSON.stringify({ email })
      }),
    startEmailAuth: (payload: EmailAuthStartPayload) =>
      http.request<EmailAuthStartResult>("/auth/email/start/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    claimEmailAuth: (pollToken: string) =>
      http.request<EmailAuthClaimResult>("/auth/email/claim/", {
        method: "POST",
        body: JSON.stringify({ poll_token: pollToken })
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
    changePassword: (payload: ChangePasswordPayload) =>
      http.request<Account>("/auth/me/password/", {
        method: "POST",
        body: JSON.stringify(payload)
      }),
    getMyBookings: () => http.request<Booking[]>("/auth/bookings/"),
    cancelMyBooking: (code: string, payload: BookingCancelPayload) =>
      http.request<Booking>(`/auth/bookings/${code}/cancel/`, {
        method: "POST",
        body: JSON.stringify(payload)
      }),
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
