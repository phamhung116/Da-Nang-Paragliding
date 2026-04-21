from __future__ import annotations

from rest_framework import serializers


class FlightTrackingSerializer(serializers.Serializer):
    id = serializers.CharField()
    booking_code = serializers.CharField()
    phone = serializers.CharField()
    service_name = serializers.CharField()
    flight_status = serializers.CharField()
    pilot_name = serializers.CharField(allow_null=True, allow_blank=True)
    current_location = serializers.JSONField()
    route_points = serializers.ListField(child=serializers.JSONField())
    timeline = serializers.ListField(child=serializers.JSONField())
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class FlightStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["WAITING_CONFIRMATION", "WAITING", "PICKING_UP", "EN_ROUTE", "FLYING", "LANDED"]
    )


class LiveTrackingPointSerializer(serializers.Serializer):
    lat = serializers.FloatField()
    lng = serializers.FloatField()
    name = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    def to_location(self, default_name: str) -> dict[str, object]:
        return {
            "lat": self.validated_data["lat"],
            "lng": self.validated_data["lng"],
            "name": self.validated_data.get("name") or default_name,
        }
