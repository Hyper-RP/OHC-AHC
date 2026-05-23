# Generated for Single Employee ID Migration
# Converts target_object_uuid and related_object_uuid to use integer IDs

from django.db import migrations, models


def migrate_uuid_to_id(apps, schema_editor):
    """
    Data migration: Convert UUID-based polymorphic references to ID-based references.
    Since the uuid field was removed from BaseModel, we need to map existing
    UUID values in AuditLog and Notification to their corresponding object IDs.
    """
    AuditLog = apps.get_model('reports', 'AuditLog')
    Notification = apps.get_model('reports', 'Notification')

    # Model map for polymorphic reference resolution
    # These are the models that can be referenced by AuditLog and Notification
    model_map = {
        'accounts.EmployeeProfile': apps.get_model('accounts', 'EmployeeProfile'),
        'accounts.DoctorProfile': apps.get_model('accounts', 'DoctorProfile'),
        'ohc.OHCVisit': apps.get_model('ohc', 'OHCVisit'),
        'ohc.Diagnosis': apps.get_model('ohc', 'Diagnosis'),
        'ohc.Prescription': apps.get_model('ohc', 'Prescription'),
        'ohc.MedicalTest': apps.get_model('ohc', 'MedicalTest'),
        'ahc.Hospital': apps.get_model('ahc', 'Hospital'),
        'ahc.Referral': apps.get_model('ahc', 'Referral'),
        'ahc.MedicalReport': apps.get_model('ahc', 'MedicalReport'),
        'payments.Invoice': apps.get_model('payments', 'Invoice'),
        'payments.Payment': apps.get_model('payments', 'Payment'),
    }

    # Helper function to get object ID from model name
    # Since we no longer have uuid field on models, we assume:
    # 1. If existing UUID was stored, it was referencing an object's id
    # 2. We'll clear/migrate these records appropriately
    def get_object_id(model_name, uuid_str):
        """
        Get the ID of an object from its model name and UUID string.
        Since uuid field was removed from models, we treat this as a legacy cleanup.
        """
        if not uuid_str or not model_name:
            return None

        Model = model_map.get(model_name)
        if not Model:
            print(f"Warning: Unknown model '{model_name}' for UUID {uuid_str}")
            return None

        try:
            # Try to find object by id if UUID was actually an ID string
            # Handle case where UUID might have been incorrectly set as an ID
            try:
                obj_id = int(uuid_str)
                obj = Model.objects.filter(id=obj_id).first()
                if obj:
                    return obj.id
            except (ValueError, TypeError):
                pass

            # For actual UUID strings that were stored, we need to handle this
            # Since uuid field was removed, we can't look up by uuid anymore
            # In production, these records should be manually reviewed or cleared
            print(f"Note: Found legacy UUID for {model_name}: {uuid_str}")
            return None

        except Exception as e:
            print(f"Error processing UUID {uuid_str} for {model_name}: {e}")
            return None

    # Migrate AuditLog records
    audit_logs_updated = 0
    audit_logs_skipped = 0
    for log in AuditLog.objects.filter(target_object_uuid__isnull=False).exclude(target_object_uuid=''):
        new_id = get_object_id(log.target_model, log.target_object_uuid)
        if new_id:
            log.target_object_id_new = new_id
            log.save(update_fields=['target_object_id_new'])
            audit_logs_updated += 1
        else:
            audit_logs_skipped += 1

    print(f"AuditLog migration: {audit_logs_updated} updated, {audit_logs_skipped} skipped")

    # Migrate Notification records
    notifications_updated = 0
    notifications_skipped = 0
    for notif in Notification.objects.filter(related_object_uuid__isnull=False).exclude(related_object_uuid=''):
        new_id = get_object_id(notif.related_model, notif.related_object_uuid)
        if new_id:
            notif.related_object_id_new = new_id
            notif.save(update_fields=['related_object_id_new'])
            notifications_updated += 1
        else:
            notifications_skipped += 1

    print(f"Notification migration: {notifications_updated} updated, {notifications_skipped} skipped")


class Migration(migrations.Migration):
    dependencies = [
        ('reports', '0002_remove_uuid_from_reports'),
    ]

    operations = [
        # Step 1: Add new ID fields as nullable
        migrations.AddField(
            model_name='auditlog',
            name='target_object_id_new',
            field=models.PositiveIntegerField(null=True),
        ),
        migrations.AddField(
            model_name='notification',
            name='related_object_id_new',
            field=models.PositiveIntegerField(null=True, blank=True),
        ),

        # Step 2: Run data migration
        migrations.RunPython(migrate_uuid_to_id, migrations.RunPython.noop),

        # Step 3: Remove old UUID fields
        migrations.RemoveField(
            model_name='auditlog',
            name='target_object_uuid',
        ),
        migrations.RemoveField(
            model_name='notification',
            name='related_object_uuid',
        ),

        # Step 4: Rename new ID fields to final names
        migrations.RenameField(
            model_name='auditlog',
            old_name='target_object_id_new',
            new_name='target_object_id',
        ),
        migrations.RenameField(
            model_name='notification',
            old_name='related_object_id_new',
            new_name='related_object_id',
        ),

        # Step 5: Add composite indexes for efficient lookups
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['target_object_id', 'target_model'], name='audit_target_idx'),
        ),
        migrations.AddIndex(
            model_name='notification',
            index=models.Index(fields=['related_object_id', 'related_model'], name='notif_related_idx'),
        ),
    ]
