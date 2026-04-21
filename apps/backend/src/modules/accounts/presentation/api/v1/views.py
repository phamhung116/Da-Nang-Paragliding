from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import (
    change_my_password_use_case,
    claim_customer_email_auth_session_use_case,
    create_managed_account_use_case,
    delete_managed_account_use_case,
    disable_account_use_case,
    get_managed_account_use_case,
    list_accounts_use_case,
    list_my_bookings_use_case,
    login_use_case,
    logout_use_case,
    register_customer_use_case,
    resend_customer_verification_email_use_case,
    start_customer_email_auth_use_case,
    update_managed_account_use_case,
    update_my_profile_use_case,
    verify_customer_email_use_case,
)
from modules.accounts.presentation.api.v1.serializers import (
    AccountReadSerializer,
    AuthSessionSerializer,
    EmailAuthClaimSerializer,
    ChangePasswordSerializer,
    EmailAuthStartSerializer,
    LoginSerializer,
    ManagedAccountSerializer,
    RegisterAccountSerializer,
    ResendVerificationEmailSerializer,
    UpdateProfileSerializer,
    VerifyEmailSerializer,
)
from modules.bookings.presentation.api.v1.serializers import BookingReadSerializer
from shared.auth import BearerTokenAuthentication, IsAdminAccount, IsAuthenticatedAccount
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.throttling import AccountScopedRateThrottle
from shared.utils import serialize_entity


class RegisterAccountApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = register_customer_use_case().execute(serializer.to_request())
            return success(
                {
                    "account": AccountReadSerializer(serialize_entity(result["account"])).data,
                    "email_verification_required": result["email_verification_required"],
                    "message": "Tai khoan da duoc tao. Vui long kiem tra email de xac thuc truoc khi dang nhap.",
                },
                status.HTTP_201_CREATED,
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class VerifyEmailApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = verify_customer_email_use_case().execute(serializer.validated_data["token"])
            return success(
                {
                    "account": AccountReadSerializer(serialize_entity(result["account"])).data,
                    "session": AuthSessionSerializer(serialize_entity(result["session"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class ResendVerificationEmailApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = ResendVerificationEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = resend_customer_verification_email_use_case().execute(serializer.validated_data["email"])
            return success(
                {
                    "resent": result["resent"],
                    "message": "Neu email nay can xac thuc, he thong da gui lai link moi.",
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class StartEmailAuthApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = EmailAuthStartSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = start_customer_email_auth_use_case().execute(serializer.to_request())
            return success(
                {
                    "sent": result["sent"],
                    "poll_token": result.get("poll_token"),
                    "message": "Neu email hop le, he thong da gui link xac thuc dang nhap.",
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class ClaimEmailAuthApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = EmailAuthClaimSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = claim_customer_email_auth_session_use_case().execute(serializer.to_request())
            if result is None:
                return success({"ready": False})
            return success(
                {
                    "ready": True,
                    "account": AccountReadSerializer(serialize_entity(result["account"])).data,
                    "session": AuthSessionSerializer(serialize_entity(result["session"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class LoginApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            result = login_use_case().execute(serializer.to_request())
            return success(
                {
                    "account": AccountReadSerializer(serialize_entity(result["account"])).data,
                    "session": AuthSessionSerializer(serialize_entity(result["session"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class LogoutApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def post(self, request):
        logout_use_case().execute(str(request.auth or ""))
        return success({"logged_out": True})


class MeApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def get(self, request):
        return success(AccountReadSerializer(serialize_entity(request.user)).data)

    def patch(self, request):
        serializer = UpdateProfileSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            account = update_my_profile_use_case().execute(request.user.id, serializer.to_request())
            return success(AccountReadSerializer(serialize_entity(account)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class MyPasswordApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            account = change_my_password_use_case().execute(request.user.id, serializer.to_request())
            return success(AccountReadSerializer(serialize_entity(account)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class MyBookingHistoryApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def get(self, request):
        bookings = list_my_bookings_use_case().execute(request.user.email)
        return success(BookingReadSerializer(serialize_entity(bookings), many=True).data)


class AdminAccountListCreateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request):
        role = request.query_params.get("role") or None
        active_param = request.query_params.get("active")
        is_active = None if active_param is None else active_param.lower() == "true"
        try:
            accounts = list_accounts_use_case().execute(role=role, is_active=is_active)
            return success(AccountReadSerializer(serialize_entity(accounts), many=True).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        serializer = ManagedAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            account = create_managed_account_use_case().execute(serializer.to_request())
            return success(AccountReadSerializer(serialize_entity(account)).data, status.HTTP_201_CREATED)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class AdminAccountDetailApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request, account_id: str):
        try:
            account = get_managed_account_use_case().execute(account_id)
            return success(AccountReadSerializer(serialize_entity(account)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)

    def patch(self, request, account_id: str):
        serializer = ManagedAccountSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            account = update_managed_account_use_case().execute(account_id, serializer.to_request())
            return success(AccountReadSerializer(serialize_entity(account)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)

    def delete(self, request, account_id: str):
        if account_id == request.user.id:
            return error("Khong the xoa tai khoan dang dang nhap.", status.HTTP_400_BAD_REQUEST)
        try:
            delete_managed_account_use_case().execute(account_id)
            return success({"id": account_id})
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class AdminAccountDisableApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def post(self, request, account_id: str):
        try:
            account = disable_account_use_case().execute(account_id)
            return success(AccountReadSerializer(serialize_entity(account)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)
