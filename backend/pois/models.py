from django.db import models


class POI(models.Model):
    """
    Điểm tham quan (Point of Interest).
    Định nghĩa đầy đủ theo ERD BuocChanSoiDa.
    """

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    name = models.CharField('Tên điểm', max_length=255)
    description = models.TextField('Mô tả', blank=True, default='')
    latitude = models.FloatField('Vĩ độ')
    longitude = models.FloatField('Kinh độ')
    geofence_radius = models.IntegerField(
        'Bán kính Geofence (mét)',
        default=50,
        help_text='Bán kính tính bằng mét để kích hoạt Narration Engine.'
    )
    category = models.CharField('Danh mục', max_length=100, blank=True, default='')
    qr_code_data = models.CharField(
        'Dữ liệu QR Code',
        max_length=512,
        blank=True,
        default='',
        help_text='Dữ liệu được mã hoá trong QR Code tại điểm tham quan.',
    )
    status = models.IntegerField(
        'Trạng thái',
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = 'pois'
        verbose_name = 'Điểm tham quan'
        verbose_name_plural = 'Điểm tham quan'
        ordering = ['name']

    def __str__(self):
        return self.name
