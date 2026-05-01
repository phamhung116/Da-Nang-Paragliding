from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0005_booking_query_indexes"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookingdocument",
            name="pickup_lat",
            field=models.FloatField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="pickup_lng",
            field=models.FloatField(blank=True, null=True),
        ),
    ]
