from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(slots=True)
class ServicePackage:
    id: str | None
    slug: str
    name: str
    name_en: str
    short_description: str
    short_description_en: str
    description: str
    description_en: str
    price: Decimal
    flight_duration_minutes: int
    included_feature_ids: list[str]
    included_features: list[ServiceFeature]
    participation_requirements: list[str]
    min_child_age: int
    hero_image: str
    gallery_images: list[str]
    launch_site_name: str
    launch_lat: float
    launch_lng: float
    landing_site_name: str
    landing_lat: float
    landing_lng: float
    featured: bool
    active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None


@dataclass(slots=True)
class ServiceFeature:
    id: str | None
    name: str
    name_en: str
    description: str
    description_en: str
    active: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None
