from __future__ import annotations

from dataclasses import dataclass
from datetime import date
from decimal import Decimal


@dataclass(slots=True)
class BookingPayload:
    code: str
    service_slug: str
    service_name: str
    launch_site_name: str
    flight_date: date
    flight_time: str
    customer_name: str
    phone: str
    email: str
    adults: int
    children: int
    notes: str | None
    pickup_option: str
    pickup_address: str | None
    pickup_fee: Decimal
    unit_price: Decimal
    original_total: Decimal
    final_total: Decimal
    deposit_amount: Decimal
    deposit_percentage: int
    payment_method: str
    payment_status: str
    approval_status: str
    rejection_reason: str | None
    flight_status: str
    assigned_pilot_name: str | None
    assigned_pilot_phone: str | None
