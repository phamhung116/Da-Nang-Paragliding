from __future__ import annotations

from calendar import monthrange
from dataclasses import asdict, is_dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
from typing import Any
from urllib.parse import urlencode
from urllib.request import urlopen
from uuid import uuid4

from django.conf import settings
from django.core.cache import cache


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


WEATHERAPI_BAD_CODES = {
    1063,
    1066,
    1069,
    1072,
    1087,
    1114,
    1117,
    1147,
    1150,
    1153,
    1168,
    1171,
    1180,
    1183,
    1186,
    1189,
    1192,
    1195,
    1198,
    1201,
    1204,
    1207,
    1210,
    1213,
    1216,
    1219,
    1222,
    1225,
    1237,
    1240,
    1243,
    1246,
    1249,
    1252,
    1255,
    1258,
    1261,
    1264,
    1273,
    1276,
    1279,
    1282,
}

def flight_condition_for(
    *,
    wind_kph: float,
    uv_index: float,
    visibility_km: float,
    weather_code: int | None = None,
    precip_mm: float = 0,
    chance_of_rain: int = 0,
) -> str:
    bad_weather_code = weather_code in WEATHERAPI_BAD_CODES if weather_code is not None else False
    if bad_weather_code or precip_mm > 0.2 or chance_of_rain >= 40 or wind_kph > 18 or uv_index > 9 or visibility_km < 8:
        return "Thoi tiet xau"
    return "Thoi tiet tot"


def fetch_weatherapi_forecast(
    *,
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
    slot_times: list[str],
) -> dict[str, dict[str, Any]]:
    if end_date < start_date:
        return {}
    api_key = getattr(settings, "WEATHERAPI_KEY", "")
    if not api_key:
        return {}
    plan_days = max(1, min(14, int(getattr(settings, "WEATHERAPI_FORECAST_DAYS", 3))))
    forecast_days = min(plan_days, max(1, (end_date - date.today()).days + 1))
    cache_key = (
        "weatherapi:v1:"
        f"{round(latitude, 4)}:{round(longitude, 4)}:"
        f"{start_date.isoformat()}:{end_date.isoformat()}:{forecast_days}:"
        f"{','.join(slot_times)}"
    )
    cached = cache.get(cache_key)
    if isinstance(cached, dict):
        return cached

    query = urlencode(
        {
            "key": api_key,
            "q": f"{latitude},{longitude}",
            "days": forecast_days,
            "aqi": "no",
            "alerts": "no",
            "lang": getattr(settings, "WEATHERAPI_LANG", "vi"),
        }
    )
    try:
        with urlopen(f"https://api.weatherapi.com/v1/forecast.json?{query}", timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}

    result: dict[str, dict[str, Any]] = {}

    for forecast_day in (payload.get("forecast") or {}).get("forecastday") or []:
        date_value = forecast_day.get("date")
        if not date_value:
            continue
        calendar_date = date.fromisoformat(date_value)
        if calendar_date < start_date or calendar_date > end_date:
            continue
        day = forecast_day.get("day") or {}
        day_condition = day.get("condition") or {}
        day_weather_code = _int_value(day_condition.get("code"))
        day_wind = _float_value(day.get("maxwind_kph"))
        day_uv = _float_value(day.get("uv"))
        day_visibility = _float_value(day.get("avgvis_km"))
        day_precip = _float_value(day.get("totalprecip_mm"))
        day_chance_of_rain = max(
            [_int_value(hour.get("chance_of_rain")) or 0 for hour in forecast_day.get("hour") or []],
            default=0,
        )
        day_weather = {
            "temperature_c": round(_float_value(day.get("maxtemp_c")), 1),
            "wind_kph": round(day_wind, 1),
            "uv_index": int(round(day_uv)),
            "visibility_km": round(day_visibility, 1),
            "weather_condition": str(day_condition.get("text") or "").strip(),
            "flight_condition": flight_condition_for(
                wind_kph=day_wind,
                uv_index=day_uv,
                visibility_km=day_visibility,
                weather_code=day_weather_code,
                precip_mm=day_precip,
                chance_of_rain=day_chance_of_rain,
            ),
            "weather_available": True,
            "slots": {},
        }
        hourly_by_hour = {
            str(hour.get("time", ""))[11:13]: hour
            for hour in forecast_day.get("hour") or []
        }
        for slot_time in slot_times:
            hour = hourly_by_hour.get(slot_time[:2])
            if not hour:
                continue
            slot_condition = hour.get("condition") or {}
            slot_weather_code = _int_value(slot_condition.get("code"))
            slot_wind = _float_value(hour.get("wind_kph"))
            slot_uv = _float_value(hour.get("uv"))
            slot_visibility_km = _float_value(hour.get("vis_km"))
            slot_precip = _float_value(hour.get("precip_mm"))
            slot_chance_of_rain = _int_value(hour.get("chance_of_rain")) or 0
            day_weather["slots"][slot_time] = {
                "temperature_c": round(_float_value(hour.get("temp_c")), 1),
                "wind_kph": round(slot_wind, 1),
                "uv_index": int(round(slot_uv)),
                "visibility_km": round(slot_visibility_km, 1),
                "weather_condition": str(slot_condition.get("text") or "").strip(),
                "flight_condition": flight_condition_for(
                    wind_kph=slot_wind,
                    uv_index=slot_uv,
                    visibility_km=slot_visibility_km,
                    weather_code=slot_weather_code,
                    precip_mm=slot_precip,
                    chance_of_rain=slot_chance_of_rain,
                ),
                "weather_available": True,
            }
        result[date_value] = day_weather

    cache.set(cache_key, result, getattr(settings, "WEATHER_API_CACHE_SECONDS", 900))
    return result


def _float_value(value: Any) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def _int_value(value: Any) -> int | None:
    try:
        return int(value)
    except (TypeError, ValueError):
        return None


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
