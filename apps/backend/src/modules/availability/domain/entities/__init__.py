from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from modules.availability.domain.value_objects import AvailabilitySlot


@dataclass(slots=True)
class AvailabilityDay:
    id: str | None
    service_slug: str
    date: date
    temperature_c: float
    wind_kph: float
    uv_index: int
    visibility_km: float
    weather_condition: str
    flight_condition: str
    weather_available: bool
    slots: list[AvailabilitySlot]
