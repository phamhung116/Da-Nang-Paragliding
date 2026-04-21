from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="postdocument",
            name="cover_image",
            field=models.TextField(),
        ),
    ]

