import { useEffect } from "react";
import "leaflet/dist/leaflet.css";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import type { PickupLocation } from "@paragliding/api-client";
import { useI18n } from "@/shared/providers/i18n-provider";

type PickupLocationMapProps = {
  point: PickupLocation;
  onChange: (point: PickupLocation) => void;
};

const PickupViewport = ({ point }: { point: PickupLocation }) => {
  const map = useMap();

  useEffect(() => {
    map.setView([point.lat, point.lng], 15);
  }, [map, point]);

  return null;
};

const PickupSelectionLayer = ({ point, onChange }: PickupLocationMapProps) => {
  const { tText } = useI18n();

  useMapEvents({
    click(event) {
      onChange({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
        name: point.name,
      });
    },
  });

  return (
    <CircleMarker center={[point.lat, point.lng]} radius={10} pathOptions={{ color: "#c91842", fillColor: "#e11d48", fillOpacity: 0.92 }}>
      <Popup>
        <strong>{point.name}</strong>
        <div>{tText("Bấm vào vị trí khác trên bản đồ để chỉnh điểm đón chính xác.")}</div>
      </Popup>
    </CircleMarker>
  );
};

export const PickupLocationMap = ({ point, onChange }: PickupLocationMapProps) => {
  return (
    <div className="pickup-location-map">
      <MapContainer center={[point.lat, point.lng]} zoom={15} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <PickupViewport point={point} />
        <PickupSelectionLayer point={point} onChange={onChange} />
      </MapContainer>
    </div>
  );
};
