import { createHttpClient } from "../http";
import type { Booking, PilotFlight, Post, Tracking } from "../types";

export const createPilotApi = (baseUrl: string, getAccessToken?: () => string | null) => {
  const http = createHttpClient(baseUrl, { getAccessToken });
  const locationBody = (payload: { lat: number; lng: number; name?: string }) => JSON.stringify(payload);

  return {
    listPosts: () => http.request<Post[]>("/posts/"),
    getPost: (slug: string) => http.request<Post>(`/posts/${slug}/`),
    listFlights: () => http.request<PilotFlight[]>("/flights/"),
    updateFlightStatus: (code: string, status: string) =>
      http.request<{ booking: Booking; tracking: Tracking }>(`/flights/${code}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      }),
    startTracking: (code: string, payload: { lat: number; lng: number; name?: string }) =>
      http.request<{ booking: Booking; tracking: Tracking }>(`/flights/${code}/tracking/start/`, {
        method: "POST",
        body: locationBody(payload)
      }),
    pingTracking: (code: string, payload: { lat: number; lng: number; name?: string }) =>
      http.request<{ booking: Booking; tracking: Tracking }>(`/flights/${code}/tracking/ping/`, {
        method: "POST",
        body: locationBody(payload)
      }),
    stopTracking: (code: string, payload: { lat: number; lng: number; name?: string }) =>
      http.request<{ booking: Booking; tracking: Tracking }>(`/flights/${code}/tracking/stop/`, {
        method: "POST",
        body: locationBody(payload)
      })
  };
};
