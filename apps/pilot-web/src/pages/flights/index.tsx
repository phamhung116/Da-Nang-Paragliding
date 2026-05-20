import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Badge, Button, Card, Panel } from "@paragliding/ui";
import type { PilotFlight, Tracking } from "@paragliding/api-client";
import { ChevronRight } from "lucide-react";
import { pilotApi } from "@/shared/config/api";
import { routes } from "@/shared/config/routes";
import { usePilotAuth } from "@/shared/providers/auth-provider";
import { PilotLayout } from "@/widgets/layout/pilot-layout";
import { PilotFlightMap } from "@/widgets/flight-map/pilot-flight-map";

const pilotStatusOptions = ["FLYING"] as const;
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
  WAITING_CONFIRMATION: "Chờ xác nhận",
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

const formatFlightDateTime = (flight: PilotFlight) => `${flight.booking.flight_date} - ${flight.booking.flight_time}`;

export const FlightsPage = () => {
  const navigate = useNavigate();
  const { account } = usePilotAuth();
  const queryKey = ["pilot-flights", account?.id];

  const flightsQuery = useQuery({
    queryKey,
    queryFn: () => pilotApi.listFlights(),
    enabled: Boolean(account),
    refetchInterval: 30000
  });

  const flights = flightsQuery.data ?? [];
  const stats = useMemo(
    () => [
      { label: "Được phân công", value: flights.length },
      { label: "Đang theo dõi", value: flights.filter((flight) => flight.tracking?.tracking_active).length },
      { label: "Đang bay", value: flights.filter((flight) => flight.booking.flight_status === "FLYING").length }
    ],
    [flights]
  );

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <h1>Danh sách chuyến bay</h1>
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

        <Card>
          <Panel className="pilot-assigned-list">
            <div className="pilot-booking-list">
              {flights.map((flight) => (
                <button
                  key={flight.booking.code}
                  type="button"
                  className="pilot-booking-row"
                  onClick={() => navigate(routes.flightDetail(flight.booking.code))}
                >
                  <div className="row-meta">
                    <strong>{flight.booking.code}</strong>
                    <small>{flight.booking.email}</small>
                  </div>
                  <div className="row-meta">
                    <strong>{flight.booking.service_name}</strong>
                    <span>{formatFlightDateTime(flight)}</span>
                  </div>
                  <div className="row-meta">
                    <Badge tone={flight.booking.flight_status === "LANDED" ? "success" : "default"}>
                      {statusLabels[flight.booking.flight_status] ?? flight.booking.flight_status}
                    </Badge>
                  </div>
                  <span className="pilot-booking-row__action" aria-hidden="true">
                    <ChevronRight size={18} strokeWidth={2.5} />
                  </span>
                </button>
              ))}
            </div>

            {!flightsQuery.isLoading && flights.length === 0 ? (
              <div className="pilot-empty">Không có lịch đặt nào được gán cho phi công này.</div>
            ) : null}
          </Panel>
        </Card>
      </div>
    </PilotLayout>
  );
};

export const FlightDetailPage = () => {
  const { code = "" } = useParams();
  const queryClient = useQueryClient();
  const { account } = usePilotAuth();
  const isDriver = account?.role === "DRIVER";
  const trackingSessionRef = useRef<TrackingSession | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeTrackingCode, setActiveTrackingCode] = useState<string | null>(null);
  const [trackingActionCode, setTrackingActionCode] = useState<string | null>(null);
  const [statusActionCode, setStatusActionCode] = useState<string | null>(null);
  const [livePositions, setLivePositions] = useState<Record<string, LivePosition>>({});

  const queryKey = ["pilot-flights", account?.id];

  const flightsQuery = useQuery({
    queryKey,
    queryFn: () => pilotApi.listFlights(),
    enabled: Boolean(account),
    refetchInterval: activeTrackingCode ? 10000 : 30000
  });

  const flight = (flightsQuery.data ?? []).find((item) => item.booking.code === code);

  const updateFlightCache = (payload: { booking: PilotFlight["booking"]; tracking: Tracking | null }) => {
    queryClient.setQueryData<PilotFlight[]>(queryKey, (current = []) =>
      current.map((currentFlight) =>
        currentFlight.booking.code === payload.booking.code
          ? {
              booking: payload.booking,
              tracking: payload.tracking
            }
          : currentFlight
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

  const trackingMutation = useMutation({
    mutationFn: ({
      code: bookingCode,
      mode,
      payload
    }: {
      code: string;
      mode: TrackingMode;
      payload: LivePosition;
    }) => {
      if (mode === "start") {
        return pilotApi.startTracking(bookingCode, payload);
      }
      if (mode === "stop") {
        return pilotApi.stopTracking(bookingCode, payload);
      }
      return pilotApi.pingTracking(bookingCode, payload);
    },
    onSuccess: (result) => {
      updateFlightCache(result);
    }
  });

  const resolveStatusPosition = (selectedFlight: PilotFlight) =>
    new Promise<LivePosition | null>((resolve) => {
      const livePosition = livePositions[selectedFlight.booking.code];
      if (livePosition) {
        resolve(livePosition);
        return;
      }

      if (!navigator.geolocation) {
        resolve(getFallbackPosition(selectedFlight));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            name: "GPS trực tiếp của phi công"
          }),
        () => resolve(getFallbackPosition(selectedFlight)),
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 5000
        }
      );
    });

  const startLiveTracking = (selectedFlight: PilotFlight, options?: { resume?: boolean }) => {
    if (!navigator.geolocation) {
      setGeoError("Trình duyệt này không hỗ trợ GPS thời gian thực cho phi công.");
      return;
    }

    if (trackingSessionRef.current && trackingSessionRef.current.code !== selectedFlight.booking.code) {
      setGeoError("Đang có một hành trình được theo dõi GPS. Hãy dừng hành trình hiện tại trước.");
      return;
    }

    if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
      return;
    }

    setGeoError(null);
    setTrackingActionCode(options?.resume ? null : selectedFlight.booking.code);
    setActiveTrackingCode(selectedFlight.booking.code);
    const shouldResume = Boolean(options?.resume && selectedFlight.tracking?.tracking_active);

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const session = trackingSessionRef.current;
        if (!session || session.code !== selectedFlight.booking.code) {
          return;
        }

        const payload: LivePosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: "GPS trực tiếp của phi công"
        };

        session.lastPosition = payload;
        setLivePositions((current) => ({ ...current, [selectedFlight.booking.code]: payload }));

        const syncTracking = async () => {
          const latestSession = trackingSessionRef.current;
          if (!latestSession || latestSession.code !== selectedFlight.booking.code) {
            return;
          }

          try {
            const now = Date.now();
            if (latestSession.phase === "idle") {
              latestSession.phase = "starting";
              try {
                await trackingMutation.mutateAsync({ code: selectedFlight.booking.code, mode: "start", payload });
                if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
                  trackingSessionRef.current.phase = "started";
                  trackingSessionRef.current.lastSentAt = now;
                }
                setTrackingActionCode(null);
              } catch (error) {
                if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
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
              await trackingMutation.mutateAsync({ code: selectedFlight.booking.code, mode: "ping", payload });
            } catch (error) {
              if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
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
      code: selectedFlight.booking.code,
      watchId,
      phase: shouldResume ? "started" : "idle",
      lastSentAt: 0,
      lastPosition: getFallbackPosition(selectedFlight, livePositions[selectedFlight.booking.code])
    };
  };

  const stopLiveTracking = async (selectedFlight: PilotFlight) => {
    const session = trackingSessionRef.current;
    if (session?.code === selectedFlight.booking.code) {
      session.phase = "stopping";
    }

    const payload = session?.lastPosition ?? getFallbackPosition(selectedFlight, livePositions[selectedFlight.booking.code]);
    if (!payload) {
      if (session?.code === selectedFlight.booking.code) {
        session.phase = "started";
      }
      setGeoError("Cần có ít nhất một vị trí GPS hợp lệ trước khi dừng theo dõi.");
      return;
    }

    setTrackingActionCode(selectedFlight.booking.code);
    try {
      await trackingMutation.mutateAsync({ code: selectedFlight.booking.code, mode: "stop", payload });
      if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
        clearTrackingSession();
      }
      setActiveTrackingCode(null);
      setLivePositions((current) => {
        const next = { ...current };
        delete next[selectedFlight.booking.code];
        return next;
      });
    } catch (error) {
      if (trackingSessionRef.current?.code === selectedFlight.booking.code) {
        trackingSessionRef.current.phase = "started";
      }
      setGeoError(getErrorMessage(error));
    } finally {
      setTrackingActionCode(null);
    }
  };

  const statusMutation = useMutation({
    mutationFn: ({
      code: bookingCode,
      status,
      payload
    }: {
      code: string;
      status: string;
      payload?: LivePosition | null;
    }) => pilotApi.updateFlightStatus(bookingCode, status, payload ?? undefined),
    onSuccess: (result) => {
      updateFlightCache(result);
      if (!result.tracking?.tracking_active && trackingSessionRef.current?.code === result.booking.code) {
        clearTrackingSession();
        setActiveTrackingCode(null);
      }
    }
  });

  const submitStatusUpdate = async (selectedFlight: PilotFlight, status: string) => {
    setStatusActionCode(selectedFlight.booking.code);
    try {
      const payload = await resolveStatusPosition(selectedFlight);
      await statusMutation.mutateAsync({ code: selectedFlight.booking.code, status, payload });
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
    if (trackingSessionRef.current || activeTrackingCode || !flight?.tracking?.tracking_active) {
      return;
    }

    startLiveTracking(flight, { resume: true });
  }, [activeTrackingCode, flight]);

  if (!code) {
    return <Navigate to={routes.home} replace />;
  }

  const hasTrackingStarted = flight ? isTrackingActive(flight, activeTrackingCode) : false;
  const isTripFinished = flight?.booking.flight_status === "LANDED";
  const isActionPending =
    Boolean(flight) &&
    (trackingActionCode === flight?.booking.code ||
      statusActionCode === flight?.booking.code ||
      trackingMutation.isPending ||
      statusMutation.isPending);
  const shouldShowMap = flight
    ? MAP_VISIBLE_STATUSES.has(flight.booking.flight_status) ||
      hasTrackingStarted ||
      Boolean((flight.tracking?.route_points.length ?? 0) > 1)
    : false;
  const trackingButtonLabel = !flight
    ? ""
    : isTripFinished
      ? "Đã kết thúc theo dõi"
      : hasTrackingStarted
        ? flight.booking.flight_status === "PICKING_UP"
          ? "Đã đón khách, đưa tới điểm bay"
          : isDriver
            ? "Đang đưa khách tới điểm bay"
            : "Kết thúc theo dõi khi hạ cánh"
        : flight.booking.pickup_option === "pickup"
          ? "Bắt đầu đi đón khách"
          : "Bắt đầu đi tới điểm bay";

  return (
    <PilotLayout>
      <div className="pilot-stack">
        <div className="pilot-heading">
          <div>
            <Badge tone="success">Chi tiết chuyến bay</Badge>
            <h1>{flight?.booking.code ?? code}</h1>
            <p>Cập nhật tiến độ, theo dõi GPS và xem thông tin vận hành của booking đang chọn.</p>
          </div>
          <Link to={routes.home}>
            <Button variant="secondary">Quay lại danh sách</Button>
          </Link>
        </div>

        {flightsQuery.error instanceof Error ? <p className="pilot-error">{flightsQuery.error.message}</p> : null}
        {geoError ? <p className="pilot-error">{geoError}</p> : null}

        {!flightsQuery.isLoading && !flight ? (
          <Card>
            <Panel className="pilot-empty">Không tìm thấy booking được phân công.</Panel>
          </Card>
        ) : null}

        {flight ? (
          <Card>
            <Panel className="pilot-flight-card">
              <div className="row-meta">
                <div className="pilot-flight-title">
                  <Badge tone="success">{statusLabels[flight.booking.flight_status] ?? flight.booking.flight_status}</Badge>
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
                    <article className="pilot-flight-time-summary-card">
                      <span>Lịch bay</span>
                      <strong>{formatFlightDateTime(flight)}</strong>
                    </article>
                    <article className="pilot-pickup-summary-card">
                      <span>Điểm đón</span>
                      <strong>
                        {flight.booking.pickup_option === "pickup"
                          ? flight.booking.pickup_address ?? "Địa chỉ đón"
                          : "Khách tự đến"}
                      </strong>
                    </article>
                  </div>

                  <div className="pilot-live-panel">
                    <div className="pilot-live-panel__copy">
                      <strong>Theo dõi GPS chuyến bay</strong>
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
                          if (isDriver) {
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
                    {!isDriver ? pilotStatusOptions.map((status) => (
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
                    )) : null}
                  </div>
                </div>

                {shouldShowMap ? (
                  <div className="pilot-flight-visual">
                    <PilotFlightMap booking={flight.booking} tracking={flight.tracking} livePosition={livePositions[flight.booking.code]} />
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
        ) : null}
      </div>
    </PilotLayout>
  );
};
