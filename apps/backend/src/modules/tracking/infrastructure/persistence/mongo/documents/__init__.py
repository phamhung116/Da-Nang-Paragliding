from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class FlightTrackingDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    booking_code = models.CharField(max_length=32, unique=True)
    phone = models.CharField(max_length=20, db_index=True)
    service_name = models.CharField(max_length=160)
    service_name_en = models.CharField(max_length=160, blank=True, default="")
    flight_status = models.CharField(max_length=40)
    pilot_name = models.CharField(max_length=120, blank=True, null=True)
    tracking_active = models.BooleanField(default=False)
    current_location = models.JSONField(default=dict)
    route_points = models.JSONField(default=list)
    timeline = models.JSONField(default=list)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "flight_tracking"
        ordering = ["-updated_at"]
