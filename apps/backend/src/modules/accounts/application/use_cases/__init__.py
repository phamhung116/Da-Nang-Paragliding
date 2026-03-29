from __future__ import annotations

from datetime import timedelta

from django.contrib.auth.hashers import make_password
from django.utils import timezone

from modules.accounts.application.dto import (
    AccountPayload,
    LoginRequest,
    ManagedAccountRequest,
    RegisterAccountRequest,
    UpdateProfileRequest,
)
from modules.accounts.domain.entities import Account
from modules.accounts.domain.repositories import AccountRepository
from modules.bookings.domain.repositories import BookingRepository
from shared.exceptions import NotFoundError, ValidationError
from shared.utils import normalize_phone

ROLE_ADMIN = "ADMIN"
ROLE_CUSTOMER = "CUSTOMER"
ROLE_PILOT = "PILOT"
MANAGEABLE_ROLES = {ROLE_ADMIN, ROLE_PILOT}
ALL_ROLES = {ROLE_ADMIN, ROLE_CUSTOMER, ROLE_PILOT}


def _normalize_email(email: str) -> str:
    return email.lower().strip()


def _ensure_unique_account(account_repository, *, email: str, phone: str, exclude_id: str | None = None):
    existing_by_email = account_repository.get_by_email(email)
    if existing_by_email and existing_by_email.id != exclude_id:
        raise ValidationError("Email da ton tai trong he thong.")

    existing_by_phone = account_repository.get_by_phone(phone)
    if existing_by_phone and existing_by_phone.id != exclude_id:
        raise ValidationError("So dien thoai da ton tai trong he thong.")


class RegisterCustomerUseCase:
    def __init__(self, account_repository: AccountRepository, session_ttl_hours: int) -> None:
        self.account_repository = account_repository
        self.session_ttl_hours = session_ttl_hours

    def execute(self, request: RegisterAccountRequest) -> dict[str, object]:
        email = _normalize_email(request.email)
        phone = normalize_phone(request.phone)
        _ensure_unique_account(self.account_repository, email=email, phone=phone)

        account = self.account_repository.create(
            AccountPayload(
                full_name=request.full_name.strip(),
                email=email,
                phone=phone,
                role=ROLE_CUSTOMER,
                preferred_language=request.preferred_language,
                is_active=True,
            ),
            password_hash=make_password(request.password),
        )
        session = self.account_repository.create_session(
            account_id=account.id or "",
            expires_at=timezone.now() + timedelta(hours=self.session_ttl_hours),
        )
        return {"account": account, "session": session}


class LoginUseCase:
    def __init__(self, account_repository: AccountRepository, session_ttl_hours: int) -> None:
        self.account_repository = account_repository
        self.session_ttl_hours = session_ttl_hours

    def execute(self, request: LoginRequest) -> dict[str, object]:
        account = self.account_repository.get_by_email(_normalize_email(request.email))
        if account is None or not self.account_repository.verify_password(account.id or "", request.password):
            raise ValidationError("Thong tin dang nhap khong hop le.")
        if not account.is_active:
            raise ValidationError("Tai khoan da bi vo hieu hoa.")

        session = self.account_repository.create_session(
            account_id=account.id or "",
            expires_at=timezone.now() + timedelta(hours=self.session_ttl_hours),
        )
        return {"account": account, "session": session}


class LogoutUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, token: str) -> None:
        self.account_repository.revoke_session(token)


class GetAccountByTokenUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, token: str) -> Account:
        account = self.account_repository.get_by_token(token)
        if account is None or not account.is_active:
            raise NotFoundError("Khong tim thay phien dang nhap hop le.")
        return account


class UpdateMyProfileUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, account_id: str, request: UpdateProfileRequest) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")

        next_full_name = request.full_name.strip() if request.full_name else account.full_name
        next_phone = normalize_phone(request.phone) if request.phone else account.phone
        next_language = request.preferred_language or account.preferred_language

        _ensure_unique_account(
            self.account_repository,
            email=account.email,
            phone=next_phone,
            exclude_id=account.id,
        )

        account.full_name = next_full_name
        account.phone = next_phone
        account.preferred_language = next_language
        return self.account_repository.update(account)


class ListMyBookingsUseCase:
    def __init__(self, booking_repository: BookingRepository) -> None:
        self.booking_repository = booking_repository

    def execute(self, email: str):
        return self.booking_repository.list_by_email(_normalize_email(email))


class ListAccountsUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, *, role: str | None = None, is_active: bool | None = None):
        if role and role not in ALL_ROLES:
            raise ValidationError("Role filter khong hop le.")
        return self.account_repository.list(role=role, is_active=is_active)


class CreateManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, request: ManagedAccountRequest) -> Account:
        if request.role not in MANAGEABLE_ROLES:
            raise ValidationError("Admin chi duoc tao Pilot hoac Admin.")
        email = _normalize_email(request.email)
        phone = normalize_phone(request.phone)
        _ensure_unique_account(self.account_repository, email=email, phone=phone)

        return self.account_repository.create(
            AccountPayload(
                full_name=request.full_name.strip(),
                email=email,
                phone=phone,
                role=request.role,
                preferred_language=request.preferred_language,
                is_active=request.is_active,
            ),
            password_hash=make_password(request.password or "ChangeMe123!"),
        )


class UpdateManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, account_id: str, request: ManagedAccountRequest) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        if request.role not in ALL_ROLES:
            raise ValidationError("Role khong hop le.")

        email = _normalize_email(request.email)
        phone = normalize_phone(request.phone)
        _ensure_unique_account(
            self.account_repository,
            email=email,
            phone=phone,
            exclude_id=account.id,
        )

        account.full_name = request.full_name.strip()
        account.email = email
        account.phone = phone
        account.role = request.role
        account.preferred_language = request.preferred_language
        account.is_active = request.is_active
        return self.account_repository.update(
            account,
            password_hash=make_password(request.password) if request.password else None,
        )


class DisableAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, account_id: str) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        account.is_active = False
        return self.account_repository.update(account)
