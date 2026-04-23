from django.urls import path

from modules.bookings.presentation.api.v1.views import (
    PublicBookingCancelApi,
    PublicBookingCreateApi,
    PublicBookingLookupApi,
    PublicPickupLocationResolveApi,
    PublicPickupLocationSuggestApi,
)

urlpatterns = [
    path("bookings/", PublicBookingCreateApi.as_view(), name="public-booking-create"),
    path("bookings/lookup/", PublicBookingLookupApi.as_view(), name="public-booking-lookup"),
    path("bookings/pickup-location/resolve/", PublicPickupLocationResolveApi.as_view(), name="public-pickup-location-resolve"),
    path("bookings/pickup-location/suggest/", PublicPickupLocationSuggestApi.as_view(), name="public-pickup-location-suggest"),
    path("auth/bookings/<str:code>/cancel/", PublicBookingCancelApi.as_view(), name="public-booking-cancel"),
]
