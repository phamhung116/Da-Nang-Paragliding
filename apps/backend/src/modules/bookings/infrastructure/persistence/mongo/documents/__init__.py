from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class BookingDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    code = models.CharField(max_length=32, unique=True)
    service_slug = models.SlugField(max_length=120)
    service_name = models.CharField(max_length=160)
    launch_site_name = models.CharField(max_length=120)
    flight_date = models.DateField()
    flight_time = models.CharField(max_length=5)
    customer_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, db_index=True)
    email = models.EmailField()
    adults = models.PositiveIntegerField()
    children = models.PositiveIntegerField(default=0)
    notes = models.TextField(blank=True, null=True)
    pickup_option = models.CharField(max_length=20, default="self")
    pickup_address = models.TextField(blank=True, null=True)
    pickup_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    original_total = models.DecimalField(max_digits=10, decimal_places=2)
    final_total = models.DecimalField(max_digits=10, decimal_places=2)
    deposit_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    deposit_percentage = models.PositiveIntegerField(default=40)
    payment_method = models.CharField(max_length=40)
    payment_status = models.CharField(max_length=40)
    approval_status = models.CharField(max_length=40, db_index=True)
    rejection_reason = models.TextField(blank=True, null=True)
    flight_status = models.CharField(max_length=40)
    assigned_pilot_name = models.CharField(max_length=120, blank=True, null=True)
    assigned_pilot_phone = models.CharField(max_length=20, blank=True, null=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "bookings"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return self.code
