from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Protocol

from modules.payments.domain.entities import PaymentTransaction


class PaymentTransactionRepository(Protocol):
    def create_pending(
        self,
        *,
        booking_code: str,
        method: str,
        amount: Decimal,
        deposit_percentage: int,
        provider_name: str,
        provider_reference: str,
        payment_url: str,
        qr_code_url: str,
        transfer_content: str,
        expires_at: datetime,
    ) -> PaymentTransaction: ...

    def get_by_booking_code(self, booking_code: str) -> PaymentTransaction | None: ...
    def mark_paid(self, booking_code: str) -> PaymentTransaction: ...
    def mark_expired(self, booking_code: str) -> PaymentTransaction: ...
    def mark_failed(self, booking_code: str) -> PaymentTransaction: ...
