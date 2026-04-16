from __future__ import annotations

from django.http import JsonResponse
from django.urls import include, path


def health_check(_: object) -> JsonResponse:
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("health/", health_check),
    path("api/v1/", include("modules.accounts.presentation.api.v1.urls")),
    path("api/v1/", include("modules.catalog.presentation.api.v1.urls")),
    path("api/v1/", include("modules.posts.presentation.api.v1.urls")),
    path("api/v1/", include("modules.availability.presentation.api.v1.urls")),
    path("api/v1/", include("modules.bookings.presentation.api.v1.urls")),
    path("api/v1/", include("modules.payments.presentation.api.v1.urls")),
    path("api/v1/", include("modules.tracking.presentation.api.v1.urls")),
    path("api/v1/pilot/", include("modules.bookings.presentation.api.v1.pilot_urls")),
    path("api/v1/pilot/", include("modules.posts.presentation.api.v1.pilot_urls")),
    path("api/v1/pilot/", include("modules.tracking.presentation.api.v1.pilot_urls")),
    path("api/v1/admin/", include("modules.catalog.presentation.api.v1.admin_urls")),
    path("api/v1/admin/", include("modules.accounts.presentation.api.v1.admin_urls")),
    path("api/v1/admin/", include("modules.posts.presentation.api.v1.admin_urls")),
    path("api/v1/admin/", include("modules.bookings.presentation.api.v1.admin_urls")),
]
