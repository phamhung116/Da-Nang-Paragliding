from __future__ import annotations

import re

from rest_framework import serializers

from modules.accounts.application.dto import (
    ChangePasswordRequest,
    EmailAuthClaimRequest,
    EmailAuthStartRequest,
    LoginRequest,
    ManagedAccountRequest,
    RegisterAccountRequest,
    UpdateProfileRequest,
)
from shared.utils import normalize_phone

PASSWORD_COMPLEXITY_MESSAGE = (
    "Mat khau phai co it nhat 8 ky tu, bao gom chu hoa, chu thuong, so va ky tu dac biet."
)


def _validate_full_name(value: str) -> str:
    normalized = value.strip()
    if len(normalized) < 2:
        raise serializers.ValidationError("Ho ten phai co it nhat 2 ky tu.")
    return normalized


def _validate_phone(value: str) -> str:
    normalized = normalize_phone(value)
    digits_only = normalized.replace("+", "")
    if len(digits_only) < 9 or len(digits_only) > 15:
        raise serializers.ValidationError("So dien thoai khong hop le.")
    return normalized


def _validate_password(value: str) -> str:
    if (
        len(value) < 8
        or not re.search(r"[A-Z]", value)
        or not re.search(r"[a-z]", value)
        or not re.search(r"\d", value)
        or not re.search(r"[^A-Za-z0-9]", value)
    ):
        raise serializers.ValidationError(PASSWORD_COMPLEXITY_MESSAGE)
    return value


class AccountReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    full_name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField()
    role = serializers.CharField()
    preferred_language = serializers.CharField()
    is_active = serializers.BooleanField()
    email_verified = serializers.BooleanField()
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class AuthSessionSerializer(serializers.Serializer):
    token = serializers.CharField()
    expires_at = serializers.DateTimeField()


class RegisterAccountSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, max_length=128)
    preferred_language = serializers.ChoiceField(choices=["vi", "en"], default="vi")

    def validate_full_name(self, value: str) -> str:
        return _validate_full_name(value)

    def validate_phone(self, value: str) -> str:
        return _validate_phone(value)

    def validate_password(self, value: str) -> str:
        return _validate_password(value)

    def to_request(self) -> RegisterAccountRequest:
        return RegisterAccountRequest(
            full_name=self.validated_data["full_name"],
            email=self.validated_data["email"],
            phone=self.validated_data["phone"],
            password=self.validated_data["password"],
            preferred_language=self.validated_data["preferred_language"],
        )


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(min_length=8, max_length=128)

    def to_request(self) -> LoginRequest:
        return LoginRequest(
            email=self.validated_data["email"],
            password=self.validated_data["password"],
        )


class VerifyEmailSerializer(serializers.Serializer):
    token = serializers.CharField(max_length=160)


class ResendVerificationEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()


class EmailAuthStartSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def to_request(self) -> EmailAuthStartRequest:
        return EmailAuthStartRequest(email=self.validated_data["email"])


class EmailAuthClaimSerializer(serializers.Serializer):
    poll_token = serializers.CharField(max_length=160)

    def to_request(self) -> EmailAuthClaimRequest:
        return EmailAuthClaimRequest(poll_token=self.validated_data["poll_token"])


class UpdateProfileSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120, required=False)
    phone = serializers.CharField(max_length=20, required=False)
    preferred_language = serializers.ChoiceField(choices=["vi", "en"], required=False)

    def validate_full_name(self, value: str) -> str:
        return _validate_full_name(value)

    def validate_phone(self, value: str) -> str:
        return _validate_phone(value)

    def to_request(self) -> UpdateProfileRequest:
        return UpdateProfileRequest(
            full_name=self.validated_data.get("full_name"),
            phone=self.validated_data.get("phone"),
            preferred_language=self.validated_data.get("preferred_language"),
        )


class ManagedAccountSerializer(serializers.Serializer):
    full_name = serializers.CharField(max_length=120)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=20)
    password = serializers.CharField(min_length=8, max_length=128, required=False, allow_blank=True)
    role = serializers.ChoiceField(choices=["ADMIN", "PILOT", "CUSTOMER"])
    preferred_language = serializers.ChoiceField(choices=["vi", "en"], default="vi")
    is_active = serializers.BooleanField(default=True)

    def validate_full_name(self, value: str) -> str:
        return _validate_full_name(value)

    def validate_phone(self, value: str) -> str:
        return _validate_phone(value)

    def validate_password(self, value: str) -> str:
        if value == "":
            return value
        return _validate_password(value)

    def to_request(self) -> ManagedAccountRequest:
        return ManagedAccountRequest(
            full_name=self.validated_data["full_name"],
            email=self.validated_data["email"],
            phone=self.validated_data["phone"],
            password=self.validated_data.get("password") or None,
            role=self.validated_data["role"],
            preferred_language=self.validated_data["preferred_language"],
            is_active=self.validated_data["is_active"],
        )


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(min_length=8, max_length=128)
    new_password = serializers.CharField(min_length=8, max_length=128)

    def validate_new_password(self, value: str) -> str:
        return _validate_password(value)

    def to_request(self) -> ChangePasswordRequest:
        return ChangePasswordRequest(
            current_password=self.validated_data["current_password"],
            new_password=self.validated_data["new_password"],
        )
