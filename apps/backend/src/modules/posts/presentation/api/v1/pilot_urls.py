from django.urls import path

from modules.posts.presentation.api.v1.views import PublicPostDetailApi, PublicPostListApi

urlpatterns = [
    path("posts/", PublicPostListApi.as_view(), name="pilot-post-list"),
    path("posts/<slug:slug>/", PublicPostDetailApi.as_view(), name="pilot-post-detail"),
]
