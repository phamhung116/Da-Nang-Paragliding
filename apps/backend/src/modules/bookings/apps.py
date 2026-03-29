from django.apps import AppConfig


class BookingsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.bookings"
    verbose_name = "Bookings"
