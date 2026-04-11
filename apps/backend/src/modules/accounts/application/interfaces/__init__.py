from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from modules.accounts.domain.entities import Account


@dataclass(slots=True)
class VerificationEmailContext:
    account: Account
    verification_url: str
    expires_hours: int


class CustomerVerificationEmailGateway(Protocol):
    def send_verification_email(self, context: VerificationEmailContext) -> None: ...


class PasswordHasher(Protocol):
    def hash(self, raw_password: str) -> str: ...
