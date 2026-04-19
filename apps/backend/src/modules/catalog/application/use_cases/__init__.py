from __future__ import annotations

from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload
from modules.catalog.domain.repositories import ServicePackageRepository
from shared.exceptions import NotFoundError


class ListServicePackagesUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, *, featured_only: bool = False, active_only: bool = True):
        return self.repository.list(featured_only=featured_only, active_only=active_only)


class GetServicePackageUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, slug: str):
        service_package = self.repository.get_by_slug(slug)
        if service_package is None:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")
        return service_package


class CreateServicePackageUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, payload: ServicePackagePayload):
        return self.repository.create(payload)


class UpdateServicePackageUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, slug: str, payload: ServicePackagePayload):
        return self.repository.update(slug, payload)


class DeleteServicePackageUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, slug: str) -> None:
        self.repository.delete(slug)


class ListServiceFeaturesUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, *, active_only: bool = False):
        return self.repository.list_features(active_only=active_only)


class CreateServiceFeatureUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, payload: ServiceFeaturePayload):
        return self.repository.create_feature(payload)


class UpdateServiceFeatureUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, feature_id: str, payload: ServiceFeaturePayload):
        return self.repository.update_feature(feature_id, payload)


class DeleteServiceFeatureUseCase:
    def __init__(self, repository: ServicePackageRepository) -> None:
        self.repository = repository

    def execute(self, feature_id: str) -> None:
        self.repository.delete_feature(feature_id)
