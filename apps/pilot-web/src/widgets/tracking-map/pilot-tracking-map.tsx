import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import type { Tracking } from "@paragliding/api-client";

type PilotTrackingMapProps = {
  tracking: Tracking | null;
};

export const PilotTrackingMap = ({ tracking }: PilotTrackingMapProps) => {
  const points = (tracking?.route_points ?? [])
    .map((point) => ({
      lat: Number(point.lat),
      lng: Number(point.lng),
      name: String(point.name ?? "Điểm theo dõi")
    }))
    .filter((point) => Number.isFinite(point.lat) && Number.isFinite(point.lng));

  const center = points[points.length - 1] ?? { lat: 16.093, lng: 108.247, name: "Đà Nẵng" };

  return (
    <div className="pilot-map">
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {points.length > 1 ? <Polyline positions={points.map((point) => [point.lat, point.lng])} color="#c91842" /> : null}
        {points.map((point, index) => (
          <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={[point.lat, point.lng]} radius={6}>
            <Popup>{point.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};
