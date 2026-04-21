from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class ServicePackageDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    slug = models.SlugField(max_length=120, unique=True)
    name = models.CharField(max_length=160)
    short_description = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    flight_duration_minutes = models.PositiveIntegerField()
    included_services = models.JSONField(default=list)
    participation_requirements = models.JSONField(default=list)
    min_child_age = models.PositiveIntegerField(default=6)
    hero_image = models.URLField()
    gallery_images = models.JSONField(default=list)
    launch_site_name = models.CharField(max_length=120)
    launch_lat = models.FloatField()
    launch_lng = models.FloatField()
    landing_site_name = models.CharField(max_length=120)
    landing_lat = models.FloatField()
    landing_lng = models.FloatField()
    featured = models.BooleanField(default=False)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_packages"
        ordering = ["-featured", "price", "name"]

    def __str__(self) -> str:
        return self.name


class ServiceFeatureDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    name = models.CharField(max_length=120, unique=True)
    description = models.CharField(max_length=255, blank=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "service_features"
        ordering = ["name"]

    def __str__(self) -> str:
        return self.name
