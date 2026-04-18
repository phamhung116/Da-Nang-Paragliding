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
    "name": "Chua Buu Dai Son",
    "lat": 16.1107,
    "lng": 108.2554,
}

LAUNCH_LOCATION = {
    "name": "Dinh Ban Co",
    "lat": 16.1372,
    "lng": 108.281,
}

LANDING_LOCATION = {
    "name": "Bai bien truoc Chua Buu Dai Son",
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
            raise NotFoundError("Khong tim thay booking theo thong tin tra cuu.")
        booking = bookings[0]
        tracking = self.tracking_repository.get_by_booking_code(booking.code)
        if tracking is None:
            raise NotFoundError("Khong tim thay tracking cho booking nay.")
        return {"booking": booking, "tracking": tracking}


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

    def execute(self, booking_code: str, status: str):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Chi booking da xac nhan moi duoc cap nhat hanh trinh bay.")

        service_package = self.service_package_repository.get_by_slug(booking.service_slug)
        if service_package is None:
            raise NotFoundError("Khong tim thay goi dich vu.")

        location = self._build_location(status, booking, service_package)
        booking.flight_status = status
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=status,
            current_location=location,
            timeline_event={
                "status": status,
                "label": self._status_label(status),
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "STATUS",
            },
        )
        return {"booking": updated_booking, "tracking": tracking}

    def _build_location(self, status: str, booking, service_package):
        if status == FLIGHT_STATUS_WAITING_CONFIRMATION:
            return {**BASE_LOCATION, "name": "Cho admin xac nhan booking"}
        if status == FLIGHT_STATUS_WAITING:
            return {**BASE_LOCATION, "name": "Dang cho"}
        if status == FLIGHT_STATUS_PICKING_UP:
            if booking.pickup_option != PICKUP_OPTION_SHUTTLE:
                raise ValidationError("Booking nay khong co dich vu xe don.")
            pickup_address = booking.pickup_address or "Dia chi don"
            geocoded = geocode_address(pickup_address)
            return {
                "name": pickup_address,
                "lat": geocoded.get("lat", BASE_LOCATION["lat"]),
                "lng": geocoded.get("lng", BASE_LOCATION["lng"]),
            }
        if status == FLIGHT_STATUS_EN_ROUTE:
            return dict(LAUNCH_LOCATION)
        if status == FLIGHT_STATUS_FLYING:
            return dict(LANDING_LOCATION)
        if status == FLIGHT_STATUS_LANDED:
            return dict(LANDING_LOCATION)
        raise ValidationError("Trang thai chuyen bay khong hop le.")

    def _status_label(self, status: str) -> str:
        labels = {
            FLIGHT_STATUS_WAITING_CONFIRMATION: "Cho xac nhan",
            FLIGHT_STATUS_WAITING: "Dang cho",
            FLIGHT_STATUS_PICKING_UP: "Dang di chuyen den diem don",
            FLIGHT_STATUS_EN_ROUTE: "Dang di chuyen den diem bay",
            FLIGHT_STATUS_FLYING: "Dang bay",
            FLIGHT_STATUS_LANDED: "Da ha canh",
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

    def execute(self, booking_code: str, pilot_phone: str, status: str):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Pilot nay khong duoc gan cho booking nay.")
        return self.update_flight_status_use_case.execute(booking_code, status)


class StartPilotTrackingUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, booking_code: str, pilot_phone: str, location: dict[str, object]):
        booking = self._validate_assigned_booking(booking_code, pilot_phone)
        if booking.flight_status == FLIGHT_STATUS_WAITING:
            booking.flight_status = (
                FLIGHT_STATUS_PICKING_UP
                if booking.pickup_option == PICKUP_OPTION_SHUTTLE
                else FLIGHT_STATUS_EN_ROUTE
            )
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=updated_booking.flight_status,
            current_location=location,
            timeline_event={
                "status": updated_booking.flight_status,
                "label": "Bat dau hanh trinh bay",
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "TRACKING_STARTED",
            },
        )
        return {"booking": updated_booking, "tracking": tracking}

    def _validate_assigned_booking(self, booking_code: str, pilot_phone: str):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if booking.approval_status != BOOKING_APPROVAL_CONFIRMED:
            raise ValidationError("Booking nay chua duoc xac nhan.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Pilot nay khong duoc gan cho booking nay.")
        return booking


class AppendPilotTrackingPointUseCase:
    def __init__(self, *, booking_repository: BookingRepository, tracking_repository: TrackingRepository) -> None:
        self.booking_repository = booking_repository
        self.tracking_repository = tracking_repository

    def execute(self, booking_code: str, pilot_phone: str, location: dict[str, object]):
        booking = self.booking_repository.get_by_code(booking_code)
        if booking is None:
            raise NotFoundError("Khong tim thay booking.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Pilot nay khong duoc gan cho booking nay.")
        tracking = self.tracking_repository.append_position(
            booking_code,
            current_location=location,
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
            raise NotFoundError("Khong tim thay booking.")
        if normalize_phone(booking.assigned_pilot_phone or "") != normalize_phone(pilot_phone):
            raise ValidationError("Pilot nay khong duoc gan cho booking nay.")

        booking.flight_status = FLIGHT_STATUS_LANDED
        updated_booking = self.booking_repository.update(booking)
        tracking = self.tracking_repository.update_status(
            booking_code,
            flight_status=FLIGHT_STATUS_LANDED,
            current_location=location,
            timeline_event={
                "status": FLIGHT_STATUS_LANDED,
                "label": "Ket thuc hanh trinh bay",
                "recorded_at": datetime.utcnow().isoformat(),
                "type": "TRACKING_STOPPED",
            },
        )
        return {"booking": updated_booking, "tracking": tracking}
