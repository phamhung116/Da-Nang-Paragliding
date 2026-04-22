from django.db import migrations, models


def backfill_post_bilingual_fields(apps, schema_editor):
    PostDocument = apps.get_model("posts", "PostDocument")

    for post in PostDocument.objects.all():
        post.title_en = getattr(post, "title_en", "") or post.title
        post.excerpt_en = getattr(post, "excerpt_en", "") or post.excerpt
        post.content_en = getattr(post, "content_en", "") or post.content
        post.save(update_fields=["title_en", "excerpt_en", "content_en", "updated_at"])


class Migration(migrations.Migration):
    dependencies = [
        ("posts", "0003_alter_postdocument_excerpt"),
    ]

    operations = [
        migrations.AddField(
            model_name="postdocument",
            name="content_en",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="postdocument",
            name="excerpt_en",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="postdocument",
            name="title_en",
            field=models.CharField(blank=True, default="", max_length=220),
        ),
        migrations.RunPython(backfill_post_bilingual_fields, migrations.RunPython.noop),
    ]
