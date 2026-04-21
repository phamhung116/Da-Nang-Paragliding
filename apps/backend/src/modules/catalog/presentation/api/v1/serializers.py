from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload


class ServicePackageReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    slug = serializers.CharField()
    name = serializers.CharField()
    short_description = serializers.CharField()
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    flight_duration_minutes = serializers.IntegerField()
    included_services = serializers.ListField(child=serializers.CharField())
    participation_requirements = serializers.ListField(child=serializers.CharField())
    min_child_age = serializers.IntegerField()
    hero_image = serializers.URLField()
    gallery_images = serializers.ListField(child=serializers.URLField())
    launch_site_name = serializers.CharField()
    launch_lat = serializers.FloatField()
    launch_lng = serializers.FloatField()
    landing_site_name = serializers.CharField()
    landing_lat = serializers.FloatField()
    landing_lng = serializers.FloatField()
    featured = serializers.BooleanField()
    active = serializers.BooleanField()
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class ServicePackageWriteSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=120)
    name = serializers.CharField(max_length=160)
    short_description = serializers.CharField(max_length=255)
    description = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    flight_duration_minutes = serializers.IntegerField(min_value=10)
    included_services = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    participation_requirements = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    min_child_age = serializers.IntegerField(min_value=3)
    hero_image = serializers.URLField()
    gallery_images = serializers.ListField(child=serializers.URLField(), allow_empty=False)
    launch_site_name = serializers.CharField(max_length=120)
    launch_lat = serializers.FloatField()
    launch_lng = serializers.FloatField()
    landing_site_name = serializers.CharField(max_length=120)
    landing_lat = serializers.FloatField()
    landing_lng = serializers.FloatField()
    featured = serializers.BooleanField(default=False)
    active = serializers.BooleanField(default=True)

    def to_payload(self) -> ServicePackagePayload:
        data = self.validated_data
        return ServicePackagePayload(
            slug=data["slug"],
            name=data["name"],
            short_description=data["short_description"],
            description=data["description"],
            price=Decimal(data["price"]),
            flight_duration_minutes=data["flight_duration_minutes"],
            included_services=data["included_services"],
            participation_requirements=data["participation_requirements"],
            min_child_age=data["min_child_age"],
            hero_image=data["hero_image"],
            gallery_images=data["gallery_images"],
            launch_site_name=data["launch_site_name"],
            launch_lat=data["launch_lat"],
            launch_lng=data["launch_lng"],
            landing_site_name=data["landing_site_name"],
            landing_lat=data["landing_lat"],
            landing_lng=data["landing_lng"],
            featured=data.get("featured", False),
            active=data.get("active", True),
        )


class ServiceFeatureReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    description = serializers.CharField()
    active = serializers.BooleanField()
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class ServiceFeatureWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    description = serializers.CharField(max_length=255, allow_blank=True, required=False)
    active = serializers.BooleanField(default=True)

    def to_payload(self) -> ServiceFeaturePayload:
        data = self.validated_data
        return ServiceFeaturePayload(
            name=data["name"].strip(),
            description=str(data.get("description") or "").strip(),
            active=data.get("active", True),
        )
