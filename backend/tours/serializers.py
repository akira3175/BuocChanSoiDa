from rest_framework import serializers

from .models import Tour, Tour_POI


class TourSerializer(serializers.ModelSerializer):
    """Serializer cho model Tour."""
    class Meta:
        model = Tour
        fields = [
            'id', 'tour_name', 'created_by', 'is_suggested', 'status'
        ]
        read_only_fields = ['id', 'created_by']


class TourPOISerializer(serializers.ModelSerializer):
    """Serializer cho model Tour_POI."""
    class Meta:
        model = Tour_POI
        fields = [
            'id', 'tour', 'poi', 'sequence_order', 'status'
        ]
        read_only_fields = ['id']
