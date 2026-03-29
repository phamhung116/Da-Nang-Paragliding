from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class PaymentTransactionDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    booking_code = models.CharField(max_length=32, unique=True)
    method = models.CharField(max_length=40)
    status = models.CharField(max_length=40)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_percentage = models.PositiveIntegerField(default=30)
    provider_name = models.CharField(max_length=80)
    provider_reference = models.CharField(max_length=120)
    payment_url = models.URLField()
    qr_code_url = models.URLField()
    transfer_content = models.CharField(max_length=160)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payment_transactions"
        ordering = ["-created_at"]
