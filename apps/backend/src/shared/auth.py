from __future__ import annotations

from rest_framework import authentication, exceptions, permissions


class BearerTokenAuthentication(authentication.BaseAuthentication):
    keyword = "Bearer"

    def authenticate(self, request):
        header = authentication.get_authorization_header(request).decode("utf-8")
        if not header:
            return None

        parts = header.split(" ", 1)
        if len(parts) != 2 or parts[0] != self.keyword:
            return None

        token = parts[1].strip()
        if not token:
            raise exceptions.AuthenticationFailed("Token không hợp lệ.")

        from config.containers import get_account_by_token_use_case

        try:
            account = get_account_by_token_use_case().execute(token)
        except Exception as exc:  # noqa: BLE001
            raise exceptions.AuthenticationFailed(str(exc)) from exc
        return (account, token)


class IsAuthenticatedAccount(permissions.BasePermission):
    message = "Bạn cần đăng nhập để thực hiện thao tác này."

    def has_permission(self, request, view) -> bool:
        return bool(getattr(request, "user", None) and getattr(request.user, "is_authenticated", False))


class HasAccountRole(permissions.BasePermission):
    required_role = ""
    message = "Bạn không đủ quyền truy cập tài nguyên này."

    def has_permission(self, request, view) -> bool:
        user = getattr(request, "user", None)
        return bool(
            user
            and getattr(user, "is_authenticated", False)
            and getattr(user, "role", None) == self.required_role
        )


class IsAdminAccount(HasAccountRole):
    required_role = "ADMIN"


class IsPilotAccount(HasAccountRole):
    required_role = "PILOT"
