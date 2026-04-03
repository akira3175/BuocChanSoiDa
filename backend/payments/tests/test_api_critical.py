from django.contrib.auth import get_user_model
from django.test import override_settings
from rest_framework.test import APITestCase

from payments.models import Invoice

User = get_user_model()


class PaymentsAPICriticalTests(APITestCase):
    def test_paypal_create_order_requires_invoice_id(self):
        r = self.client.post('/api/payments/paypal/create-order/', {}, format='json')
        self.assertEqual(r.status_code, 400)
        err = (r.data.get('error') or '').lower()
        self.assertIn('invoice', err)

    def test_paypal_create_order_rejects_invalid_uuid(self):
        r = self.client.post(
            '/api/payments/paypal/create-order/',
            {'invoiceId': 'not-a-uuid'},
            format='json',
        )
        self.assertEqual(r.status_code, 400)

    @override_settings(PAYPAL_CLIENT_ID='', PAYPAL_SECRET='')
    def test_paypal_create_order_returns_500_when_paypal_not_configured(self):
        """Deterministic: empty PayPal credentials return 500 (ignores host env / .env)."""
        user = User.objects.create_user(
            username='payer',
            email='payer@example.com',
            password='x',
        )
        inv = Invoice.objects.create(
            user=user,
            amount=1000,
            reason='test',
            status=Invoice.Status.PENDING,
        )
        r = self.client.post(
            '/api/payments/paypal/create-order/',
            {'invoiceId': str(inv.id)},
            format='json',
        )
        self.assertEqual(r.status_code, 500)
        self.assertIn('not configured', str(r.data).lower())
