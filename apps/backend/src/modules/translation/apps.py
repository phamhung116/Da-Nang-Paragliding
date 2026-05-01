from __future__ import annotations

from django.apps import AppConfig


class TranslationConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.translation"
