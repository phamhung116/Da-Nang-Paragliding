from __future__ import annotations

from typing import Protocol

from modules.tracking.domain.entities import FlightTracking


class TrackingRepository(Protocol):
    def create_initial(
        self,
        *,
        booking_code: str,
        phone: str,
        service_name: str,
        flight_status: str,
        pilot_name: str | None,
        current_location: dict[str, object],
    ) -> FlightTracking: ...

    def get_by_booking_code(self, booking_code: str) -> FlightTracking | None: ...
    def get_latest_by_phone(self, phone: str) -> FlightTracking | None: ...
    def assign_pilot(self, *, booking_code: str, pilot_name: str | None) -> FlightTracking: ...
    def update_status(
        self,
        booking_code: str,
        *,
        flight_status: str,
        current_location: dict[str, object],
        timeline_event: dict[str, object] | None,
        tracking_active: bool | None = None,
        append_route_point: bool = False,
        reset_route_points: bool = False,
    ) -> FlightTracking: ...
    def append_position(
        self,
        booking_code: str,
        *,
        current_location: dict[str, object],
        timeline_event: dict[str, object] | None = None,
    ) -> FlightTracking: ...
