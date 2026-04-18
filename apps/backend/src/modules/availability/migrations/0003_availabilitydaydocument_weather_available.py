from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("availability", "0002_weather_condition_visibility"),
    ]

    operations = [
        migrations.AddField(
            model_name="availabilitydaydocument",
            name="weather_available",
            field=models.BooleanField(default=False),
        ),
    ]
