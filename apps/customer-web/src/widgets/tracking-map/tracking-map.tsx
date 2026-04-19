import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Booking, Tracking } from "@paragliding/api-client";

type TrackingMapProps = {
  booking: Booking;
  tracking: Tracking;
};

const basePoint = { lat: 16.1107, lng: 108.2554, name: "Chua Buu Dai Son" };
const launchPoint = { lat: 16.1372, lng: 108.281, name: "Dinh Ban Co" };
const landingPoint = { lat: 16.1107, lng: 108.2554, name: "Bai bien truoc Chua Buu Dai Son" };

type MapPoint = {
  lat: number;
  lng: number;
  name: string;
};

const parseMapPoint = (value: Record<string, unknown> | undefined, fallbackName: string): MapPoint | null => {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return {
    lat,
    lng,
    name: String(value?.name ?? fallbackName)
  };
};

const parseTrackedRoutePoints = (tracking: Tracking) =>
  tracking.route_points
    .map((point) => parseMapPoint(point, "Tracking point"))
    .filter((point): point is MapPoint => Boolean(point));

const isSamePoint = (left: MapPoint, right: MapPoint) =>
  Math.abs(left.lat - right.lat) < 0.00001 && Math.abs(left.lng - right.lng) < 0.00001;

const normalizeName = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase();

const isBaseLocationName = (value: string) => normalizeName(value).includes("chua buu dai son");

const findPickupPoint = (booking: Booking, tracking: Tracking): MapPoint | null => {
  if (booking.pickup_option !== "pickup") {
    return null;
  }

  const pickupAddress = booking.pickup_address?.trim();
  const routePoints = parseTrackedRoutePoints(tracking);

  if (pickupAddress) {
    const matched = routePoints.find((point) => point.name.trim() === pickupAddress);
    if (matched) {
      return matched;
    }
  }

  return routePoints.find((point) => !isBaseLocationName(point.name)) ?? null;
};

const resolveGroundRoute = (booking: Booking, tracking: Tracking, currentLocation: MapPoint) => {
  const pickupPoint = findPickupPoint(booking, tracking);

  if (booking.flight_status === "PICKING_UP" && pickupPoint) {
    const origin = isSamePoint(currentLocation, pickupPoint) ? basePoint : currentLocation;
    return {
      origin,
      destination: pickupPoint,
      markers: [origin, pickupPoint]
    };
  }

  if (booking.flight_status === "EN_ROUTE") {
    const origin = isSamePoint(currentLocation, launchPoint) ? pickupPoint ?? basePoint : currentLocation;
    return {
      origin,
      destination: launchPoint,
      markers: [origin, launchPoint]
    };
  }

  if (booking.flight_status === "FLYING" || booking.flight_status === "LANDED") {
    return {
      origin: launchPoint,
      destination: landingPoint,
      markers: [launchPoint, landingPoint]
    };
  }

  return {
    origin: null,
    destination: null,
    markers: [currentLocation]
  };
};

const routeKey = (origin: MapPoint | null, destination: MapPoint | null) =>
  origin && destination ? `${origin.lng},${origin.lat};${destination.lng},${destination.lat}` : "";

const MapViewport = ({ points }: { points: MapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 13);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [32, 32] }
    );
  }, [map, points]);

  return null;
};

export const TrackingMap = ({ booking, tracking }: TrackingMapProps) => {
  const currentLocation = parseMapPoint(tracking.current_location, "Diem hien tai") ?? {
    lat: 16.093,
    lng: 108.247,
    name: "Da Nang"
  };
  const trackedRoutePoints = useMemo(() => parseTrackedRoutePoints(tracking), [tracking]);
  const hasTrackedSession = trackedRoutePoints.length > 0;
  const { origin, destination, markers } = useMemo(
    () => resolveGroundRoute(booking, tracking, currentLocation),
    [booking, currentLocation, tracking]
  );
  const [roadRoute, setRoadRoute] = useState<Array<[number, number]>>([]);
  const activeRouteKey = routeKey(origin, destination);
  const fallbackRoute =
    origin && destination ? ([[origin.lat, origin.lng], [destination.lat, destination.lng]] as Array<[number, number]>) : [];

  const routePositions = useMemo(() => {
    if (trackedRoutePoints.length > 1) {
      return trackedRoutePoints.map((point) => [point.lat, point.lng] as [number, number]);
    }

    if (hasTrackedSession) {
      return [];
    }

    return roadRoute.length ? roadRoute : fallbackRoute;
  }, [fallbackRoute, hasTrackedSession, roadRoute, trackedRoutePoints]);

  const markerPoints = useMemo(() => {
    if (!trackedRoutePoints.length) {
      return markers;
    }

    const first = trackedRoutePoints[0];
    const last = trackedRoutePoints[trackedRoutePoints.length - 1];
    return isSamePoint(first, last) ? [last] : [first, last];
  }, [markers, trackedRoutePoints]);

  const viewportPoints = useMemo(
    () =>
      routePositions
        .map(([lat, lng]) => ({ lat, lng, name: "Route" }))
        .concat(markerPoints),
    [markerPoints, routePositions]
  );

  const center = markerPoints[markerPoints.length - 1] ?? currentLocation;

  useEffect(() => {
    if (!activeRouteKey || hasTrackedSession) {
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
  }, [activeRouteKey, hasTrackedSession]);

  return (
    <div className="tracking-map">
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport points={viewportPoints} />
        {routePositions.length > 1 ? (
          <Polyline positions={routePositions} color="#e8702a" weight={5} opacity={0.9} />
        ) : null}
        {markerPoints.map((point, index) => (
          <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={[point.lat, point.lng]} radius={8}>
            <Popup>{point.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};
