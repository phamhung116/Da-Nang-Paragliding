from __future__ import annotations

from django.conf import settings
from django.core.mail import send_mail

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
            recipient=booking.email or booking.phone,
            title=f"Cap nhat booking {booking.code}",
            message=message,
        )
        if booking.email:
            send_mail(
                subject=f"Cap nhat booking SkyNest {booking.code}",
                message=(
                    f"Xin chao {booking.customer_name},\n\n"
                    f"{message}\n\n"
                    f"Ma booking: {booking.code}\n"
                    f"Lich bay: {booking.flight_date} luc {booking.flight_time}\n\n"
                    "SkyNest Da Nang Paragliding"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[booking.email],
                fail_silently=False,
            )
        print(f"[notification:{self.provider_name}] booking={booking.code} recipient={booking.email or booking.phone}")
