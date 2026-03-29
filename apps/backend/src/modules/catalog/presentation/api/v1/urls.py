from django.urls import path

from modules.catalog.presentation.api.v1.views import (
    PublicServicePackageDetailApi,
    PublicServicePackageListApi,
)

urlpatterns = [
    path("services/", PublicServicePackageListApi.as_view(), name="public-service-list"),
    path("services/<slug:slug>/", PublicServicePackageDetailApi.as_view(), name="public-service-detail"),
]
