import math
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

    def distance_to(self, lat: float, lng: float) -> float:
        """Tính khoảng cách Haversine từ POI tới toạ độ (lat, lng), đơn vị mét."""
        R = 6_371_000
        φ1, φ2 = math.radians(self.latitude), math.radians(lat)
        Δφ = math.radians(lat - self.latitude)
        Δλ = math.radians(lng - self.longitude)
        a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
        return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


class Media(models.Model):
    """
    File âm thanh / thông tin TTS cho một POI theo ngôn ngữ và vùng miền.
    Phục vụ Media Selection Engine (exact match → language fallback → TTS).
    """

    class MediaType(models.TextChoices):
        AUDIO = 'AUDIO', 'File âm thanh thu sẵn'
        TTS = 'TTS', 'Text-to-Speech'

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    poi = models.ForeignKey(
        POI,
        on_delete=models.CASCADE,
        related_name='media',
        verbose_name='Điểm tham quan',
    )
    file_url = models.URLField(
        'URL file âm thanh',
        blank=True,
        default='',
        help_text='Để trống nếu loại là TTS (nội dung lấy từ POI.description).',
    )
    language = models.CharField(
        'Ngôn ngữ',
        max_length=10,
        help_text='Mã ngôn ngữ: vi, en, ja, ko, zh, ...',
    )
    voice_region = models.CharField(
        'Vùng giọng đọc',
        max_length=50,
        blank=True,
        default='',
        help_text='mien_nam, mien_bac, mien_trung, usa, uk, ...',
    )
    media_type = models.CharField(
        'Loại media',
        max_length=10,
        choices=MediaType.choices,
        default=MediaType.AUDIO,
    )
    status = models.IntegerField(
        'Trạng thái',
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = 'poi_media'
        verbose_name = 'File âm thanh'
        verbose_name_plural = 'File âm thanh'
        ordering = ['language', 'voice_region']
        indexes = [
            models.Index(fields=['poi', 'language', 'voice_region'], name='media_poi_lang_region_idx'),
        ]

    def __str__(self):
        return f'{self.poi.name} [{self.language}/{self.voice_region}] ({self.media_type})'


class Partner(models.Model):
    """
    Đối tác ẩm thực / dịch vụ liên kết với một POI.
    Hiển thị dạng card gợi ý trong NarrationBottomSheet khi đang phát audio.
    """

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    poi = models.ForeignKey(
        POI,
        on_delete=models.CASCADE,
        related_name='partners',
        verbose_name='Điểm tham quan',
    )
    business_name = models.CharField('Tên cơ sở', max_length=255)
    menu_details = models.JSONField(
        'Chi tiết menu',
        default=dict,
        blank=True,
        help_text='JSON: {"must_try": ["món A", "món B"], "price_range": "50k-100k"}',
    )
    opening_hours = models.CharField(
        'Giờ mở cửa',
        max_length=100,
        blank=True,
        default='',
        help_text='Ví dụ: 07:00 - 22:00',
    )
    status = models.IntegerField(
        'Trạng thái',
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = 'partners'
        verbose_name = 'Đối tác'
        verbose_name_plural = 'Đối tác'
        ordering = ['business_name']

    def __str__(self):
        return f'{self.business_name} @ {self.poi.name}'
