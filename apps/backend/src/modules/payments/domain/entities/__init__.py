from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal


@dataclass(slots=True)
class PaymentTransaction:
    id: str | None
    booking_code: str
    method: str
    status: str
    amount: Decimal
    deposit_percentage: int
    provider_name: str
    provider_reference: str
    payment_url: str
    qr_code_url: str
    transfer_content: str
    expires_at: datetime
    created_at: datetime | None = None
    updated_at: datetime | None = None
