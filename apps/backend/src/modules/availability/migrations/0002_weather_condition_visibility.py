from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("availability", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="availabilitydaydocument",
            name="visibility_km",
            field=models.FloatField(default=10),
        ),
        migrations.AddField(
            model_name="availabilitydaydocument",
            name="weather_condition",
            field=models.CharField(default="Dang cap nhat", max_length=80),
        ),
    ]
