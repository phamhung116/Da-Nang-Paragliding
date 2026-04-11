from __future__ import annotations

from rest_framework import serializers


class AvailabilitySlotSerializer(serializers.Serializer):
    time = serializers.CharField()
    capacity = serializers.IntegerField()
    booked = serializers.IntegerField()
    is_locked = serializers.BooleanField()
    temperature_c = serializers.FloatField()
    wind_kph = serializers.FloatField()
    uv_index = serializers.IntegerField()
    visibility_km = serializers.FloatField()
    weather_condition = serializers.CharField()
    flight_condition = serializers.CharField()
    weather_available = serializers.BooleanField()
    is_full = serializers.SerializerMethodField()

    def get_is_full(self, obj) -> bool:
        return obj["booked"] >= obj["capacity"]


class AvailabilityDaySerializer(serializers.Serializer):
    id = serializers.CharField()
    service_slug = serializers.CharField()
    date = serializers.DateField()
    temperature_c = serializers.FloatField()
    wind_kph = serializers.FloatField()
    uv_index = serializers.IntegerField()
    visibility_km = serializers.FloatField()
    weather_condition = serializers.CharField()
    flight_condition = serializers.CharField()
    weather_available = serializers.BooleanField()
    slots = AvailabilitySlotSerializer(many=True)
