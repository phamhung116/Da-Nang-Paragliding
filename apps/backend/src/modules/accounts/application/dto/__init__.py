from __future__ import annotations

from dataclasses import dataclass

from modules.accounts.domain.payloads import AccountPayload


@dataclass(slots=True)
class RegisterAccountRequest:
    full_name: str
    email: str
    phone: str
    password: str
    preferred_language: str


@dataclass(slots=True)
class LoginRequest:
    email: str
    password: str


@dataclass(slots=True)
class UpdateProfileRequest:
    full_name: str | None = None
    phone: str | None = None
    preferred_language: str | None = None


@dataclass(slots=True)
class ManagedAccountRequest:
    full_name: str
    email: str
    phone: str
    password: str | None
    role: str
    preferred_language: str
    is_active: bool


@dataclass(slots=True)
class EmailAuthStartRequest:
    email: str


@dataclass(slots=True)
class EmailAuthClaimRequest:
    poll_token: str


@dataclass(slots=True)
class ChangePasswordRequest:
    current_password: str
    new_password: str
