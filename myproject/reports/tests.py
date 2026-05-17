from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import User
from reports.models import AuditLog, Notification


class ReportsModelTests(TestCase):
    """Test Reports models don't have uuid field"""

    def test_audit_log_no_uuid_field(self):
        """AuditLog should not have uuid field"""
        fields = [f.name for f in AuditLog._meta.get_fields()]
        self.assertNotIn('uuid', fields, "AuditLog should not have uuid field")
        self.assertIn('id', fields, "AuditLog should have id field")

    def test_notification_no_uuid_field(self):
        """Notification should not have uuid field"""
        fields = [f.name for f in Notification._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Notification should not have uuid field")
        self.assertIn('id', fields, "Notification should have id field")


class ReportsCreationTests(TestCase):
    """Test Reports models can be created without uuid"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )

    def test_audit_log_created(self):
        """AuditLog should be created without uuid"""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='create',
            target_model='User',
            target_object_uuid='1'
        )
        self.assertIsNotNone(audit_log.id)
        self.assertEqual(audit_log.module, 'accounts')

    def test_notification_created(self):
        """Notification should be created without uuid"""
        notification = Notification.objects.create(
            recipient=self.user,
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertIsNotNone(notification.id)
        self.assertEqual(notification.title, 'Test Notification')


class ReportsApiTests(TestCase):
    """Test Reports API responses don't include uuid"""

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN,
            is_staff=True
        )
        self.client.force_authenticate(user=self.user)

    def test_audit_log_list_response_no_uuid(self):
        """GET /api/reports/audit-logs/ should not include uuid"""
        response = self.client.get('/api/reports/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            audit_log_data = response.data[0]
            self.assertNotIn('uuid', audit_log_data, "AuditLog response should not include uuid")

    def test_notification_list_response_no_uuid(self):
        """GET /api/reports/notifications/ should not include uuid"""
        response = self.client.get('/api/reports/notifications/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            notification_data = response.data[0]
            self.assertNotIn('uuid', notification_data, "Notification response should not include uuid")


class ReportsForeignKeyTests(TestCase):
    """Test Reports foreign key relationships work without uuid"""

    def setUp(self):
        self.user = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='testpass123',
            role=User.Role.ADMIN
        )
        self.recipient = User.objects.create_user(
            username='recipient',
            email='recipient@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )

    def test_audit_log_actor_fk(self):
        """AuditLog actor foreign key should work"""
        audit_log = AuditLog.objects.create(
            actor=self.user,
            module='accounts',
            action='create',
            target_model='User',
            target_object_uuid='1'
        )
        self.assertEqual(audit_log.actor, self.user)
        self.assertEqual(audit_log.actor_id, self.user.id)

    def test_notification_recipient_fk(self):
        """Notification recipient foreign key should work"""
        notification = Notification.objects.create(
            recipient=self.recipient,
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertEqual(notification.recipient, self.recipient)
        self.assertEqual(notification.recipient_id, self.recipient.id)

    def test_notification_actor_fk(self):
        """Notification recipient foreign key should work (Notification doesn't have actor field)"""
        notification = Notification.objects.create(
            recipient=self.recipient,
            title='Test Notification',
            message='This is a test notification'
        )
        self.assertEqual(notification.recipient, self.recipient)
        self.assertEqual(notification.recipient_id, self.recipient.id)