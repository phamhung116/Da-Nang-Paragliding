from __future__ import annotations

from rest_framework.throttling import ScopedRateThrottle, UserRateThrottle


def _account_ident(request) -> str:
    user = getattr(request, "user", None)
    if user and getattr(user, "is_authenticated", False):
        return str(getattr(user, "id", "") or getattr(user, "email", "") or "authenticated")
    return ""


class AccountUserRateThrottle(UserRateThrottle):
    def get_cache_key(self, request, view):
        ident = _account_ident(request)
        if not ident:
            return None
        return self.cache_format % {"scope": self.scope, "ident": ident}


class AccountScopedRateThrottle(ScopedRateThrottle):
    def get_cache_key(self, request, view):
        ident = _account_ident(request) or self.get_ident(request)
        return self.cache_format % {"scope": self.scope, "ident": ident}
