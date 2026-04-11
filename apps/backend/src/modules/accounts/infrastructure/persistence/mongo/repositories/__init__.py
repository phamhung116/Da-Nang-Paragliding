from __future__ import annotations

from datetime import datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe

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
        email_verified=getattr(document, "email_verified", True),
        created_at=document.created_at,
        updated_at=document.updated_at,
    )


def _hash_token(token: str) -> str:
    return sha256(token.encode("utf-8")).hexdigest()


def _token_lookup_values(token: str) -> list[str]:
    return [_hash_token(token), token]


def _to_session(document: AccountSessionDocument, *, token: str | None = None) -> AuthSession:
    return AuthSession(
        id=str(document.id),
        account_id=document.account_id,
        token=token or document.token,
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
            email_verified=payload.email_verified,
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
        document.email_verified = account.email_verified
        if password_hash:
            document.password_hash = password_hash
        document.save()
        return _to_account(document)

    def delete(self, account_id: str) -> None:
        document = AccountDocument.objects.filter(id=account_id).first()
        if document is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        AccountSessionDocument.objects.filter(account_id=account_id).delete()
        document.delete()

    def verify_password(self, account_id: str, raw_password: str) -> bool:
        document = AccountDocument.objects.filter(id=account_id).first()
        return bool(document and check_password(raw_password, document.password_hash))

    def create_session(self, *, account_id: str, expires_at: datetime) -> AuthSession:
        token = token_urlsafe(32)
        document = AccountSessionDocument.objects.create(
            account_id=account_id,
            token=_hash_token(token),
            expires_at=expires_at,
        )
        return _to_session(document, token=token)

    def revoke_session(self, token: str) -> None:
        document = AccountSessionDocument.objects.filter(
            token__in=_token_lookup_values(token),
            revoked_at__isnull=True,
        ).first()
        if document is None:
            return
        document.revoked_at = timezone.now()
        document.save(update_fields=["revoked_at", "updated_at"])

    def get_by_token(self, token: str) -> Account | None:
        session = AccountSessionDocument.objects.filter(
            token__in=_token_lookup_values(token),
            revoked_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).first()
        if session is None:
            return None
        return self.get_by_id(session.account_id)

    def set_email_verification_token(
        self,
        *,
        account_id: str,
        token: str,
        sent_at: datetime,
        poll_token: str | None = None,
        poll_expires_at: datetime | None = None,
    ) -> None:
        document = AccountDocument.objects.filter(id=account_id).first()
        if document is None:
            raise NotFoundError("Khong tim thay tai khoan.")

        document.email_verified = False
        document.email_verified_at = None
        document.email_verification_token = _hash_token(token)
        document.email_verification_sent_at = sent_at
        document.email_login_poll_token = _hash_token(poll_token) if poll_token else None
        document.email_login_poll_expires_at = poll_expires_at
        document.email_login_poll_verified_at = None
        document.save()

    def verify_email_by_token(self, token: str, *, expires_after: timedelta) -> Account | None:
        document = AccountDocument.objects.filter(
            email_verification_token__in=_token_lookup_values(token),
            email_verified=False,
            is_active=True,
        ).first()
        if document is None or document.email_verification_sent_at is None:
            return None

        if document.email_verification_sent_at < timezone.now() - expires_after:
            return None

        document.email_verified = True
        document.email_verified_at = timezone.now()
        document.email_login_poll_verified_at = timezone.now() if document.email_login_poll_token else None
        document.email_verification_token = None
        document.email_verification_sent_at = None
        document.save()
        return _to_account(document)

    def get_verified_email_poll_account(self, poll_token: str) -> Account | None:
        document = AccountDocument.objects.filter(
            email_login_poll_token__in=_token_lookup_values(poll_token),
            email_login_poll_verified_at__isnull=False,
            email_login_poll_expires_at__gt=timezone.now(),
            is_active=True,
        ).first()
        return _to_account(document) if document else None

    def clear_email_poll_token(self, poll_token: str) -> None:
        document = AccountDocument.objects.filter(email_login_poll_token__in=_token_lookup_values(poll_token)).first()
        if document is None:
            return
        document.email_login_poll_token = None
        document.email_login_poll_expires_at = None
        document.email_login_poll_verified_at = None
        document.save(update_fields=["email_login_poll_token", "email_login_poll_expires_at", "email_login_poll_verified_at", "updated_at"])
