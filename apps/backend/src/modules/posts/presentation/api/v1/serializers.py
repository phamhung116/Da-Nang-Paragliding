from __future__ import annotations

from rest_framework import serializers

from modules.posts.application.dto import PostPayload
from shared.html import sanitize_post_html
from shared.media import validate_image_source


class PostReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    slug = serializers.CharField()
    title = serializers.CharField()
    title_en = serializers.CharField()
    excerpt = serializers.CharField()
    excerpt_en = serializers.CharField()
    content = serializers.SerializerMethodField()
    content_en = serializers.SerializerMethodField()
    cover_image = serializers.CharField()
    published = serializers.BooleanField()
    published_at = serializers.DateTimeField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)

    def get_content(self, obj) -> str:
        if isinstance(obj, dict):
            return sanitize_post_html(str(obj.get("content", "")))
        return sanitize_post_html(str(getattr(obj, "content", "")))

    def get_content_en(self, obj) -> str:
        if isinstance(obj, dict):
            return sanitize_post_html(str(obj.get("content_en", "")))
        return sanitize_post_html(str(getattr(obj, "content_en", "")))


class PostWriteSerializer(serializers.Serializer):
    slug = serializers.SlugField(max_length=140)
    title = serializers.CharField(max_length=220)
    title_en = serializers.CharField(max_length=220, required=False, allow_blank=True)
    excerpt = serializers.CharField()
    excerpt_en = serializers.CharField(required=False, allow_blank=True)
    content = serializers.CharField()
    content_en = serializers.CharField(required=False, allow_blank=True)
    cover_image = serializers.CharField()
    published = serializers.BooleanField(default=True)

    def validate_content(self, value: str) -> str:
        return sanitize_post_html(value)

    def validate_content_en(self, value: str) -> str:
        return sanitize_post_html(value)

    def validate_cover_image(self, value: str) -> str:
        return validate_image_source(value)

    def to_payload(self) -> PostPayload:
        data = self.validated_data
        title = data["title"].strip()
        excerpt = data["excerpt"].strip()
        content = data["content"]
        return PostPayload(
            slug=data["slug"],
            title=title,
            title_en=str(data.get("title_en") or title).strip(),
            excerpt=excerpt,
            excerpt_en=str(data.get("excerpt_en") or excerpt).strip(),
            content=content,
            content_en=str(data.get("content_en") or content),
            cover_image=data["cover_image"],
            published=data.get("published", True),
        )
