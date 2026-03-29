from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.payments"
    verbose_name = "Payments"
