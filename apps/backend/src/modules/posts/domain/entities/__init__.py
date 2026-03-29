from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class Post:
    id: str | None
    slug: str
    title: str
    excerpt: str
    content: str
    cover_image: str
    published: bool
    published_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
