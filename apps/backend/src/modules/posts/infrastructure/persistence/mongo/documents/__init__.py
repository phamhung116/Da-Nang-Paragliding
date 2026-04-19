from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class PostDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    slug = models.SlugField(max_length=140, unique=True)
    title = models.CharField(max_length=220)
    excerpt = models.CharField(max_length=320)
    content = models.TextField()
    cover_image = models.TextField()
    published = models.BooleanField(default=True, db_index=True)
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "posts"
        ordering = ["-published_at", "-created_at"]

    def __str__(self) -> str:
        return self.title
