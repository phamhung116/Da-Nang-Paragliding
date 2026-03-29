from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class FlightTracking:
    id: str | None
    booking_code: str
    phone: str
    service_name: str
    flight_status: str
    pilot_name: str | None
    current_location: dict[str, object]
    route_points: list[dict[str, object]]
    timeline: list[dict[str, object]]
    created_at: datetime | None = None
    updated_at: datetime | None = None
