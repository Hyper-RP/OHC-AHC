import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("ohc", "0015_diagnosis_examination_notes"),
    ]

    operations = [
        migrations.AlterField(
            model_name="ohcvisit",
            name="employee",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                related_name="ohc_visits",
                to="accounts.employeeprofile",
            ),
        ),
        migrations.AddField(
            model_name="ohcvisit",
            name="candidate_department",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="ohcvisit",
            name="candidate_designation",
            field=models.CharField(blank=True, max_length=120),
        ),
        migrations.AddField(
            model_name="ohcvisit",
            name="candidate_id",
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
