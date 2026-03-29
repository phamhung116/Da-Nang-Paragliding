from django.urls import path

from modules.tracking.presentation.api.v1.views import AdminFlightStatusUpdateApi

urlpatterns = [
    path(
        "bookings/<str:code>/flight-status/",
        AdminFlightStatusUpdateApi.as_view(),
        name="admin-flight-status-update",
    ),
]
