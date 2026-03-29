from django.urls import path

from modules.availability.presentation.api.v1.views import MonthlyAvailabilityApi

urlpatterns = [
    path(
        "services/<slug:slug>/availability/",
        MonthlyAvailabilityApi.as_view(),
        name="public-service-availability",
    ),
]
