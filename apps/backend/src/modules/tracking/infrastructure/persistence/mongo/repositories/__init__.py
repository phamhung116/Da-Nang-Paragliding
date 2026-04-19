from __future__ import annotations

from datetime import datetime

from modules.tracking.domain.entities import FlightTracking
from modules.tracking.infrastructure.persistence.mongo.documents import FlightTrackingDocument
from shared.exceptions import NotFoundError


def _to_domain(document: FlightTrackingDocument) -> FlightTracking:
    return FlightTracking(
        id=str(document.id),
        booking_code=document.booking_code,
        phone=document.phone,
        service_name=document.service_name,
        flight_status=document.flight_status,
        pilot_name=document.pilot_name,
        tracking_active=bool(document.tracking_active),
        current_location=dict(document.current_location),
        route_points=list(document.route_points),
        timeline=list(document.timeline),
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


class MongoTrackingRepository:
    def create_initial(
        self,
        *,
        booking_code: str,
        phone: str,
        service_name: str,
        flight_status: str,
        pilot_name: str | None,
        current_location: dict[str, object],
    ) -> FlightTracking:
        document = FlightTrackingDocument.objects.create(
            booking_code=booking_code,
            phone=phone,
            service_name=service_name,
            flight_status=flight_status,
            pilot_name=pilot_name,
            tracking_active=False,
            current_location=current_location,
            route_points=[],
            timeline=[
                {
                    "status": flight_status,
                    "label": "Cho xac nhan" if flight_status == "WAITING_CONFIRMATION" else "Dang cho",
                    "recorded_at": datetime.utcnow().isoformat(),
                    "type": "STATUS",
                }
            ],
        )
        return _to_domain(document)

    def get_by_booking_code(self, booking_code: str) -> FlightTracking | None:
        document = FlightTrackingDocument.objects.filter(booking_code=booking_code).first()
        return _to_domain(document) if document else None

    def get_latest_by_phone(self, phone: str) -> FlightTracking | None:
        document = FlightTrackingDocument.objects.filter(phone=phone).first()
        return _to_domain(document) if document else None

    def assign_pilot(self, *, booking_code: str, pilot_name: str | None) -> FlightTracking:
        document = FlightTrackingDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay tracking.")

        document.pilot_name = pilot_name
        document.save(update_fields=["pilot_name", "updated_at"])
        return _to_domain(document)

    def update_status(
        self,
        booking_code: str,
        *,
        flight_status: str,
        current_location: dict[str, object],
        timeline_event: dict[str, object] | None,
        tracking_active: bool | None = None,
        append_route_point: bool = False,
        reset_route_points: bool = False,
    ) -> FlightTracking:
        document = FlightTrackingDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay tracking.")

        route_points = [] if reset_route_points else list(document.route_points)
        if append_route_point:
            route_points.append({**current_location, "recorded_at": datetime.utcnow().isoformat()})
        timeline = list(document.timeline)
        if timeline_event:
            timeline.append(timeline_event)

        document.flight_status = flight_status
        document.current_location = current_location
        document.route_points = route_points
        document.timeline = timeline
        update_fields = ["flight_status", "current_location", "route_points", "timeline", "updated_at"]
        if tracking_active is not None:
            document.tracking_active = tracking_active
            update_fields.append("tracking_active")
        document.save(update_fields=update_fields)
        return _to_domain(document)

    def append_position(
        self,
        booking_code: str,
        *,
        current_location: dict[str, object],
        timeline_event: dict[str, object] | None = None,
    ) -> FlightTracking:
        document = FlightTrackingDocument.objects.filter(booking_code=booking_code).first()
        if document is None:
            raise NotFoundError("Khong tim thay tracking.")

        route_points = list(document.route_points)
        route_points.append({**current_location, "recorded_at": datetime.utcnow().isoformat()})
        timeline = list(document.timeline)
        if timeline_event:
            timeline.append(timeline_event)

        document.current_location = current_location
        document.route_points = route_points
        document.timeline = timeline
        document.save(update_fields=["current_location", "route_points", "timeline", "updated_at"])
        return _to_domain(document)
