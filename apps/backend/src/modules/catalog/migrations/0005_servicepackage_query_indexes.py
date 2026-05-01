from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0004_servicepackage_bilingual_fields"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="servicepackagedocument",
            index=models.Index(fields=["active", "featured"], name="catalog_service_flags_idx"),
        ),
    ]
