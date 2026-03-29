from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class NotificationLogDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    channel = models.CharField(max_length=40)
    recipient = models.CharField(max_length=120)
    title = models.CharField(max_length=160)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]
