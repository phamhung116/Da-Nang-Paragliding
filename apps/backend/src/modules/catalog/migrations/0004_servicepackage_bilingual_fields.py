from django.db import migrations, models


def backfill_catalog_bilingual_fields(apps, schema_editor):
    ServiceFeatureDocument = apps.get_model("catalog", "ServiceFeatureDocument")
    ServicePackageDocument = apps.get_model("catalog", "ServicePackageDocument")

    feature_map = {}
    for feature in ServiceFeatureDocument.objects.all():
        feature.name_en = getattr(feature, "name_en", "") or feature.name
        feature.description_en = getattr(feature, "description_en", "") or feature.description
        feature.save(update_fields=["name_en", "description_en", "updated_at"])
        feature_map[feature.name] = feature

    for service in ServicePackageDocument.objects.all():
        service.name_en = getattr(service, "name_en", "") or service.name
        service.short_description_en = getattr(service, "short_description_en", "") or service.short_description
        service.description_en = getattr(service, "description_en", "") or service.description
        if not getattr(service, "included_feature_ids", []):
            service.included_feature_ids = [
                str(feature_map[name].id)
                for name in getattr(service, "included_services", []) or []
                if name in feature_map
            ]
        service.save(
            update_fields=[
                "name_en",
                "short_description_en",
                "description_en",
                "included_feature_ids",
                "updated_at",
            ]
        )


class Migration(migrations.Migration):
    dependencies = [
        ("catalog", "0003_alter_servicepackagedocument_hero_image"),
    ]

    operations = [
        migrations.AddField(
            model_name="servicepackagedocument",
            name="description_en",
            field=models.TextField(blank=True, default=""),
        ),
        migrations.AddField(
            model_name="servicepackagedocument",
            name="included_feature_ids",
            field=models.JSONField(default=list),
        ),
        migrations.AddField(
            model_name="servicepackagedocument",
            name="name_en",
            field=models.CharField(blank=True, default="", max_length=160),
        ),
        migrations.AddField(
            model_name="servicepackagedocument",
            name="short_description_en",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="servicefeaturedocument",
            name="description_en",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
        migrations.AddField(
            model_name="servicefeaturedocument",
            name="name_en",
            field=models.CharField(blank=True, default="", max_length=120),
        ),
        migrations.RunPython(backfill_catalog_bilingual_fields, migrations.RunPython.noop),
    ]
