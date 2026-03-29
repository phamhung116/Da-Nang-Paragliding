from __future__ import annotations

from rest_framework import serializers


class PaymentTransactionSerializer(serializers.Serializer):
    id = serializers.CharField()
    booking_code = serializers.CharField()
    method = serializers.CharField()
    status = serializers.CharField()
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    deposit_percentage = serializers.IntegerField()
    provider_name = serializers.CharField()
    provider_reference = serializers.CharField()
    payment_url = serializers.URLField()
    qr_code_url = serializers.URLField()
    transfer_content = serializers.CharField()
    expires_at = serializers.DateTimeField()
    created_at = serializers.DateTimeField(allow_null=True)
    updated_at = serializers.DateTimeField(allow_null=True)
