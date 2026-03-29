from django.urls import path

from modules.tracking.presentation.api.v1.views import PublicTrackingLookupApi

urlpatterns = [
    path("tracking/lookup/", PublicTrackingLookupApi.as_view(), name="public-tracking-lookup"),
]
