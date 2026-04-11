from __future__ import annotations

from dataclasses import dataclass
from datetime import date

from modules.bookings.domain.payloads import BookingPayload


@dataclass(slots=True)
class BookingCreateRequest:
    service_slug: str
    flight_date: date
    flight_time: str
    customer_name: str
    phone: str
    email: str
    adults: int
    children: int
    notes: str | None
    payment_method: str


@dataclass(slots=True)
class ReviewBookingRequest:
    decision: str
    reason: str | None = None
    pilot_name: str | None = None
    pilot_phone: str | None = None


@dataclass(slots=True)
class AssignPilotRequest:
    pilot_name: str
    pilot_phone: str


@dataclass(slots=True)
class CancelBookingRequest:
    reason: str
    refund_bank: str | None = None
    refund_account_number: str | None = None
    refund_account_name: str | None = None
