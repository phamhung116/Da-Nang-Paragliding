from __future__ import annotations

from django.utils import timezone

from modules.posts.application.dto import PostPayload
from modules.posts.domain.entities import Post


def to_domain(document) -> Post:
    return Post(
        id=str(document.id),
        slug=document.slug,
        title=document.title,
        title_en=getattr(document, "title_en", ""),
        excerpt=document.excerpt,
        excerpt_en=getattr(document, "excerpt_en", ""),
        content=document.content,
        content_en=getattr(document, "content_en", ""),
        cover_image=document.cover_image,
        published=document.published,
        published_at=document.published_at,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def to_document_defaults(payload: PostPayload) -> dict[str, object]:
    return {
        "slug": payload.slug,
        "title": payload.title,
        "title_en": payload.title_en,
        "excerpt": payload.excerpt,
        "excerpt_en": payload.excerpt_en,
        "content": payload.content,
        "content_en": payload.content_en,
        "cover_image": payload.cover_image,
        "published": payload.published,
        "published_at": timezone.now() if payload.published else None,
    }
