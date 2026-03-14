from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from pois.models import POI

class Tour(models.Model):
    """
    Tour tham quan.
    """

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    id = models.BigAutoField(primary_key=True)
    tour_name = models.CharField('Tên tour', max_length=255)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tours',
        verbose_name='Người tạo'
    )
    is_suggested = models.BooleanField('Tour đề xuất', default=False)
    status = models.IntegerField(
        'Trạng thái',
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = 'tours'
        verbose_name = 'Tour'
        verbose_name_plural = 'Tours'
        ordering = ['-id']

    def __str__(self):
        return self.tour_name


class Tour_POI(models.Model):
    """
    Mapping Điểm tham quan (POI) vào Tour.
    """

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    id = models.BigAutoField(primary_key=True)
    tour = models.ForeignKey(
        Tour,
        on_delete=models.CASCADE,
        related_name='tour_pois',
        verbose_name='Tour'
    )
    poi = models.ForeignKey(
        POI,
        on_delete=models.CASCADE,
        related_name='tour_pois',
        verbose_name='Điểm tham quan'
    )
    sequence_order = models.IntegerField(
        'Thứ tự', 
        default=1,
        validators=[MinValueValidator(1)]
    )
    status = models.IntegerField(
        'Trạng thái',
        choices=Status.choices,
        default=Status.ACTIVE,
    )

    class Meta:
        db_table = 'tour_pois'
        verbose_name = 'Điểm tham quan của Tour'
        verbose_name_plural = 'Các điểm tham quan của Tour'
        ordering = ['tour', 'sequence_order']

    def __str__(self):
        return f'{self.tour.tour_name} - {self.poi.name} ({self.sequence_order})'
