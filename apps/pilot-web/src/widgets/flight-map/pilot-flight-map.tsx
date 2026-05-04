import { useEffect, useMemo, useRef, useState } from "react";
import { divIcon } from "leaflet";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Booking, Tracking } from "@paragliding/api-client";

type MapPoint = {
  lat: number;
  lng: number;
  name: string;
  segment?: string;
  recordedAt?: string;
};

type PilotFlightMapProps = {
  booking: Booking;
  tracking: Tracking | null;
  livePosition?: MapPoint | null;
};

const launchPoint = { lat: 16.1372, lng: 108.281, name: "Dinh Son Tra" };
const landingPoint = { lat: 16.1107, lng: 108.2554, name: "Bai bien truoc Chua Buu Dai Son" };

const pilotCarIcon = divIcon({
  className: "pilot-map-marker pilot-map-marker--car",
  html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17h10M5 17h14v-5l-2-5H7l-2 5v5Zm2.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm9 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM7 12h10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  iconSize: [34, 34],
  iconAnchor: [17, 17],
  popupAnchor: [0, -18],
});

const destinationIcon = divIcon({
  className: "pilot-map-marker pilot-map-marker--destination",
  html: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 22s7-5.1 7-12a7 7 0 1 0-14 0c0 6.9 7 12 7 12Z" fill="currentColor"/><circle cx="12" cy="10" r="2.5" fill="white"/></svg>',
  iconSize: [34, 34],
  iconAnchor: [17, 32],
  popupAnchor: [0, -30],
});

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

const parseRoutePoints = (tracking: Tracking | null, livePosition?: MapPoint | null): MapPoint[] => {
  const points = (tracking?.route_points ?? [])
    .map((point) => parseMapPoint(point, "Diem lo trinh"))
    .filter((point): point is MapPoint => Boolean(point));

  if (!livePosition) {
    return points;
  }

  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.lat !== livePosition.lat || lastPoint.lng !== livePosition.lng) {
    points.push(livePosition);
  }

  return points;
};

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

const findPickupPoint = (booking: Booking, routePoints: MapPoint[]): MapPoint | null => {
  if (booking.pickup_option !== "pickup") {
    return null;
  }

  if (typeof booking.pickup_lat === "number" && typeof booking.pickup_lng === "number") {
    return {
      lat: booking.pickup_lat,
      lng: booking.pickup_lng,
      name: booking.pickup_address?.trim() || "Diem don",
    };
  }

  const pickupAddress = booking.pickup_address?.trim();
  if (!pickupAddress) {
    return routePoints[0] ?? null;
  }

  return routePoints.find((point) => point.name.trim() === pickupAddress) ?? routePoints[0] ?? null;
};

const resolveActiveRoute = (booking: Booking, currentLocation: MapPoint | null, pickupPoint: MapPoint | null) => {
  if (booking.flight_status === "PICKING_UP" && currentLocation && pickupPoint) {
    return {
      origin: currentLocation,
      destination: pickupPoint,
      markers: dedupePoints([currentLocation, pickupPoint]),
      useRoadRouting: true,
    };
  }

  if (booking.flight_status === "EN_ROUTE" && currentLocation) {
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
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [24, 24] }
    );
  }, [map, points, viewKey]);

  return null;
};

export const PilotFlightMap = ({ booking, tracking, livePosition }: PilotFlightMapProps) => {
  const routePoints = useMemo(() => parseRoutePoints(tracking, livePosition), [tracking, livePosition]);
  const currentLocation =
    livePosition ?? parseMapPoint(tracking?.current_location, "Vi tri hien tai") ?? routePoints[routePoints.length - 1] ?? null;
  const pickupPoint = useMemo(() => findPickupPoint(booking, routePoints), [booking, routePoints]);
  const { origin, destination, markers, useRoadRouting } = useMemo(
    () => resolveActiveRoute(booking, currentLocation, pickupPoint),
    [booking, currentLocation, pickupPoint]
  );

  const [roadRoute, setRoadRoute] = useState<Array<[number, number]>>([]);
  const activeRouteKey = useRoadRouting ? routeKey(origin, destination) : "";
  const fallbackRoute =
    origin && destination ? ([[origin.lat, origin.lng], [destination.lat, destination.lng]] as Array<[number, number]>) : [];

  const routePositions = useMemo(() => {
    if (useRoadRouting && origin && destination) {
      return roadRoute.length ? roadRoute : fallbackRoute;
    }

    if (routePoints.length > 1) {
      return routePoints.map((point) => [point.lat, point.lng] as [number, number]);
    }

    return fallbackRoute;
  }, [destination, fallbackRoute, origin, roadRoute, routePoints, useRoadRouting]);

  const viewportPoints = useMemo(
    () => routePositions.map(([lat, lng]) => ({ lat, lng, name: "Lo trinh" })).concat(markers),
    [markers, routePositions]
  );
  const center = currentLocation ?? markers[markers.length - 1] ?? { lat: 16.0544, lng: 108.2022, name: "Da Nang" };
  const viewKey = `${booking.code}:${booking.flight_status}:${destination?.lat ?? "none"}:${destination?.lng ?? "none"}`;

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
    <div className="pilot-flight-map">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport points={viewportPoints} viewKey={viewKey} />

        {routePositions.length > 1 ? (
          <Polyline positions={routePositions} color="#2563eb" weight={5} opacity={0.9} />
        ) : null}

        {markers.map((point, index) => {
          const isCurrentLocation = Boolean(currentLocation && isSamePoint(point, currentLocation));
          const isDestination = Boolean(destination && isSamePoint(point, destination));

          if (isCurrentLocation || isDestination) {
            return (
              <Marker
                key={`${point.lat}-${point.lng}-${index}`}
                position={[point.lat, point.lng]}
                icon={isCurrentLocation ? pilotCarIcon : destinationIcon}
              >
                <Popup>
                  <strong>{point.name}</strong>
                  {point.recordedAt ? <div>{point.recordedAt}</div> : null}
                </Popup>
              </Marker>
            );
          }

          return (
            <CircleMarker
              key={`${point.lat}-${point.lng}-${index}`}
              center={[point.lat, point.lng]}
              radius={6}
              pathOptions={{ color: "#2563eb", fillColor: "#bfdbfe", fillOpacity: 0.9 }}
            >
              <Popup>
                <strong>{point.name}</strong>
                {point.recordedAt ? <div>{point.recordedAt}</div> : null}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {!viewportPoints.length ? <div className="pilot-flight-map__empty">Lo trinh se hien thi tai day khi phi cong bat dau theo doi GPS.</div> : null}
    </div>
  );
};
