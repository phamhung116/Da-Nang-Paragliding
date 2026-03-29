from django.urls import path

from modules.catalog.presentation.api.v1.views import (
    AdminServicePackageDetailApi,
    AdminServicePackageListCreateApi,
)

urlpatterns = [
    path("services/", AdminServicePackageListCreateApi.as_view(), name="admin-service-list"),
    path("services/<slug:slug>/", AdminServicePackageDetailApi.as_view(), name="admin-service-detail"),
]
