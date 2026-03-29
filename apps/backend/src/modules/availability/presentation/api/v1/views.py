from __future__ import annotations

from datetime import datetime

from rest_framework import status
from rest_framework.views import APIView

from config.containers import get_monthly_availability_use_case
from modules.availability.presentation.api.v1.serializers import AvailabilityDaySerializer
from shared.exceptions import DomainError
from shared.responses import error, success
from shared.utils import serialize_entity


class MonthlyAvailabilityApi(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, slug: str):
        current = datetime.now()
        year = int(request.query_params.get("year", current.year))
        month = int(request.query_params.get("month", current.month))

        try:
            days = get_monthly_availability_use_case().execute(slug, year, month)
            return success(AvailabilityDaySerializer(serialize_entity(days), many=True).data)
        except DomainError as exc:
            return error(str(exc), status.HTTP_404_NOT_FOUND)
