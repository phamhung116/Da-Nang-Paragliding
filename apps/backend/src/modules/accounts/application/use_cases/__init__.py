from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import sha1
from secrets import token_urlsafe

from modules.accounts.application.dto import (
    AccountPayload,
    ChangePasswordRequest,
    EmailAuthClaimRequest,
    EmailAuthStartRequest,
    LoginRequest,
    ManagedAccountRequest,
    RegisterAccountRequest,
    UpdateProfileRequest,
)
from modules.accounts.application.interfaces import (
    CustomerVerificationEmailGateway,
    PasswordHasher,
    VerificationEmailContext,
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


def _now_utc():
    return datetime.now(UTC)


class RegisterCustomerUseCase:
    def __init__(
        self,
        account_repository: AccountRepository,
        email_gateway: CustomerVerificationEmailGateway,
        password_hasher: PasswordHasher,
        *,
        customer_app_url: str,
        verification_token_ttl_hours: int,
    ) -> None:
        self.account_repository = account_repository
        self.email_gateway = email_gateway
        self.password_hasher = password_hasher
        self.customer_app_url = customer_app_url.rstrip("/")
        self.verification_token_ttl_hours = verification_token_ttl_hours

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
                email_verified=False,
            ),
            password_hash=self.password_hasher.hash(request.password),
        )

        token = token_urlsafe(36)
        self.account_repository.set_email_verification_token(
            account_id=account.id or "",
            token=token,
            sent_at=_now_utc(),
        )
        self.email_gateway.send_verification_email(
            VerificationEmailContext(
                account=account,
                verification_url=f"{self.customer_app_url}/verify-email?token={token}",
                expires_hours=self.verification_token_ttl_hours,
            )
        )

        return {"account": account, "email_verification_required": True}


class VerifyCustomerEmailUseCase:
    def __init__(
        self,
        account_repository: AccountRepository,
        *,
        session_ttl_hours: int,
        verification_token_ttl_hours: int,
    ) -> None:
        self.account_repository = account_repository
        self.session_ttl_hours = session_ttl_hours
        self.verification_token_ttl_hours = verification_token_ttl_hours

    def execute(self, token: str) -> dict[str, object]:
        account = self.account_repository.verify_email_by_token(
            token.strip(),
            expires_after=timedelta(hours=self.verification_token_ttl_hours),
        )
        if account is None:
            raise ValidationError("Link xac thuc email khong hop le hoac da het han.")

        session = self.account_repository.create_session(
            account_id=account.id or "",
            expires_at=_now_utc() + timedelta(hours=self.session_ttl_hours),
        )
        return {"account": account, "session": session}


class ResendCustomerVerificationEmailUseCase:
    def __init__(
        self,
        account_repository: AccountRepository,
        email_gateway: CustomerVerificationEmailGateway,
        *,
        customer_app_url: str,
        verification_token_ttl_hours: int,
    ) -> None:
        self.account_repository = account_repository
        self.email_gateway = email_gateway
        self.customer_app_url = customer_app_url.rstrip("/")
        self.verification_token_ttl_hours = verification_token_ttl_hours

    def execute(self, email: str) -> dict[str, bool]:
        account = self.account_repository.get_by_email(_normalize_email(email))
        if account is None or account.role != ROLE_CUSTOMER:
            return {"resent": True}

        token = token_urlsafe(36)
        self.account_repository.set_email_verification_token(
            account_id=account.id or "",
            token=token,
            sent_at=_now_utc(),
        )
        self.email_gateway.send_verification_email(
            VerificationEmailContext(
                account=account,
                verification_url=f"{self.customer_app_url}/verify-email?token={token}",
                expires_hours=self.verification_token_ttl_hours,
            )
        )
        return {"resent": True}


class StartCustomerEmailAuthUseCase:
    def __init__(
        self,
        account_repository: AccountRepository,
        email_gateway: CustomerVerificationEmailGateway,
        password_hasher: PasswordHasher,
        *,
        customer_app_url: str,
        verification_token_ttl_hours: int,
    ) -> None:
        self.account_repository = account_repository
        self.email_gateway = email_gateway
        self.password_hasher = password_hasher
        self.customer_app_url = customer_app_url.rstrip("/")
        self.verification_token_ttl_hours = verification_token_ttl_hours

    def execute(self, request: EmailAuthStartRequest) -> dict[str, object]:
        email = _normalize_email(request.email)
        account = self.account_repository.get_by_email(email)
        if account is None:
            account = self.account_repository.create(
                AccountPayload(
                    full_name=email.split("@")[0].replace(".", " ").title() or "SkyNest Customer",
                    email=email,
                    phone=self._placeholder_phone(email),
                    role=ROLE_CUSTOMER,
                    preferred_language="vi",
                    is_active=True,
                    email_verified=False,
                ),
                password_hash=self.password_hasher.hash(token_urlsafe(24)),
            )
        elif account.role != ROLE_CUSTOMER or not account.is_active:
            return {"sent": True}

        token = token_urlsafe(36)
        poll_token = token_urlsafe(36)
        sent_at = _now_utc()
        self.account_repository.set_email_verification_token(
            account_id=account.id or "",
            token=token,
            sent_at=sent_at,
            poll_token=poll_token,
            poll_expires_at=sent_at + timedelta(hours=self.verification_token_ttl_hours),
        )
        self.email_gateway.send_verification_email(
            VerificationEmailContext(
                account=account,
                verification_url=f"{self.customer_app_url}/verify-email?token={token}",
                expires_hours=self.verification_token_ttl_hours,
            )
        )
        return {"sent": True, "poll_token": poll_token}

    def _placeholder_phone(self, email: str) -> str:
        return f"EMAIL{sha1(email.encode('utf-8')).hexdigest()[:12].upper()}"


class ClaimCustomerEmailAuthSessionUseCase:
    def __init__(self, account_repository: AccountRepository, *, session_ttl_hours: int) -> None:
        self.account_repository = account_repository
        self.session_ttl_hours = session_ttl_hours

    def execute(self, request: EmailAuthClaimRequest) -> dict[str, object] | None:
        poll_token = request.poll_token.strip()
        if not poll_token:
            return None
        account = self.account_repository.get_verified_email_poll_account(poll_token)
        if account is None or account.role != ROLE_CUSTOMER or not account.is_active:
            return None
        session = self.account_repository.create_session(
            account_id=account.id or "",
            expires_at=_now_utc() + timedelta(hours=self.session_ttl_hours),
        )
        self.account_repository.clear_email_poll_token(poll_token)
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
        if account.role == ROLE_CUSTOMER and not account.email_verified:
            raise ValidationError("Email chua duoc xac thuc. Vui long kiem tra hop thu va bam link xac thuc.")

        session = self.account_repository.create_session(
            account_id=account.id or "",
            expires_at=_now_utc() + timedelta(hours=self.session_ttl_hours),
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


class ChangeMyPasswordUseCase:
    def __init__(self, account_repository: AccountRepository, password_hasher: PasswordHasher) -> None:
        self.account_repository = account_repository
        self.password_hasher = password_hasher

    def execute(self, account_id: str, request: ChangePasswordRequest) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        if not self.account_repository.verify_password(account.id or "", request.current_password):
            raise ValidationError("Mat khau hien tai khong dung.")
        return self.account_repository.update(
            account,
            password_hash=self.password_hasher.hash(request.new_password),
        )


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


class GetManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, account_id: str) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        return account


class CreateManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository, password_hasher: PasswordHasher) -> None:
        self.account_repository = account_repository
        self.password_hasher = password_hasher

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
                is_active=True,
                email_verified=True,
            ),
            password_hash=self.password_hasher.hash(request.password or "ChangeMe123!"),
        )


class UpdateManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository, password_hasher: PasswordHasher) -> None:
        self.account_repository = account_repository
        self.password_hasher = password_hasher

    def execute(self, account_id: str, request: ManagedAccountRequest) -> Account:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        if account.role == ROLE_CUSTOMER:
            raise ValidationError("Khong the sua thong tin account customer tu admin.")
        if account.role == ROLE_PILOT and request.password:
            raise ValidationError("Admin khong duoc thay doi mat khau account pilot.")
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
        return self.account_repository.update(
            account,
            password_hash=self.password_hasher.hash(request.password) if request.password else None,
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


class DeleteManagedAccountUseCase:
    def __init__(self, account_repository: AccountRepository) -> None:
        self.account_repository = account_repository

    def execute(self, account_id: str) -> None:
        account = self.account_repository.get_by_id(account_id)
        if account is None:
            raise NotFoundError("Khong tim thay tai khoan.")
        if account.role == ROLE_CUSTOMER:
            raise ValidationError("Khong the xoa account customer tu admin.")
        self.account_repository.delete(account_id)
