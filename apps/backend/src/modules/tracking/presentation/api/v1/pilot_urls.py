from django.urls import path

from modules.tracking.presentation.api.v1.views import (
    PilotFlightStatusUpdateApi,
    PilotTrackingPingApi,
    PilotTrackingStartApi,
    PilotTrackingStopApi,
)

urlpatterns = [
    path(
        "flights/<str:code>/status/",
        PilotFlightStatusUpdateApi.as_view(),
        name="pilot-flight-status-update",
    ),
    path(
        "flights/<str:code>/tracking/start/",
        PilotTrackingStartApi.as_view(),
        name="pilot-tracking-start",
    ),
    path(
        "flights/<str:code>/tracking/ping/",
        PilotTrackingPingApi.as_view(),
        name="pilot-tracking-ping",
    ),
    path(
        "flights/<str:code>/tracking/stop/",
        PilotTrackingStopApi.as_view(),
        name="pilot-tracking-stop",
    ),
]
