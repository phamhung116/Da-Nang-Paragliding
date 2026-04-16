from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime


@dataclass(slots=True)
class Account:
    id: str | None
    full_name: str
    email: str
    phone: str
    role: str
    preferred_language: str
    is_active: bool
    email_verified: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    @property
    def is_authenticated(self) -> bool:
        return True


@dataclass(slots=True)
class AuthSession:
    id: str | None
    account_id: str
    token: str
    expires_at: datetime
    created_at: datetime | None = None
    updated_at: datetime | None = None
