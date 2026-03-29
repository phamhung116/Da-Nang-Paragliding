from django.apps import AppConfig


class CatalogConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.catalog"
    verbose_name = "Catalog"
