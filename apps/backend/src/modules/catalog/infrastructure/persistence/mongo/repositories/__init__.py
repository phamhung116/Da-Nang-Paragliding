from __future__ import annotations

from django.db.models import QuerySet

from modules.catalog.application.dto import ServiceFeaturePayload, ServicePackagePayload
from modules.catalog.domain.entities import ServiceFeature, ServicePackage
from modules.catalog.infrastructure.mappers import (
    to_document_defaults,
    to_domain,
    to_feature_document_defaults,
    to_feature_domain,
)
from modules.catalog.infrastructure.persistence.mongo.documents import ServiceFeatureDocument, ServicePackageDocument
from shared.exceptions import NotFoundError, ValidationError


class MongoServicePackageRepository:
    def _base_queryset(self) -> QuerySet[ServicePackageDocument]:
        return ServicePackageDocument.objects.all()

    def _normalize_feature_values(self, values: list[object]) -> list[str]:
        return [str(value).strip() for value in values if str(value).strip()]

    def _resolve_feature_documents(
        self,
        values: list[object],
        *,
        feature_documents_by_id: dict[str, ServiceFeatureDocument] | None = None,
        feature_documents_by_name: dict[str, ServiceFeatureDocument] | None = None,
    ) -> list[ServiceFeatureDocument]:
        normalized = self._normalize_feature_values(values)
        if not normalized:
            return []

        by_id = feature_documents_by_id or {
            str(document.id): document for document in ServiceFeatureDocument.objects.filter(id__in=normalized)
        }
        unresolved = [value for value in normalized if value not in by_id]
        by_name = feature_documents_by_name or {
            document.name: document for document in ServiceFeatureDocument.objects.filter(name__in=unresolved)
        }

        resolved: list[ServiceFeatureDocument] = []
        seen: set[str] = set()
        for value in normalized:
            document = by_id.get(value) or by_name.get(value)
            if document is None:
                continue
            document_id = str(document.id)
            if document_id in seen:
                continue
            seen.add(document_id)
            resolved.append(document)
        return resolved

    def _resolve_service_features(
        self,
        document: ServicePackageDocument,
        *,
        feature_documents_by_id: dict[str, ServiceFeatureDocument] | None = None,
        feature_documents_by_name: dict[str, ServiceFeatureDocument] | None = None,
    ) -> tuple[list[str], list[ServiceFeature]]:
        stored_feature_ids = list(getattr(document, "included_feature_ids", []) or [])
        if not stored_feature_ids:
            stored_feature_ids = list(getattr(document, "included_services", []) or [])
        feature_documents = self._resolve_feature_documents(
            stored_feature_ids,
            feature_documents_by_id=feature_documents_by_id,
            feature_documents_by_name=feature_documents_by_name,
        )
        return [str(item.id) for item in feature_documents], [to_feature_domain(item) for item in feature_documents]

    def _prefetch_feature_maps(
        self,
        documents: list[ServicePackageDocument],
    ) -> tuple[dict[str, ServiceFeatureDocument], dict[str, ServiceFeatureDocument]]:
        normalized_values = self._normalize_feature_values(
            [
                value
                for document in documents
                for value in (
                    list(getattr(document, "included_feature_ids", []) or [])
                    or list(getattr(document, "included_services", []) or [])
                )
            ]
        )
        if not normalized_values:
            return {}, {}

        feature_documents_by_id = {
            str(document.id): document for document in ServiceFeatureDocument.objects.filter(id__in=normalized_values)
        }
        unresolved = [value for value in normalized_values if value not in feature_documents_by_id]
        feature_documents_by_name = {
            document.name: document for document in ServiceFeatureDocument.objects.filter(name__in=unresolved)
        }
        return feature_documents_by_id, feature_documents_by_name

    def _get_feature_documents_or_raise(self, feature_ids: list[str]) -> list[ServiceFeatureDocument]:
        requested_ids: list[str] = []
        seen: set[str] = set()
        for value in feature_ids:
            normalized = str(value).strip()
            if not normalized or normalized in seen:
                continue
            seen.add(normalized)
            requested_ids.append(normalized)

        feature_documents = self._resolve_feature_documents(requested_ids)
        if len(feature_documents) != len(requested_ids):
            raise ValidationError("Có dịch vụ đi kèm không tồn tại hoặc đã bị xóa.")
        return feature_documents

    def list(self, *, featured_only: bool = False, active_only: bool = True) -> list[ServicePackage]:
        queryset = self._base_queryset()
        if featured_only:
            queryset = queryset.filter(featured=True)
        if active_only:
            queryset = queryset.filter(active=True)

        documents = list(queryset)
        feature_documents_by_id, feature_documents_by_name = self._prefetch_feature_maps(documents)
        packages: list[ServicePackage] = []
        for document in documents:
            included_feature_ids, included_features = self._resolve_service_features(
                document,
                feature_documents_by_id=feature_documents_by_id,
                feature_documents_by_name=feature_documents_by_name,
            )
            packages.append(
                to_domain(
                    document,
                    included_feature_ids=included_feature_ids,
                    included_features=included_features,
                )
            )
        return packages

    def get_by_slug(self, slug: str) -> ServicePackage | None:
        document = self._base_queryset().filter(slug=slug).first()
        if document is None:
            return None
        included_feature_ids, included_features = self._resolve_service_features(document)
        return to_domain(
            document,
            included_feature_ids=included_feature_ids,
            included_features=included_features,
        )

    def create(self, payload: ServicePackagePayload) -> ServicePackage:
        feature_documents = self._get_feature_documents_or_raise(payload.included_feature_ids)
        included_feature_ids = [str(item.id) for item in feature_documents]
        included_features = [to_feature_domain(item) for item in feature_documents]
        document = ServicePackageDocument.objects.create(
            **to_document_defaults(
                payload,
                included_services=[item.name for item in feature_documents],
                included_feature_ids=included_feature_ids,
            )
        )
        return to_domain(
            document,
            included_feature_ids=included_feature_ids,
            included_features=included_features,
        )

    def update(self, slug: str, payload: ServicePackagePayload) -> ServicePackage:
        document = self._base_queryset().filter(slug=slug).first()
        if document is None:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")

        feature_documents = self._get_feature_documents_or_raise(payload.included_feature_ids)
        included_feature_ids = [str(item.id) for item in feature_documents]
        included_features = [to_feature_domain(item) for item in feature_documents]
        for field, value in to_document_defaults(
            payload,
            included_services=[item.name for item in feature_documents],
            included_feature_ids=included_feature_ids,
        ).items():
            setattr(document, field, value)

        document.save()
        return to_domain(
            document,
            included_feature_ids=included_feature_ids,
            included_features=included_features,
        )

    def delete(self, slug: str) -> None:
        deleted, _ = self._base_queryset().filter(slug=slug).delete()
        if not deleted:
            raise NotFoundError("Không tìm thấy gói dịch vụ.")

    def list_features(self, *, active_only: bool = False) -> list[ServiceFeature]:
        queryset = ServiceFeatureDocument.objects.all()
        if active_only:
            queryset = queryset.filter(active=True)
        return [to_feature_domain(document) for document in queryset]

    def get_feature(self, feature_id: str) -> ServiceFeature | None:
        document = ServiceFeatureDocument.objects.filter(id=feature_id).first()
        return to_feature_domain(document) if document else None

    def create_feature(self, payload: ServiceFeaturePayload) -> ServiceFeature:
        document = ServiceFeatureDocument.objects.create(**to_feature_document_defaults(payload))
        return to_feature_domain(document)

    def update_feature(self, feature_id: str, payload: ServiceFeaturePayload) -> ServiceFeature:
        document = ServiceFeatureDocument.objects.filter(id=feature_id).first()
        if document is None:
            raise NotFoundError("Không tìm thấy dịch vụ đi kèm.")

        for field, value in to_feature_document_defaults(payload).items():
            setattr(document, field, value)
        document.save()
        return to_feature_domain(document)

    def delete_feature(self, feature_id: str) -> None:
        document = ServiceFeatureDocument.objects.filter(id=feature_id).first()
        if document is None:
            raise NotFoundError("Không tìm thấy dịch vụ đi kèm.")
        document.delete()
