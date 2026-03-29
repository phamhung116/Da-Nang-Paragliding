from django.urls import path

from modules.payments.presentation.api.v1.views import CompleteOnlinePaymentApi

urlpatterns = [
    path(
        "bookings/<str:code>/payment/complete/",
        CompleteOnlinePaymentApi.as_view(),
        name="public-complete-payment",
    ),
]
