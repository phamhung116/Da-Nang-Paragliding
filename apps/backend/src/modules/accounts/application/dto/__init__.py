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

