from __future__ import annotations

from django.db.models import QuerySet

from modules.catalog.application.dto import ServicePackagePayload
from modules.catalog.domain.entities import ServicePackage
from modules.catalog.infrastructure.mappers import to_document_defaults, to_domain
from modules.catalog.infrastructure.persistence.mongo.documents import ServicePackageDocument
from shared.exceptions import NotFoundError


class MongoServicePackageRepository:
    def _base_queryset(self) -> QuerySet[ServicePackageDocument]:
        return ServicePackageDocument.objects.all()

    def list(self, *, featured_only: bool = False, active_only: bool = True) -> list[ServicePackage]:
        queryset = self._base_queryset()
        if featured_only:
            queryset = queryset.filter(featured=True)
        if active_only:
            queryset = queryset.filter(active=True)
        return [to_domain(document) for document in queryset]

    def get_by_slug(self, slug: str) -> ServicePackage | None:
        document = self._base_queryset().filter(slug=slug).first()
        return to_domain(document) if document else None

    def create(self, payload: ServicePackagePayload) -> ServicePackage:
        document = ServicePackageDocument.objects.create(**to_document_defaults(payload))
        return to_domain(document)

    def update(self, slug: str, payload: ServicePackagePayload) -> ServicePackage:
        document = self._base_queryset().filter(slug=slug).first()
        if document is None:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")

        for field, value in to_document_defaults(payload).items():
            setattr(document, field, value)

        document.save()
        return to_domain(document)

    def delete(self, slug: str) -> None:
        deleted, _ = self._base_queryset().filter(slug=slug).delete()
        if not deleted:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")
