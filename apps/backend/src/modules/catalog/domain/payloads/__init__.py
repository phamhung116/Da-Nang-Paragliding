from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal


@dataclass(slots=True)
class ServicePackagePayload:
    slug: str
    name: str
    short_description: str
    description: str
    price: Decimal
    flight_duration_minutes: int
    included_services: list[str]
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
