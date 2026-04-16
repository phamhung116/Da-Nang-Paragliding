from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class PostPayload:
    slug: str
    title: str
    excerpt: str
    content: str
    cover_image: str
    published: bool
