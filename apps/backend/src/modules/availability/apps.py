from django.apps import AppConfig


class AvailabilityConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.availability"
    verbose_name = "Availability"
