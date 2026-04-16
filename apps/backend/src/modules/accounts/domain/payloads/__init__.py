from __future__ import annotations

from dataclasses import dataclass


@dataclass(slots=True)
class AccountPayload:
    full_name: str
    email: str
    phone: str
    role: str
    preferred_language: str
    is_active: bool
    email_verified: bool
