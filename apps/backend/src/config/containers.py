from __future__ import annotations

from django.conf import settings

from modules.accounts.application.use_cases import (
    ChangeMyPasswordUseCase,
    ClaimCustomerEmailAuthSessionUseCase,
    CreateManagedAccountUseCase,
    DeleteManagedAccountUseCase,
    DisableAccountUseCase,
    GetManagedAccountUseCase,
    GetAccountByTokenUseCase,
    ListAccountsUseCase,
    ListMyBookingsUseCase,
    LoginUseCase,
    LogoutUseCase,
    RegisterCustomerUseCase,
    ResendCustomerVerificationEmailUseCase,
    StartCustomerEmailAuthUseCase,
    UpdateManagedAccountUseCase,
    UpdateMyProfileUseCase,
    VerifyCustomerEmailUseCase,
)
from modules.accounts.infrastructure.email.gateways import CustomerEmailGateway
from modules.accounts.infrastructure.persistence.mongo.repositories import MongoAccountRepository
from modules.accounts.infrastructure.security import DjangoPasswordHasher
from modules.availability.application.use_cases import GetMonthlyAvailabilityUseCase
from modules.availability.infrastructure.persistence.mongo.repositories import (
    MongoAvailabilityRepository,
)
from modules.bookings.application.use_cases import (
    AssignPilotUseCase,
    CancelBookingUseCase,
    CreateBookingUseCase,
    GetBookingUseCase,
    ListBookingRequestsUseCase,
    ListConfirmedBookingsUseCase,
    ListPilotFlightsUseCase,
    LookupBookingsByPhoneUseCase,
    ReviewBookingUseCase,
)
from modules.bookings.domain.services import PricingPolicy
from modules.bookings.infrastructure.persistence.mongo.repositories import MongoBookingRepository
from modules.catalog.application.use_cases import (
    CreateServicePackageUseCase,
    DeleteServicePackageUseCase,
    GetServicePackageUseCase,
    ListServicePackagesUseCase,
    UpdateServicePackageUseCase,
)
from modules.catalog.infrastructure.persistence.mongo.repositories import (
    MongoServicePackageRepository,
)
from modules.notifications.infrastructure.gateways import ConsoleNotificationGateway
from modules.notifications.infrastructure.persistence.mongo.repositories import (
    MongoNotificationLogRepository,
)
from modules.payments.application.use_cases import CompleteOnlinePaymentUseCase
from modules.payments.infrastructure.gateways import MockPaymentGateway, PayOsPaymentGateway
from modules.payments.infrastructure.persistence.mongo.repositories import (
    MongoPaymentTransactionRepository,
)
from modules.posts.application.use_cases import (
    CreatePostUseCase,
    DeletePostUseCase,
    GetPostUseCase,
    ListPostsUseCase,
    UpdatePostUseCase,
)
from modules.posts.infrastructure.persistence.mongo.repositories import MongoPostRepository
from modules.tracking.application.use_cases import (
    AppendPilotTrackingPointUseCase,
    GetTrackingByPhoneUseCase,
    StartPilotTrackingUseCase,
    StopPilotTrackingUseCase,
    UpdatePilotFlightStatusUseCase,
    UpdateFlightStatusUseCase,
)
from modules.tracking.infrastructure.persistence.mongo.repositories import MongoTrackingRepository


def service_package_repository() -> MongoServicePackageRepository:
    return MongoServicePackageRepository()


def account_repository() -> MongoAccountRepository:
    return MongoAccountRepository()


def availability_repository() -> MongoAvailabilityRepository:
    return MongoAvailabilityRepository()


def booking_repository() -> MongoBookingRepository:
    return MongoBookingRepository()


def payment_transaction_repository() -> MongoPaymentTransactionRepository:
    return MongoPaymentTransactionRepository()


def post_repository() -> MongoPostRepository:
    return MongoPostRepository()


def tracking_repository() -> MongoTrackingRepository:
    return MongoTrackingRepository()


def notification_log_repository() -> MongoNotificationLogRepository:
    return MongoNotificationLogRepository()


def pricing_policy() -> PricingPolicy:
    return PricingPolicy(discount_percent=settings.ONLINE_PAYMENT_DISCOUNT_PERCENT)


def payment_gateway() -> MockPaymentGateway:
    if str(settings.PAYMENT_PROVIDER).lower() == "payos":
        return PayOsPaymentGateway()
    return MockPaymentGateway(provider_name=settings.PAYMENT_PROVIDER)


def notification_gateway() -> ConsoleNotificationGateway:
    return ConsoleNotificationGateway(
        provider_name=settings.NOTIFICATION_PROVIDER,
        log_repository=notification_log_repository(),
    )


def customer_email_gateway() -> CustomerEmailGateway:
    return CustomerEmailGateway()


def password_hasher() -> DjangoPasswordHasher:
    return DjangoPasswordHasher()


def list_service_packages_use_case() -> ListServicePackagesUseCase:
    return ListServicePackagesUseCase(service_package_repository())


def get_service_package_use_case() -> GetServicePackageUseCase:
    return GetServicePackageUseCase(service_package_repository())


def create_service_package_use_case() -> CreateServicePackageUseCase:
    return CreateServicePackageUseCase(service_package_repository())


def update_service_package_use_case() -> UpdateServicePackageUseCase:
    return UpdateServicePackageUseCase(service_package_repository())


def delete_service_package_use_case() -> DeleteServicePackageUseCase:
    return DeleteServicePackageUseCase(service_package_repository())


def list_posts_use_case() -> ListPostsUseCase:
    return ListPostsUseCase(post_repository())


def get_post_use_case() -> GetPostUseCase:
    return GetPostUseCase(post_repository())


def create_post_use_case() -> CreatePostUseCase:
    return CreatePostUseCase(post_repository())


def update_post_use_case() -> UpdatePostUseCase:
    return UpdatePostUseCase(post_repository())


def delete_post_use_case() -> DeletePostUseCase:
    return DeletePostUseCase(post_repository())


def get_monthly_availability_use_case() -> GetMonthlyAvailabilityUseCase:
    return GetMonthlyAvailabilityUseCase(
        availability_repository(),
        service_package_repository(),
        booking_repository(),
        account_repository(),
    )


def register_customer_use_case() -> RegisterCustomerUseCase:
    return RegisterCustomerUseCase(
        account_repository(),
        customer_email_gateway(),
        password_hasher(),
        customer_app_url=settings.CUSTOMER_WEB_URL,
        verification_token_ttl_hours=settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    )


def verify_customer_email_use_case() -> VerifyCustomerEmailUseCase:
    return VerifyCustomerEmailUseCase(
        account_repository(),
        session_ttl_hours=settings.ACCESS_TOKEN_TTL_HOURS,
        verification_token_ttl_hours=settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    )


def resend_customer_verification_email_use_case() -> ResendCustomerVerificationEmailUseCase:
    return ResendCustomerVerificationEmailUseCase(
        account_repository(),
        customer_email_gateway(),
        customer_app_url=settings.CUSTOMER_WEB_URL,
        verification_token_ttl_hours=settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    )


def start_customer_email_auth_use_case() -> StartCustomerEmailAuthUseCase:
    return StartCustomerEmailAuthUseCase(
        account_repository(),
        customer_email_gateway(),
        password_hasher(),
        customer_app_url=settings.CUSTOMER_WEB_URL,
        verification_token_ttl_hours=settings.EMAIL_VERIFICATION_TOKEN_TTL_HOURS,
    )


def claim_customer_email_auth_session_use_case() -> ClaimCustomerEmailAuthSessionUseCase:
    return ClaimCustomerEmailAuthSessionUseCase(
        account_repository(),
        session_ttl_hours=settings.ACCESS_TOKEN_TTL_HOURS,
    )


def login_use_case() -> LoginUseCase:
    return LoginUseCase(account_repository(), settings.ACCESS_TOKEN_TTL_HOURS)


def logout_use_case() -> LogoutUseCase:
    return LogoutUseCase(account_repository())


def get_account_by_token_use_case() -> GetAccountByTokenUseCase:
    return GetAccountByTokenUseCase(account_repository())


def update_my_profile_use_case() -> UpdateMyProfileUseCase:
    return UpdateMyProfileUseCase(account_repository())


def change_my_password_use_case() -> ChangeMyPasswordUseCase:
    return ChangeMyPasswordUseCase(account_repository(), password_hasher())


def list_my_bookings_use_case() -> ListMyBookingsUseCase:
    return ListMyBookingsUseCase(booking_repository())


def list_accounts_use_case() -> ListAccountsUseCase:
    return ListAccountsUseCase(account_repository())


def get_managed_account_use_case() -> GetManagedAccountUseCase:
    return GetManagedAccountUseCase(account_repository())


def create_managed_account_use_case() -> CreateManagedAccountUseCase:
    return CreateManagedAccountUseCase(account_repository(), password_hasher())


def update_managed_account_use_case() -> UpdateManagedAccountUseCase:
    return UpdateManagedAccountUseCase(account_repository(), password_hasher())


def disable_account_use_case() -> DisableAccountUseCase:
    return DisableAccountUseCase(account_repository())


def delete_managed_account_use_case() -> DeleteManagedAccountUseCase:
    return DeleteManagedAccountUseCase(account_repository())


def create_booking_use_case() -> CreateBookingUseCase:
    return CreateBookingUseCase(
        booking_repository=booking_repository(),
        service_package_repository=service_package_repository(),
        availability_repository=availability_repository(),
        pricing_policy=pricing_policy(),
        payment_transaction_repository=payment_transaction_repository(),
        payment_gateway=payment_gateway(),
        tracking_repository=tracking_repository(),
        account_repository=account_repository(),
        online_deposit_percent=settings.ONLINE_DEPOSIT_PERCENT,
    )


def lookup_bookings_by_phone_use_case() -> LookupBookingsByPhoneUseCase:
    return LookupBookingsByPhoneUseCase(booking_repository())


def list_booking_requests_use_case() -> ListBookingRequestsUseCase:
    return ListBookingRequestsUseCase(booking_repository())


def get_booking_use_case() -> GetBookingUseCase:
    return GetBookingUseCase(booking_repository())


def review_booking_use_case() -> ReviewBookingUseCase:
    return ReviewBookingUseCase(
        booking_repository=booking_repository(),
        availability_repository=availability_repository(),
        notification_gateway=notification_gateway(),
        tracking_repository=tracking_repository(),
        account_repository=account_repository(),
    )


def list_confirmed_bookings_use_case() -> ListConfirmedBookingsUseCase:
    return ListConfirmedBookingsUseCase(booking_repository())


def cancel_booking_use_case() -> CancelBookingUseCase:
    return CancelBookingUseCase(
        booking_repository=booking_repository(),
        availability_repository=availability_repository(),
        notification_gateway=notification_gateway(),
        account_repository=account_repository(),
    )


def assign_pilot_use_case() -> AssignPilotUseCase:
    return AssignPilotUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
        notification_gateway=notification_gateway(),
        account_repository=account_repository(),
    )


def list_pilot_flights_use_case() -> ListPilotFlightsUseCase:
    return ListPilotFlightsUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
    )


def complete_online_payment_use_case() -> CompleteOnlinePaymentUseCase:
    return CompleteOnlinePaymentUseCase(
        booking_repository=booking_repository(),
        payment_transaction_repository=payment_transaction_repository(),
        payment_gateway=payment_gateway(),
    )


def get_tracking_by_phone_use_case() -> GetTrackingByPhoneUseCase:
    return GetTrackingByPhoneUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
    )


def update_flight_status_use_case() -> UpdateFlightStatusUseCase:
    return UpdateFlightStatusUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
        service_package_repository=service_package_repository(),
    )


def update_pilot_flight_status_use_case() -> UpdatePilotFlightStatusUseCase:
    return UpdatePilotFlightStatusUseCase(
        booking_repository=booking_repository(),
        update_flight_status_use_case=update_flight_status_use_case(),
    )


def start_pilot_tracking_use_case() -> StartPilotTrackingUseCase:
    return StartPilotTrackingUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
    )


def append_pilot_tracking_point_use_case() -> AppendPilotTrackingPointUseCase:
    return AppendPilotTrackingPointUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
    )


def stop_pilot_tracking_use_case() -> StopPilotTrackingUseCase:
    return StopPilotTrackingUseCase(
        booking_repository=booking_repository(),
        tracking_repository=tracking_repository(),
    )
