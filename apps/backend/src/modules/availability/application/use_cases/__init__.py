from __future__ import annotations

from datetime import date
from random import Random

from modules.availability.domain.entities import AvailabilityDay
from modules.availability.domain.repositories import AvailabilityRepository
from modules.availability.domain.value_objects import AvailabilitySlot
from modules.bookings.domain.repositories import BookingRepository
from modules.catalog.domain.repositories import ServicePackageRepository
from shared.exceptions import NotFoundError
from shared.utils import daterange, deterministic_weather, month_bounds


class GetMonthlyAvailabilityUseCase:
    def __init__(
        self,
        availability_repository: AvailabilityRepository,
        service_package_repository: ServicePackageRepository,
        booking_repository: BookingRepository,
        account_repository,
    ) -> None:
        self.availability_repository = availability_repository
        self.service_package_repository = service_package_repository
        self.booking_repository = booking_repository
        self.account_repository = account_repository

    def execute(self, service_slug: str, year: int, month: int) -> list[AvailabilityDay]:
        service_package = self.service_package_repository.get_by_slug(service_slug)
        if service_package is None or not service_package.active:
            raise NotFoundError("Khong tim thay goi dich vu.")

        days = self.availability_repository.list_month(service_slug, year, month)
        if not days:
            start, end = month_bounds(year, month)
            generated_days = [
                self._build_day(service_slug=service_slug, calendar_date=calendar_date)
                for calendar_date in daterange(start, end)
            ]
            days = self.availability_repository.create_many(generated_days)

        active_pilot_count = len(self.account_repository.list(role="PILOT", is_active=True))
        booked_counts = self.booking_repository.reserved_counts_for_month(service_slug, year, month)
        return [self._hydrate_day(day, active_pilot_count, booked_counts.get(day.date.isoformat(), {})) for day in days]

    def _build_day(self, service_slug: str, calendar_date: date) -> AvailabilityDay:
        seed_key = f"{service_slug}:{calendar_date.isoformat()}"
        weather = deterministic_weather(seed_key)
        seeded_random = Random(seed_key)
        slot_times = ["06:30", "08:00", "09:30", "11:00", "13:30", "15:30"]
        slots: list[AvailabilitySlot] = []

        for slot_time in slot_times:
            slot_weather = deterministic_weather(f"{seed_key}:{slot_time}")
            is_weather_locked = slot_weather["flight_condition"] == "Khong phu hop"
            random_lock = seeded_random.random() > 0.9
            slots.append(
                AvailabilitySlot(
                    time=slot_time,
                    capacity=0,
                    booked=0,
                    is_locked=is_weather_locked or random_lock,
                    temperature_c=slot_weather["temperature_c"],
                    wind_kph=slot_weather["wind_kph"],
                    uv_index=slot_weather["uv_index"],
                    flight_condition=slot_weather["flight_condition"],
                )
            )

        return AvailabilityDay(
            id=None,
            service_slug=service_slug,
            date=calendar_date,
            temperature_c=weather["temperature_c"],
            wind_kph=weather["wind_kph"],
            uv_index=weather["uv_index"],
            flight_condition=weather["flight_condition"],
            slots=slots,
        )

    def _hydrate_day(
        self,
        day: AvailabilityDay,
        active_pilot_count: int,
        booked_count_by_time: dict[str, int],
    ) -> AvailabilityDay:
        hydrated_slots = [
            AvailabilitySlot(
                time=slot.time,
                capacity=active_pilot_count,
                booked=int(booked_count_by_time.get(slot.time, 0)),
                is_locked=slot.is_locked or active_pilot_count <= 0,
                temperature_c=slot.temperature_c,
                wind_kph=slot.wind_kph,
                uv_index=slot.uv_index,
                flight_condition=slot.flight_condition,
            )
            for slot in day.slots
        ]

        return AvailabilityDay(
            id=day.id,
            service_slug=day.service_slug,
            date=day.date,
            temperature_c=day.temperature_c,
            wind_kph=day.wind_kph,
            uv_index=day.uv_index,
            flight_condition=day.flight_condition,
            slots=hydrated_slots,
        )
