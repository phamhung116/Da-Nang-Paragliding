from __future__ import annotations

from datetime import date

from rest_framework import serializers

from modules.bookings.application.dto import (
    AssignPilotRequest,
    BookingCreateRequest,
    CancelBookingRequest,
    ReviewBookingRequest,
)
from shared.utils import normalize_phone


class BookingReadSerializer(serializers.Serializer):
    id = serializers.CharField()
    code = serializers.CharField()
    service_slug = serializers.CharField()
    service_name = serializers.CharField()
    launch_site_name = serializers.CharField()
    flight_date = serializers.DateField()
    flight_time = serializers.CharField()
    customer_name = serializers.CharField()
    phone = serializers.CharField()
    email = serializers.EmailField()
    adults = serializers.IntegerField()
    children = serializers.IntegerField()
    notes = serializers.CharField(allow_null=True, allow_blank=True)
    unit_price = serializers.DecimalField(max_digits=10, decimal_places=2)
    original_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    final_total = serializers.DecimalField(max_digits=10, decimal_places=2)
    payment_method = serializers.CharField()
    payment_status = serializers.CharField()
    approval_status = serializers.CharField()
    rejection_reason = serializers.CharField(allow_null=True, allow_blank=True)
    flight_status = serializers.CharField()
    assigned_pilot_name = serializers.CharField(allow_null=True, allow_blank=True)
    assigned_pilot_phone = serializers.CharField(allow_null=True, allow_blank=True)
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)


class BookingCreateSerializer(serializers.Serializer):
    service_slug = serializers.SlugField()
    flight_date = serializers.DateField()
    flight_time = serializers.RegexField(r"^\d{2}:\d{2}$")
    customer_name = serializers.CharField(max_length=120, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    adults = serializers.IntegerField(min_value=0)
    children = serializers.IntegerField(min_value=0)
    notes = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    payment_method = serializers.ChoiceField(choices=["wallet", "gateway", "bank_transfer"])

    def validate_flight_date(self, value: date) -> date:
        if value < date.today():
            raise serializers.ValidationError("Ngay bay khong duoc o qua khu.")
        return value

    def validate(self, attrs):
        if attrs["adults"] + attrs["children"] <= 0:
            raise serializers.ValidationError("Phai co it nhat 1 khach tham gia.")
        attrs["phone"] = normalize_phone(attrs.get("phone", ""))
        return attrs

    def to_request(self) -> BookingCreateRequest:
        data = self.validated_data
        return BookingCreateRequest(
            service_slug=data["service_slug"],
            flight_date=data["flight_date"],
            flight_time=data["flight_time"],
            customer_name=data.get("customer_name", ""),
            phone=data.get("phone", ""),
            email=data.get("email", ""),
            adults=data["adults"],
            children=data["children"],
            notes=data.get("notes"),
            payment_method=data["payment_method"],
        )


class ReviewBookingSerializer(serializers.Serializer):
    decision = serializers.ChoiceField(choices=["confirm", "reject"])
    reason = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    pilot_name = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)
    pilot_phone = serializers.CharField(max_length=20, required=False, allow_blank=True, allow_null=True)

    def to_request(self) -> ReviewBookingRequest:
        return ReviewBookingRequest(
            decision=self.validated_data["decision"],
            reason=self.validated_data.get("reason"),
            pilot_name=self.validated_data.get("pilot_name") or None,
            pilot_phone=normalize_phone(self.validated_data.get("pilot_phone", "")) if self.validated_data.get("pilot_phone") else None,
        )


class AssignPilotSerializer(serializers.Serializer):
    pilot_name = serializers.CharField(max_length=120)
    pilot_phone = serializers.CharField(max_length=20)

    def to_request(self) -> AssignPilotRequest:
        return AssignPilotRequest(
            pilot_name=self.validated_data["pilot_name"],
            pilot_phone=normalize_phone(self.validated_data["pilot_phone"]),
        )


class CancelBookingSerializer(serializers.Serializer):
    reason = serializers.CharField(max_length=800)
    refund_bank = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)
    refund_account_number = serializers.CharField(max_length=64, required=False, allow_blank=True, allow_null=True)
    refund_account_name = serializers.CharField(max_length=120, required=False, allow_blank=True, allow_null=True)

    def to_request(self) -> CancelBookingRequest:
        return CancelBookingRequest(
            reason=self.validated_data["reason"],
            refund_bank=self.validated_data.get("refund_bank") or None,
            refund_account_number=self.validated_data.get("refund_account_number") or None,
            refund_account_name=self.validated_data.get("refund_account_name") or None,
        )
