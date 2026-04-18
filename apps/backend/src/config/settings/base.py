from __future__ import annotations

import os
from pathlib import Path

from django_mongodb_backend.utils import parse_uri
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[3]

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me-in-production")
DEBUG = os.getenv("DJANGO_DEBUG", "true").lower() == "true"
ALLOWED_HOSTS = [host for host in os.getenv("DJANGO_ALLOWED_HOSTS", "*").split(",") if host]

INSTALLED_APPS = [
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "modules.accounts",
    "modules.catalog",
    "modules.posts",
    "modules.availability",
    "modules.bookings",
    "modules.payments",
    "modules.tracking",
    "modules.notifications",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
            ],
        },
    }
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": parse_uri(
        os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017"),
        db_name=os.getenv("MONGODB_NAME", "paragliding_platform"),
    )
}

CACHES = {
    "default": {
        "BACKEND": os.getenv("DJANGO_CACHE_BACKEND", "django.core.cache.backends.locmem.LocMemCache"),
        "LOCATION": os.getenv("DJANGO_CACHE_LOCATION", "skynest-runtime-cache"),
    }
}

AUTH_PASSWORD_VALIDATORS = []

LANGUAGE_CODE = "vi-vn"
TIME_ZONE = os.getenv("APP_TIME_ZONE", "Asia/Bangkok")
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

DEFAULT_AUTO_FIELD = "django_mongodb_backend.fields.ObjectIdAutoField"

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"],
    "DEFAULT_PARSER_CLASSES": ["rest_framework.parsers.JSONParser"],
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "DEFAULT_PERMISSION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
}

CORS_ALLOWED_ORIGINS = [
    origin
    for origin in os.getenv(
        "CORS_ALLOWED_ORIGINS",
        "http://localhost:5173,http://localhost:5174,http://localhost:5175",
    ).split(",")
    if origin
]
CORS_ALLOW_CREDENTIALS = True

ONLINE_PAYMENT_DISCOUNT_PERCENT = int(os.getenv("ONLINE_PAYMENT_DISCOUNT_PERCENT", "10"))
ONLINE_DEPOSIT_PERCENT = int(os.getenv("ONLINE_DEPOSIT_PERCENT", "40"))

BUSINESS_INFO = {
    "name": os.getenv("BUSINESS_NAME", "SkyNest Paragliding"),
    "phone": os.getenv("BUSINESS_PHONE", "+84 909 000 123"),
    "email": os.getenv("BUSINESS_EMAIL", "hello@skynest.vn"),
    "address": os.getenv("BUSINESS_ADDRESS", "Đồi bay Sơn Trà, Đà Nẵng"),
}

NOTIFICATION_PROVIDER = os.getenv("NOTIFICATION_PROVIDER", "console")
PAYMENT_PROVIDER = os.getenv("PAYMENT_PROVIDER", "mockpay")
PAYOS_CLIENT_ID = os.getenv("PAYOS_CLIENT_ID", "")
PAYOS_API_KEY = os.getenv("PAYOS_API_KEY", "")
PAYOS_CHECKSUM_KEY = os.getenv("PAYOS_CHECKSUM_KEY", "")
PAYOS_RETURN_URL = os.getenv("PAYOS_RETURN_URL", "")
PAYOS_CANCEL_URL = os.getenv("PAYOS_CANCEL_URL", "")
ACCESS_TOKEN_TTL_HOURS = int(os.getenv("ACCESS_TOKEN_TTL_HOURS", "168"))
EMAIL_VERIFICATION_TOKEN_TTL_HOURS = int(os.getenv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", "24"))
CUSTOMER_WEB_URL = os.getenv("CUSTOMER_WEB_URL", "http://localhost:5173")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY", "")
WEATHERAPI_LANG = os.getenv("WEATHERAPI_LANG", "vi")
WEATHERAPI_FORECAST_DAYS = int(os.getenv("WEATHERAPI_FORECAST_DAYS", "3"))
WEATHER_API_CACHE_SECONDS = int(os.getenv("WEATHER_API_CACHE_SECONDS", "900"))

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = os.getenv("EMAIL_USE_TLS", "true").lower() == "true"
EMAIL_USE_SSL = os.getenv("EMAIL_USE_SSL", "false").lower() == "true"
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", BUSINESS_INFO["email"])
