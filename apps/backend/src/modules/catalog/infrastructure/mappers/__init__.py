from __future__ import annotations

from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload
from modules.catalog.domain.entities import ServiceFeature, ServicePackage


def to_domain(document, *, included_feature_ids: list[str], included_features: list[ServiceFeature]) -> ServicePackage:
    return ServicePackage(
        id=str(document.id),
        slug=document.slug,
        name=document.name,
        name_en=getattr(document, "name_en", ""),
        short_description=document.short_description,
        short_description_en=getattr(document, "short_description_en", ""),
        description=document.description,
        description_en=getattr(document, "description_en", ""),
        price=document.price,
        flight_duration_minutes=document.flight_duration_minutes,
        included_feature_ids=included_feature_ids,
        included_features=included_features,
        participation_requirements=list(document.participation_requirements),
        min_child_age=document.min_child_age,
        hero_image=document.hero_image,
        gallery_images=list(document.gallery_images),
        launch_site_name=document.launch_site_name,
        launch_lat=document.launch_lat,
        launch_lng=document.launch_lng,
        landing_site_name=document.landing_site_name,
        landing_lat=document.landing_lat,
        landing_lng=document.landing_lng,
        featured=document.featured,
        active=document.active,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def to_document_defaults(
    payload: ServicePackagePayload,
    *,
    included_services: list[str],
    included_feature_ids: list[str],
) -> dict[str, object]:
    return {
        "slug": payload.slug,
        "name": payload.name,
        "name_en": payload.name_en,
        "short_description": payload.short_description,
        "short_description_en": payload.short_description_en,
        "description": payload.description,
        "description_en": payload.description_en,
        "price": payload.price,
        "flight_duration_minutes": payload.flight_duration_minutes,
        "included_services": included_services,
        "included_feature_ids": included_feature_ids,
        "participation_requirements": payload.participation_requirements,
        "min_child_age": payload.min_child_age,
        "hero_image": payload.hero_image,
        "gallery_images": payload.gallery_images,
        "launch_site_name": payload.launch_site_name,
        "launch_lat": payload.launch_lat,
        "launch_lng": payload.launch_lng,
        "landing_site_name": payload.landing_site_name,
        "landing_lat": payload.landing_lat,
        "landing_lng": payload.landing_lng,
        "featured": payload.featured,
        "active": payload.active,
    }


def to_feature_domain(document) -> ServiceFeature:
    return ServiceFeature(
        id=str(document.id),
        name=document.name,
        name_en=getattr(document, "name_en", ""),
        description=document.description,
        description_en=getattr(document, "description_en", ""),
        active=document.active,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def to_feature_document_defaults(payload: ServiceFeaturePayload) -> dict[str, object]:
    return {
        "name": payload.name,
        "name_en": payload.name_en,
        "description": payload.description,
        "description_en": payload.description_en,
        "active": payload.active,
    }
