from __future__ import annotations

from datetime import datetime
from uuid import uuid4

from django.contrib.auth.hashers import check_password
from django.utils import timezone

from modules.accounts.application.dto import AccountPayload
from modules.accounts.domain.entities import Account, AuthSession
from modules.accounts.infrastructure.persistence.mongo.documents import (
    AccountDocument,
    AccountSessionDocument,
)
from shared.exceptions import NotFoundError


def _to_account(document: AccountDocument) -> Account:
    return Account(
        id=str(document.id),
        full_name=document.full_name,
        email=document.email,
        phone=document.phone,
        role=document.role,
        preferred_language=document.preferred_language,
        is_active=document.is_active,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def _to_session(document: AccountSessionDocument) -> AuthSession:
    return AuthSession(
        id=str(document.id),
        account_id=document.account_id,
        token=document.token,
        expires_at=document.expires_at,
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


class MongoAccountRepository:
    def create(self, payload: AccountPayload, *, password_hash: str) -> Account:
        document = AccountDocument.objects.create(
            full_name=payload.full_name,
            email=payload.email,
            phone=payload.phone,
            password_hash=password_hash,
            role=payload.role,
            preferred_language=payload.preferred_language,
            is_active=payload.is_active,
        )
        return _to_account(document)

    def get_by_id(self, account_id: str) -> Account | None:
        document = AccountDocument.objects.filter(id=account_id).first()
        return _to_account(document) if document else None

    def get_by_email(self, email: str) -> Account | None:
        document = AccountDocument.objects.filter(email=email).first()
        return _to_account(document) if document else None

    def get_by_phone(self, phone: str) -> Account | None:
        document = AccountDocument.objects.filter(phone=phone).first()
        return _to_account(document) if document else None

    def list(self, *, role: str | None = None, is_active: bool | None = None) -> list[Account]:
        queryset = AccountDocument.objects.all()
        if role:
            queryset = queryset.filter(role=role)
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        return [_to_account(document) for document in queryset]

    def update(self, account: Account, *, password_hash: str | None = None) -> Account:
        document = AccountDocument.objects.filter(id=account.id).first()
        if document is None:
            raise NotFoundError("Khong tim thay tai khoan.")

        document.full_name = account.full_name
        document.email = account.email
        document.phone = account.phone
        document.role = account.role
        document.preferred_language = account.preferred_language
        document.is_active = account.is_active
        if password_hash:
            document.password_hash = password_hash
        document.save()
        return _to_account(document)

    def verify_password(self, account_id: str, raw_password: str) -> bool:
        document = AccountDocument.objects.filter(id=account_id).first()
        return bool(document and check_password(raw_password, document.password_hash))

    def create_session(self, *, account_id: str, expires_at: datetime) -> AuthSession:
        document = AccountSessionDocument.objects.create(
            account_id=account_id,
            token=uuid4().hex,
            expires_at=expires_at,
        )
        return _to_session(document)

    def revoke_session(self, token: str) -> None:
        document = AccountSessionDocument.objects.filter(token=token, revoked_at__isnull=True).first()
        if document is None:
            return
        document.revoked_at = timezone.now()
        document.save(update_fields=["revoked_at", "updated_at"])

    def get_by_token(self, token: str) -> Account | None:
        session = AccountSessionDocument.objects.filter(
            token=token,
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()
        if session is None:
            return None
        return self.get_by_id(session.account_id)

