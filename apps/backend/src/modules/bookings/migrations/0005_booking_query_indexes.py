from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0004_bookingdocument_service_name_en"),
    ]

    operations = [
        migrations.AlterField(
            model_name="bookingdocument",
            name="email",
            field=models.EmailField(db_index=True, max_length=254),
        ),
        migrations.AddIndex(
            model_name="bookingdocument",
            index=models.Index(
                fields=["service_slug", "flight_date", "flight_time", "approval_status"],
                name="bookings_slot_active_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="bookingdocument",
            index=models.Index(
                fields=["assigned_pilot_phone", "approval_status", "flight_date", "flight_time"],
                name="bookings_pilot_slot_idx",
            ),
        ),
        migrations.AddIndex(
            model_name="bookingdocument",
            index=models.Index(fields=["email", "-created_at"], name="bookings_email_created_idx"),
        ),
    ]
