import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Button, Card, Panel } from "@paragliding/ui";
import type { PilotFlight, Tracking } from "@paragliding/api-client";
import { pilotApi } from "@/shared/config/api";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { PilotLayout } from "@/widgets/layout/pilot-layout";
import { PilotFlightMap } from "@/widgets/flight-map/pilot-flight-map";

const statusOptions = ["WAITING", "FLYING"] as const;
const LIVE_PING_INTERVAL_MS = 5000;
const MAP_VISIBLE_STATUSES = new Set(["PICKING_UP", "EN_ROUTE", "FLYING", "LANDED"]);

type LivePosition = {
  lat: number;
  lng: number;
  name: string;
};

type TrackingMode = "start" | "ping" | "stop";

type TrackingSession = {
  code: string;
  watchId: number;
  phase: "idle" | "starting" | "started" | "stopping";
  lastSentAt: number;
  lastPosition: LivePosition | null;
};

const statusLabels: Record<string, string> = {
  WAITING: "Đang chờ",
  PICKING_UP: "Phi công đang đi đón khách",
  EN_ROUTE: "Đang di chuyển đến điểm bay",
  FLYING: "Đang bay",
  LANDED: "Đã hạ cánh"
};

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return "Không thể cập nhật vị trí phi công lúc này.";
};

const getGeoErrorMessage = (error: GeolocationPositionError) => {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Phi công cần cấp quyền truy cập vị trí để bắt đầu theo dõi GPS.";
    case error.POSITION_UNAVAILABLE:
      return "Không lấy được GPS hiện tại. Hãy thử lại sau.";
    case error.TIMEOUT:
      return "Lấy vị trí GPS quá lâu. Hãy thử lại.";
    default:
      return "Có lỗi khi lấy vị trí GPS của phi công.";
  }
};

const formatCurrentLocation = (tracking: Tracking | null) => {
  const label = tracking?.current_location?.name;
  return typeof label === "string" && label.trim() ? label : "Đang chờ cập nhật GPS";
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
      name: typeof currentLocation.name === "string" ? currentLocation.name : "Vị trí hiện tại"
    };
  }

  return null;
};

const isTrackingActive = (flight: PilotFlight, activeTrackingCode: string | null) =>
  activeTrackingCode === flight.booking.code || Boolean(flight.tracking?.tracking_active);

export const FlightsPage = () => {
  const queryClient = useQueryClient();
  const { account } = usePilotAuth();
  const trackingSessionRef = useRef<TrackingSession | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [trackingActionCode, setTrackingActionCode] = useState<string | null>(null);
  const [statusActionCode, setStatusActionCode] = useState<string | null>(null);
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

  const clearTrackingSession = () => {
    const session = trackingSessionRef.current;
    if (session) {
      navigator.geolocation.clearWatch(session.watchId);
      trackingSessionRef.current = null;
    }
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
      { label: "Được phân công", value: flights.length },
      {
        label: "Đang theo dõi",
        value: flights.filter((flight) => isTrackingActive(flight, activeTrackingCode)).length
      },
      { label: "Đang bay", value: flights.filter((item) => item.booking.flight_status === "FLYING").length }
    ];
  }, [activeTrackingCode, flightsQuery.data]);

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

  const resolveStatusPosition = (flight: PilotFlight) =>
    new Promise<LivePosition | null>((resolve) => {
      const livePosition = livePositions[flight.booking.code];
      if (livePosition) {
        resolve(livePosition);
        return;
      }

      if (!navigator.geolocation) {
        resolve(getFallbackPosition(flight));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "GPS trực tiếp của phi công"
          }),
        () => resolve(getFallbackPosition(flight)),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 5000
        }
      );
    });

  const startLiveTracking = (flight: PilotFlight, options?: { resume?: boolean }) => {
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt này không hỗ trợ GPS thời gian thực cho phi công.");
      return;
    }

    if (trackingSessionRef.current && trackingSessionRef.current.code !== flight.booking.code) {
      setGeoError("Đang có một hành trình được theo dõi GPS. Hãy dừng hành trình hiện tại trước.");
      return;
    }

    if (trackingSessionRef.current?.code === flight.booking.code) {
      return;
    }

    setGeoError(null);
    setTrackingActionCode(options?.resume ? null : flight.booking.code);
    setActiveTrackingCode(flight.booking.code);
    const shouldResume = Boolean(options?.resume && flight.tracking?.tracking_active);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const session = trackingSessionRef.current;
        if (!session || session.code !== flight.booking.code) {
          return;
        }

        const payload: LivePosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "GPS trực tiếp của phi công"
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
              try {
                await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "start", payload });
                if (trackingSessionRef.current?.code === flight.booking.code) {
                  trackingSessionRef.current.phase = "started";
                  trackingSessionRef.current.lastSentAt = now;
                }
                setTrackingActionCode(null);
              } catch (error) {
                if (trackingSessionRef.current?.code === flight.booking.code) {
                  trackingSessionRef.current.phase = "idle";
                  trackingSessionRef.current.lastSentAt = 0;
                }
                throw error;
              }
              return;
            }

            if (latestSession.phase !== "started") {
              return;
            }

            if (now - latestSession.lastSentAt < LIVE_PING_INTERVAL_MS) {
              return;
            }

            const previousSentAt = latestSession.lastSentAt;
            latestSession.lastSentAt = now;
            try {
              await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "ping", payload });
            } catch (error) {
              if (trackingSessionRef.current?.code === flight.booking.code) {
                trackingSessionRef.current.lastSentAt = previousSentAt;
              }
              throw error;
            }
          } catch (error) {
            setTrackingActionCode(null);
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
      phase: shouldResume ? "started" : "idle",
      lastSentAt: 0,
      lastPosition: getFallbackPosition(flight, livePositions[flight.booking.code])
    };
  };

  const stopLiveTracking = async (flight: PilotFlight) => {
    const session = trackingSessionRef.current;
    if (session?.code === flight.booking.code) {
      session.phase = "stopping";
    }

    const payload = session?.lastPosition ?? getFallbackPosition(flight, livePositions[flight.booking.code]);
    if (!payload) {
      if (session?.code === flight.booking.code) {
        session.phase = "started";
      }
      setGeoError("Cần có ít nhất một vị trí GPS hợp lệ trước khi dừng theo dõi.");
      return;
    }

    setTrackingActionCode(flight.booking.code);
    try {
      await trackingMutation.mutateAsync({ code: flight.booking.code, mode: "stop", payload });
      if (trackingSessionRef.current?.code === flight.booking.code) {
        clearTrackingSession();
      }
      setActiveTrackingCode(null);
      setLivePositions((current) => {
        const next = { ...current };
        delete next[flight.booking.code];
        return next;
      });
    } catch (error) {
      if (trackingSessionRef.current?.code === flight.booking.code) {
        trackingSessionRef.current.phase = "started";
      }
      setGeoError(getErrorMessage(error));
    } finally {
      setTrackingActionCode(null);
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({ code, status, payload }: { code: string; status: string; payload?: LivePosition | null }) =>
      pilotApi.updateFlightStatus(code, status, payload ?? undefined),
    onSuccess: (result) => {
      updateFlightCache(result);
      if (!result.tracking?.tracking_active && trackingSessionRef.current?.code === result.booking.code) {
        clearTrackingSession();
        setActiveTrackingCode(null);
      }
    }
  });

  const submitStatusUpdate = async (flight: PilotFlight, status: string) => {
    setStatusActionCode(flight.booking.code);
    try {
      const payload = await resolveStatusPosition(flight);
      await statusMutation.mutateAsync({ code: flight.booking.code, status, payload });
    } catch (error) {
      setGeoError(getErrorMessage(error));
    } finally {
      setStatusActionCode(null);
    }
  };

  useEffect(() => {
    return () => {
      clearTrackingSession();
    };
  }, []);

  useEffect(() => {
    if (trackingSessionRef.current || activeTrackingCode) {
      return;
    }

    const activeTrackedFlight = (flightsQuery.data ?? []).find((flight) => flight.tracking?.tracking_active);
    if (activeTrackedFlight) {
      startLiveTracking(activeTrackedFlight, { resume: true });
    }
  }, [activeTrackingCode, flightsQuery.data]);

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge tone="success">Bảng chuyến bay</Badge>
            <h1>Chuyến bay được phân công</h1>
            <p>Theo dõi GPS bắt đầu từ lúc phi công bấm đi đón khách hoặc đi tới điểm bay.</p>
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
            const hasTrackingStarted = isTrackingActive(flight, activeTrackingCode);
            const isTripFinished = flight.booking.flight_status === "LANDED";
            const isActionPending =
              trackingActionCode === flight.booking.code ||
              statusActionCode === flight.booking.code ||
              trackingMutation.isPending ||
              statusMutation.isPending;
            const shouldShowMap =
              MAP_VISIBLE_STATUSES.has(flight.booking.flight_status) ||
              hasTrackingStarted ||
              Boolean((flight.tracking?.route_points.length ?? 0) > 1);
            const trackingButtonLabel = isTripFinished
              ? "Đã kết thúc theo dõi"
                : hasTrackingStarted
                  ? flight.booking.flight_status === "PICKING_UP"
                    ? "Đã đón khách, đưa tới điểm bay"
                    : "Kết thúc theo dõi khi hạ cánh"
                : flight.booking.pickup_option === "pickup"
                  ? "Bắt đầu đi đón khách"
                  : "Bắt đầu đi tới điểm bay";

            return (
              <Card key={flight.booking.code}>
                <Panel className="pilot-flight-card">
                  <div className="row-meta">
                    <div className="pilot-flight-title">
                      <Badge tone="success">
                        {statusLabels[flight.booking.flight_status] ?? flight.booking.flight_status}
                      </Badge>
                      {hasTrackingStarted ? <Badge>GPS trực tiếp</Badge> : null}
                    </div>
                    <h2>{flight.booking.service_name}</h2>
                    <span>{flight.booking.code}</span>
                  </div>

                  <div className="pilot-flight-board">
                    <div className="pilot-flight-summary">
                      <div className="pilot-card-grid">
                        <article>
                          <span>Khách hàng</span>
                          <strong>{flight.booking.customer_name}</strong>
                        </article>
                        <article>
                          <span>Lịch bay</span>
                          <strong>
                            {flight.booking.flight_date} - {flight.booking.flight_time}
                          </strong>
                        </article>
                        <article>
                          <span>Vị trí hiện tại</span>
                          <strong>{formatCurrentLocation(flight.tracking)}</strong>
                        </article>
                        <article>
                          <span>Điểm đón</span>
                          <strong>
                            {flight.booking.pickup_option === "pickup"
                              ? flight.booking.pickup_address ?? "Địa chỉ đón"
                              : "Khách tự đến"}
                          </strong>
                        </article>
                        <article>
                          <span>Điểm GPS</span>
                          <strong>{flight.tracking?.route_points.length ?? 0}</strong>
                        </article>
                      </div>

                      <div className="pilot-live-panel">
                        <div className="pilot-live-panel__copy">
                          <strong>Theo dõi GPS chuyến bay</strong>
                          <p>Với khách chọn xe đón, lộ trình GPS bắt đầu từ lúc phi công đi đón khách.</p>
                        </div>
                        <Button
                          type="button"
                          variant={hasTrackingStarted ? "secondary" : "primary"}
                          disabled={isActionPending || statusMutation.isPending || (!hasTrackingStarted && isTripFinished)}
                          onClick={() => {
                            if (hasTrackingStarted) {
                              if (flight.booking.flight_status === "PICKING_UP") {
                                void submitStatusUpdate(flight, "EN_ROUTE");
                                return;
                              }
                              void stopLiveTracking(flight);
                              return;
                            }
                            startLiveTracking(flight);
                          }}
                        >
                          {trackingButtonLabel}
                        </Button>
                      </div>

                      <div className="pilot-status-actions">
                        {statusOptions.map((status) => (
                          <Button
                            key={status}
                            variant={flight.booking.flight_status === status ? "primary" : "secondary"}
                            disabled={statusMutation.isPending || isActionPending || (status === "FLYING" && !hasTrackingStarted)}
                            onClick={() => {
                              void submitStatusUpdate(flight, status);
                            }}
                          >
                            {statusLabels[status]}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {shouldShowMap ? (
                      <div className="pilot-flight-visual">
                        <PilotFlightMap booking={flight.booking} tracking={flight.tracking} livePosition={livePositions[flight.booking.code]} />

                        <div className="pilot-map-note">
                          <strong>Lộ trình bay</strong>
                          <p>Điểm GPS được cập nhật tự động khi phi công đang theo dõi chuyến bay.</p>
                        </div>
                      </div>
                    ) : null}
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
            <Panel className="pilot-empty">Không có lịch đặt nào được gán cho phi công này.</Panel>
          </Card>
        ) : null}
      </div>
    </PilotLayout>
  );
};
