from __future__ import annotations

from modules.bookings.domain.entities import Booking
from modules.notifications.infrastructure.persistence.mongo.repositories import (
    MongoNotificationLogRepository,
)


class ConsoleNotificationGateway:
    def __init__(self, *, provider_name: str, log_repository: MongoNotificationLogRepository) -> None:
        self.provider_name = provider_name
        self.log_repository = log_repository

    def send_booking_update(self, booking: Booking, message: str) -> None:
        self.log_repository.create(
            channel=self.provider_name,
            recipient=booking.phone,
            title=f"Cập nhật booking {booking.code}",
            message=message,
        )
        print(f"[notification:{self.provider_name}] booking={booking.code} recipient={booking.phone}")
