from django.apps import AppConfig


class TrackingConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.tracking"
    verbose_name = "Tracking"
