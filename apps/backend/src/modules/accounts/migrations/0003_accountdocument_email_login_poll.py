from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0002_accountdocument_email_verification"),
    ]

    operations = [
        migrations.AddField(
            model_name="accountdocument",
            name="email_login_poll_token",
            field=models.CharField(blank=True, db_index=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="accountdocument",
            name="email_login_poll_expires_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="accountdocument",
            name="email_login_poll_verified_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
