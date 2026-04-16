from django.urls import path

from modules.bookings.presentation.api.v1.views import (
    AdminAssignPilotApi,
    AdminBookingCancelApi,
    AdminBookingDetailApi,
    AdminBookingReviewApi,
    AdminConfirmedBookingListApi,
)

urlpatterns = [
    path("bookings/", AdminConfirmedBookingListApi.as_view(), name="admin-confirmed-bookings"),
    path("bookings/<str:code>/", AdminBookingDetailApi.as_view(), name="admin-booking-detail"),
    path("bookings/<str:code>/cancel/", AdminBookingCancelApi.as_view(), name="admin-booking-cancel"),
    path("bookings/<str:code>/review/", AdminBookingReviewApi.as_view(), name="admin-booking-review"),
    path("bookings/<str:code>/pilot/", AdminAssignPilotApi.as_view(), name="admin-assign-pilot"),
]
