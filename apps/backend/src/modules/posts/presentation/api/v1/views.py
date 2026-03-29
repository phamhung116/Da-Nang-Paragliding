from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import (
    create_post_use_case,
    delete_post_use_case,
    get_post_use_case,
    list_posts_use_case,
    update_post_use_case,
)
from modules.posts.presentation.api.v1.serializers import PostReadSerializer, PostWriteSerializer
from shared.auth import BearerTokenAuthentication, IsAdminAccount
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.utils import serialize_entity


class PublicPostListApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        posts = list_posts_use_case().execute(published_only=True)
        return success(PostReadSerializer(serialize_entity(posts), many=True).data)


class PublicPostDetailApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, slug: str):
        try:
            post = get_post_use_case().execute(slug)
            if not post.published:
                return error("Khong tim thay bai viet.", status.HTTP_404_NOT_FOUND)
            return success(PostReadSerializer(serialize_entity(post)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)


class AdminPostListCreateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request):
        posts = list_posts_use_case().execute(published_only=False)
        return success(PostReadSerializer(serialize_entity(posts), many=True).data)

    def post(self, request):
        serializer = PostWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        post = create_post_use_case().execute(serializer.to_payload())
        return success(PostReadSerializer(serialize_entity(post)).data, status.HTTP_201_CREATED)


class AdminPostDetailApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request, slug: str):
        try:
            post = get_post_use_case().execute(slug)
            return success(PostReadSerializer(serialize_entity(post)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)

    def patch(self, request, slug: str):
        serializer = PostWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            post = update_post_use_case().execute(slug, serializer.to_payload())
            return success(PostReadSerializer(serialize_entity(post)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)

    def delete(self, request, slug: str):
        try:
            delete_post_use_case().execute(slug)
            return success({"slug": slug})
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)
