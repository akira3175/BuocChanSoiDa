import uuid

from django.conf import settings
from django.db import models


class Invoice(models.Model):
    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        SUCCESS = 'SUCCESS', 'Success'
        FAILED = 'FAILED', 'Failed'
        CANCELLED = 'CANCELLED', 'Cancelled'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
    )

    reason = models.CharField(max_length=255, default='Đặt món ăn')
    amount = models.PositiveBigIntegerField(help_text='Số tiền VND')

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    transaction_code = models.CharField(max_length=100, blank=True, default='')
    paid_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']

    def __str__(self) -> str:
        return f'Invoice {self.id} - {self.status} - {self.amount}'
