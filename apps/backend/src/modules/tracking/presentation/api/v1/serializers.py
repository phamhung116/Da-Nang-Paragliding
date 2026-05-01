from __future__ import annotations

from rest_framework import serializers


class FlightTrackingSerializer(serializers.Serializer):
    id = serializers.CharField()
    booking_code = serializers.CharField()
    phone = serializers.CharField()
    service_name = serializers.CharField()
    service_name_en = serializers.CharField()
    flight_status = serializers.CharField()
    pilot_name = serializers.CharField(allow_null=True, allow_blank=True)
    tracking_active = serializers.BooleanField()
    current_location = serializers.JSONField()
    route_points = serializers.ListField(child=serializers.JSONField())
    timeline = serializers.ListField(child=serializers.JSONField())
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class FlightStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(
        choices=["WAITING_CONFIRMATION", "WAITING", "PICKING_UP", "EN_ROUTE", "FLYING", "LANDED"]
    )
    lat = serializers.FloatField(required=False)
    lng = serializers.FloatField(required=False)
    name = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    def validate(self, attrs):
        lat = attrs.get("lat")
        lng = attrs.get("lng")
        if (lat is None) != (lng is None):
            raise serializers.ValidationError("Vị trí cần có đầy đủ vĩ độ và kinh độ.")
        return attrs

    def to_location_or_none(self, default_name: str) -> dict[str, object] | None:
        if "lat" not in self.validated_data or "lng" not in self.validated_data:
            return None
        return {
            "lat": self.validated_data["lat"],
            "lng": self.validated_data["lng"],
            "name": self.validated_data.get("name") or default_name,
        }


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
