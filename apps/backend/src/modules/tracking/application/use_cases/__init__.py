from __future__ import annotations

from datetime import datetime

from modules.bookings.domain.repositories import BookingRepository
from modules.bookings.domain.value_objects import (
    BOOKING_APPROVAL_CONFIRMED,
    FLIGHT_STATUS_EN_ROUTE,
    FLIGHT_STATUS_FLYING,
    FLIGHT_STATUS_LANDED,
    FLIGHT_STATUS_PICKING_UP,
    FLIGHT_STATUS_WAITING,
    FLIGHT_STATUS_WAITING_CONFIRMATION,
    PICKUP_OPTION_SHUTTLE,
)
from modules.catalog.domain.repositories import ServicePackageRepository
from modules.tracking.domain.repositories import TrackingRepository
from shared.exceptions import NotFoundError, ValidationError
from shared.utils import geocode_address, normalize_phone

BASE_LOCATION = {
    "name": "Chùa Bửu Đài Sơn",
    "lat": 16.1107,
    "lng": 108.2554,
}

LAUNCH_LOCATION = {
    "name": "Đỉnh Sơn Trà",
    "lat": 16.1372,
    "lng": 108.281,
}

LANDING_LOCATION = {
    "name": "Bãi biển trước Chùa Bửu Đài Sơn",
    "lat": 16.1107,
    "lng": 108.2554,
}


class GetTrackingByPhoneUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, identifier: str) -> dict[str, object]:
        identifier = identifier.strip()
        bookings = (
            self.booking_repository.list_by_email(identifier.lower())
            if "@" in identifier
            else self.booking_repository.list_by_phone(normalize_phone(identifier))
        )
        if not bookings:
            raise NotFoundError("Không tìm thấy lịch đặt theo thông tin tra cứu.")

        prioritized_bookings = sorted(bookings, key=self._booking_priority, reverse=True)
        for booking in prioritized_bookings:
            tracking = self.tracking_repository.get_by_booking_code(booking.code)
            if tracking is not None:
                return {"booking": booking, "tracking": tracking}

        raise NotFoundError("Không tìm thấy dữ liệu theo dõi cho lịch đặt này.")

    def _booking_priority(self, booking) -> tuple[int, int, float, int, str]:
        is_active_approval = int(
            booking.approval_status not in {"CANCELLED", "REJECTED"}
        )
        is_active_flight = int(booking.flight_status != FLIGHT_STATUS_LANDED)
        created_at = booking.created_at.timestamp() if booking.created_at else 0.0
        flight_date = booking.flight_date.toordinal()
        flight_time = booking.flight_time or ""
        return (is_active_approval, is_active_flight, created_at, flight_date, flight_time)


class UpdateFlightStatusUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        tracking_repository: TrackingRepository,
        service_package_repository: ServicePackageRepository,
    ) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository
        self.service_package_repository = service_package_repository

    def execute(self, booking_code: str, status: str, location: dict[str, object] | None = None):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Chỉ lịch đặt đã xác nhận mới được cập nhật hành trình bay.")

        service_package = self.service_package_repository.get_by_slug(booking.service_slug)
        if service_package is None:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")
        tracking = self.tracking_repository.get_by_booking_code(booking.code)
        if tracking is None:
            raise NotFoundError("Không tìm thấy dữ liệu theo dõi.")

        next_location = self._build_location(status, booking, tracking, location)
        append_route_point = bool(location and tracking.tracking_active and status != FLIGHT_STATUS_PICKING_UP)
        tracked_location = (
            {**next_location, "segment": status}
            if status in {FLIGHT_STATUS_EN_ROUTE, FLIGHT_STATUS_FLYING, FLIGHT_STATUS_LANDED}
            else next_location
        )
        booking.flight_status = status
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=status,
            current_location=tracked_location,
            timeline_event={
                "status": status,
                "label": self._status_label(status),
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "STATUS",
            },
            append_route_point=append_route_point,
        )
        return {"booking": updated_booking, "tracking": tracking}

    def _build_location(self, status: str, booking, tracking, location: dict[str, object] | None):
        if status == FLIGHT_STATUS_WAITING_CONFIRMATION:
            return {**BASE_LOCATION, "name": "Chờ quản trị viên xác nhận lịch đặt"}
        if status == FLIGHT_STATUS_WAITING:
            return {**BASE_LOCATION, "name": "Đang chờ"}
        if status == FLIGHT_STATUS_PICKING_UP:
            if booking.pickup_option != PICKUP_OPTION_SHUTTLE:
                raise ValidationError("Lịch đặt này không có dịch vụ xe đón.")
            return dict(location or tracking.current_location or BASE_LOCATION)
        if status == FLIGHT_STATUS_EN_ROUTE:
            return dict(location or tracking.current_location or self._pickup_location(booking) or BASE_LOCATION)
        if status == FLIGHT_STATUS_FLYING:
            return dict(location or tracking.current_location or dict(LAUNCH_LOCATION))
        if status == FLIGHT_STATUS_LANDED:
            return dict(location or LANDING_LOCATION)
        raise ValidationError("Trạng thái chuyến bay không hợp lệ.")

    def _pickup_location(self, booking) -> dict[str, object] | None:
        if booking.pickup_option != PICKUP_OPTION_SHUTTLE:
            return None
        if booking.pickup_lat is not None and booking.pickup_lng is not None:
            return {
                "name": booking.pickup_address or "Địa chỉ đón",
                "lat": booking.pickup_lat,
                "lng": booking.pickup_lng,
            }
        pickup_address = booking.pickup_address or "Địa chỉ đón"
        geocoded = geocode_address(pickup_address)
        if not geocoded:
            return None
        return {
            "name": pickup_address,
            "lat": geocoded.get("lat", BASE_LOCATION["lat"]),
            "lng": geocoded.get("lng", BASE_LOCATION["lng"]),
        }

    def _status_label(self, status: str) -> str:
        labels = {
            FLIGHT_STATUS_WAITING_CONFIRMATION: "Chờ xác nhận",
            FLIGHT_STATUS_WAITING: "Đang chờ",
            FLIGHT_STATUS_PICKING_UP: "Phi công đang đến điểm đón",
            FLIGHT_STATUS_EN_ROUTE: "Đang di chuyển đến điểm bay",
            FLIGHT_STATUS_FLYING: "Đang bay",
            FLIGHT_STATUS_LANDED: "Đã hạ cánh",
        }
        return labels[status]


class UpdatePilotFlightStatusUseCase:
    def __init__(
        self,
        *,
        booking_repository: BookingRepository,
        update_flight_status_use_case: UpdateFlightStatusUseCase,
    ) -> None:
        self.booking_repository = booking_repository
        self.update_flight_status_use_case = update_flight_status_use_case

    def execute(self, booking_code: str, pilot_phone: str, status: str, location: dict[str, object] | None = None):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Phi công này không được gán cho lịch đặt này.")
        return self.update_flight_status_use_case.execute(booking_code, status, location)


class StartPilotTrackingUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, booking_code: str, pilot_phone: str, location: dict[str, object]):
        booking = self._validate_assigned_booking(booking_code, pilot_phone)
        tracking = self.tracking_repository.get_by_booking_code(booking.code)
        if tracking is None:
            raise NotFoundError("Không tìm thấy dữ liệu theo dõi.")
        if tracking.tracking_active:
            raise ValidationError("Chuyến đi này đang được theo dõi.")
        if booking.flight_status == FLIGHT_STATUS_LANDED:
            raise ValidationError("Chuyến đi này đã kết thúc.")

        if booking.flight_status in {FLIGHT_STATUS_WAITING, FLIGHT_STATUS_PICKING_UP}:
            booking.flight_status = FLIGHT_STATUS_EN_ROUTE
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=updated_booking.flight_status,
            current_location={**location, "segment": updated_booking.flight_status},
            timeline_event={
                "status": updated_booking.flight_status,
                "label": "Bắt đầu đưa khách tới điểm bay",
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "TRACKING_STARTED",
            },
            tracking_active=True,
            append_route_point=True,
            reset_route_points=True,
        )
        return {"booking": updated_booking, "tracking": tracking}

    def _validate_assigned_booking(self, booking_code: str, pilot_phone: str):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Lịch đặt này chưa được xác nhận.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Phi công này không được gán cho lịch đặt này.")
        return booking


class AppendPilotTrackingPointUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, booking_code: str, pilot_phone: str, location: dict[str, object]):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Phi công này không được gán cho lịch đặt này.")
        tracking = self.tracking_repository.get_by_booking_code(booking_code)
        if tracking is None:
            raise NotFoundError("Không tìm thấy dữ liệu theo dõi.")
        if not tracking.tracking_active:
            raise ValidationError("Chuyến đi này chưa bắt đầu theo dõi.")
        tracking = self.tracking_repository.append_position(
            booking_code,
            current_location={**location, "segment": booking.flight_status},
            timeline_event=None,
        )
        return {"booking": booking, "tracking": tracking}


class StopPilotTrackingUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, booking_code: str, pilot_phone: str, location: dict[str, object]):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Không tìm thấy lịch đặt.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Phi công này không được gán cho lịch đặt này.")
        tracking = self.tracking_repository.get_by_booking_code(booking_code)
        if tracking is None:
            raise NotFoundError("Không tìm thấy dữ liệu theo dõi.")
        if not tracking.tracking_active:
            raise ValidationError("Chuyến đi này chưa bắt đầu theo dõi.")

        booking.flight_status = FLIGHT_STATUS_LANDED
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=FLIGHT_STATUS_LANDED,
            current_location={**location, "segment": FLIGHT_STATUS_LANDED},
            timeline_event={
                "status": FLIGHT_STATUS_LANDED,
                "label": "Kết thúc chuyến đi",
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "TRACKING_STOPPED",
            },
            tracking_active=False,
            append_route_point=True,
        )
        return {"booking": updated_booking, "tracking": tracking}
