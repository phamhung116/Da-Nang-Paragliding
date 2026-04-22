from __future__ import annotations

from decimal import Decimal

from rest_framework import serializers

from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload
from shared.media import validate_image_source


class ServiceFeatureReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    name = serializers.CharField()
    name_en = serializers.CharField()
    description = serializers.CharField()
    description_en = serializers.CharField()
    active = serializers.BooleanField()
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class ServicePackageReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    slug = serializers.CharField()
    name = serializers.CharField()
    name_en = serializers.CharField()
    short_description = serializers.CharField()
    short_description_en = serializers.CharField()
    description = serializers.CharField()
    description_en = serializers.CharField()
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    included_feature_ids = serializers.ListField(child=serializers.CharField())
    included_features = ServiceFeatureReadSerializer(many=True)
    hero_image = serializers.CharField()
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
    name_en = serializers.CharField(max_length=160, required=False, allow_blank=True)
    short_description = serializers.CharField(max_length=255)
    short_description_en = serializers.CharField(max_length=255, required=False, allow_blank=True)
    description = serializers.CharField()
    description_en = serializers.CharField(required=False, allow_blank=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2)
    included_feature_ids = serializers.ListField(child=serializers.CharField(), allow_empty=False)
    hero_image = serializers.CharField()
    launch_site_name = serializers.CharField(max_length=120)
    launch_lat = serializers.FloatField()
    launch_lng = serializers.FloatField()
    landing_site_name = serializers.CharField(max_length=120)
    landing_lat = serializers.FloatField()
    landing_lng = serializers.FloatField()
    featured = serializers.BooleanField(default=False)
    active = serializers.BooleanField(default=True)

    def validate_hero_image(self, value: str) -> str:
        return validate_image_source(value)

    def to_payload(self) -> ServicePackagePayload:
        data = self.validated_data
        name = data["name"].strip()
        short_description = data["short_description"].strip()
        description = data["description"].strip()
        return ServicePackagePayload(
            slug=data["slug"],
            name=name,
            name_en=str(data.get("name_en") or name).strip(),
            short_description=short_description,
            short_description_en=str(data.get("short_description_en") or short_description).strip(),
            description=description,
            description_en=str(data.get("description_en") or description).strip(),
            price=Decimal(data["price"]),
            flight_duration_minutes=0,
            included_feature_ids=[str(value).strip() for value in data["included_feature_ids"]],
            participation_requirements=[],
            min_child_age=0,
            hero_image=data["hero_image"],
            gallery_images=[],
            launch_site_name=data["launch_site_name"],
            launch_lat=data["launch_lat"],
            launch_lng=data["launch_lng"],
            landing_site_name=data["landing_site_name"],
            landing_lat=data["landing_lat"],
            landing_lng=data["landing_lng"],
            featured=data.get("featured", False),
            active=data.get("active", True),
        )


class ServiceFeatureWriteSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=120)
    name_en = serializers.CharField(max_length=120, required=False, allow_blank=True)
    description = serializers.CharField(max_length=255, allow_blank=True, required=False)
    description_en = serializers.CharField(max_length=255, allow_blank=True, required=False)
    active = serializers.BooleanField(default=True)

    def to_payload(self) -> ServiceFeaturePayload:
        data = self.validated_data
        name = data["name"].strip()
        description = str(data.get("description") or "").strip()
        return ServiceFeaturePayload(
            name=name,
            name_en=str(data.get("name_en") or name).strip(),
            description=description,
            description_en=str(data.get("description_en") or description).strip(),
            active=data.get("active", True),
        )
