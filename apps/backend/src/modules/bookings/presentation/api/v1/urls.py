from django.urls import path

from modules.bookings.presentation.api.v1.views import PublicBookingCreateApi, PublicBookingLookupApi

urlpatterns = [
    path("bookings/", PublicBookingCreateApi.as_view(), name="public-booking-create"),
    path("bookings/lookup/", PublicBookingLookupApi.as_view(), name="public-booking-lookup"),
]
