from __future__ import annotations

from datetime import date, timedelta

from modules.availability.domain.entities import AvailabilityDay
from modules.availability.domain.repositories import AvailabilityRepository
from modules.availability.domain.value_objects import AvailabilitySlot
from modules.bookings.domain.repositories import BookingRepository
from modules.catalog.domain.repositories import ServicePackageRepository
from shared.exceptions import NotFoundError
from shared.utils import daterange, fetch_weatherapi_forecast, month_bounds

SLOT_TIMES = ["06:30", "08:00", "09:30", "11:00", "13:30", "15:30"]


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
        today = date.today()
        start, end = month_bounds(year, month)
        forecast_start = max(start, today)
        forecast_end = min(end, today + timedelta(days=13))
        real_weather = fetch_weatherapi_forecast(
            latitude=service_package.launch_lat,
            longitude=service_package.launch_lng,
            start_date=forecast_start,
            end_date=forecast_end,
            slot_times=SLOT_TIMES,
        )
        return [
            self._hydrate_day(
                self._apply_real_weather(day, real_weather.get(day.date.isoformat())),
                active_pilot_count,
                booked_counts.get(day.date.isoformat(), {}),
            )
            for day in days
        ]

    def _build_day(self, service_slug: str, calendar_date: date) -> AvailabilityDay:
        slots: list[AvailabilitySlot] = []

        for slot_time in SLOT_TIMES:
            slots.append(
                AvailabilitySlot(
                    time=slot_time,
                    capacity=0,
                    booked=0,
                    is_locked=False,
                    temperature_c=0,
                    wind_kph=0,
                    uv_index=0,
                    visibility_km=0,
                    weather_condition="",
                    flight_condition="",
                    weather_available=False,
                )
            )

        return AvailabilityDay(
            id=None,
            service_slug=service_slug,
            date=calendar_date,
            temperature_c=0,
            wind_kph=0,
            uv_index=0,
            visibility_km=0,
            weather_condition="",
            flight_condition="",
            weather_available=False,
            slots=slots,
        )

    def _apply_real_weather(self, day: AvailabilityDay, weather: dict | None) -> AvailabilityDay:
        if not weather:
            return day
        real_slots = weather.get("slots", {})
        slots = []
        for slot in day.slots:
            slot_weather = real_slots.get(slot.time, weather)
            slots.append(
                AvailabilitySlot(
                    time=slot.time,
                    capacity=slot.capacity,
                    booked=slot.booked,
                    is_locked=slot.is_locked or slot_weather["flight_condition"] == "Thoi tiet xau",
                    temperature_c=slot_weather["temperature_c"],
                    wind_kph=slot_weather["wind_kph"],
                    uv_index=slot_weather["uv_index"],
                    visibility_km=slot_weather["visibility_km"],
                    weather_condition=slot_weather["weather_condition"],
                    flight_condition=slot_weather["flight_condition"],
                    weather_available=bool(slot_weather.get("weather_available", False)),
                )
            )
        return AvailabilityDay(
            id=day.id,
            service_slug=day.service_slug,
            date=day.date,
            temperature_c=weather["temperature_c"],
            wind_kph=weather["wind_kph"],
            uv_index=weather["uv_index"],
            visibility_km=weather["visibility_km"],
            weather_condition=weather["weather_condition"],
            flight_condition=weather["flight_condition"],
            weather_available=bool(weather.get("weather_available", False)),
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
                visibility_km=slot.visibility_km,
                weather_condition=slot.weather_condition,
                flight_condition=slot.flight_condition,
                weather_available=slot.weather_available,
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
            visibility_km=day.visibility_km,
            weather_condition=day.weather_condition,
            flight_condition=day.flight_condition,
            weather_available=day.weather_available,
            slots=hydrated_slots,
        )
