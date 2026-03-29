from django.urls import path

from modules.posts.presentation.api.v1.views import AdminPostDetailApi, AdminPostListCreateApi

urlpatterns = [
    path("posts/", AdminPostListCreateApi.as_view(), name="admin-post-list"),
    path("posts/<slug:slug>/", AdminPostDetailApi.as_view(), name="admin-post-detail"),
]
