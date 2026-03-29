import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import type { Tracking } from "@paragliding/api-client";

type TrackingMapProps = {
  tracking: Tracking;
};

export const TrackingMap = ({ tracking }: TrackingMapProps) => {
  const points = tracking.route_points
    .map((point) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
      name: String(point.name ?? "Điểm hành trình")
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  const center = points[0] ?? { lat: 16.093, lng: 108.247 };

  return (
    <div className="tracking-map">
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polyline positions={points.map((point) => [point.lat, point.lng])} color="#e8702a" />
        {points.map((point, index) => (
          <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={[point.lat, point.lng]} radius={8}>
            <Popup>{point.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};
