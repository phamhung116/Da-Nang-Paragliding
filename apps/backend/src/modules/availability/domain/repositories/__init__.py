from __future__ import annotations

from datetime import date
from typing import Protocol

from modules.availability.domain.entities import AvailabilityDay


class AvailabilityRepository(Protocol):
    def list_month(self, service_slug: str, year: int, month: int) -> list[AvailabilityDay]: ...
    def create_many(self, days: list[AvailabilityDay]) -> list[AvailabilityDay]: ...
    def reserve_slot(
        self,
        service_slug: str,
        flight_date: date,
        flight_time: str,
        *,
        capacity: int,
        booked: int,
    ) -> AvailabilityDay: ...
    def release_slot(
        self,
        service_slug: str,
        flight_date: date,
        flight_time: str,
        *,
        capacity: int,
        booked: int,
    ) -> AvailabilityDay: ...
