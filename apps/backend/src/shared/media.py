from __future__ import annotations

from urllib.parse import urlparse

from rest_framework import serializers

_DATA_IMAGE_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/jpg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
)


def validate_image_source(value: str) -> str:
    normalized = str(value or "").strip()
    lower_value = normalized.lower()

    if any(lower_value.startswith(prefix) for prefix in _DATA_IMAGE_PREFIXES):
        return normalized

    scheme = urlparse(normalized).scheme.lower()
    if scheme in {"http", "https"}:
        return normalized

    raise serializers.ValidationError("Anh phai la URL http/https hoac anh tai len hop le.")

