from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from modules.bookings.domain.value_objects import (
    PAYMENT_STATUS_EXPIRED,
    PAYMENT_STATUS_FAILED,
    PAYMENT_STATUS_PAID,
    PAYMENT_STATUS_PENDING,
)
from modules.payments.domain.entities import PaymentTransaction
from modules.payments.infrastructure.persistence.mongo.documents import PaymentTransactionDocument
from shared.exceptions import NotFoundError


def _to_domain(document: PaymentTransactionDocument) -> PaymentTransaction:
    return PaymentTransaction(
        id=str(document.id),
        booking_code=document.booking_code,
        method=document.method,
        status=document.status,
        amount=document.amount,
        deposit_percentage=getattr(document, "deposit_percentage", 30),
        provider_name=document.provider_name,
        provider_reference=document.provider_reference,
        payment_url=document.payment_url,
        qr_code_url=getattr(
            document,
            "qr_code_url",
            "https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=demo",
        ),
        transfer_content=getattr(document, "transfer_content", document.booking_code),
        expires_at=getattr(document, "expires_at", document.created_at),
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


class MongoPaymentTransactionRepository:
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
    ) -> PaymentTransaction:
        document = PaymentTransactionDocument.objects.create(
            booking_code=booking_code,
            method=method,
            status=PAYMENT_STATUS_PENDING,
            amount=amount,
            deposit_percentage=deposit_percentage,
            provider_name=provider_name,
            provider_reference=provider_reference,
            payment_url=payment_url,
            qr_code_url=qr_code_url,
            transfer_content=transfer_content,
            expires_at=expires_at,
        )
        return _to_domain(document)

    def get_by_booking_code(self, booking_code: str) -> PaymentTransaction | None:
        document = PaymentTransactionDocument.objects.filter(booking_code=booking_code).first()
        return _to_domain(document) if document else None

    def mark_paid(self, booking_code: str) -> PaymentTransaction:
        document = PaymentTransactionDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay giao dich.")
        document.status = PAYMENT_STATUS_PAID
        document.save(update_fields=["status", "updated_at"])
        return _to_domain(document)

    def mark_expired(self, booking_code: str) -> PaymentTransaction:
        document = PaymentTransactionDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay giao dich.")
        document.status = PAYMENT_STATUS_EXPIRED
        document.save(update_fields=["status", "updated_at"])
        return _to_domain(document)

    def mark_failed(self, booking_code: str) -> PaymentTransaction:
        document = PaymentTransactionDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay giao dich.")
        document.status = PAYMENT_STATUS_FAILED
        document.save(update_fields=["status", "updated_at"])
        return _to_domain(document)
