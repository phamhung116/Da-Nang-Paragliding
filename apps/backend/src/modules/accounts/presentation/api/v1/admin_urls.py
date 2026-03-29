from django.urls import path

from modules.accounts.presentation.api.v1.views import (
    AdminAccountDetailApi,
    AdminAccountDisableApi,
    AdminAccountListCreateApi,
)

urlpatterns = [
    path("accounts/", AdminAccountListCreateApi.as_view(), name="admin-account-list-create"),
    path("accounts/<str:account_id>/", AdminAccountDetailApi.as_view(), name="admin-account-detail"),
    path("accounts/<str:account_id>/disable/", AdminAccountDisableApi.as_view(), name="admin-account-disable"),
]

