from django.urls import path

from modules.catalog.presentation.api.v1.views import (
    AdminServiceFeatureDetailApi,
    AdminServiceFeatureListCreateApi,
    AdminServicePackageDetailApi,
    AdminServicePackageListCreateApi,
)

urlpatterns = [
    path("service-features/", AdminServiceFeatureListCreateApi.as_view(), name="admin-service-feature-list"),
    path("service-features/<str:feature_id>/", AdminServiceFeatureDetailApi.as_view(), name="admin-service-feature-detail"),
    path("services/", AdminServicePackageListCreateApi.as_view(), name="admin-service-list"),
    path("services/<slug:slug>/", AdminServicePackageDetailApi.as_view(), name="admin-service-detail"),
]
