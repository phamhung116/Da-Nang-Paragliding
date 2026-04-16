import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Panel } from "@paragliding/ui";
import type { PilotFlight, Tracking } from "@paragliding/api-client";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { pilotApi } from "@/shared/config/api";
import { PilotLayout } from "@/widgets/layout/pilot-layout";
import { PilotFlightMap } from "@/widgets/flight-map/pilot-flight-map";

const statusOptions = ["WAITING", "EN_ROUTE", "FLYING", "LANDED"] as const;
const LIVE_PING_INTERVAL_MS = 5000;

type LivePosition = {
  lat: number;
  lng: number;
  name: string;
};

type TrackingMode = "start" | "ping" | "stop";

type TrackingSession = {
  code: string;
  watchId: number;
  phase: "idle" | "starting" | "started";
  lastSentAt: number;
  lastPosition: LivePosition | null;
};

const statusLabels: Record<(typeof statusOptions)[number], string> = {
  WAITING: "Dang cho",
  EN_ROUTE: "Dang di chuyen",
  FLYING: "Dang bay",
  LANDED: "Da ha canh"
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Khong the cap nhat vi tri pilot luc nay.";
};

const getGeoErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Pilot can cap quyen truy cap vi tri de bat dau tracking.";
    case error.POSITION_UNAVAILABLE:
      return "Khong lay duoc GPS hien tai. Hay thu lai sau.";
    case error.TIMEOUT:
      return "Lay vi tri GPS qua lau. Hay thu lai.";
    default:
      return "Co loi khi lay vi tri GPS cua pilot.";
  }
};

const formatCurrentLocation = (tracking: Tracking | null) => {
  const label = tracking?.current_location?.name;
  return typeof label === "string" && label.trim() ? label : "Dang cho cap nhat GPS";
};

const getFallbackPosition = (flight: PilotFlight, livePosition?: LivePosition | null): LivePosition | null => {
  if (livePosition) {
    return livePosition;
  }

  const currentLocation = flight.tracking?.current_location;
  if (currentLocation && typeof currentLocation.lat === "number" && typeof currentLocation.lng === "number") {
    return {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
      name: typeof currentLocation.name === "string" ? currentLocation.name : "Vi tri hien tai"
    };
  }

  return null;
};

export const FlightsPage = () => {
  const queryClient = useQueryClient();
  const { account } = usePilotAuth();
  const trackingSessionRef = useRef<TrackingSession | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [trackingActionCode, setTrackingActionCode] = useState<string | null>(null);
  const [livePositions, setLivePositions] = useState<Record<string, LivePosition>>({});

  const queryKey = ["pilot-flights", account?.id];

  const updateFlightCache = (payload: { booking: PilotFlight["booking"]; tracking: Tracking | null }) => {
    queryClient.setQueryData<PilotFlight[]>(queryKey, (current = []) =>
      current.map((flight) =>
        flight.booking.code === payload.booking.code
          ? {
              booking: payload.booking,
              tracking: payload.tracking
            }
          : flight
      )
    );
  };

  const flightsQuery = useQuery({
    queryKey,
    queryFn: () => pilotApi.listFlights(),
    enabled: Boolean(account),
    refetchInterval: activeTrackingCode ? 10000 : 30000
  });

  const stats = useMemo(() => {
    const flights = flightsQuery.data ?? [];
    return [
      { label: "Assigned", value: flights.length },
      { label: "Tracking live", value: activeTrackingCode ? 1 : 0 },
      { label: "Flying", value: flights.filter((item) => item.booking.flight_status === "FLYING").length }
    ];
  }, [activeTrackingCode, flightsQuery.data]);

  const statusMutation = useMutation({
    mutationFn: ({ code, status }: { code: string; status: string }) => pilotApi.updateFlightStatus(code, status),
    onSuccess: (result) => {
      updateFlightCache(result);
    }
  });

  const trackingMutation = useMutation({
    mutationFn: ({
      code,
      mode,
      payload
    }: {
      code: string;
      mode: TrackingMode;
      payload: LivePosition;
    }) => {
      if (mode === "start") {
        return pilotApi.startTracking(code, payload);
      }
      if (mode === "stop") {
        return pilotApi.stopTracking(code, payload);
      }
      return pilotApi.pingTracking(code, payload);
    },
    onSuccess: (result) => {
      updateFlightCache(result);
    }
  });

  const clearTrackingSession = () => {
    const session = trackingSessionRef.current;
    if (session) {
      navigator.geolocation.clearWatch(session.watchId);
      trackingSessionRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTrackingSession();
    };
  }, []);

  const startLiveTracking = (flight: PilotFlight) => {
    if (!navigator.geolocation) {
      setGeoError("Trinh duyet nay khong ho tro GPS real-time cho pilot.");
      return;
    }

    if (trackingSessionRef.current && trackingSessionRef.current.code !== flight.booking.code) {
      setGeoError("Dang co mot hanh trinh duoc tracking. Hay dung hanh trinh hien tai truoc.");
      return;
    }

    setGeoError(null);
    setTrackingActionCode(flight.booking.code);
    setActiveTrackingCode(flight.booking.code);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const session = trackingSessionRef.current;
        if (!session || session.code !== flight.booking.code) {
          return;
        }

        const payload: LivePosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "Pilot GPS live"
        };

        session.lastPosition = payload;
        setLivePositions((current) => ({ ...current, [flight.booking.code]: payload }));

        const syncTracking = async () => {
          const latestSession = trackingSessionRef.current;
          if (!latestSession || latestSession.code !== flight.booking.code) {
            return;
          }

          try {
            const now = Date.now();
            if (latestSession.phase === "idle") {
              latestSession.phase = "starting";
              await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "start", payload });
              if (trackingSessionRef.current?.code === flight.booking.code) {
                trackingSessionRef.current.phase = "started";
                trackingSessionRef.current.lastSentAt = now;
              }
              setTrackingActionCode(null);
              return;
            }

            if (latestSession.phase !== "started") {
              return;
            }

            if (now - latestSession.lastSentAt < LIVE_PING_INTERVAL_MS) {
              return;
            }

            latestSession.lastSentAt = now;
            await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "ping", payload });
          } catch (error) {
            setGeoError(getErrorMessage(error));
          }
        };

        void syncTracking();
      },
      (error) => {
        setGeoError(getGeoErrorMessage(error));
        clearTrackingSession();
        setActiveTrackingCode(null);
        setTrackingActionCode(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000
      }
    );

    trackingSessionRef.current = {
      code: flight.booking.code,
      watchId,
      phase: "idle",
      lastSentAt: 0,
      lastPosition: getFallbackPosition(flight, livePositions[flight.booking.code])
    };
  };

  const stopLiveTracking = async (flight: PilotFlight) => {
    const session = trackingSessionRef.current;
    if (session?.code === flight.booking.code) {
      clearTrackingSession();
    }

    const payload = session?.lastPosition ?? getFallbackPosition(flight, livePositions[flight.booking.code]);
    if (!payload) {
      setGeoError("Can co it nhat mot vi tri GPS hop le truoc khi dung tracking.");
      return;
    }

    setTrackingActionCode(flight.booking.code);
    try {
      await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "stop", payload });
      setActiveTrackingCode(null);
      setLivePositions((current) => {
        const next = { ...current };
        delete next[flight.booking.code];
        return next;
      });
    } catch (error) {
      setGeoError(getErrorMessage(error));
    } finally {
      setTrackingActionCode(null);
    }
  };

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge tone="success">Flight desk</Badge>
            <h1>Assigned flights</h1>
            <p>Bat dau tracking GPS khi pilot vao hanh trinh, va dung tracking de luu toan bo route tren map.</p>
          </div>
          <div className="pilot-quick-stats">
            {stats.map((item) => (
              <div key={item.label} className="pilot-stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {flightsQuery.error instanceof Error ? <p className="pilot-error">{flightsQuery.error.message}</p> : null}
        {geoError ? <p className="pilot-error">{geoError}</p> : null}

        <div className="pilot-flight-grid">
          {(flightsQuery.data ?? []).map((flight) => {
            const isLiveTracking = activeTrackingCode === flight.booking.code;
            const isActionPending = trackingActionCode === flight.booking.code || trackingMutation.isPending;

            return (
              <Card key={flight.booking.code}>
                <Panel className="pilot-flight-card">
                  <div className="row-meta">
                    <div className="pilot-flight-title">
                      <Badge tone="success">{statusLabels[flight.booking.flight_status as keyof typeof statusLabels] ?? flight.booking.flight_status}</Badge>
                      {isLiveTracking ? <Badge>GPS live</Badge> : null}
                    </div>
                    <h2>{flight.booking.service_name}</h2>
                    <span>{flight.booking.code}</span>
                  </div>

                  <div className="pilot-flight-board">
                    <div className="pilot-flight-summary">
                      <div className="pilot-card-grid">
                        <article>
                          <span>Customer</span>
                          <strong>{flight.booking.customer_name}</strong>
                        </article>
                        <article>
                          <span>Schedule</span>
                          <strong>
                            {flight.booking.flight_date} - {flight.booking.flight_time}
                          </strong>
                        </article>
                        <article>
                          <span>Current location</span>
                          <strong>{formatCurrentLocation(flight.tracking)}</strong>
                        </article>
                        <article>
                          <span>Route points</span>
                          <strong>{flight.tracking?.route_points.length ?? 0}</strong>
                        </article>
                      </div>

                      <div className="pilot-live-panel">
                        <div className="pilot-live-panel__copy">
                          <strong>GPS flight tracking</strong>
                          <p>
                            Khi pilot bat dau hanh trinh, he thong se cap nhat vi tri hien tai theo GPS va luu lai route
                            tren map theo thoi gian thuc.
                          </p>
                        </div>

                        <div className="pilot-live-panel__actions">
                          <Button
                            disabled={isLiveTracking || (Boolean(activeTrackingCode) && !isLiveTracking) || isActionPending}
                            onClick={() => startLiveTracking(flight)}
                          >
                            Bat dau tracking
                          </Button>
                          <Button
                            variant="secondary"
                            disabled={!isLiveTracking || isActionPending}
                            onClick={() => void stopLiveTracking(flight)}
                          >
                            Dung va luu route
                          </Button>
                        </div>
                      </div>

                      <div className="pilot-status-actions">
                        {statusOptions.map((status) => (
                          <Button
                            key={status}
                            variant={flight.booking.flight_status === status ? "primary" : "secondary"}
                            onClick={() => statusMutation.mutate({ code: flight.booking.code, status })}
                          >
                            {statusLabels[status]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="pilot-flight-visual">
                      <PilotFlightMap tracking={flight.tracking} livePosition={livePositions[flight.booking.code]} />

                      <div className="pilot-map-note">
                        <strong>Flight path</strong>
                        <p>
                          Sau khi pilot dung tracking, toan bo duong di chuyen van duoc giu tren map de admin va customer
                          xem lai.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pilot-timeline">
                    {(flight.tracking?.timeline ?? []).map((event, index) => (
                      <div key={`${String(event.recorded_at)}-${index}`} className="pilot-timeline__item">
                        <span>{String(event.label)}</span>
                        <small>{String(event.recorded_at)}</small>
                      </div>
                    ))}
                  </div>
                </Panel>
              </Card>
            );
          })}
        </div>

        {!flightsQuery.isLoading && (flightsQuery.data ?? []).length === 0 ? (
          <Card>
            <Panel className="pilot-empty">Khong co booking nao duoc gan cho pilot nay.</Panel>
          </Card>
        ) : null}
      </div>
    </PilotLayout>
  );
};
