from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import (
    assign_pilot_use_case,
    cancel_booking_use_case,
    create_booking_use_case,
    get_booking_use_case,
    list_booking_requests_use_case,
    list_confirmed_bookings_use_case,
    list_pilot_flights_use_case,
    lookup_bookings_by_phone_use_case,
    review_booking_use_case,
    update_my_profile_use_case,
)
from modules.accounts.application.dto import UpdateProfileRequest
from modules.bookings.presentation.api.v1.serializers import (
    AssignPilotSerializer,
    BookingCreateSerializer,
    BookingReadSerializer,
    CancelBookingSerializer,
    ReviewBookingSerializer,
)
from modules.tracking.presentation.api.v1.serializers import FlightTrackingSerializer
from shared.auth import (
    BearerTokenAuthentication,
    IsAdminAccount,
    IsAuthenticatedAccount,
    IsPilotAccount,
)
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.throttling import AccountScopedRateThrottle
from shared.utils import normalize_phone, serialize_entity


class PublicBookingCreateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        booking_request = serializer.to_request()
        try:
            if str(request.user.phone).startswith("EMAIL"):
                booking_request.customer_name = booking_request.customer_name or request.user.full_name
                booking_request.phone = normalize_phone(booking_request.phone)
                if not booking_request.customer_name.strip() or not booking_request.phone:
                    return error("Vui long nhap ho ten va so dien thoai khi dat lich.", status.HTTP_400_BAD_REQUEST)
                update_my_profile_use_case().execute(
                    request.user.id,
                    UpdateProfileRequest(
                        full_name=booking_request.customer_name,
                        phone=booking_request.phone,
                        preferred_language=request.user.preferred_language,
                    ),
                )
            else:
                booking_request.customer_name = request.user.full_name
                booking_request.phone = request.user.phone
            booking_request.email = request.user.email
            result = create_booking_use_case().execute(booking_request)
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "payment_session": result["payment_session"],
                },
                status.HTTP_201_CREATED,
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PublicBookingLookupApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "lookup"

    def get(self, request):
        identifier = (
            request.query_params.get("query")
            or request.query_params.get("email")
            or request.query_params.get("phone")
            or ""
        )
        bookings = lookup_bookings_by_phone_use_case().execute(identifier)
        return success(BookingReadSerializer(serialize_entity(bookings), many=True).data)


class PublicBookingCancelApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def post(self, request, code: str):
        serializer = CancelBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = cancel_booking_use_case().execute(
                code,
                serializer.to_request(),
                customer_email=request.user.email,
            )
            return success(BookingReadSerializer(serialize_entity(booking)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class AdminBookingRequestListApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request):
        bookings = list_booking_requests_use_case().execute()
        return success(BookingReadSerializer(serialize_entity(bookings), many=True).data)


class AdminBookingReviewApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def post(self, request, code: str):
        serializer = ReviewBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = review_booking_use_case().execute(code, serializer.to_request())
            return success(BookingReadSerializer(serialize_entity(booking)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class AdminBookingDetailApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request, code: str):
        try:
            booking = get_booking_use_case().execute(code)
            return success(BookingReadSerializer(serialize_entity(booking)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)


class AdminBookingCancelApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def post(self, request, code: str):
        serializer = CancelBookingSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            booking = cancel_booking_use_case().execute(code, serializer.to_request())
            return success(BookingReadSerializer(serialize_entity(booking)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class AdminConfirmedBookingListApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def get(self, request):
        bookings = list_confirmed_bookings_use_case().execute()
        return success(BookingReadSerializer(serialize_entity(bookings), many=True).data)


class AdminAssignPilotApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def patch(self, request, code: str):
        serializer = AssignPilotSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            booking = assign_pilot_use_case().execute(code, serializer.to_request())
            return success(BookingReadSerializer(serialize_entity(booking)).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PilotFlightListApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsPilotAccount]

    def get(self, request):
        flights = list_pilot_flights_use_case().execute(request.user.phone)
        payload = []
        for item in flights:
            payload.append(
                {
                    "booking": BookingReadSerializer(serialize_entity(item["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(item["tracking"])).data
                    if item["tracking"]
                    else None,
                }
            )
        return success(payload)
