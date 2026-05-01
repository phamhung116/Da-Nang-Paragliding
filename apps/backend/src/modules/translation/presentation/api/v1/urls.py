from django.urls import path

from modules.translation.presentation.api.v1.views import TranslateApi

urlpatterns = [
    path("translate/", TranslateApi.as_view(), name="translate"),
]
