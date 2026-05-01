from __future__ import annotations

import hashlib
import html
import json
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings
from django.core.cache import cache
from rest_framework import serializers, status
from rest_framework.views import APIView

from shared.responses import error, success
from shared.throttling import AccountScopedRateThrottle

SUPPORTED_LOCALES = ("vi", "en")
SUPPORTED_FORMATS = ("text", "html")
MAX_TEXT_ITEMS = 50
MAX_TEXT_LENGTH = 30000


class TranslateRequestSerializer(serializers.Serializer):
    q = serializers.ListField(
        child=serializers.CharField(allow_blank=True, trim_whitespace=False, max_length=MAX_TEXT_LENGTH),
        allow_empty=False,
        max_length=MAX_TEXT_ITEMS,
    )
    source = serializers.ChoiceField(choices=SUPPORTED_LOCALES, default="vi", required=False)
    target = serializers.ChoiceField(choices=SUPPORTED_LOCALES)
    format = serializers.ChoiceField(choices=SUPPORTED_FORMATS, default="text", required=False)

    def validate(self, attrs):
        if attrs["source"] == attrs["target"]:
            attrs["same_language"] = True
        return attrs


def _cache_key(source: str, target: str, text_format: str, text: str) -> str:
    digest = hashlib.sha256(f"{source}:{target}:{text_format}:{text}".encode("utf-8")).hexdigest()
    return f"langbly-translate:v1:{digest}"


def _call_langbly_translate(texts: list[str], source: str, target: str, text_format: str) -> list[str]:
    api_key = settings.LANGBLY_API_KEY.strip()
    if not api_key:
        raise RuntimeError("LANGBLY_API_KEY is not configured.")

    body = json.dumps(
        {
            "q": texts,
            "source": source,
            "target": target,
            "format": text_format,
            "quality": settings.LANGBLY_TRANSLATE_QUALITY,
        }
    ).encode("utf-8")
    request = Request(
        settings.LANGBLY_TRANSLATE_ENDPOINT,
        data=body,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "DanangParagliding/1.0",
            "X-API-Key": api_key,
        },
        method="POST",
    )

    with urlopen(request, timeout=12) as response:
        payload = json.loads(response.read().decode("utf-8"))

    translated_items = payload.get("data", {}).get("translations", [])
    if len(translated_items) != len(texts):
        raise RuntimeError("Langbly API returned an unexpected response.")

    return [html.unescape(str(item.get("translatedText", ""))) for item in translated_items]


class TranslateApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "translate"

    def post(self, request):
        serializer = TranslateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.validated_data
        texts = list(payload["q"])
        source = str(payload["source"])
        target = str(payload["target"])
        text_format = str(payload["format"])

        if payload.get("same_language"):
            return success({"translations": texts})

        translations: list[str | None] = [None] * len(texts)
        pending_indexes: list[int] = []
        pending_texts: list[str] = []

        for index, text in enumerate(texts):
            if not text.strip():
                translations[index] = text
                continue

            key = _cache_key(source, target, text_format, text)
            cached = cache.get(key)
            if cached is not None:
                translations[index] = str(cached)
                continue

            pending_indexes.append(index)
            pending_texts.append(text)

        if pending_texts:
            try:
                translated_texts = _call_langbly_translate(pending_texts, source, target, text_format)
            except RuntimeError as exc:
                return error(str(exc), status.HTTP_503_SERVICE_UNAVAILABLE)
            except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
                return error("Langbly API is unavailable. Please try again later.", status.HTTP_502_BAD_GATEWAY)

            for index, translated_text in zip(pending_indexes, translated_texts, strict=True):
                translations[index] = translated_text
                cache.set(
                    _cache_key(source, target, text_format, texts[index]),
                    translated_text,
                    settings.LANGBLY_TRANSLATE_CACHE_SECONDS,
                )

        return success({"translations": [text if text is not None else "" for text in translations]})
