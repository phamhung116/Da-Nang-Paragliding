from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class AvailabilitySlot:
    time: str
    capacity: int
    booked: int
    is_locked: bool
    temperature_c: float
    wind_kph: float
    uv_index: int
    visibility_km: float
    weather_condition: str
    flight_condition: str
    weather_available: bool

    @property
    def is_full(self) -> bool:
        return self.booked >= self.capacity
