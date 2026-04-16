from django.urls import path

from modules.bookings.presentation.api.v1.views import (
    PublicBookingCancelApi,
    PublicBookingCreateApi,
    PublicBookingLookupApi,
)

urlpatterns = [
    path("bookings/", PublicBookingCreateApi.as_view(), name="public-booking-create"),
    path("bookings/lookup/", PublicBookingLookupApi.as_view(), name="public-booking-lookup"),
    path("auth/bookings/<str:code>/cancel/", PublicBookingCancelApi.as_view(), name="public-booking-cancel"),
]
