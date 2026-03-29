from django.urls import path

from modules.accounts.presentation.api.v1.views import (
    LoginApi,
    LogoutApi,
    MeApi,
    MyBookingHistoryApi,
    RegisterAccountApi,
)

urlpatterns = [
    path("auth/register/", RegisterAccountApi.as_view(), name="auth-register"),
    path("auth/login/", LoginApi.as_view(), name="auth-login"),
    path("auth/logout/", LogoutApi.as_view(), name="auth-logout"),
    path("auth/me/", MeApi.as_view(), name="auth-me"),
    path("auth/bookings/", MyBookingHistoryApi.as_view(), name="auth-bookings"),
]

