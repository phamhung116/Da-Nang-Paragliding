from __future__ import annotations

from django.utils import timezone
from modules.posts.application.dto import PostPayload
from modules.posts.domain.entities import Post
from modules.posts.infrastructure.mappers import to_document_defaults, to_domain
from modules.posts.infrastructure.persistence.mongo.documents import PostDocument
from shared.exceptions import NotFoundError


class MongoPostRepository:
    def list(self, *, published_only: bool = True) -> list[Post]:
        queryset = PostDocument.objects.all()
        if published_only:
            queryset = queryset.filter(published=True)
        return [to_domain(document) for document in queryset]

    def get_by_slug(self, slug: str) -> Post | None:
        document = PostDocument.objects.filter(slug=slug).first()
        return to_domain(document) if document else None

    def create(self, payload: PostPayload) -> Post:
        document = PostDocument.objects.create(**to_document_defaults(payload))
        return to_domain(document)

    def update(self, slug: str, payload: PostPayload) -> Post:
        document = PostDocument.objects.filter(slug=slug).first()
        if document is None:
            raise NotFoundError("Không tìm thấy bài viết.")

        for field, value in to_document_defaults(payload).items():
            setattr(document, field, value)
        if payload.published and document.published_at is None:
            document.published_at = timezone.now()
        if not payload.published:
            document.published_at = None
        document.save()
        return to_domain(document)

    def delete(self, slug: str) -> None:
        deleted, _ = PostDocument.objects.filter(slug=slug).delete()
        if not deleted:
            raise NotFoundError("Không tìm thấy bài viết.")
