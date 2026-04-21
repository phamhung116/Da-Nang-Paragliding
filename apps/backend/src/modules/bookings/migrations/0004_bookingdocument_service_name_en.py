from django.db import migrations, models


def backfill_booking_service_name_en(apps, schema_editor):
    BookingDocument = apps.get_model("bookings", "BookingDocument")

    for booking in BookingDocument.objects.all():
        booking.service_name_en = getattr(booking, "service_name_en", "") or booking.service_name
        booking.save(update_fields=["service_name_en", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0003_booking_pickup_deposit"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookingdocument",
            name="service_name_en",
            field=models.CharField(blank=True, default="", max_length=160),
        ),
        migrations.RunPython(backfill_booking_service_name_en, migrations.RunPython.noop),
    ]
