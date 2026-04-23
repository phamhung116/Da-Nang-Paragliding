import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Booking, Tracking } from "@paragliding/api-client";

type TrackingMapProps = {
  booking: Booking;
  tracking: Tracking;
};

type MapPoint = {
  lat: number;
  lng: number;
  name: string;
  segment?: string;
  recordedAt?: string;
};

const launchPoint = { lat: 16.1372, lng: 108.281, name: "Đỉnh Sơn Trà" };
const landingPoint = { lat: 16.1107, lng: 108.2554, name: "Bãi biển trước Chùa Bửu Đài Sơn" };

const parseMapPoint = (value: Record<string, unknown> | undefined, fallbackName: string): MapPoint | null => {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    name: String(value?.name ?? fallbackName),
    segment: typeof value?.segment === "string" ? value.segment : undefined,
    recordedAt: typeof value?.recorded_at === "string" ? value.recorded_at : undefined,
  };
};

const parseTrackedRoutePoints = (tracking: Tracking) =>
  tracking.route_points
    .map((point) => parseMapPoint(point, "Điểm theo dõi"))
    .filter((point): point is MapPoint => Boolean(point));

const isSamePoint = (left: MapPoint, right: MapPoint) =>
  Math.abs(left.lat - right.lat) < 0.00001 && Math.abs(left.lng - right.lng) < 0.00001;

const dedupePoints = (points: Array<MapPoint | null | undefined>) => {
  const unique: MapPoint[] = [];
  for (const point of points) {
    if (!point) {
      continue;
    }
    if (!unique.some((item) => isSamePoint(item, point))) {
      unique.push(point);
    }
  }
  return unique;
};

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const isBaseLocationName = (value: string) => normalizeName(value).includes("chua buu dai son");

const findPickupPoint = (booking: Booking, trackedRoutePoints: MapPoint[]): MapPoint | null => {
  if (booking.pickup_option !== "pickup") {
    return null;
  }

  if (typeof booking.pickup_lat === "number" && typeof booking.pickup_lng === "number") {
    return {
      lat: booking.pickup_lat,
      lng: booking.pickup_lng,
      name: booking.pickup_address?.trim() || "Điểm đón",
    };
  }

  const pickupAddress = booking.pickup_address?.trim();
  if (pickupAddress) {
    const matched = trackedRoutePoints.find((point) => point.name.trim() === pickupAddress);
    if (matched) {
      return matched;
    }
  }

  return trackedRoutePoints.find((point) => !isBaseLocationName(point.name)) ?? null;
};

const getActiveSegmentPoints = (tracking: Tracking, flightStatus: string) => {
  const trackedRoutePoints = parseTrackedRoutePoints(tracking);
  const activeSegments = flightStatus === "LANDED" ? ["FLYING", "LANDED"] : [flightStatus];
  const filtered = trackedRoutePoints.filter((point) => point.segment && activeSegments.includes(point.segment));
  return filtered.length ? filtered : trackedRoutePoints;
};

const resolveActiveRoute = (booking: Booking, currentLocation: MapPoint, pickupPoint: MapPoint | null) => {
  if (booking.flight_status === "EN_ROUTE") {
    return {
      origin: currentLocation,
      destination: launchPoint,
      markers: dedupePoints([pickupPoint, currentLocation, launchPoint]),
      useRoadRouting: true,
    };
  }

  if (booking.flight_status === "FLYING") {
    return {
      origin: launchPoint,
      destination: currentLocation,
      markers: dedupePoints([launchPoint, currentLocation]),
      useRoadRouting: false,
    };
  }

  if (booking.flight_status === "LANDED") {
    return {
      origin: launchPoint,
      destination: landingPoint,
      markers: dedupePoints([launchPoint, landingPoint]),
      useRoadRouting: false,
    };
  }

  return {
    origin: null,
    destination: null,
    markers: dedupePoints([currentLocation]),
    useRoadRouting: false,
  };
};

const routeKey = (origin: MapPoint | null, destination: MapPoint | null) =>
  origin && destination ? `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` : "";

const MapViewport = ({ points, viewKey }: { points: MapPoint[]; viewKey: string }) => {
  const map = useMap();
  const lastViewKeyRef = useRef("");

  useEffect(() => {
    if (!points.length || lastViewKeyRef.current === viewKey) {
      return;
    }
    lastViewKeyRef.current = viewKey;

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [32, 32] }
    );
  }, [map, points, viewKey]);

  return null;
};

export const TrackingMap = ({ booking, tracking }: TrackingMapProps) => {
  const currentLocation = parseMapPoint(tracking.current_location, "Điểm hiện tại") ?? {
    lat: 16.093,
    lng: 108.247,
    name: "Đà Nẵng",
  };

  const activeTrackedPoints = useMemo(
    () => getActiveSegmentPoints(tracking, booking.flight_status),
    [booking.flight_status, tracking]
  );
  const pickupPoint = useMemo(
    () => findPickupPoint(booking, parseTrackedRoutePoints(tracking)),
    [booking, tracking]
  );
  const { origin, destination, markers, useRoadRouting } = useMemo(
    () => resolveActiveRoute(booking, currentLocation, pickupPoint),
    [booking, currentLocation, pickupPoint]
  );

  const [roadRoute, setRoadRoute] = useState<Array<[number, number]>>([]);
  const activeRouteKey = useRoadRouting ? routeKey(origin, destination) : "";
  const fallbackRoute =
    origin && destination ? ([[origin.lat, origin.lng], [destination.lat, destination.lng]] as Array<[number, number]>) : [];

  const routePositions = useMemo(() => {
    if (activeTrackedPoints.length > 1) {
      return activeTrackedPoints.map((point) => [point.lat, point.lng] as [number, number]);
    }

    if (origin && destination) {
      if (!useRoadRouting) {
        return fallbackRoute;
      }
      return roadRoute.length ? roadRoute : fallbackRoute;
    }

    return [];
  }, [activeTrackedPoints, destination, fallbackRoute, origin, roadRoute, useRoadRouting]);

  const viewportPoints = useMemo(
    () => routePositions.map(([lat, lng]) => ({ lat, lng, name: "Lộ trình" })).concat(markers),
    [markers, routePositions]
  );

  const center = markers[markers.length - 1] ?? currentLocation;
  const viewKey = `${booking.code}:${booking.flight_status}:${pickupPoint?.lat ?? "none"}:${pickupPoint?.lng ?? "none"}`;

  useEffect(() => {
    if (!activeRouteKey) {
      setRoadRoute([]);
      return;
    }

    const controller = new AbortController();
    const url = `https://router.project-osrm.org/route/v1/driving/${activeRouteKey}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload) => {
        const coordinates = payload?.routes?.[0]?.geometry?.coordinates;
        if (!Array.isArray(coordinates)) {
          setRoadRoute([]);
          return;
        }

        setRoadRoute(
          coordinates
            .map((coordinate: unknown) => {
              if (!Array.isArray(coordinate)) {
                return null;
              }
              const [lng, lat] = coordinate.map(Number);
              return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
            })
            .filter((point: [number, number] | null): point is [number, number] => Boolean(point))
        );
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setRoadRoute([]);
        }
      });

    return () => controller.abort();
  }, [activeRouteKey]);

  return (
    <div className="tracking-map">
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport points={viewportPoints} viewKey={viewKey} />
        {routePositions.length > 1 ? (
          <Polyline positions={routePositions} color="#e8702a" weight={5} opacity={0.9} />
        ) : null}
        {markers.map((point, index) => (
          <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={[point.lat, point.lng]} radius={8}>
            <Popup>
              <strong>{point.name}</strong>
              {point.recordedAt ? <div>{point.recordedAt}</div> : null}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};
