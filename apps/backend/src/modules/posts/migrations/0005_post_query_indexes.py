from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0004_postdocument_bilingual_fields"),
    ]

    operations = [
        migrations.AddIndex(
            model_name="postdocument",
            index=models.Index(fields=["published", "-published_at", "-created_at"], name="posts_public_sort_idx"),
        ),
    ]
