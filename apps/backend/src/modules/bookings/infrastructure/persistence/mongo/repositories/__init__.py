from __future__ import annotations

from collections import defaultdict

from modules.bookings.application.dto import BookingPayload
from modules.bookings.domain.entities import Booking
from modules.bookings.domain.value_objects import (
    BOOKING_APPROVAL_CANCELLED,
    BOOKING_APPROVAL_CONFIRMED,
    BOOKING_APPROVAL_PENDING,
    BOOKING_APPROVAL_REJECTED,
)
from modules.bookings.infrastructure.persistence.mongo.documents import BookingDocument
from shared.exceptions import NotFoundError


def _to_domain(document: BookingDocument) -> Booking:
    return Booking(
        id=str(document.id),
        code=document.code,
        service_slug=document.service_slug,
        service_name=document.service_name,
        launch_site_name=document.launch_site_name,
        flight_date=document.flight_date,
        flight_time=document.flight_time,
        customer_name=document.customer_name,
        phone=document.phone,
        email=document.email,
        adults=document.adults,
        children=document.children,
        notes=document.notes,
        pickup_option=getattr(document, "pickup_option", "self"),
        pickup_address=getattr(document, "pickup_address", None),
        pickup_fee=getattr(document, "pickup_fee", 0),
        unit_price=document.unit_price,
        original_total=document.original_total,
        final_total=document.final_total,
        deposit_amount=getattr(document, "deposit_amount", 0),
        deposit_percentage=getattr(document, "deposit_percentage", 40),
        payment_method=document.payment_method,
        payment_status=document.payment_status,
        approval_status=document.approval_status,
        rejection_reason=document.rejection_reason,
        flight_status=document.flight_status,
        assigned_pilot_name=document.assigned_pilot_name,
        assigned_pilot_phone=document.assigned_pilot_phone,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


class MongoBookingRepository:
    def create(self, payload: BookingPayload) -> Booking:
        document = BookingDocument.objects.create(
            code=payload.code,
            service_slug=payload.service_slug,
            service_name=payload.service_name,
            launch_site_name=payload.launch_site_name,
            flight_date=payload.flight_date,
            flight_time=payload.flight_time,
            customer_name=payload.customer_name,
            phone=payload.phone,
            email=payload.email,
            adults=payload.adults,
            children=payload.children,
            notes=payload.notes,
            pickup_option=payload.pickup_option,
            pickup_address=payload.pickup_address,
            pickup_fee=payload.pickup_fee,
            unit_price=payload.unit_price,
            original_total=payload.original_total,
            final_total=payload.final_total,
            deposit_amount=payload.deposit_amount,
            deposit_percentage=payload.deposit_percentage,
            payment_method=payload.payment_method,
            payment_status=payload.payment_status,
            approval_status=payload.approval_status,
            rejection_reason=payload.rejection_reason,
            flight_status=payload.flight_status,
            assigned_pilot_name=payload.assigned_pilot_name,
            assigned_pilot_phone=payload.assigned_pilot_phone,
        )
        return _to_domain(document)

    def get_by_code(self, code: str) -> Booking | None:
        document = BookingDocument.objects.filter(code=code).first()
        return _to_domain(document) if document else None

    def list_by_phone(self, phone: str) -> list[Booking]:
        return [_to_domain(document) for document in BookingDocument.objects.filter(phone=phone)]

    def list_by_email(self, email: str) -> list[Booking]:
        return [_to_domain(document) for document in BookingDocument.objects.filter(email=email)]

    def list_all(self) -> list[Booking]:
        return [_to_domain(document) for document in BookingDocument.objects.all().order_by("-created_at")]

    def list_cancelled(self) -> list[Booking]:
        return [
            _to_domain(document)
            for document in BookingDocument.objects.filter(approval_status__in=[BOOKING_APPROVAL_CANCELLED, BOOKING_APPROVAL_REJECTED])
        ]

    def list_pending_review(self) -> list[Booking]:
        return [
            _to_domain(document)
            for document in BookingDocument.objects.filter(approval_status=BOOKING_APPROVAL_PENDING)
        ]

    def list_confirmed(self) -> list[Booking]:
        return [
            _to_domain(document)
            for document in BookingDocument.objects.filter(approval_status=BOOKING_APPROVAL_CONFIRMED)
        ]

    def list_for_pilot(self, phone: str) -> list[Booking]:
        return [
            _to_domain(document)
            for document in BookingDocument.objects.filter(
                approval_status=BOOKING_APPROVAL_CONFIRMED,
                assigned_pilot_phone=phone,
            )
        ]

    def count_reserved_for_slot(self, service_slug: str, flight_date, flight_time: str) -> int:
        return (
            BookingDocument.objects.filter(
                service_slug=service_slug,
                flight_date=flight_date,
                flight_time=flight_time,
            )
            .exclude(approval_status=BOOKING_APPROVAL_REJECTED)
            .exclude(approval_status=BOOKING_APPROVAL_CANCELLED)
            .count()
        )

    def reserved_counts_for_month(self, service_slug: str, year: int, month: int) -> dict[str, dict[str, int]]:
        counts: dict[str, dict[str, int]] = defaultdict(lambda: defaultdict(int))
        queryset = (
            BookingDocument.objects.filter(
                service_slug=service_slug,
                flight_date__year=year,
                flight_date__month=month,
            )
            .exclude(approval_status=BOOKING_APPROVAL_REJECTED)
            .exclude(approval_status=BOOKING_APPROVAL_CANCELLED)
        )
        for document in queryset:
            date_key = document.flight_date.isoformat()
            counts[date_key][document.flight_time] += 1
        return {date_key: dict(time_counts) for date_key, time_counts in counts.items()}

    def list_assigned_pilot_phones_for_slot(self, flight_date, flight_time: str, *, exclude_code: str | None = None) -> list[str]:
        queryset = BookingDocument.objects.filter(
            flight_date=flight_date,
            flight_time=flight_time,
            approval_status=BOOKING_APPROVAL_CONFIRMED,
            assigned_pilot_phone__isnull=False,
        )
        if exclude_code:
            queryset = queryset.exclude(code=exclude_code)
        return [str(phone) for phone in queryset.values_list("assigned_pilot_phone", flat=True) if phone]

    def update(self, booking: Booking) -> Booking:
        document = BookingDocument.objects.filter(code=booking.code).first()
        if document is None:
            raise NotFoundError("Không tìm thấy booking.")

        for field in [
            "payment_status",
            "approval_status",
            "rejection_reason",
            "flight_status",
            "notes",
            "pickup_option",
            "pickup_address",
            "pickup_fee",
            "deposit_amount",
            "deposit_percentage",
            "assigned_pilot_name",
            "assigned_pilot_phone",
        ]:
            setattr(document, field, getattr(booking, field))

        document.save()
        return _to_domain(document)
