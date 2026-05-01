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
    PAYMENT_STATUS_PENDING,
)
from modules.accounts.domain.repositories import AccountRepository
from modules.catalog.domain.repositories import ServicePackageRepository
from modules.payments.domain.repositories import PaymentTransactionRepository
from modules.payments.application.interfaces import PaymentGateway
from modules.tracking.domain.repositories import TrackingRepository
from shared.exceptions import NotFoundError, ValidationError
from shared.utils import (
    generate_booking_code,
    geocode_address,
    geocode_address_candidates,
    normalize_phone,
    quantize_money,
)

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
            raise NotFoundError("Không tìm thấy gói dịch vụ.")
        if request.adults + request.children <= 0:
            raise ValidationError("Số lượng khách phải lớn hơn 0.")
        if request.payment_method not in ONLINE_PAYMENT_METHODS:
            raise ValidationError("Phương thức thanh toán không hợp lệ. Hiện chỉ hỗ trợ payOS.")
        pickup_option = request.pickup_option or PICKUP_OPTION_SELF
        if pickup_option not in {PICKUP_OPTION_SELF, PICKUP_OPTION_SHUTTLE}:
            raise ValidationError("Lựa chọn đưa đón không hợp lệ.")
        pickup_address = request.pickup_address.strip() if request.pickup_address else None
        if pickup_option == PICKUP_OPTION_SHUTTLE and not pickup_address:
            raise ValidationError("Vui lòng nhập địa chỉ đón.")
        pickup_fee = PICKUP_FEE if pickup_option == PICKUP_OPTION_SHUTTLE else Decimal("0")
        pickup_lat = request.pickup_lat
        pickup_lng = request.pickup_lng
        if pickup_option == PICKUP_OPTION_SHUTTLE:
            if pickup_lat is None or pickup_lng is None:
                geocoded = geocode_address(pickup_address or "")
                pickup_lat = geocoded.get("lat") if geocoded else None
                pickup_lng = geocoded.get("lng") if geocoded else None
            if pickup_lat is None or pickup_lng is None:
                raise ValidationError("Không xác định được điểm đón. Vui lòng chọn lại trên bản đồ.")
        else:
            pickup_lat = None
            pickup_lng = None

        active_pilot_count = self._active_pilot_count()
        current_reserved = self.booking_repository.count_reserved_for_slot(
            request.service_slug,
            request.flight_date,
            request.flight_time,
        )
        if current_reserved >= active_pilot_count:
            raise ValidationError("Khung giờ này đã hết phi công khả dụng.")

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
        payment_status = PAYMENT_STATUS_PENDING
        booking = self.booking_repository.create(
            BookingPayload(
                code=generate_booking_code(),
                service_slug=service_package.slug,
                service_name=service_package.name,
                service_name_en=service_package.name_en or service_package.name,
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
                pickup_lat=pickup_lat,
                pickup_lng=pickup_lng,
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
            service_name_en=booking.service_name_en,
            flight_status=booking.flight_status,
            pilot_name=None,
            current_location={
                "name": "Chùa Bửu Đài Sơn",
                "lat": 16.1107,
                "lng": 108.2554,
            },
        )

        return {"booking": booking, "payment_session": payment_session}

    def _active_pilot_count(self) -> int:
        return self.account_repository.count(role="PILOT", is_active=True)


class LookupBookingsByPhoneUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self, identifier: str) -> list[Booking]:
        identifier = identifier.strip()
        if "@" in identifier:
            return self.booking_repository.list_by_email(identifier.lower())
        return self.booking_repository.list_by_phone(normalize_phone(identifier))


class ResolvePickupLocationUseCase:
    def execute(self, address: str) -> dict[str, object]:
        normalized = address.strip()
        if not normalized:
            raise ValidationError("Vui lòng nhập địa chỉ đón.")
        geocoded = geocode_address(normalized)
        if not geocoded:
            raise ValidationError("Không tìm thấy điểm đón phù hợp. Hãy nhập địa chỉ cụ thể hơn.")
        return {
            "name": normalized,
            "lat": geocoded["lat"],
            "lng": geocoded["lng"],
        }

    def suggest(self, address: str) -> list[dict[str, object]]:
        normalized = address.strip()
        if len(normalized) < 3:
            return []
        return geocode_address_candidates(normalized, limit=5)


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
            raise NotFoundError("Không tìm thấy lịch đặt.")
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
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if booking.approval_status != BOOKING_APPROVAL_PENDING:
            raise ValidationError("Lịch đặt này đã được xử lý trước đó.")

        if request.decision == "confirm":
            if not request.pilot_name or not request.pilot_phone:
                raise ValidationError("Cần chọn phi công khả dụng khi xác nhận lịch đặt.")
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
            message = f"Lịch đặt {updated_booking.code} đã được xác nhận và gán phi công {updated_booking.assigned_pilot_name}."
        elif request.decision == "reject":
            if not request.reason:
                raise ValidationError("Lý do từ chối là bắt buộc.")
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
            message = f"Lịch đặt {booking.code} bị từ chối. Lý do: {request.reason}"
        else:
            raise ValidationError("Quyết định không hợp lệ.")

        self.notification_gateway.send_booking_update(updated_booking, message)
        return updated_booking

    def _active_pilot_count(self) -> int:
        return self.account_repository.count(role="PILOT", is_active=True)

    def _ensure_pilot_available(self, booking: Booking) -> None:
        pilot_phone = normalize_phone(booking.assigned_pilot_phone or "")
        pilot = self.account_repository.get_by_phone(pilot_phone)
        if pilot is None or not pilot.is_active or pilot.role != "PILOT":
            raise ValidationError("Phi công được chọn không hợp lệ hoặc đã bị vô hiệu hóa.")

        occupied_pilot_phones = {
            normalize_phone(phone)
            for phone in self.booking_repository.list_assigned_pilot_phones_for_slot(
                booking.flight_date,
                booking.flight_time,
                exclude_code=booking.code,
            )
        }
        if pilot_phone in occupied_pilot_phones:
            raise ValidationError("Phi công này đã được gán cho một lịch đặt khác trong cùng khung giờ.")


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
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if customer_email and booking.email.lower() != customer_email.lower().strip():
            raise ValidationError("Bạn không có quyền hủy lịch đặt này.")
        if booking.approval_status in {BOOKING_APPROVAL_CANCELLED, BOOKING_APPROVAL_REJECTED}:
            raise ValidationError("Lịch đặt này đã bị hủy trước đó.")
        if not request.reason.strip():
            raise ValidationError("Lý do hủy lịch đặt là bắt buộc.")

        booking.approval_status = BOOKING_APPROVAL_CANCELLED
        booking.rejection_reason = self._build_reason(request)
        updated_booking = self.booking_repository.update(booking)
        self._release_reserved_slot(updated_booking)
        self.notification_gateway.send_booking_update(
            updated_booking,
            f"Lịch đặt {updated_booking.code} đã bị hủy. Lý do: {request.reason.strip()}",
        )
        return updated_booking

    def _build_reason(self, request: CancelBookingRequest) -> str:
        reason = request.reason.strip()
        refund_parts = [
            ("Ngân hàng", request.refund_bank),
            ("Số tài khoản", request.refund_account_number),
            ("Chủ tài khoản", request.refund_account_name),
        ]
        details = [f"{label}: {value.strip()}" for label, value in refund_parts if value and value.strip()]
        if not details:
            return reason
        return f"{reason}\nThông tin hoàn cọc: " + "; ".join(details)

    def _release_reserved_slot(self, booking: Booking) -> None:
        active_pilot_count = self.account_repository.count(role="PILOT", is_active=True)
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
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Chỉ lịch đặt đã xác nhận mới được gán phi công.")

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
            f"Lịch đặt {updated_booking.code} đã được gán phi công {updated_booking.assigned_pilot_name}.",
        )
        return updated_booking

    def _ensure_pilot_available(self, booking: Booking) -> None:
        pilot_phone = normalize_phone(booking.assigned_pilot_phone or "")
        pilot = self.account_repository.get_by_phone(pilot_phone)
        if pilot is None or not pilot.is_active or pilot.role != "PILOT":
            raise ValidationError("Phi công được chọn không hợp lệ hoặc đã bị vô hiệu hóa.")

        occupied_pilot_phones = {
            normalize_phone(phone)
            for phone in self.booking_repository.list_assigned_pilot_phones_for_slot(
                booking.flight_date,
                booking.flight_time,
                exclude_code=booking.code,
            )
        }
        if pilot_phone in occupied_pilot_phones:
            raise ValidationError("Phi công này đã được gán cho một lịch đặt khác trong cùng khung giờ.")


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
