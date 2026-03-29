from __future__ import annotations

from rest_framework import status
from rest_framework.views import APIView

from config.containers import complete_online_payment_use_case
from modules.bookings.presentation.api.v1.serializers import BookingReadSerializer
from modules.payments.presentation.api.v1.serializers import PaymentTransactionSerializer
from shared.auth import BearerTokenAuthentication, IsAuthenticatedAccount
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.utils import serialize_entity


class CompleteOnlinePaymentApi(APIView):
    authentication_classes = [BearerTokenAuthentication]
    permission_classes = [IsAuthenticatedAccount]

    def post(self, request, code: str):
        try:
            result = complete_online_payment_use_case().execute(code)
            return success(
                {
                    "booking": BookingReadSerializer(serialize_entity(result["booking"])).data,
                    "transaction": PaymentTransactionSerializer(
                        serialize_entity(result["transaction"])
                    ).data
                    if result["transaction"]
                    else None,
                },
                status.HTTP_200_OK,
            )
        except DomainError as exc:
            return error(str(exc), status.HTTP_400_BAD_REQUEST)
