from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from pois.models import POI
from django.db.models import Max

class Tour(models.Model):
    """
    Tour tham quan.
    """

    class Status(models.IntegerChoices):
        INACTIVE = 0, 'Không hoạt động'
        ACTIVE = 1, 'Hoạt động'

    id = models.BigAutoField(primary_key=True)
    tour_name = models.CharField('Tên tour', max_length=255)
    description = models.TextField('Mô tả', blank=True, default='')
    estimated_duration_min = models.IntegerField(
        'Thời lượng ước tính (phút)',
        null=True,
        blank=True,
    )
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
        constraints = [
            models.UniqueConstraint(
                fields=['tour', 'sequence_order'],
                name='uniq_tour_sequence_order',
            ),
            models.UniqueConstraint(
                fields=['tour', 'poi'],
                name='uniq_tour_poi',
            ),
        ]

    def save(self, *args, **kwargs):
        """
        Nếu không set sequence_order khi tạo mới, tự lấy max(sequence_order)+1 trong tour.
        """
        if self._state.adding:
            # Trường hợp API/ORM không truyền (None/<=0)
            should_auto = self.sequence_order is None or self.sequence_order <= 0

            # Trường hợp user không nhập gì trong admin/ORM (default=1)
            # Nếu tour đã có sequence_order=1 thì coi như "chưa set" và auto max+1
            if not should_auto and self.sequence_order == 1:
                if Tour_POI.objects.filter(tour=self.tour, sequence_order=1).exists():
                    should_auto = True

        if self._state.adding and should_auto:
            max_order = (
                Tour_POI.objects.filter(tour=self.tour)
                .aggregate(m=Max('sequence_order'))
                .get('m')
            )
            self.sequence_order = (max_order or 0) + 1
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.tour.tour_name} - {self.poi.name} ({self.sequence_order})'
