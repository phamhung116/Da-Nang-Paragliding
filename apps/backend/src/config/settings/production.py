from __future__ import annotations

import os

from . import base as base_settings
from .base import *  # noqa: F403,F401

DEBUG = base_settings._env_bool("DJANGO_DEBUG", False)
ALLOWED_HOSTS = base_settings._env_list("DJANGO_ALLOWED_HOSTS")

ACCESS_TOKEN_TTL_HOURS = int(os.getenv("ACCESS_TOKEN_TTL_HOURS", "24"))
EMAIL_VERIFICATION_TOKEN_TTL_HOURS = int(os.getenv("EMAIL_VERIFICATION_TOKEN_TTL_HOURS", "1"))

SECURE_SSL_REDIRECT = base_settings._env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = base_settings._env_bool("DJANGO_SECURE_HSTS_INCLUDE_SUBDOMAINS", True)
SECURE_HSTS_PRELOAD = base_settings._env_bool("DJANGO_SECURE_HSTS_PRELOAD", True)
SESSION_COOKIE_SECURE = base_settings._env_bool("SESSION_COOKIE_SECURE", True)
CSRF_COOKIE_SECURE = base_settings._env_bool("CSRF_COOKIE_SECURE", True)
USE_X_FORWARDED_HOST = base_settings._env_bool("DJANGO_USE_X_FORWARDED_HOST", True)
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

base_settings._validate_production_settings(globals())
