import { useEffect, useMemo } from "react";
import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import type { Tracking } from "@paragliding/api-client";

type MapPoint = {
  lat: number;
  lng: number;
  name: string;
  recordedAt?: string;
};

type PilotFlightMapProps = {
  tracking: Tracking | null;
  livePosition?: MapPoint | null;
};

const parseRoutePoints = (tracking: Tracking | null, livePosition?: MapPoint | null): MapPoint[] => {
  const points: MapPoint[] = (tracking?.route_points ?? [])
    .map((point) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
      name: String(point.name ?? "Route point"),
      recordedAt: point.recorded_at ? String(point.recorded_at) : undefined
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  if (!livePosition) {
    return points;
  }

  const lastPoint = points[points.length - 1];
  if (!lastPoint || lastPoint.lat !== livePosition.lat || lastPoint.lng !== livePosition.lng) {
    points.push(livePosition);
  }

  return points;
};

const MapViewport = ({ points }: { points: MapPoint[] }) => {
  const map = useMap();

  useEffect(() => {
    if (!points.length) {
      return;
    }

    if (points.length === 1) {
      map.setView([points[0].lat, points[0].lng], 14);
      return;
    }

    map.fitBounds(
      points.map((point) => [point.lat, point.lng] as [number, number]),
      { padding: [24, 24] }
    );
  }, [map, points]);

  return null;
};

export const PilotFlightMap = ({ tracking, livePosition }: PilotFlightMapProps) => {
  const routePoints = useMemo(() => parseRoutePoints(tracking, livePosition), [tracking, livePosition]);
  const center = routePoints[routePoints.length - 1] ?? { lat: 16.0544, lng: 108.2022, name: "Da Nang" };

  return (
    <div className="pilot-flight-map">
      <MapContainer center={[center.lat, center.lng]} zoom={13} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewport points={routePoints} />

        {routePoints.length > 1 ? (
          <Polyline positions={routePoints.map((point) => [point.lat, point.lng] as [number, number])} color="#c91842" weight={4} />
        ) : null}

        {routePoints.map((point, index) => {
          const isLastPoint = index === routePoints.length - 1;
          return (
            <CircleMarker
              key={`${point.lat}-${point.lng}-${index}`}
              center={[point.lat, point.lng]}
              radius={isLastPoint ? 8 : 5}
              pathOptions={{
                color: isLastPoint ? "#c91842" : "#7e1f31",
                fillColor: isLastPoint ? "#c91842" : "#f5cbd7",
                fillOpacity: 0.9
              }}
            >
              <Popup>
                <strong>{point.name}</strong>
                {point.recordedAt ? <div>{point.recordedAt}</div> : null}
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {!routePoints.length ? <div className="pilot-flight-map__empty">Route se hien tai day khi pilot bat dau tracking.</div> : null}
    </div>
  );
};
