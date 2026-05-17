from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

from accounts.models import EmployeeProfile, DoctorProfile, User
from payments.models import Invoice, Payment


class PaymentsModelTests(TestCase):
    """Test Payments models don't have uuid field"""

    def test_invoice_no_uuid_field(self):
        """Invoice should not have uuid field"""
        fields = [f.name for f in Invoice._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Invoice should not have uuid field")
        self.assertIn('id', fields, "Invoice should have id field")

    def test_payment_no_uuid_field(self):
        """Payment should not have uuid field"""
        fields = [f.name for f in Payment._meta.get_fields()]
        self.assertNotIn('uuid', fields, "Payment should not have uuid field")
        self.assertIn('id', fields, "Payment should have id field")


class PaymentsCreationTests(TestCase):
    """Test Payments models can be created without uuid"""

    def setUp(self):
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='IT',
            designation='Developer'
        )

    def test_invoice_created(self):
        """Invoice should be created without uuid"""
        invoice = Invoice.objects.create(
            employee=self.employee_profile,
            invoice_number='INV001',
            total_amount=100.00
        )
        self.assertIsNotNone(invoice.id)
        self.assertEqual(invoice.invoice_number, 'INV001')

    def test_payment_created(self):
        """Payment should be created without uuid"""
        invoice = Invoice.objects.create(
            employee=self.employee_profile,
            invoice_number='INV001',
            total_amount=100.00
        )
        payment = Payment.objects.create(
            invoice=invoice,
            employee=self.employee_profile,
            amount=100.00
        )
        self.assertIsNotNone(payment.id)
        self.assertEqual(payment.amount, 100.00)


class PaymentsApiTests(TestCase):
    """Test Payments API responses don't include uuid"""

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

    def test_invoice_list_response_no_uuid(self):
        """GET /api/payments/invoices/ should not include uuid"""
        response = self.client.get('/api/payments/invoices/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            invoice_data = response.data[0]
            self.assertNotIn('uuid', invoice_data, "Invoice response should not include uuid")

    def test_payment_list_response_no_uuid(self):
        """GET /api/payments/transactions/ should not include uuid"""
        response = self.client.get('/api/payments/transactions/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        if response.data and len(response.data) > 0:
            payment_data = response.data[0]
            self.assertNotIn('uuid', payment_data, "Payment response should not include uuid")


class PaymentsForeignKeyTests(TestCase):
    """Test Payments foreign key relationships work without uuid"""

    def setUp(self):
        self.employee_user = User.objects.create_user(
            username='employee',
            email='employee@example.com',
            password='testpass123',
            role=User.Role.EMPLOYEE
        )
        self.employee_profile = EmployeeProfile.objects.create(
            user=self.employee_user,
            employee_code='EMP001',
            department='IT',
            designation='Developer'
        )

    def test_payment_invoice_fk(self):
        """Payment invoice foreign key should work"""
        invoice = Invoice.objects.create(
            employee=self.employee_profile,
            invoice_number='INV001',
            total_amount=100.00
        )
        payment = Payment.objects.create(
            invoice=invoice,
            employee=self.employee_profile,
            amount=100.00
        )
        self.assertEqual(payment.invoice, invoice)
        self.assertEqual(payment.invoice_id, invoice.id)

    def test_invoice_employee_fk(self):
        """Invoice employee foreign key should work"""
        invoice = Invoice.objects.create(
            employee=self.employee_profile,
            invoice_number='INV001',
            total_amount=100.00
        )
        self.assertEqual(invoice.employee, self.employee_profile)
        self.assertEqual(invoice.employee_id, self.employee_profile.id)