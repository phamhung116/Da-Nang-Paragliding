from __future__ import annotations

from calendar import monthrange
from dataclasses import asdict, is_dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
from random import Random
from typing import Any
from uuid import uuid4


def month_bounds(year: int, month: int) -> tuple[date, date]:
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def daterange(start: date, end: date) -> list[date]:
    days: list[date] = []
    cursor = start
    while cursor <= end:
        days.append(cursor)
        cursor += timedelta(days=1)
    return days


def quantize_money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def generate_booking_code() -> str:
    timestamp = datetime.utcnow().strftime("%y%m%d%H%M%S")
    return f"BK{timestamp}{uuid4().hex[:4].upper()}"


def normalize_phone(phone: str) -> str:
    return "".join(character for character in phone if character.isdigit() or character == "+")


def deterministic_weather(seed_key: str) -> dict[str, Any]:
    seeded_random = Random(seed_key)
    temperature = round(23 + seeded_random.uniform(-2.5, 8.5), 1)
    wind = round(9 + seeded_random.uniform(0, 15), 1)
    uv_index = seeded_random.randint(3, 10)

    if wind <= 15 and uv_index <= 8:
        condition = "Lý Tưởng"
    elif wind <= 20:
        condition = "Moderate"
    else:
        condition = "No Fly"

    return {
        "temperature_c": temperature,
        "wind_kph": wind,
        "uv_index": uv_index,
        "flight_condition": condition,
    }


def serialize_entity(entity: Any) -> Any:
    if is_dataclass(entity):
        return asdict(entity)
    if isinstance(entity, Decimal):
        return str(entity)
    if isinstance(entity, list):
        return [serialize_entity(item) for item in entity]
    if isinstance(entity, dict):
        return {key: serialize_entity(value) for key, value in entity.items()}
    if isinstance(entity, (date, datetime)):
        return entity.isoformat()
    return entity
