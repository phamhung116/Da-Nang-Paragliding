from django.apps import AppConfig


class PostsConfig(AppConfig):
    default_auto_field = "django_mongodb_backend.fields.ObjectIdAutoField"
    name = "modules.posts"
    verbose_name = "Posts"
