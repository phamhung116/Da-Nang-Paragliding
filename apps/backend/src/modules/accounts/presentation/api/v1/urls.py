from django.urls import path

from modules.accounts.presentation.api.v1.views import (
    ClaimEmailAuthApi,
    LoginApi,
    LogoutApi,
    MeApi,
    MyPasswordApi,
    MyBookingHistoryApi,
    RegisterAccountApi,
    ResendVerificationEmailApi,
    StartEmailAuthApi,
    VerifyEmailApi,
)

urlpatterns = [
    path("auth/register/", RegisterAccountApi.as_view(), name="auth-register"),
    path("auth/verify-email/", VerifyEmailApi.as_view(), name="auth-verify-email"),
    path("auth/resend-verification/", ResendVerificationEmailApi.as_view(), name="auth-resend-verification"),
    path("auth/email/start/", StartEmailAuthApi.as_view(), name="auth-email-start"),
    path("auth/email/claim/", ClaimEmailAuthApi.as_view(), name="auth-email-claim"),
    path("auth/login/", LoginApi.as_view(), name="auth-login"),
    path("auth/logout/", LogoutApi.as_view(), name="auth-logout"),
    path("auth/me/", MeApi.as_view(), name="auth-me"),
    path("auth/me/password/", MyPasswordApi.as_view(), name="auth-me-password"),
    path("auth/bookings/", MyBookingHistoryApi.as_view(), name="auth-bookings"),
]
