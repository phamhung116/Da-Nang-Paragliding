from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import (
    append_pilot_tracking_point_use_case,
    get_tracking_by_phone_use_case,
    start_pilot_tracking_use_case,
    stop_pilot_tracking_use_case,
    update_flight_status_use_case,
    update_pilot_flight_status_use_case,
)
from modules.bookings.presentation.api.v1.serializers import BookingReadSerializer
from modules.tracking.presentation.api.v1.serializers import (
    FlightStatusUpdateSerializer,
    FlightTrackingSerializer,
    LiveTrackingPointSerializer,
)
from shared.auth import BearerTokenAuthentication, IsAdminAccount, IsPilotAccount
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.throttling import AccountScopedRateThrottle
from shared.utils import serialize_entity


class PublicTrackingLookupApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []
    throttle_classes = [AccountScopedRateThrottle]
    throttle_scope = "lookup"

    def get(self, request):
        phone = (
            request.query_params.get("query")
            or request.query_params.get("email")
            or request.query_params.get("phone")
            or ""
        )
        try:
            result = get_tracking_by_phone_use_case().execute(phone)
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)


class AdminFlightStatusUpdateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAdminAccount]

    def patch(self, request, code: str):
        serializer = FlightStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = update_flight_status_use_case().execute(code, serializer.validated_data["status"])
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PilotFlightStatusUpdateApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsPilotAccount]

    def patch(self, request, code: str):
        serializer = FlightStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = update_pilot_flight_status_use_case().execute(
                code,
                request.user.phone,
                serializer.validated_data["status"],
            )
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PilotTrackingStartApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsPilotAccount]

    def post(self, request, code: str):
        serializer = LiveTrackingPointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = start_pilot_tracking_use_case().execute(
                code,
                request.user.phone,
                serializer.to_location("Bat dau hanh trinh"),
            )
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PilotTrackingPingApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsPilotAccount]

    def post(self, request, code: str):
        serializer = LiveTrackingPointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = append_pilot_tracking_point_use_case().execute(
                code,
                request.user.phone,
                serializer.to_location("Vi tri hien tai"),
            )
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)


class PilotTrackingStopApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsPilotAccount]

    def post(self, request, code: str):
        serializer = LiveTrackingPointSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            result = stop_pilot_tracking_use_case().execute(
                code,
                request.user.phone,
                serializer.to_location("Da ha canh"),
            )
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "tracking": FlightTrackingSerializer(serialize_entity(result["tracking"])).data,
                }
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)
