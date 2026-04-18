from __future__ import annotations

from datetime import datetime
from decimal import Decimal
import hashlib
import hmac
import json
from urllib.request import Request, urlopen
from zlib import crc32
from urllib.parse import quote
from uuid import uuid4

from django.conf import settings

from shared.exceptions import ValidationError


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


class PayOsPaymentGateway:
    endpoint = "https://api-merchant.payos.vn/v2/payment-requests"

    def __init__(self) -> None:
        self.client_id = getattr(settings, "PAYOS_CLIENT_ID", "")
        self.api_key = getattr(settings, "PAYOS_API_KEY", "")
        self.checksum_key = getattr(settings, "PAYOS_CHECKSUM_KEY", "")
        self.return_url = getattr(settings, "PAYOS_RETURN_URL", "").rstrip("/")
        self.cancel_url = getattr(settings, "PAYOS_CANCEL_URL", "").rstrip("/")

    def create_payment_session(
        self,
        *,
        booking_code: str,
        amount: Decimal,
        method: str,
        deposit_percentage: int,
        expires_at: datetime,
    ) -> dict[str, str]:
        self._ensure_configured()
        order_code = self._order_code(booking_code)
        amount_value = int(amount)
        description = booking_code[:25]
        return_url = self.return_url or f"{settings.CUSTOMER_WEB_URL.rstrip('/')}/checkout?booking={booking_code}"
        cancel_url = self.cancel_url or f"{settings.CUSTOMER_WEB_URL.rstrip('/')}/checkout?booking={booking_code}&cancelled=1"
        payload = {
            "orderCode": order_code,
            "amount": amount_value,
            "description": description,
            "items": [
                {
                    "name": f"Dat coc {booking_code}",
                    "quantity": 1,
                    "price": amount_value,
                }
            ],
            "returnUrl": return_url,
            "cancelUrl": cancel_url,
            "expiredAt": int(expires_at.timestamp()),
        }
        payload["signature"] = self._signature(
            {
                "amount": amount_value,
                "cancelUrl": cancel_url,
                "description": description,
                "orderCode": order_code,
                "returnUrl": return_url,
            }
        )

        response = self._request(self.endpoint, method="POST", payload=payload)
        data = response.get("data") or {}
        checkout_url = str(data.get("checkoutUrl") or "")
        qr_code = str(data.get("qrCode") or "")
        if not checkout_url:
            raise ValidationError("PayOS khong tra ve link thanh toan.")

        return {
            "provider_name": "payos",
            "provider_reference": str(order_code),
            "payment_url": checkout_url,
            "amount": str(amount),
            "deposit_percentage": str(deposit_percentage),
            "transfer_content": description,
            "qr_code_url": qr_code
            if qr_code.startswith("http")
            else f"https://api.qrserver.com/v1/create-qr-code/?size=280x280&data={quote(qr_code or checkout_url)}",
            "expires_at": expires_at.isoformat(),
        }

    def capture_payment(self, provider_reference: str) -> dict[str, str]:
        self._ensure_configured()
        response = self._request(f"{self.endpoint}/{provider_reference}", method="GET")
        data = response.get("data") or {}
        return {
            "provider_reference": provider_reference,
            "status": str(data.get("status") or "PENDING").upper(),
        }

    def _request(self, url: str, *, method: str, payload: dict | None = None) -> dict:
        body = json.dumps(payload).encode("utf-8") if payload is not None else None
        request = Request(
            url,
            data=body,
            method=method,
            headers={
                "Content-Type": "application/json",
                "x-client-id": self.client_id,
                "x-api-key": self.api_key,
            },
        )
        try:
            with urlopen(request, timeout=8) as response:
                return json.loads(response.read().decode("utf-8"))
        except Exception as exc:
            raise ValidationError("Khong ket noi duoc PayOS. Hay thu lai sau.") from exc

    def _ensure_configured(self) -> None:
        if not self.client_id or not self.api_key or not self.checksum_key:
            raise ValidationError("Thieu cau hinh PayOS tren backend.")

    def _signature(self, data: dict[str, object]) -> str:
        data_string = "&".join(f"{key}={data[key]}" for key in sorted(data))
        return hmac.new(
            self.checksum_key.encode("utf-8"),
            data_string.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    def _order_code(self, booking_code: str) -> int:
        digits = "".join(character for character in booking_code if character.isdigit())[-10:]
        suffix = crc32(booking_code.encode("utf-8")) % 10000
        return int(f"{digits or 0}{suffix:04d}")
