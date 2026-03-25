import uuid

import requests
from django.conf import settings
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Invoice
from .paypal import ensure_usd_payload, paypal_request
from .serializers import InvoiceCreateSerializer, InvoiceSerializer


class InvoiceListCreateView(generics.ListCreateAPIView):
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        return Invoice.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return InvoiceCreateSerializer
        return InvoiceSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()
        return Response(InvoiceSerializer(invoice).data, status=201)


class InvoiceCreateView(generics.CreateAPIView):
    serializer_class = InvoiceCreateSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        invoice = serializer.save()
        return Response(InvoiceSerializer(invoice).data, status=201)


class InvoiceDetailView(generics.RetrieveAPIView):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.AllowAny]


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def paypal_create_order(request):
    invoice_id = request.data.get('invoiceId', '')

    if not invoice_id:
        return Response({'error': 'invoiceId is required.'}, status=400)

    try:
        uuid.UUID(str(invoice_id))
    except ValueError:
        return Response({'error': 'invoiceId is invalid.'}, status=400)

    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_SECRET:
        return Response({'error': 'PayPal is not configured.'}, status=500)

    invoice = get_object_or_404(Invoice, id=invoice_id)
    if invoice.status == Invoice.Status.SUCCESS:
        return Response({'error': 'Invoice is already paid.'}, status=400)

    payload = {
        'intent': 'CAPTURE',
        'purchase_units': [
            {
                'reference_id': str(invoice.id),
                'description': invoice.reason,
                'amount': {
                    'currency_code': 'VND',
                    'value': str(int(invoice.amount)),
                },
            }
        ],
    }

    # Try VND first; if PayPal rejects (422), fallback to USD
    try:
        result = paypal_request('POST', '/v2/checkout/orders', json=payload)
    except requests.exceptions.HTTPError as e:
        if e.response is not None and e.response.status_code == 422:
            print("[PayPal] 422 error, retrying with USD fallback")
            payload_usd = ensure_usd_payload(payload.copy())
            result = paypal_request('POST', '/v2/checkout/orders', json=payload_usd)
        else:
            raise
    order_id = str(result.get('id', ''))

    if order_id:
        invoice.transaction_code = order_id
        invoice.save(update_fields=['transaction_code'])

    return Response(result)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def paypal_capture_order(request, order_id: str):
    if not settings.PAYPAL_CLIENT_ID or not settings.PAYPAL_SECRET:
        return Response({'error': 'PayPal is not configured.'}, status=500)

    invoice = Invoice.objects.filter(transaction_code=order_id).first()
    if not invoice:
        invoice_id = request.data.get('invoiceId', '')
        if invoice_id:
            invoice = Invoice.objects.filter(id=invoice_id).first()

    result = paypal_request('POST', f"/v2/checkout/orders/{order_id}/capture")

    status = str(result.get('status', ''))
    if invoice:
        if status == 'COMPLETED':
            invoice.status = Invoice.Status.SUCCESS
            invoice.paid_at = timezone.now()
            invoice.transaction_code = order_id
            invoice.save(update_fields=['status', 'paid_at', 'transaction_code'])
        else:
            invoice.status = Invoice.Status.FAILED
            invoice.transaction_code = order_id
            invoice.save(update_fields=['status', 'transaction_code'])

    return Response(result)
