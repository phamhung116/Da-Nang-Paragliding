from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class PostPayload:
    slug: str
    title: str
    title_en: str
    excerpt: str
    excerpt_en: str
    content: str
    content_en: str
    cover_image: str
    published: bool
