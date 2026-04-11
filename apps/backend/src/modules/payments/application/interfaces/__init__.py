from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Protocol


class PaymentGateway(Protocol):
    def create_payment_session(
        self,
        *,
        booking_code: str,
        amount: Decimal,
        method: str,
        deposit_percentage: int,
        expires_at: datetime,
    ) -> dict[str, str]: ...

    def capture_payment(self, provider_reference: str) -> dict[str, str]: ...
