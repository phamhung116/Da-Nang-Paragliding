from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class AvailabilityDayDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    service_slug = models.SlugField(max_length=120)
    date = models.DateField()
    temperature_c = models.FloatField()
    wind_kph = models.FloatField()
    uv_index = models.PositiveIntegerField()
    visibility_km = models.FloatField(default=10)
    weather_condition = models.CharField(max_length=80, default="Dang cap nhat")
    flight_condition = models.CharField(max_length=80)
    weather_available = models.BooleanField(default=False)
    slots = models.JSONField(default=list)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "availability_days"
        unique_together = ("service_slug", "date")
        ordering = ["date"]

    def __str__(self) -> str:
        return f"{self.service_slug}:{self.date.isoformat()}"
