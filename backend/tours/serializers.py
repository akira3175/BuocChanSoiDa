from rest_framework import serializers
from django.db.models import Max

from .models import Tour, Tour_POI
from pois.serializers import POIListSerializer


class TourPOIInlineSerializer(serializers.ModelSerializer):
    """Serializer gọn cho POI bên trong Tour payload."""
    poi = POIListSerializer(read_only=True)

    class Meta:
        model = Tour_POI
        fields = ['poi', 'sequence_order']


class TourSerializer(serializers.ModelSerializer):
    """Serializer cho model Tour."""
    name = serializers.CharField(source='tour_name')
    pois = serializers.SerializerMethodField()

    def get_pois(self, obj):
        mappings = (
            obj.tour_pois
            .filter(status=Tour_POI.Status.ACTIVE)
            .select_related('poi')
            .order_by('sequence_order')
        )
        return TourPOIInlineSerializer(mappings, many=True).data

    class Meta:
        model = Tour
        fields = [
            'id',
            'name',
            'description',
            'status',
            'is_suggested',
            'estimated_duration_min',
            'pois',
            'created_by',
        ]
        read_only_fields = ['id', 'created_by', 'pois']


class TourPOISerializer(serializers.ModelSerializer):
    """Serializer cho model Tour_POI."""
    sequence_order = serializers.IntegerField(required=False, min_value=1)

    def validate(self, attrs):
        """
        - Cho phép đổi sequence_order khi edit, miễn không trùng trong cùng tour.
        - Không cho phép trùng POI trong cùng tour.
        """
        tour = attrs.get('tour') or getattr(self.instance, 'tour', None)
        poi = attrs.get('poi') or getattr(self.instance, 'poi', None)
        sequence_order = attrs.get('sequence_order') or getattr(self.instance, 'sequence_order', None)

        if tour and poi:
            qs = Tour_POI.objects.filter(tour=tour, poi=poi)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'poi': 'POI này đã tồn tại trong tour. Vui lòng chọn POI khác.'
                })

        if tour and sequence_order:
            qs = Tour_POI.objects.filter(tour=tour, sequence_order=sequence_order)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError({
                    'sequence_order': 'sequence_order đã tồn tại trong tour này. Vui lòng chọn giá trị khác.'
                })

        return attrs

    def create(self, validated_data):
        # Nếu không truyền sequence_order, tự động max+1 (đồng bộ với model.save)
        if 'sequence_order' not in validated_data:
            tour = validated_data['tour']
            max_order = Tour_POI.objects.filter(tour=tour).aggregate(m=Max('sequence_order')).get('m')
            validated_data['sequence_order'] = (max_order or 0) + 1
        return super().create(validated_data)

    class Meta:
        model = Tour_POI
        fields = [
            'id', 'tour', 'poi', 'sequence_order', 'status'
        ]
        read_only_fields = ['id']
