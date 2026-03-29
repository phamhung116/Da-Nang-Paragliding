from django.urls import path

from modules.bookings.presentation.api.v1.views import PilotFlightListApi

urlpatterns = [
    path("flights/", PilotFlightListApi.as_view(), name="pilot-flight-list"),
]
