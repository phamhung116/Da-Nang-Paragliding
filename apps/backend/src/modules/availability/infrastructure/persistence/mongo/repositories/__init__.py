from __future__ import annotations

from datetime import date

from modules.availability.domain.entities import AvailabilityDay
from modules.availability.domain.value_objects import AvailabilitySlot
from modules.availability.infrastructure.persistence.mongo.documents import AvailabilityDayDocument
from shared.exceptions import NotFoundError, ValidationError


def _to_domain(document: AvailabilityDayDocument) -> AvailabilityDay:
    return AvailabilityDay(
        id=str(document.id),
        service_slug=document.service_slug,
        date=document.date,
        temperature_c=document.temperature_c,
        wind_kph=document.wind_kph,
        uv_index=document.uv_index,
        flight_condition=document.flight_condition,
        slots=[
            AvailabilitySlot(
                time=slot["time"],
                capacity=slot["capacity"],
                booked=slot["booked"],
                is_locked=slot["is_locked"],
                temperature_c=slot.get("temperature_c", document.temperature_c),
                wind_kph=slot.get("wind_kph", document.wind_kph),
                uv_index=slot.get("uv_index", document.uv_index),
                flight_condition=slot.get("flight_condition", document.flight_condition),
            )
            for slot in document.slots
        ],
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
        "flight_condition": slot.flight_condition,
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
                flight_condition=day.flight_condition,
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
