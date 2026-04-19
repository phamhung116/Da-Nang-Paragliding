from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0002_servicefeaturedocument"),
    ]

    operations = [
        migrations.AlterField(
            model_name="servicepackagedocument",
            name="hero_image",
            field=models.TextField(),
        ),
    ]

