from django.db import migrations, models


def backfill_tracking_service_name_en(apps, schema_editor):
    FlightTrackingDocument = apps.get_model("tracking", "FlightTrackingDocument")

    for tracking in FlightTrackingDocument.objects.all():
        tracking.service_name_en = getattr(tracking, "service_name_en", "") or tracking.service_name
        tracking.save(update_fields=["service_name_en", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("tracking", "0003_flighttrackingdocument_tracking_active"),
    ]

    operations = [
        migrations.AddField(
            model_name="flighttrackingdocument",
            name="service_name_en",
            field=models.CharField(blank=True, default="", max_length=160),
        ),
        migrations.RunPython(backfill_tracking_service_name_en, migrations.RunPython.noop),
    ]
