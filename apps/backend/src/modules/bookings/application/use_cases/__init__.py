from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from modules.availability.domain.repositories import AvailabilityRepository
from modules.bookings.application.dto import (
    AssignPilotRequest,
    BookingCreateRequest,
    BookingPayload,
    CancelBookingRequest,
    ReviewBookingRequest,
)
from modules.bookings.application.interfaces import BookingNotificationGateway
from modules.bookings.domain.entities import Booking
from modules.bookings.domain.repositories import BookingRepository
from modules.bookings.domain.services import PricingPolicy
from modules.bookings.domain.value_objects import (
    BOOKING_APPROVAL_CANCELLED,
    BOOKING_APPROVAL_CONFIRMED,
    BOOKING_APPROVAL_PENDING,
    BOOKING_APPROVAL_REJECTED,
    FLIGHT_STATUS_WAITING_CONFIRMATION,
    PICKUP_OPTION_SELF,
    PICKUP_OPTION_SHUTTLE,
    FLIGHT_STATUS_WAITING,
    ONLINE_PAYMENT_METHODS,
    PAYMENT_STATUS_AWAITING_CASH,
    PAYMENT_STATUS_PENDING,
)
from modules.accounts.domain.repositories import AccountRepository
from modules.catalog.domain.repositories import ServicePackageRepository
from modules.payments.domain.repositories import PaymentTransactionRepository
from modules.payments.application.interfaces import PaymentGateway
from modules.tracking.domain.repositories import TrackingRepository
from shared.exceptions import NotFoundError, ValidationError
from shared.utils import generate_booking_code, normalize_phone, quantize_money

PICKUP_FEE = Decimal("50000")


class CreateBookingUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        service_package_repository: ServicePackageRepository,
        availability_repository: AvailabilityRepository,
        pricing_policy: PricingPolicy,
        payment_transaction_repository: PaymentTransactionRepository,
        payment_gateway: PaymentGateway,
        tracking_repository: TrackingRepository,
        account_repository: AccountRepository,
        online_deposit_percent: int,
    ) -> None:
        self.booking_repository = booking_repository
        self.service_package_repository = service_package_repository
        self.availability_repository = availability_repository
        self.pricing_policy = pricing_policy
        self.payment_transaction_repository = payment_transaction_repository
        self.payment_gateway = payment_gateway
        self.tracking_repository = tracking_repository
        self.account_repository = account_repository
        self.online_deposit_percent = online_deposit_percent

    def execute(self, request: BookingCreateRequest) -> dict[str, object]:
        service_package = self.service_package_repository.get_by_slug(request.service_slug)
        if service_package is None or not service_package.active:
            raise NotFoundError("Khong tim thay goi dich vu.")
        if request.adults + request.children <= 0:
            raise ValidationError("So luong khach phai lon hon 0.")
        pickup_option = request.pickup_option or PICKUP_OPTION_SELF
        if pickup_option not in {PICKUP_OPTION_SELF, PICKUP_OPTION_SHUTTLE}:
            raise ValidationError("Lua chon dua don khong hop le.")
        pickup_address = request.pickup_address.strip() if request.pickup_address else None
        if pickup_option == PICKUP_OPTION_SHUTTLE and not pickup_address:
            raise ValidationError("Vui long nhap dia chi don.")
        pickup_fee = PICKUP_FEE if pickup_option == PICKUP_OPTION_SHUTTLE else Decimal("0")

        active_pilot_count = self._active_pilot_count()
        current_reserved = self.booking_repository.count_reserved_for_slot(
            request.service_slug,
            request.flight_date,
            request.flight_time,
        )
        if current_reserved >= active_pilot_count:
            raise ValidationError("Khung gio nay da het pilot kha dung.")

        self.availability_repository.reserve_slot(
            request.service_slug,
            request.flight_date,
            request.flight_time,
            capacity=active_pilot_count,
            booked=current_reserved + 1,
        )

        pricing = self.pricing_policy.calculate(
            unit_price=service_package.price,
            adults=request.adults,
            children=request.children,
            payment_method=request.payment_method,
        )
        final_total = quantize_money(pricing.original_total + pickup_fee)
        deposit_amount = quantize_money((pricing.original_total * self.online_deposit_percent / 100) + pickup_fee)
        payment_status = (
            PAYMENT_STATUS_PENDING if request.payment_method in ONLINE_PAYMENT_METHODS else PAYMENT_STATUS_AWAITING_CASH
        )
        booking = self.booking_repository.create(
            BookingPayload(
                code=generate_booking_code(),
                service_slug=service_package.slug,
                service_name=service_package.name,
                launch_site_name=service_package.launch_site_name,
                flight_date=request.flight_date,
                flight_time=request.flight_time,
                customer_name=request.customer_name.strip(),
                phone=normalize_phone(request.phone),
                email=request.email.lower().strip(),
                adults=request.adults,
                children=request.children,
                notes=request.notes.strip() if request.notes else None,
                pickup_option=pickup_option,
                pickup_address=pickup_address,
                pickup_fee=pickup_fee,
                unit_price=service_package.price,
                original_total=pricing.original_total,
                final_total=final_total,
                deposit_amount=deposit_amount,
                deposit_percentage=self.online_deposit_percent,
                payment_method=request.payment_method,
                payment_status=payment_status,
                approval_status=BOOKING_APPROVAL_PENDING,
                rejection_reason=None,
                flight_status=FLIGHT_STATUS_WAITING_CONFIRMATION,
                assigned_pilot_name=None,
                assigned_pilot_phone=None,
            )
        )

        payment_session = None
        if request.payment_method in ONLINE_PAYMENT_METHODS:
            expires_at = datetime.now(UTC) + timedelta(minutes=30)
            payment_session = self.payment_gateway.create_payment_session(
                booking_code=booking.code,
                amount=deposit_amount,
                method=request.payment_method,
                deposit_percentage=self.online_deposit_percent,
                expires_at=expires_at,
            )
            self.payment_transaction_repository.create_pending(
                booking_code=booking.code,
                method=request.payment_method,
                amount=deposit_amount,
                deposit_percentage=self.online_deposit_percent,
                provider_name=payment_session["provider_name"],
                provider_reference=payment_session["provider_reference"],
                payment_url=payment_session["payment_url"],
                qr_code_url=payment_session["qr_code_url"],
                transfer_content=payment_session["transfer_content"],
                expires_at=expires_at,
            )

        self.tracking_repository.create_initial(
            booking_code=booking.code,
            phone=booking.phone,
            service_name=booking.service_name,
            flight_status=booking.flight_status,
            pilot_name=None,
            current_location={
                "name": "Chua Buu Dai Son",
                "lat": 16.1107,
                "lng": 108.2554,
            },
        )

        return {"booking": booking, "payment_session": payment_session}

    def _active_pilot_count(self) -> int:
        return len(self.account_repository.list(role="PILOT", is_active=True))


class LookupBookingsByPhoneUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self, identifier: str) -> list[Booking]:
        identifier = identifier.strip()
        if "@" in identifier:
            return self.booking_repository.list_by_email(identifier.lower())
        return self.booking_repository.list_by_phone(normalize_phone(identifier))


class ListBookingRequestsUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self) -> list[Booking]:
        return self.booking_repository.list_pending_review()


class GetBookingUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self, code: str) -> Booking:
        booking = self.booking_repository.get_by_code(code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        return booking


class ReviewBookingUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        availability_repository: AvailabilityRepository,
        notification_gateway: BookingNotificationGateway,
        tracking_repository: TrackingRepository,
        account_repository: AccountRepository,
    ) -> None:
        self.booking_repository = booking_repository
        self.availability_repository = availability_repository
        self.notification_gateway = notification_gateway
        self.tracking_repository = tracking_repository
        self.account_repository = account_repository

    def execute(self, booking_code: str, request: ReviewBookingRequest) -> Booking:
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if booking.approval_status != BOOKING_APPROVAL_PENDING:
            raise ValidationError("Booking nay da duoc xu ly truoc do.")

        if request.decision == "confirm":
            if not request.pilot_name or not request.pilot_phone:
                raise ValidationError("Can chon pilot kha dung khi xac nhan booking.")
            booking.approval_status = BOOKING_APPROVAL_CONFIRMED
            booking.rejection_reason = None
            booking.flight_status = FLIGHT_STATUS_WAITING
            booking.assigned_pilot_name = request.pilot_name.strip()
            booking.assigned_pilot_phone = normalize_phone(request.pilot_phone)
            self._ensure_pilot_available(booking)
            updated_booking = self.booking_repository.update(booking)
            self.tracking_repository.assign_pilot(
                booking_code=updated_booking.code,
                pilot_name=updated_booking.assigned_pilot_name,
            )
            message = f"Booking {updated_booking.code} da duoc xac nhan va gan pilot {updated_booking.assigned_pilot_name}."
        elif request.decision == "reject":
            if not request.reason:
                raise ValidationError("Ly do tu choi la bat buoc.")
            booking.approval_status = BOOKING_APPROVAL_CANCELLED
            booking.rejection_reason = request.reason
            updated_booking = self.booking_repository.update(booking)
            active_pilot_count = self._active_pilot_count()
            current_reserved = self.booking_repository.count_reserved_for_slot(
                booking.service_slug,
                booking.flight_date,
                booking.flight_time,
            )
            self.availability_repository.release_slot(
                booking.service_slug,
                booking.flight_date,
                booking.flight_time,
                capacity=active_pilot_count,
                booked=current_reserved,
            )
            message = f"Booking {booking.code} bi tu choi. Ly do: {request.reason}"
        else:
            raise ValidationError("Quyet dinh khong hop le.")

        self.notification_gateway.send_booking_update(updated_booking, message)
        return updated_booking

    def _active_pilot_count(self) -> int:
        return len(self.account_repository.list(role="PILOT", is_active=True))

    def _ensure_pilot_available(self, booking: Booking) -> None:
        pilot_phone = normalize_phone(booking.assigned_pilot_phone or "")
        pilot = self.account_repository.get_by_phone(pilot_phone)
        if pilot is None or not pilot.is_active or pilot.role != "PILOT":
            raise ValidationError("Pilot duoc chon khong hop le hoac da bi vo hieu hoa.")

        occupied_pilot_phones = {
            normalize_phone(phone)
            for phone in self.booking_repository.list_assigned_pilot_phones_for_slot(
                booking.flight_date,
                booking.flight_time,
                exclude_code=booking.code,
            )
        }
        if pilot_phone in occupied_pilot_phones:
            raise ValidationError("Pilot nay da duoc gan cho mot booking khac trong cung khung gio.")


class ListConfirmedBookingsUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self) -> list[Booking]:
        return self.booking_repository.list_all()


class CancelBookingUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        availability_repository: AvailabilityRepository,
        notification_gateway: BookingNotificationGateway,
        account_repository: AccountRepository,
    ) -> None:
        self.booking_repository = booking_repository
        self.availability_repository = availability_repository
        self.notification_gateway = notification_gateway
        self.account_repository = account_repository

    def execute(self, booking_code: str, request: CancelBookingRequest, *, customer_email: str | None = None) -> Booking:
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if customer_email and booking.email.lower() != customer_email.lower().strip():
            raise ValidationError("Ban khong co quyen huy booking nay.")
        if booking.approval_status in {BOOKING_APPROVAL_CANCELLED, BOOKING_APPROVAL_REJECTED}:
            raise ValidationError("Booking nay da bi huy truoc do.")
        if not request.reason.strip():
            raise ValidationError("Ly do huy booking la bat buoc.")

        booking.approval_status = BOOKING_APPROVAL_CANCELLED
        booking.rejection_reason = self._build_reason(request)
        updated_booking = self.booking_repository.update(booking)
        self._release_reserved_slot(updated_booking)
        self.notification_gateway.send_booking_update(
            updated_booking,
            f"Booking {updated_booking.code} da bi huy. Ly do: {request.reason.strip()}",
        )
        return updated_booking

    def _build_reason(self, request: CancelBookingRequest) -> str:
        reason = request.reason.strip()
        refund_parts = [
            ("Ngan hang", request.refund_bank),
            ("So tai khoan", request.refund_account_number),
            ("Chu tai khoan", request.refund_account_name),
        ]
        details = [f"{label}: {value.strip()}" for label, value in refund_parts if value and value.strip()]
        if not details:
            return reason
        return f"{reason}\nThong tin hoan coc: " + "; ".join(details)

    def _release_reserved_slot(self, booking: Booking) -> None:
        active_pilot_count = len(self.account_repository.list(role="PILOT", is_active=True))
        current_reserved = self.booking_repository.count_reserved_for_slot(
            booking.service_slug,
            booking.flight_date,
            booking.flight_time,
        )
        self.availability_repository.release_slot(
            booking.service_slug,
            booking.flight_date,
            booking.flight_time,
            capacity=active_pilot_count,
            booked=current_reserved,
        )


class AssignPilotUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        tracking_repository: TrackingRepository,
        notification_gateway: BookingNotificationGateway,
        account_repository: AccountRepository,
    ) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository
        self.notification_gateway = notification_gateway
        self.account_repository = account_repository

    def execute(self, booking_code: str, request: AssignPilotRequest) -> Booking:
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Chi booking da xac nhan moi duoc gan pilot.")

        booking.assigned_pilot_name = request.pilot_name.strip()
        booking.assigned_pilot_phone = normalize_phone(request.pilot_phone)
        self._ensure_pilot_available(booking)
        updated_booking = self.booking_repository.update(booking)
        self.tracking_repository.assign_pilot(
            booking_code=updated_booking.code,
            pilot_name=updated_booking.assigned_pilot_name,
        )
        self.notification_gateway.send_booking_update(
            updated_booking,
            f"Booking {updated_booking.code} da duoc gan pilot {updated_booking.assigned_pilot_name}.",
        )
        return updated_booking

    def _ensure_pilot_available(self, booking: Booking) -> None:
        pilot_phone = normalize_phone(booking.assigned_pilot_phone or "")
        pilot = self.account_repository.get_by_phone(pilot_phone)
        if pilot is None or not pilot.is_active or pilot.role != "PILOT":
            raise ValidationError("Pilot duoc chon khong hop le hoac da bi vo hieu hoa.")

        occupied_pilot_phones = {
            normalize_phone(phone)
            for phone in self.booking_repository.list_assigned_pilot_phones_for_slot(
                booking.flight_date,
                booking.flight_time,
                exclude_code=booking.code,
            )
        }
        if pilot_phone in occupied_pilot_phones:
            raise ValidationError("Pilot nay da duoc gan cho mot booking khac trong cung khung gio.")


class ListPilotFlightsUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        tracking_repository: TrackingRepository,
    ) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, phone: str) -> list[dict[str, object]]:
        normalized_phone = normalize_phone(phone)
        flights: list[dict[str, object]] = []
        for booking in self.booking_repository.list_for_pilot(normalized_phone):
            tracking = self.tracking_repository.get_by_booking_code(booking.code)
            flights.append({"booking": booking, "tracking": tracking})
        return flights
