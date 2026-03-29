from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import (
    create_service_package_use_case,
    delete_service_package_use_case,
    get_service_package_use_case,
    list_service_packages_use_case,
    update_service_package_use_case,
)
from modules.catalog.presentation.api.v1.serializers import (
    ServicePackageReadSerializer,
    ServicePackageWriteSerializer,
)
from shared.auth import BearerTokenAuthentication, IsAdminAccount
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.utils import serialize_entity


class PublicServicePackageListApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        featured = request.query_params.get("featured") == "true"
        use_case = list_service_packages_use_case()
        packages = use_case.execute(featured_only=featured, active_only=True)
        return success(ServicePackageReadSerializer(serialize_entity(packages), many=True).data)


class PublicServicePackageDetailApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, slug: str):
        try:
            service_package = get_service_package_use_case().execute(slug)
            return success(ServicePackageReadSerializer(serialize_entity(service_package)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)


class AdminServicePackageListCreateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request):
        packages = list_service_packages_use_case().execute(active_only=False)
        return success(ServicePackageReadSerializer(serialize_entity(packages), many=True).data)

    def post(self, request):
        serializer = ServicePackageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        service_package = create_service_package_use_case().execute(serializer.to_payload())
        return success(
            ServicePackageReadSerializer(serialize_entity(service_package)).data,
            status.HTTP_201_CREATED,
        )


class AdminServicePackageDetailApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request, slug: str):
        try:
            service_package = get_service_package_use_case().execute(slug)
            return success(ServicePackageReadSerializer(serialize_entity(service_package)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)

    def patch(self, request, slug: str):
        serializer = ServicePackageWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            service_package = update_service_package_use_case().execute(slug, serializer.to_payload())
            return success(ServicePackageReadSerializer(serialize_entity(service_package)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug: str):
        try:
            delete_service_package_use_case().execute(slug)
            return success({"slug": slug})
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)
