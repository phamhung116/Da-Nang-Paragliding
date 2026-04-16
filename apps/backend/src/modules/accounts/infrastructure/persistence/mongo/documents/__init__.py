from __future__ import annotations

from django.db import models
from django_mongodb_backend.fields import ObjectIdAutoField


class AccountDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    full_name = models.CharField(max_length=120)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, unique=True, db_index=True)
    password_hash = models.CharField(max_length=256)
    role = models.CharField(max_length=40, db_index=True)
    preferred_language = models.CharField(max_length=5, default="vi")
    is_active = models.BooleanField(default=True, db_index=True)
    email_verified = models.BooleanField(default=True, db_index=True)
    email_verified_at = models.DateTimeField(blank=True, null=True)
    email_verification_token = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    email_verification_sent_at = models.DateTimeField(blank=True, null=True)
    email_login_poll_token = models.CharField(max_length=120, blank=True, null=True, db_index=True)
    email_login_poll_expires_at = models.DateTimeField(blank=True, null=True)
    email_login_poll_verified_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "accounts"
        ordering = ["-created_at"]


class AccountSessionDocument(models.Model):
    id = ObjectIdAutoField(primary_key=True)
    account_id = models.CharField(max_length=32, db_index=True)
    token = models.CharField(max_length=120, unique=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "account_sessions"
        ordering = ["-created_at"]
