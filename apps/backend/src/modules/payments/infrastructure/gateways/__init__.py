from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from urllib.parse import quote
from uuid import uuid4


class MockPaymentGateway:
    def __init__(self, provider_name: str) -> None:
        self.provider_name = provider_name

    def create_payment_session(
        self,
        *,
        booking_code: str,
        amount: Decimal,
        method: str,
        deposit_percentage: int,
        expires_at: datetime,
    ) -> dict[str, str]:
        reference = f"{self.provider_name.upper()}-{uuid4().hex[:8].upper()}"
        transfer_content = booking_code
        qr_payload = (
            f"bank=Mock Bank&account=00123456789&amount={amount}&content={transfer_content}"
        )
        return {
            "provider_name": self.provider_name,
            "provider_reference": reference,
            "payment_url": f"https://pay.local/{method}/{booking_code}/{reference}",
            "amount": str(amount),
            "deposit_percentage": str(deposit_percentage),
            "transfer_content": transfer_content,
            "qr_code_url": f"https://api.qrserver.com/v1/create-qr-code/?size=280x280&data={quote(qr_payload)}",
            "expires_at": expires_at.isoformat(),
        }

    def capture_payment(self, provider_reference: str) -> dict[str, str]:
        return {
            "provider_reference": provider_reference,
            "status": "PAID",
        }
