from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0002_alter_postdocument_cover_image"),
    ]

    operations = [
        migrations.AlterField(
            model_name="postdocument",
            name="excerpt",
            field=models.TextField(),
        ),
    ]
