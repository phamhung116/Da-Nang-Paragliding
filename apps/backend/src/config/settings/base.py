from __future__ import annotations

import os
from pathlib import Path

from django.core.exceptions import ImproperlyConfigured
from django_mongodb_backend.utils import parse_uri
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parents[3]


def _env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


def _env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


DJANGO_ENV = os.getenv("DJANGO_ENV", "development").strip().lower()
IS_PRODUCTION_ENV = DJANGO_ENV == "production"

SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "change-me-in-production")
DEBUG = _env_bool("DJANGO_DEBUG", not IS_PRODUCTION_ENV)
ALLOWED_HOSTS = _env_list("DJANGO_ALLOWED_HOSTS", "" if IS_PRODUCTION_ENV else "*")

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
    "shared.middleware.SecurityHeadersMiddleware",
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
        "LOCATION": os.getenv("DJANGO_CACHE_LOCATION", "danang-paragliding-runtime-cache"),
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
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.AnonRateThrottle",
        "shared.throttling.AccountUserRateThrottle",
    ],
    "DEFAULT_THROTTLE_RATES": {
        "anon": os.getenv("DRF_ANON_THROTTLE_RATE", "120/minute" if IS_PRODUCTION_ENV else "1000/minute"),
        "user": os.getenv("DRF_USER_THROTTLE_RATE", "600/minute" if IS_PRODUCTION_ENV else "5000/minute"),
        "auth": os.getenv("DRF_AUTH_THROTTLE_RATE", "10/minute" if IS_PRODUCTION_ENV else "60/minute"),
        "lookup": os.getenv("DRF_LOOKUP_THROTTLE_RATE", "30/minute" if IS_PRODUCTION_ENV else "300/minute"),
    },
    "UNAUTHENTICATED_USER": None,
}

CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = _env_list(
    "CORS_ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:5175",
)
CORS_ALLOW_CREDENTIALS = _env_bool("CORS_ALLOW_CREDENTIALS", True)
CSRF_TRUSTED_ORIGINS = _env_list("CSRF_TRUSTED_ORIGINS")

SESSION_COOKIE_SECURE = _env_bool("SESSION_COOKIE_SECURE", IS_PRODUCTION_ENV)
CSRF_COOKIE_SECURE = _env_bool("CSRF_COOKIE_SECURE", IS_PRODUCTION_ENV)
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = _env_bool("CSRF_COOKIE_HTTPONLY", True)
SESSION_COOKIE_SAMESITE = os.getenv("SESSION_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SAMESITE = os.getenv("CSRF_COOKIE_SAMESITE", "Lax")

SECURE_SSL_REDIRECT = _env_bool("DJANGO_SECURE_SSL_REDIRECT", IS_PRODUCTION_ENV)
SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000" if IS_PRODUCTION_ENV else "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = _env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", IS_PRODUCTION_ENV)
SECURE_HSTS_PRELOAD = _env_bool("DJANGO_SECURE_HSTS_PRELOAD", IS_PRODUCTION_ENV)
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = os.getenv("DJANGO_SECURE_REFERRER_POLICY", "strict-origin-when-cross-origin")
SECURE_CROSS_ORIGIN_OPENER_POLICY = os.getenv("DJANGO_CROSS_ORIGIN_OPENER_POLICY", "same-origin")
X_FRAME_OPTIONS = "DENY"
USE_X_FORWARDED_HOST = _env_bool("DJANGO_USE_X_FORWARDED_HOST", IS_PRODUCTION_ENV)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURITY_CONTENT_SECURITY_POLICY = os.getenv(
    "SECURITY_CONTENT_SECURITY_POLICY",
    "default-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'",
)
SECURITY_PERMISSIONS_POLICY = os.getenv(
    "SECURITY_PERMISSIONS_POLICY",
    "accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), "
    "fullscreen=(self), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()",
)
EXTRA_SECURITY_HEADERS = {
    "Content-Security-Policy": SECURITY_CONTENT_SECURITY_POLICY,
    "Permissions-Policy": SECURITY_PERMISSIONS_POLICY,
    "X-Permitted-Cross-Domain-Policies": "none",
}

ONLINE_PAYMENT_DISCOUNT_PERCENT = int(os.getenv("ONLINE_PAYMENT_DISCOUNT_PERCENT", "10"))
ONLINE_DEPOSIT_PERCENT = int(os.getenv("ONLINE_DEPOSIT_PERCENT", "40"))

BUSINESS_INFO = {
    "name": os.getenv("BUSINESS_NAME", "Da Nang Paragliding"),
    "phone": os.getenv("BUSINESS_PHONE", "+84 909 000 123"),
    "email": os.getenv("BUSINESS_EMAIL", "info@danangparagliding.vn"),
    "address": os.getenv("BUSINESS_ADDRESS", "Doi bay Son Tra, Da Nang"),
}

NOTIFICATION_PROVIDER = os.getenv("NOTIFICATION_PROVIDER", "console")
PAYMENT_PROVIDER = os.getenv("PAYMENT_PROVIDER", "mockpay")
PAYOS_CLIENT_ID = os.getenv("PAYOS_CLIENT_ID", "")
PAYOS_API_KEY = os.getenv("PAYOS_API_KEY", "")
PAYOS_CHECKSUM_KEY = os.getenv("PAYOS_CHECKSUM_KEY", "")
PAYOS_RETURN_URL = os.getenv("PAYOS_RETURN_URL", "")
PAYOS_CANCEL_URL = os.getenv("PAYOS_CANCEL_URL", "")
ACCESS_TOKEN_TTL_HOURS = int(os.getenv("ACCESS_TOKEN_TTL_HOURS", "24" if IS_PRODUCTION_ENV else "168"))
EMAIL_VERIFICATION_TOKEN_TTL_HOURS = int(
    os.getenv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", "1" if IS_PRODUCTION_ENV else "24")
)
CUSTOMER_WEB_URL = os.getenv("CUSTOMER_WEB_URL", "http://localhost:5173")
WEATHERAPI_KEY = os.getenv("WEATHERAPI_KEY", "")
WEATHERAPI_LANG = os.getenv("WEATHERAPI_LANG", "vi")
WEATHERAPI_FORECAST_DAYS = int(os.getenv("WEATHERAPI_FORECAST_DAYS", "14"))
WEATHER_API_CACHE_SECONDS = int(os.getenv("WEATHER_API_CACHE_SECONDS", "900"))

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.console.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = _env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = _env_bool("EMAIL_USE_SSL", False)
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", BUSINESS_INFO["email"])


def _validate_production_settings(values: dict[str, object] | None = None) -> None:
    settings_values = values or globals()
    secret_key = str(settings_values.get("SECRET_KEY", ""))
    allowed_hosts = settings_values.get("ALLOWED_HOSTS", [])
    cors_origins = settings_values.get("CORS_ALLOWED_ORIGINS", [])
    payment_provider = str(settings_values.get("PAYMENT_PROVIDER", "")).lower()
    email_backend = str(settings_values.get("EMAIL_BACKEND", ""))
    customer_web_url = str(settings_values.get("CUSTOMER_WEB_URL", ""))
    mongodb_uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")

    if bool(settings_values.get("DEBUG", False)):
        raise ImproperlyConfigured("DJANGO_DEBUG must be false in production.")
    if secret_key in {"", "replace-me", "change-me-in-production"} or secret_key.startswith("replace-me") or len(secret_key) < 32:
        raise ImproperlyConfigured("Set DJANGO_SECRET_KEY to a strong secret before production deploy.")
    if not isinstance(allowed_hosts, list) or not allowed_hosts or "*" in allowed_hosts:
        raise ImproperlyConfigured("Set explicit DJANGO_ALLOWED_HOSTS before production deploy.")
    if not isinstance(cors_origins, list) or not cors_origins:
        raise ImproperlyConfigured("Set explicit CORS_ALLOWED_ORIGINS before production deploy.")
    if any(str(origin).startswith("http://") for origin in cors_origins):
        raise ImproperlyConfigured("CORS_ALLOWED_ORIGINS must use https:// in production.")
    if not customer_web_url.startswith("https://"):
        raise ImproperlyConfigured("CUSTOMER_WEB_URL must use https:// in production.")
    if not bool(settings_values.get("SECURE_SSL_REDIRECT", False)):
        raise ImproperlyConfigured("DJANGO_SECURE_SSL_REDIRECT must be true in production.")
    if int(settings_values.get("SECURE_HSTS_SECONDS", 0)) < 31536000:
        raise ImproperlyConfigured("DJANGO_SECURE_HSTS_SECONDS must be at least 31536000 in production.")
    if not bool(settings_values.get("SESSION_COOKIE_SECURE", False)):
        raise ImproperlyConfigured("SESSION_COOKIE_SECURE must be true in production.")
    if not bool(settings_values.get("CSRF_COOKIE_SECURE", False)):
        raise ImproperlyConfigured("CSRF_COOKIE_SECURE must be true in production.")
    if mongodb_uri.startswith("mongodb://127.0.0.1") or mongodb_uri.startswith("mongodb://localhost"):
        raise ImproperlyConfigured("MONGODB_URI must point to the production database.")
    if payment_provider in {"", "mockpay"}:
        raise ImproperlyConfigured("PAYMENT_PROVIDER must be a real provider in production, for example payos.")
    if payment_provider == "payos":
        missing = [
            key
            for key in ("PAYOS_CLIENT_ID", "PAYOS_API_KEY", "PAYOS_CHECKSUM_KEY", "PAYOS_RETURN_URL", "PAYOS_CANCEL_URL")
            if not str(settings_values.get(key, "")).strip()
        ]
        if missing:
            raise ImproperlyConfigured(f"Missing production PayOS settings: {', '.join(missing)}.")
    if email_backend.endswith("console.EmailBackend"):
        raise ImproperlyConfigured("EMAIL_BACKEND must send real email in production.")


if IS_PRODUCTION_ENV:
    _validate_production_settings()
