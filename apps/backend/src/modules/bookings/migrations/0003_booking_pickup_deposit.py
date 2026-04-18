from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("bookings", "0002_bookingdocument_assigned_pilot_name_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="bookingdocument",
            name="pickup_option",
            field=models.CharField(default="self", max_length=20),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="pickup_address",
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="pickup_fee",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="deposit_amount",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10),
        ),
        migrations.AddField(
            model_name="bookingdocument",
            name="deposit_percentage",
            field=models.PositiveIntegerField(default=40),
        ),
    ]
