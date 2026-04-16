from __future__ import annotations

from django.contrib.auth.hashers import make_password


class DjangoPasswordHasher:
    def hash(self, raw_password: str) -> str:
        return make_password(raw_password)
