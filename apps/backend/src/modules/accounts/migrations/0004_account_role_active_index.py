from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("accounts", "0003_accountdocument_email_login_poll"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="accountdocument",
            index=models.Index(fields=["role", "is_active"], name="accounts_role_active_idx"),
        ),
    ]
