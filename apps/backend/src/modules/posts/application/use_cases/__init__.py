from __future__ import annotations

from modules.posts.application.dto import PostPayload
from modules.posts.domain.repositories import PostRepository
from shared.exceptions import NotFoundError


class ListPostsUseCase:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository

    def execute(self, *, published_only: bool = True):
        return self.repository.list(published_only=published_only)


class GetPostUseCase:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository

    def execute(self, slug: str):
        post = self.repository.get_by_slug(slug)
        if post is None:
            raise NotFoundError("Không tìm thấy bài viết.")
        return post


class CreatePostUseCase:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository

    def execute(self, payload: PostPayload):
        return self.repository.create(payload)


class UpdatePostUseCase:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository

    def execute(self, slug: str, payload: PostPayload):
        return self.repository.update(slug, payload)


class DeletePostUseCase:
    def __init__(self, repository: PostRepository) -> None:
        self.repository = repository

    def execute(self, slug: str) -> None:
        self.repository.delete(slug)
