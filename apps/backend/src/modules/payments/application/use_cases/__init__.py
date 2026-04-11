from __future__ import annotations

from datetime import UTC, datetime

from modules.bookings.domain.repositories import BookingRepository
from modules.bookings.domain.value_objects import (
    BOOKING_APPROVAL_CONFIRMED,
    FLIGHT_STATUS_WAITING,
    PAYMENT_METHOD_CASH,
    PAYMENT_STATUS_EXPIRED,
    PAYMENT_STATUS_PAID,
)
from modules.payments.application.interfaces import PaymentGateway
from modules.payments.domain.repositories import PaymentTransactionRepository
from shared.exceptions import NotFoundError, ValidationError


class CompleteOnlinePaymentUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        payment_transaction_repository: PaymentTransactionRepository,
        payment_gateway: PaymentGateway,
    ) -> None:
        self.booking_repository = booking_repository
        self.payment_transaction_repository = payment_transaction_repository
        self.payment_gateway = payment_gateway

    def execute(self, booking_code: str) -> dict[str, object]:
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if booking.payment_method == PAYMENT_METHOD_CASH:
            raise ValidationError("Booking nay su dung thanh toan tien mat.")
        if booking.payment_status == PAYMENT_STATUS_PAID:
            transaction = self.payment_transaction_repository.get_by_booking_code(booking_code)
            return {"booking": booking, "transaction": transaction}

        transaction = self.payment_transaction_repository.get_by_booking_code(booking_code)
        if transaction is None:
            raise NotFoundError("Khong tim thay giao dich thanh toan.")

        if datetime.now(UTC) > transaction.expires_at:
            transaction = self.payment_transaction_repository.mark_expired(booking_code)
            booking.payment_status = PAYMENT_STATUS_EXPIRED
            booking = self.booking_repository.update(booking)
            raise ValidationError("Phien thanh toan da het han.")

        self.payment_gateway.capture_payment(transaction.provider_reference)
        transaction = self.payment_transaction_repository.mark_paid(booking_code)
        booking.payment_status = PAYMENT_STATUS_PAID
        booking.approval_status = BOOKING_APPROVAL_CONFIRMED
        booking.flight_status = FLIGHT_STATUS_WAITING
        booking = self.booking_repository.update(booking)
        return {"booking": booking, "transaction": transaction}
