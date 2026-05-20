from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0006_booking_pickup_coordinates"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookingdocument",
            name="assigned_driver_name",
            field=models.CharField(blank=True, max_length=120, null=True),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="assigned_driver_phone",
            field=models.CharField(blank=True, db_index=True, max_length=20, null=True),
        ),
        migrations.AddIndex(
            model_name="bookingdocument",
            index=models.Index(
                fields=["assigned_driver_phone", "approval_status", "flight_date", "flight_time"],
                name="bookings_driver_slot_idx",
            ),
        ),
    ]
