from django.urls import path

from modules.bookings.presentation.api.v1.views import (
    AdminAssignPilotApi,
    AdminBookingRequestListApi,
    AdminBookingReviewApi,
    AdminConfirmedBookingListApi,
)

urlpatterns = [
    path("booking-requests/", AdminBookingRequestListApi.as_view(), name="admin-booking-requests"),
    path("booking-requests/<str:code>/review/", AdminBookingReviewApi.as_view(), name="admin-booking-review"),
    path("bookings/", AdminConfirmedBookingListApi.as_view(), name="admin-confirmed-bookings"),
    path("bookings/<str:code>/pilot/", AdminAssignPilotApi.as_view(), name="admin-assign-pilot"),
]
