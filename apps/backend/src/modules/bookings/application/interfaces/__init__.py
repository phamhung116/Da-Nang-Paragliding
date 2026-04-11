from __future__ import annotations

from typing import Protocol

from modules.bookings.domain.entities import Booking


class BookingNotificationGateway(Protocol):
    def send_booking_update(self, booking: Booking, message: str) -> None: ...
