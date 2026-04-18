import { CircleMarker, MapContainer, Polyline, Popup, TileLayer } from "react-leaflet";
import type { Booking, Tracking } from "@paragliding/api-client";

type TrackingMapProps = {
  booking: Booking;
  tracking: Tracking;
};

const basePoint = { lat: 16.1107, lng: 108.2554, name: "Chua Buu Dai Son" };
const launchPoint = { lat: 16.1372, lng: 108.281, name: "Dinh Ban Co" };
const landingPoint = { lat: 16.1107, lng: 108.2554, name: "Bai bien truoc Chua Buu Dai Son" };

export const TrackingMap = ({ booking, tracking }: TrackingMapProps) => {
  const currentLocation = {
    lat: Number(tracking.current_location.lat),
    lng: Number(tracking.current_location.lng),
    name: String(tracking.current_location.name ?? "Diem hien tai")
  };

  const points =
    booking.flight_status === "PICKING_UP" && Number.isFinite(currentLocation.lat) && Number.isFinite(currentLocation.lng)
      ? [basePoint, currentLocation]
      : booking.flight_status === "EN_ROUTE"
        ? [basePoint, launchPoint]
        : booking.flight_status === "FLYING" || booking.flight_status === "LANDED"
          ? [landingPoint]
          : [];

  const center = points[0] ?? { lat: 16.093, lng: 108.247, name: "Da Nang" };
  const shouldDrawLine = booking.flight_status === "PICKING_UP" || booking.flight_status === "EN_ROUTE";

  return (
    <div className="tracking-map">
      <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {shouldDrawLine && points.length > 1 ? (
          <Polyline positions={points.map((point) => [point.lat, point.lng])} color="#e8702a" />
        ) : null}
        {points.map((point, index) => (
          <CircleMarker key={`${point.lat}-${point.lng}-${index}`} center={[point.lat, point.lng]} radius={8}>
            <Popup>{point.name}</Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
};
