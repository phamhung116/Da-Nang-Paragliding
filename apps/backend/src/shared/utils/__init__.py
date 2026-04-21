from __future__ import annotations

from calendar import monthrange
from dataclasses import asdict, is_dataclass
from datetime import date, datetime, timedelta
from decimal import Decimal, ROUND_HALF_UP
import json
from typing import Any
from urllib.parse import urlencode
from urllib.request import Request, urlopen
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


IDEAL_FLIGHT_CONDITION = "Ly tuong"
BAD_FLIGHT_CONDITION = "Khong ly tuong"

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

WEATHERAPI_BLOCKING_CODES = {
    1087,
    1114,
    1117,
    1135,
    1147,
    1171,
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

OPEN_METEO_BLOCKING_CODES = {
    45,
    48,
    63,
    65,
    80,
    81,
    82,
    95,
    96,
    99,
}


def flight_condition_for(
    *,
    wind_kph: float,
    uv_index: float,
    visibility_km: float,
    temperature_c: float | None = None,
    wind_gust_kph: float | None = None,
    weather_code: int | None = None,
    precip_mm: float = 0,
    chance_of_rain: int = 0,
) -> str:
    blocking_weather_code = (
        weather_code in WEATHERAPI_BLOCKING_CODES or weather_code in OPEN_METEO_BLOCKING_CODES
        if weather_code is not None
        else False
    )
    bad_temperature = temperature_c is not None and (temperature_c < 15 or temperature_c > 38)
    bad_gust = wind_gust_kph is not None and wind_gust_kph > 36
    if (
        blocking_weather_code
        or bad_temperature
        or bad_gust
        or precip_mm > 2
        or chance_of_rain >= 70
        or wind_kph > 28
        or uv_index > 11
        or visibility_km < 6
    ):
        return BAD_FLIGHT_CONDITION
    return IDEAL_FLIGHT_CONDITION


OPEN_METEO_WEATHER_LABELS = {
    0: "Troi quang",
    1: "It may",
    2: "May rai rac",
    3: "Nhieu may",
    45: "Suong mu",
    48: "Suong mu dong bang",
    51: "Mua phun nhe",
    53: "Mua phun",
    55: "Mua phun manh",
    61: "Mua nhe",
    63: "Mua vua",
    65: "Mua lon",
    80: "Mua rao nhe",
    81: "Mua rao",
    82: "Mua rao manh",
    95: "Giong",
    96: "Giong kem mua da",
    99: "Giong kem mua da manh",
}


def _weather_label(weather_code: int | None) -> str:
    if weather_code is None:
        return "Dang cap nhat"
    return OPEN_METEO_WEATHER_LABELS.get(weather_code, "Dang cap nhat")


def _fetch_open_meteo_forecast(
    *,
    latitude: float,
    longitude: float,
    start_date: date,
    end_date: date,
    slot_times: list[str],
) -> dict[str, dict[str, Any]]:
    query = urlencode(
        {
            "latitude": latitude,
            "longitude": longitude,
            "timezone": getattr(settings, "TIME_ZONE", "Asia/Bangkok"),
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join(
                [
                    "temperature_2m_max",
                    "weather_code",
                    "wind_speed_10m_max",
                    "wind_gusts_10m_max",
                    "uv_index_max",
                    "precipitation_sum",
                ]
            ),
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                    "wind_gusts_10m",
                    "visibility",
                    "uv_index",
                ]
            ),
        }
    )
    cache_key = (
        "openmeteo:v1:"
        f"{round(latitude, 4)}:{round(longitude, 4)}:"
        f"{start_date.isoformat()}:{end_date.isoformat()}:{','.join(slot_times)}"
    )
    cached = cache.get(cache_key)
    if isinstance(cached, dict):
        return cached

    try:
        request = Request(
            f"https://api.open-meteo.com/v1/forecast?{query}",
            headers={"User-Agent": "DaNangParagliding/1.0 forecast integration"},
        )
        with urlopen(request, timeout=5) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}

    daily = payload.get("daily") or {}
    hourly = payload.get("hourly") or {}
    hourly_times = hourly.get("time") or []
    hourly_by_time = {str(value): index for index, value in enumerate(hourly_times)}
    result: dict[str, dict[str, Any]] = {}

    for index, date_value in enumerate(daily.get("time") or []):
        weather_code = _int_at(daily.get("weather_code"), index)
        temperature_c = round(_float_at(daily.get("temperature_2m_max"), index), 1)
        wind_kph = round(_float_at(daily.get("wind_speed_10m_max"), index), 1)
        wind_gust_kph = round(_float_at(daily.get("wind_gusts_10m_max"), index), 1)
        uv_index = int(round(_float_at(daily.get("uv_index_max"), index)))
        precip_mm = _float_at(daily.get("precipitation_sum"), index)
        day_weather = {
            "temperature_c": temperature_c,
            "wind_kph": wind_kph,
            "uv_index": uv_index,
            "visibility_km": 10,
            "weather_condition": _weather_label(weather_code),
            "flight_condition": flight_condition_for(
                temperature_c=temperature_c,
                wind_kph=wind_kph,
                wind_gust_kph=wind_gust_kph,
                uv_index=uv_index,
                visibility_km=10,
                weather_code=weather_code,
                precip_mm=precip_mm,
            ),
            "weather_available": True,
            "slots": {},
        }

        for slot_time in slot_times:
            lookup_key = f"{date_value}T{slot_time[:2]}:00"
            hour_index = hourly_by_time.get(lookup_key)
            if hour_index is None:
                continue
            slot_weather_code = _int_at(hourly.get("weather_code"), hour_index)
            slot_temperature = round(_float_at(hourly.get("temperature_2m"), hour_index), 1)
            slot_wind = round(_float_at(hourly.get("wind_speed_10m"), hour_index), 1)
            slot_gust = round(_float_at(hourly.get("wind_gusts_10m"), hour_index), 1)
            slot_visibility_km = round(_float_at(hourly.get("visibility"), hour_index) / 1000, 1)
            slot_uv = int(round(_float_at(hourly.get("uv_index"), hour_index)))
            slot_precip = _float_at(hourly.get("precipitation"), hour_index)
            day_weather["slots"][slot_time] = {
                "temperature_c": slot_temperature,
                "wind_kph": slot_wind,
                "uv_index": slot_uv,
                "visibility_km": slot_visibility_km,
                "weather_condition": _weather_label(slot_weather_code),
                "flight_condition": flight_condition_for(
                    temperature_c=slot_temperature,
                    wind_kph=slot_wind,
                    wind_gust_kph=slot_gust,
                    uv_index=slot_uv,
                    visibility_km=slot_visibility_km,
                    weather_code=slot_weather_code,
                    precip_mm=slot_precip,
                ),
                "weather_available": True,
            }

        result[str(date_value)] = day_weather

    cache.set(cache_key, result, getattr(settings, "WEATHER_API_CACHE_SECONDS", 900))
    return result


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
        return _fetch_open_meteo_forecast(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            slot_times=slot_times,
        )
    plan_days = min(14, max(14, int(getattr(settings, "WEATHERAPI_FORECAST_DAYS", 14))))
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
        return _fetch_open_meteo_forecast(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            slot_times=slot_times,
        )

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
                temperature_c=round(_float_value(day.get("maxtemp_c")), 1),
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
                    temperature_c=round(_float_value(hour.get("temp_c")), 1),
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

    missing_dates = [
        forecast_date.isoformat()
        for forecast_date in daterange(start_date, end_date)
        if forecast_date.isoformat() not in result
    ]
    if missing_dates:
        fallback = _fetch_open_meteo_forecast(
            latitude=latitude,
            longitude=longitude,
            start_date=start_date,
            end_date=end_date,
            slot_times=slot_times,
        )
        for date_value in missing_dates:
            if date_value in fallback:
                result[date_value] = fallback[date_value]

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


def _float_at(values: Any, index: int) -> float:
    try:
        return float(values[index])
    except (TypeError, ValueError, IndexError):
        return 0.0


def _int_at(values: Any, index: int) -> int | None:
    try:
        return int(values[index])
    except (TypeError, ValueError, IndexError):
        return None


def geocode_address(address: str) -> dict[str, float]:
    normalized = address.strip()
    if not normalized:
        return {}
    cache_key = f"geocode:nominatim:v1:{normalized.lower()}"
    cached = cache.get(cache_key)
    if isinstance(cached, dict):
        return cached

    query = urlencode({"q": f"{normalized}, Da Nang, Vietnam", "format": "json", "limit": 1})
    try:
        request = Request(
            f"https://nominatim.openstreetmap.org/search?{query}",
            headers={"User-Agent": "DaNangParagliding/1.0 booking pickup geocoder"},
        )
        with urlopen(request, timeout=4) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except Exception:
        return {}

    if not isinstance(payload, list) or not payload:
        return {}
    result = {
        "lat": _float_value(payload[0].get("lat")),
        "lng": _float_value(payload[0].get("lon")),
    }
    if not result["lat"] or not result["lng"]:
        return {}
    cache.set(cache_key, result, 60 * 60 * 24 * 14)
    return result


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
