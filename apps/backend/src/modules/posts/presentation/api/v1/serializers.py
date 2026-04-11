from __future__ import annotations

from rest_framework import serializers

from modules.posts.application.dto import PostPayload
from shared.html import sanitize_post_html


class PostReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    slug = serializers.CharField()
    title = serializers.CharField()
    excerpt = serializers.CharField()
    content = serializers.SerializerMethodField()
    cover_image = serializers.URLField()
    published = serializers.BooleanField()
    published_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)

    def get_content(self, obj) -> str:
        if isinstance(obj, dict):
            return sanitize_post_html(str(obj.get("content", "")))
        return sanitize_post_html(str(getattr(obj, "content", "")))


class PostWriteSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=140)
    title = serializers.CharField(max_length=220)
    excerpt = serializers.CharField(max_length=320)
    content = serializers.CharField()
    cover_image = serializers.URLField()
    published = serializers.BooleanField(default=True)

    def validate_content(self, value: str) -> str:
        return sanitize_post_html(value)

    def to_payload(self) -> PostPayload:
        data = self.validated_data
        return PostPayload(
            slug=data["slug"],
            title=data["title"],
            excerpt=data["excerpt"],
            content=data["content"],
            cover_image=data["cover_image"],
            published=data.get("published", True),
        )
