from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User, EmployeeProfile
from ohc.models import OHCVisit
from reports.models import AuditLog, Notification


class BaseModelTests(TestCase):
    """Verify BaseModel does not have uuid field."""

    def test_auditlog_has_no_uuid_field(self):
        """Confirm AuditLog does not have uuid field."""
        fields = [f.name for f in AuditLog._meta.get_fields()]
        self.assertNotIn('uuid', fields, "AuditLog should not have uuid field")
        self.assertIn('id', fields, "AuditLog should have id field")

    def test_notification_has_no_uuid_field(self):
        """Confirm Notification does not have uuid field."""
        fields = [f.name for f in Notification._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Notification should not have uuid field")
        self.assertIn('id', fields, "Notification should have id field")


class AuditLogModelTests(TestCase):
    """Test AuditLog model with target_object_id field."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role=User.Role.ADMIN,
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='Engineering',
            designation='Software Engineer',
        )
        self.visit = OHCVisit.objects.create(
            employee=self.employee,
            consulted_doctor=None,
            visit_type='WALK_IN',
            visit_status='OPEN',
            visit_date='2026-05-20T10:00:00Z',
            chief_complaint='Headache',
        )

    def test_auditlog_has_target_object_id_field(self):
        """Verify AuditLog has target_object_id field."""
        self.assertTrue(hasattr(AuditLog, 'target_object_id'))

    def test_auditlog_target_object_id_is_integer_field(self):
        """Verify target_object_id is PositiveIntegerField."""
        field = AuditLog._meta.get_field('target_object_id')
        from django.db import models
        self.assertIsInstance(field, models.PositiveIntegerField)

    def test_auditlog_has_target_object_id_index(self):
        """Verify composite index exists on target_object_id + target_model."""
        index_names = [idx.name for idx in AuditLog._meta.indexes]
        self.assertIn('audit_target_idx', index_names)

    def test_auditlog_can_be_created_without_uuid(self):
        """Verify AuditLog can be created with target_object_id."""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='UPDATE',
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id,
            object_snapshot={'employee_code': 'EMP001'},
        )
        self.assertEqual(audit_log.target_object_id, self.visit.id)
        self.assertEqual(audit_log.target_model, 'ohc.OHCVisit')

    def test_auditlog_lookup_by_target_object_id(self):
        """Verify lookup works with target_object_id."""
        AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='UPDATE',
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id,
        )
        audit_log = AuditLog.objects.filter(
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id
        ).first()
        self.assertIsNotNone(audit_log)
        self.assertEqual(audit_log.target_object_id, self.visit.id)

    def test_auditlog_target_object_id_can_be_null(self):
        """Verify target_object_id can be null (system actions)."""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='system',
            action='CRON_JOB',
            target_model='system',
            target_object_id=None,  # System-level action, no object
        )
        self.assertIsNone(audit_log.target_object_id)

    def test_auditlog_no_target_object_uuid_field(self):
        """Verify AuditLog does not have target_object_uuid field."""
        fields = [f.name for f in AuditLog._meta.get_fields()]
        self.assertNotIn('target_object_uuid', fields)


class NotificationModelTests(TestCase):
    """Test Notification model with related_object_id field."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            role=User.Role.EMPLOYEE,
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='Engineering',
            designation='Software Engineer',
        )
        self.visit = OHCVisit.objects.create(
            employee=self.employee,
            consulted_doctor=None,
            visit_type='WALK_IN',
            visit_status='OPEN',
            visit_date='2026-05-20T10:00:00Z',
            chief_complaint='Headache',
        )

    def test_notification_has_related_object_id_field(self):
        """Verify Notification has related_object_id field."""
        self.assertTrue(hasattr(Notification, 'related_object_id'))

    def test_notification_related_object_id_is_integer_field(self):
        """Verify related_object_id is PositiveIntegerField."""
        field = Notification._meta.get_field('related_object_id')
        from django.db import models
        self.assertIsInstance(field, models.PositiveIntegerField)

    def test_notification_related_object_id_can_be_null(self):
        """Verify related_object_id can be null."""
        notification = Notification.objects.create(
            recipient=self.user,
            title='General Announcement',
            message='System maintenance tonight',
            notification_type=Notification.NotificationType.GENERAL,
            related_model=None,
            related_object_id=None,  # General notification
        )
        self.assertIsNone(notification.related_object_id)

    def test_notification_has_related_object_id_index(self):
        """Verify composite index exists on related_object_id + related_model."""
        index_names = [idx.name for idx in Notification._meta.indexes]
        self.assertIn('notif_related_idx', index_names)

    def test_notification_can_be_created_without_uuid(self):
        """Verify Notification can be created with related_object_id."""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Visit Scheduled',
            message='Your OHC visit has been scheduled.',
            notification_type=Notification.NotificationType.APPOINTMENT,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id,
        )
        self.assertEqual(notification.related_object_id, self.visit.id)
        self.assertEqual(notification.related_model, 'ohc.OHCVisit')

    def test_notification_lookup_by_related_object_id(self):
        """Verify lookup works with related_object_id."""
        Notification.objects.create(
            recipient=self.user,
            title='Visit Scheduled',
            message='Your OHC visit has been scheduled.',
            notification_type=Notification.NotificationType.APPOINTMENT,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id,
        )
        notification = Notification.objects.filter(
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id
        ).first()
        self.assertIsNotNone(notification)
        self.assertEqual(notification.related_object_id, self.visit.id)

    def test_notification_no_related_object_uuid_field(self):
        """Verify Notification does not have related_object_uuid field."""
        fields = [f.name for f in Notification._meta.get_fields()]
        self.assertNotIn('related_object_uuid', fields)


class APITests(TestCase):
    """Test API responses exclude uuid field."""

    def setUp(self):
        """Set up test client and data."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='apiuser',
            email='api@example.com',
            role=User.Role.ADMIN,
        )
        self.client.force_authenticate(user=self.user)
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='Engineering',
            designation='Software Engineer',
        )
        self.visit = OHCVisit.objects.create(
            employee=self.employee,
            consulted_doctor=None,
            visit_type='WALK_IN',
            visit_status='OPEN',
            visit_date='2026-05-20T10:00:00Z',
            chief_complaint='Headache',
        )

    def test_auditlog_list_response_no_uuid(self):
        """Verify AuditLog list response does not include uuid field."""
        AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='UPDATE',
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id,
        )
        response = self.client.get('/api/reports/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if 'results' in data:
            for item in data['results']:
                self.assertNotIn('uuid', item)
                self.assertNotIn('target_object_uuid', item)
                self.assertIn('target_object_id', item)

    def test_notification_list_response_no_uuid(self):
        """Verify Notification list response does not include uuid field."""
        Notification.objects.create(
            recipient=self.user,
            title='Visit Scheduled',
            message='Your OHC visit has been scheduled.',
            notification_type=Notification.NotificationType.APPOINTMENT,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id,
        )
        response = self.client.get('/api/reports/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        if 'results' in data:
            for item in data['results']:
                self.assertNotIn('uuid', item)
                self.assertNotIn('related_object_uuid', item)
                self.assertIn('related_object_id', item)


class ForeignKeyTests(TestCase):
    """Test foreign key relationships work with ID fields."""

    def setUp(self):
        """Set up test data."""
        from ohc.models import Diagnosis

        self.user = User.objects.create_user(
            username='fkuser',
            email='fk@example.com',
            role=User.Role.ADMIN,
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='Engineering',
            designation='Software Engineer',
        )
        self.visit = OHCVisit.objects.create(
            employee=self.employee,
            consulted_doctor=None,
            visit_type='WALK_IN',
            visit_status='OPEN',
            visit_date='2026-05-20T10:00:00Z',
            chief_complaint='Headache',
        )
        self.diagnosis = Diagnosis.objects.create(
            visit=self.visit,
            diagnosed_by=None,
            diagnosis_name='Migraine',
            severity='MILD',
            condition_status='ACTIVE',
        )

    def test_auditlog_actor_fk_works(self):
        """Verify AuditLog actor FK relationship works."""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='UPDATE',
            target_model='accounts.EmployeeProfile',
            target_object_id=self.employee.id,
        )
        self.assertEqual(audit_log.actor, self.user)
        self.assertEqual(audit_log.actor_id, self.user.id)

    def test_notification_recipient_fk_works(self):
        """Verify Notification recipient FK relationship works."""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Visit Scheduled',
            message='Your OHC visit has been scheduled.',
            notification_type=Notification.NotificationType.APPOINTMENT,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id,
        )
        self.assertEqual(notification.recipient, self.user)
        self.assertEqual(notification.recipient_id, self.user.id)

    def test_polymorphic_auditlog_relationship_works(self):
        """Verify polymorphic AuditLog relationship works using ID."""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='ohc',
            action='CREATE',
            target_model='ohc.Diagnosis',
            target_object_id=self.diagnosis.id,
        )
        self.assertEqual(audit_log.target_model, 'ohc.Diagnosis')
        self.assertEqual(audit_log.target_object_id, self.diagnosis.id)

    def test_polymorphic_notification_relationship_works(self):
        """Verify polymorphic Notification relationship works using ID."""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Diagnosis Created',
            message='A new diagnosis has been added.',
            notification_type=Notification.NotificationType.REPORT,
            related_model='ohc.Diagnosis',
            related_object_id=self.diagnosis.id,
        )
        self.assertEqual(notification.related_model, 'ohc.Diagnosis')
        self.assertEqual(notification.related_object_id, self.diagnosis.id)


class IntegrationTests(TestCase):
    """Integration tests for end-to-end functionality."""

    def setUp(self):
        """Set up test data."""
        self.user = User.objects.create_user(
            username='integrationuser',
            email='integration@example.com',
            role=User.Role.ADMIN,
        )
        self.employee = EmployeeProfile.objects.create(
            user=self.user,
            employee_code='EMP001',
            department='Engineering',
            designation='Software Engineer',
        )
        self.visit = OHCVisit.objects.create(
            employee=self.employee,
            consulted_doctor=None,
            visit_type='WALK_IN',
            visit_status='OPEN',
            visit_date='2026-05-20T10:00:00Z',
            chief_complaint='Headache',
        )

    def test_audit_trail_with_target_object_id(self):
        """Test complete audit trail with target_object_id."""
        AuditLog.objects.create(
            actor=self.user,
            module='ohc',
            action='CREATE',
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id,
            object_snapshot={'chief_complaint': 'Headache'},
        )
        audit_logs = AuditLog.objects.filter(
            target_model='ohc.OHCVisit',
            target_object_id=self.visit.id
        )
        self.assertEqual(audit_logs.count(), 1)

    def test_notification_delivery_with_related_object_id(self):
        """Test notification delivery with related_object_id."""
        Notification.objects.create(
            recipient=self.user,
            title='Visit Complete',
            message='Your visit has been completed.',
            notification_type=Notification.NotificationType.APPOINTMENT,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id,
        )
        notifications = Notification.objects.filter(
            recipient=self.user,
            related_model='ohc.OHCVisit',
            related_object_id=self.visit.id
        )
        self.assertEqual(notifications.count(), 1)

    def test_multiple_notifications_same_object(self):
        """Test multiple notifications for same object using ID."""
        for i in range(3):
            Notification.objects.create(
                recipient=self.user,
                title=f'Update {i}',
                message=f'Update number {i}',
                notification_type=Notification.NotificationType.REPORT,
                related_model='ohc.OHCVisit',
                related_object_id=self.visit.id,
            )
        notifications = Notification.objects.filter(
            related_object_id=self.visit.id
        )
        self.assertEqual(notifications.count(), 3)
        self.assertEqual(notifications.filter(
            related_model='ohc.OHCVisit'
        ).count(), 3)

    def test_audit_log_with_null_target_object_id(self):
        """Test audit log with null target_object_id (system action)."""
        AuditLog.objects.create(
            actor=self.user,
            module='system',
            action='BACKUP_JOB',
            target_model='system',
            target_object_id=None,
        )
        audit_logs = AuditLog.objects.filter(target_object_id__isnull=True)
        self.assertGreaterEqual(audit_logs.count(), 1)

    def test_notification_with_null_related_object_id(self):
        """Test notification with null related_object_id (general)."""
        Notification.objects.create(
            recipient=self.user,
            title='System Announcement',
            message='Scheduled maintenance tonight.',
            notification_type=Notification.NotificationType.GENERAL,
            related_model=None,
            related_object_id=None,
        )
        notifications = Notification.objects.filter(related_object_id__isnull=True)
        self.assertGreaterEqual(notifications.count(), 1)
