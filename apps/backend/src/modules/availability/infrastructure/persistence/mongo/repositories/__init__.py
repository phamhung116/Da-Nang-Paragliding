from __future__ import annotations

from datetime import date

from modules.availability.domain.entities import AvailabilityDay
from modules.availability.domain.value_objects import AvailabilitySlot
from modules.availability.infrastructure.persistence.mongo.documents import AvailabilityDayDocument
from shared.exceptions import NotFoundError, ValidationError


def _to_domain(document: AvailabilityDayDocument) -> AvailabilityDay:
    stored_weather_available = bool(getattr(document, "weather_available", False))
    return AvailabilityDay(
        id=str(document.id),
        service_slug=document.service_slug,
        date=document.date,
        temperature_c=document.temperature_c if stored_weather_available else 0,
        wind_kph=document.wind_kph if stored_weather_available else 0,
        uv_index=document.uv_index if stored_weather_available else 0,
        visibility_km=getattr(document, "visibility_km", 0) if stored_weather_available else 0,
        weather_condition=getattr(document, "weather_condition", "") if stored_weather_available else "",
        flight_condition=document.flight_condition if stored_weather_available else "",
        weather_available=stored_weather_available,
        slots=[
            _slot_to_domain(slot)
            for slot in document.slots
        ],
    )


def _slot_to_domain(slot: dict[str, object]) -> AvailabilitySlot:
    weather_available = bool(slot.get("weather_available", False))
    return AvailabilitySlot(
        time=str(slot["time"]),
        capacity=int(slot["capacity"]),
        booked=int(slot["booked"]),
        is_locked=bool(slot["is_locked"]),
        temperature_c=float(slot.get("temperature_c", 0)) if weather_available else 0,
        wind_kph=float(slot.get("wind_kph", 0)) if weather_available else 0,
        uv_index=int(slot.get("uv_index", 0)) if weather_available else 0,
        visibility_km=float(slot.get("visibility_km", 0)) if weather_available else 0,
        weather_condition=str(slot.get("weather_condition", "")) if weather_available else "",
        flight_condition=str(slot.get("flight_condition", "")) if weather_available else "",
        weather_available=weather_available,
    )


def _slot_payload(slot: AvailabilitySlot) -> dict[str, object]:
    return {
        "time": slot.time,
        "capacity": slot.capacity,
        "booked": slot.booked,
        "is_locked": slot.is_locked,
        "temperature_c": slot.temperature_c,
        "wind_kph": slot.wind_kph,
        "uv_index": slot.uv_index,
        "visibility_km": slot.visibility_km,
        "weather_condition": slot.weather_condition,
        "flight_condition": slot.flight_condition,
        "weather_available": slot.weather_available,
    }


class MongoAvailabilityRepository:
    def list_month(self, service_slug: str, year: int, month: int) -> list[AvailabilityDay]:
        documents = AvailabilityDayDocument.objects.filter(
            service_slug=service_slug,
            date__year=year,
            date__month=month,
        )
        return [_to_domain(document) for document in documents]

    def create_many(self, days: list[AvailabilityDay]) -> list[AvailabilityDay]:
        created: list[AvailabilityDay] = []
        for day in days:
            document = AvailabilityDayDocument.objects.create(
                service_slug=day.service_slug,
                date=day.date,
                temperature_c=day.temperature_c,
                wind_kph=day.wind_kph,
                uv_index=day.uv_index,
                visibility_km=day.visibility_km,
                weather_condition=day.weather_condition,
                flight_condition=day.flight_condition,
                weather_available=day.weather_available,
                slots=[_slot_payload(slot) for slot in day.slots],
            )
            created.append(_to_domain(document))
        return created

    def reserve_slot(
        self,
        service_slug: str,
        flight_date: date,
        flight_time: str,
        *,
        capacity: int,
        booked: int,
    ) -> AvailabilityDay:
        document = AvailabilityDayDocument.objects.filter(service_slug=service_slug, date=flight_date).first()
        if document is None:
            raise NotFoundError("Khong tim thay lich bay.")
        document.slots = self._sync_slot_booking(
            document.slots,
            flight_time,
            capacity=capacity,
            booked=booked,
            validate_reserve=True,
        )
        document.save(update_fields=["slots", "updated_at"])
        return _to_domain(document)

    def release_slot(
        self,
        service_slug: str,
        flight_date: date,
        flight_time: str,
        *,
        capacity: int,
        booked: int,
    ) -> AvailabilityDay:
        document = AvailabilityDayDocument.objects.filter(service_slug=service_slug, date=flight_date).first()
        if document is None:
            raise NotFoundError("Khong tim thay lich bay.")
        document.slots = self._sync_slot_booking(
            document.slots,
            flight_time,
            capacity=capacity,
            booked=booked,
            validate_reserve=False,
        )
        document.save(update_fields=["slots", "updated_at"])
        return _to_domain(document)

    def _sync_slot_booking(
        self,
        slots: list[dict[str, object]],
        flight_time: str,
        *,
        capacity: int,
        booked: int,
        validate_reserve: bool,
    ) -> list[dict[str, object]]:
        updated_slots: list[dict[str, object]] = []
        slot_found = False

        for slot in slots:
            new_slot = dict(slot)
            if slot["time"] == flight_time:
                slot_found = True
                is_locked = bool(slot["is_locked"])
                if validate_reserve and (is_locked or capacity <= 0):
                    raise ValidationError("Khung gio nay dang bi khoa hoac khong con pilot kha dung.")
                if validate_reserve and booked > capacity:
                    raise ValidationError("Khung gio nay da day.")
                new_slot["capacity"] = max(0, capacity)
                new_slot["booked"] = max(0, booked)
            updated_slots.append(new_slot)

        if not slot_found:
            raise NotFoundError("Khong tim thay khung gio da chon.")

        return updated_slots
